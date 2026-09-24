// 查 reveal 記錄與最近 DM 送出狀態
import { prisma } from "@/lib/db/client";

async function main() {
  const reveals = await prisma.$queryRawUnsafe(`
    SELECT "commentId", "commenterId", "commenterName", "status", "automationId", "createdAt"
    FROM "DmLog"
    WHERE "commentId" LIKE 'reveal:%'
    ORDER BY "createdAt" DESC
    LIMIT 30
  `);
  console.log("=== REVEAL LOGS ===");
  console.log(JSON.stringify(reveals, null, 2));

  const recent = await prisma.$queryRawUnsafe(`
    SELECT "commenterName", "commenterId", "status", "commentId", "automationId", "createdAt"
    FROM "DmLog"
    ORDER BY "createdAt" DESC
    LIMIT 15
  `);
  console.log("=== RECENT DMLOGS ===");
  console.log(JSON.stringify(recent, null, 2));
}

main().finally(() => prisma.$disconnect());
