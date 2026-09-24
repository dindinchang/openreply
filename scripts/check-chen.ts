// 查 chenlulu969 留言處理失敗的錯誤訊息
import { prisma } from "@/lib/db/client";

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT "commenterName", "commenterId", "status", "attempts", "errorMessage", "createdAt", "automationId"
    FROM "DmLog"
    WHERE "commenterName" = 'chenlulu969'
    ORDER BY "createdAt" DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(rows, null, 2));
}

main().finally(() => prisma.$disconnect());
