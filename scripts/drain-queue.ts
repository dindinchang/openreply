// 清空 DM queue 所有堆積的 job（止血：失敗重試轟炸）
import { getDMQueue } from "@/lib/queue/client";

async function main() {
  const queue = getDMQueue();
  const counts = await queue.getJobCounts(
    "waiting",
    "active",
    "delayed",
    "failed",
    "completed"
  );
  console.log("before:", JSON.stringify(counts));

  await queue.obliterate({ force: true });
  console.log("obliterated");

  const after = await queue.getJobCounts("waiting", "active", "delayed", "failed");
  console.log("after:", JSON.stringify(after));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
