// 把 chenlulu969 的開場 DM 標記為 SENT（實際已送出成功）
import { prisma } from "@/lib/db/client";

async function main() {
  const r = await prisma.$executeRawUnsafe(`
    UPDATE "DmLog"
    SET status = 'SENT', "dmSentAt" = now(), "errorMessage" = NULL
    WHERE "commenterName" = 'chenlulu969' AND status = 'FAILED'
  `);
  console.log("updated:", r);
}

main().finally(() => prisma.$disconnect());
