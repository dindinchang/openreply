// 重製測試帳號：清掉 DmLog 記錄，但保留 ProcessedComment（舊留言不會被重新處理）
// 這樣帳號像全新使用者（下次留言全新流程），又不會對舊留言重複私訊回覆。
// 用法：npx tsx --env-file=.env scripts/reset-test-account.ts [commenterId]
import { prisma } from "@/lib/db/client";

async function main() {
  const commenterId = process.argv[2] ?? "1039664412004668";
  const d1 = await prisma.dmLog.deleteMany({ where: { commenterId } });
  console.log(JSON.stringify({ commenterId, dmLogDeleted: d1.count }, null, 2));
}

main().finally(() => prisma.$disconnect());
