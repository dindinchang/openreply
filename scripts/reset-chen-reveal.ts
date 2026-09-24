// 刪除 chenlulu969 的 reveal 記錄，讓系統用正確的 Dropbox 直連重發一次
import { prisma } from "@/lib/db/client";

async function main() {
  const r = await prisma.$executeRawUnsafe(`
    DELETE FROM "DmLog"
    WHERE "commenterId" = '1039664412004668' AND "commentId" LIKE 'reveal:%'
  `);
  console.log("deleted reveal logs:", r);
}

main().finally(() => prisma.$disconnect());
