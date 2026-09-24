// 查 reveal 送出記錄（誰、哪個 campaign、幾次）
import { prisma } from "@/lib/db/client";

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT d."commentId", d."commenterName", d."commenterId", d."status", d."createdAt",
           a.name AS automation, a."openingDmEnabled", a."requireFollow"
    FROM "DmLog" d
    LEFT JOIN "Automation" a ON a.id = d."automationId"
    WHERE d."commentId" LIKE 'reveal:%'
    ORDER BY d."createdAt" DESC
  `);
  console.log(JSON.stringify(rows, null, 2));
}

main().finally(() => prisma.$disconnect());
