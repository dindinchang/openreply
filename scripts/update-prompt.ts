// 更新 Campaign B 的未追蹤提示文案
import { prisma } from "@/lib/db/client";

async function main() {
  const msg =
    "您尚未追蹤，所以無法領取禮物。追蹤 @dindin_chang 後我會自動送上 🎁";
  const r = await prisma.$executeRawUnsafe(
    `UPDATE "Automation" SET "followPromptMessage" = $1 WHERE id = 'cmt4sd1eb00008kdcd39pu7h9'`,
    msg
  );
  console.log("updated:", r);
}

main().finally(() => prisma.$disconnect());
