import { createDMWorker, reconcileFollowReveals } from "@/lib/queue/dm-worker";
import { recordWorkerHeartbeat } from "@/lib/ops/worker-health";
import { reconcileComments } from "@/lib/polling/comment-reconciler";
import { attachPendingNextReels } from "@/lib/automation/attach-next-reel";
import os from "node:os";

const worker = createDMWorker();
const startedAt = new Date().toISOString();
const HEARTBEAT_INTERVAL_MS = 30_000;
// Polling safety net for comments that webhooks miss. Runs in the worker because
// it must fire every few minutes and Vercel's free crons only run once a day.
const POLL_INTERVAL_MS = Number(
  process.env.COMMENT_POLL_INTERVAL_MS ?? 5 * 60_000
);

console.log("[DM Worker] Started");

async function heartbeat() {
  try {
    await recordWorkerHeartbeat({
      pid: process.pid,
      hostname: os.hostname(),
      startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DM Worker] Heartbeat failed:", message);
  }
}

void heartbeat();
const heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL_MS);

async function poll() {
  try {
    const attached = await attachPendingNextReels();
    if (attached.bound > 0 || attached.failedAccounts > 0) {
      console.log("[DM Worker] Next-reel attachment:", attached);
    }
    await reconcileComments();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DM Worker] Comment reconciliation failed:", message);
  }
}

async function revealPoll() {
  try {
    await reconcileFollowReveals();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DM Worker] Follow-reveal reconciliation failed:", message);
  }
}

// Kick off one sweep shortly after boot, then on a fixed interval.
setTimeout(() => void poll(), 10_000);
const pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);

// Follow-gate reveal sweep: delivers the gift link once the commenter follows.
setTimeout(() => void revealPoll(), 15_000);
const revealTimer = setInterval(() => void revealPoll(), POLL_INTERVAL_MS);

async function shutdown(signal: string) {
  console.log(`[DM Worker] ${signal} received, closing worker`);
  clearInterval(heartbeatTimer);
  clearInterval(pollTimer);
  clearInterval(revealTimer);
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

// 2026-09-04 事故修補：Neon/Redis 斷線風暴會讓進程無聲消失（無 crash log、無 shutdown 訊息），
// 監控只能靠「心跳消失」事後猜。改成：任何未捕捉的崩潰級錯誤，先寫進 log 再 exit(1)，
// 讓 Startup watchdog（每 5 分檢查）確定拉起新 worker。崩潰 = 留痕 + 可復活。
process.on("uncaughtException", (error) => {
  console.error("[DM Worker] uncaughtException, exiting for watchdog revival:", error);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[DM Worker] unhandledRejection, exiting for watchdog revival:", reason);
  process.exit(1);
});
