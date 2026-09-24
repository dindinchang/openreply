// 把 chenlulu969 的舊留言補回 ProcessedComment（避免重製後舊留言被重新處理）
import { prisma } from "@/lib/db/client";

async function main() {
  const ids = [
    "18224898757335265",
    "18145243246541922",
    "18032099090842029",
    "17950346076032555",
  ];
  const r = await prisma.$executeRawUnsafe(`
    INSERT INTO "ProcessedComment" ("id", "instagramAccountId", "commentId", "source", "seenAt")
    SELECT 'restore-' || md5(random()::text), '17841400517506754', unnest($1::text[]), 'POLLING', now()
    ON CONFLICT ("commentId") DO NOTHING
  `, ids);
  console.log("restored processed:", r);
}

main().finally(() => prisma.$disconnect());
