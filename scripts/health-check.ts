// OpenReply 健康監控（cron watchdog 用，no_agent 模式）
// 有異常才 print（stdout 會被 cron 送到 Telegram）；正常完全靜默 = 0 token
import { getRedisConnection } from '@/lib/queue/client';
import { getPrisma } from '@/lib/db/client';

async function main() {
  const problems: string[] = [];
  const redis = getRedisConnection();

  // 1. Worker 心跳（Redis health:worker:dm，TTL 120s，30s 寫一次）
  try {
    const hb = await redis.get('health:worker:dm');
    if (!hb) {
      problems.push('⚠️ OpenReply worker 心跳不存在 — 進程可能沒在跑');
    } else {
      const parsed = JSON.parse(hb) as { checkedAt: string };
      const ageSec = Math.round((Date.now() - new Date(parsed.checkedAt).getTime()) / 1000);
      if (ageSec > 150) {
        problems.push(`⚠️ OpenReply worker 心跳停滯 ${ageSec} 秒 — 進程可能卡死或掛了`);
      }
    }
  } catch (e) {
    problems.push(`⚠️ OpenReply 心跳檢查失敗: ${e instanceof Error ? e.message : e}`);
  }

  const p = getPrisma();

  // 2. sweep 錯誤洪流（OperationalEvent 最近 30 分鐘 WARNING ≥5 = 連續多輪 sweep 出錯）
  try {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const errCount = await p.operationalEvent.count({
      where: { level: 'WARNING', createdAt: { gte: since } },
    });
    if (errCount >= 5) {
      problems.push(`⚠️ OpenReply 最近 30 分鐘 ${errCount} 筆 sweep 錯誤 — 可能被 IG 限流`);
    }
  } catch (e) {
    problems.push(`⚠️ OpenReply 錯誤統計失敗: ${e instanceof Error ? e.message : e}`);
  }

  // 3. DM 失敗暴增（最近 1 小時 FAILED ≥3 = 又在無限重試或帳號出問題）
  try {
    const sinceH = new Date(Date.now() - 60 * 60 * 1000);
    const failCount = await p.dmLog.count({
      where: { status: 'FAILED', createdAt: { gte: sinceH } },
    });
    if (failCount >= 3) {
      problems.push(`⚠️ OpenReply 最近 1 小時 ${failCount} 筆 DM 失敗 — 檢查帳號/限流`);
    }
  } catch (e) {
    problems.push(`⚠️ OpenReply 失敗統計失敗: ${e instanceof Error ? e.message : e}`);
  }

  if (problems.length > 0) console.log(problems.join('\n'));

  try { await p.$disconnect(); } catch {}
  try { redis.disconnect(); } catch {}
  process.exit(0);
}

main().catch((e) => {
  console.error(`❌ OpenReply 健康檢查 script 本身出錯: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
