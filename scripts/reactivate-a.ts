// 重開 Campaign A（全部留言-感謝追蹤）— 全域去重已修好，可安全啟用
import { prisma } from "@/lib/db/client";

async function main() {
  const r = await prisma.$executeRawUnsafe(`
    UPDATE "Automation" SET "isActive" = true
    WHERE id = 'cmt4rs0ph0000hgdcnl2s3tuq'
  `);
  console.log("reactivated:", r);

  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, name, "isActive", "matchAnyPost", "postId" FROM "Automation" ORDER BY "isActive" DESC`
  );
  console.log(JSON.stringify(rows, null, 2));
}

main().finally(() => prisma.$disconnect());
