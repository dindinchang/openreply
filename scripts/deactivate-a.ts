// 止血：停用 Campaign A（全部留言-感謝追蹤）避免重複發送
import { prisma } from "@/lib/db/client";

async function main() {
  const r = await prisma.$executeRawUnsafe(`
    UPDATE "Automation" SET "isActive" = false
    WHERE id = 'cmt4rs0ph0000hgdcnl2s3tuq'
  `);
  console.log("deactivated:", r);

  const active = await prisma.$queryRawUnsafe(
    `SELECT id, name, "isActive" FROM "Automation" ORDER BY "isActive" DESC`
  );
  console.log(JSON.stringify(active, null, 2));
}

main().finally(() => prisma.$disconnect());
