// 更新 Campaign A 的開場 DM 文案（去掉禮物句，只謝留言＋請追蹤）
import { prisma } from "@/lib/db/client";

async function main() {
  const before = await prisma.$queryRawUnsafe(
    `SELECT "openingDmMessage" FROM "Automation" WHERE id = 'cmt4rs0ph0000hgdcnl2s3tuq'`
  );
  console.log("before:", JSON.stringify(before));

  const msg =
    "🎧 哇！謝謝你來留言 🙌 喜歡我的音樂嗎？追蹤 @dindin_chang 不錯過任何新作品 👇";
  const r = await prisma.$executeRawUnsafe(
    `UPDATE "Automation" SET "openingDmMessage" = $1 WHERE id = 'cmt4rs0ph0000hgdcnl2s3tuq'`,
    msg
  );
  console.log("updated:", r);

  const after = await prisma.$queryRawUnsafe(
    `SELECT "openingDmMessage", "dmMessage" FROM "Automation" WHERE id = 'cmt4rs0ph0000hgdcnl2s3tuq'`
  );
  console.log("after:", JSON.stringify(after, null, 2));
}

main().finally(() => prisma.$disconnect());
