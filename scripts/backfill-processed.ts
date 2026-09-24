// 把已處理過的留言補進 ProcessedComment（全域去重歷史）
import { prisma } from "@/lib/db/client";

async function main() {
  const r = await prisma.$executeRawUnsafe(`
    INSERT INTO "ProcessedComment" ("id", "instagramAccountId", "commentId", "source", "seenAt")
    SELECT 'backfill-' || md5(random()::text), "instagramAccountId", "commentId", 'POLLING', now()
    FROM "DmLog"
    WHERE "commentId" NOT LIKE 'reveal:%'
    ON CONFLICT ("commentId") DO NOTHING
  `);
  console.log("backfilled processed:", r);
}

main().finally(() => prisma.$disconnect());
