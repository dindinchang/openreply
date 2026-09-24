// 手動補 reveal SENT 記錄（禮物已於上一輪 worker 送出，僅 dmLog 寫入失敗）
import { prisma } from "@/lib/db/client";

async function main() {
  const rows = await prisma.$executeRawUnsafe(`
    INSERT INTO "DmLog"
      ("id","workspaceId","automationId","instagramAccountId","commenterId","commenterName","commentText","commentId","status","dmSentAt","createdAt","updatedAt")
    SELECT
      'manual-reveal-' || md5(random()::text),
      "workspaceId",
      "automationId",
      "instagramAccountId",
      "commenterId",
      "commenterName",
      '(follow verified via poll)',
      'reveal:' || "commenterId",
      'SENT',
      now(),
      now(),
      now()
    FROM "DmLog"
    WHERE "status" = 'SENT'
      AND "commentId" NOT LIKE 'reveal:%'
      AND "commenterId" IN ('4624383947847226','1077886971385086')
    ON CONFLICT ("automationId","commentId") DO NOTHING
  `);
  console.log("inserted:", rows);
}

main().finally(() => prisma.$disconnect());
