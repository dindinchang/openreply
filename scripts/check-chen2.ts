// 查 chenlulu969 最近的所有 dmLog（含新留言的開場 DM 狀態）
import { prisma } from "@/lib/db/client";

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT "commentId", "commentText", "status", "attempts", "errorMessage", "createdAt", "dmSentAt", "automationId"
    FROM "DmLog"
    WHERE "commenterId" = '1039664412004668'
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(rows, null, 2));
}

main().finally(() => prisma.$disconnect());
