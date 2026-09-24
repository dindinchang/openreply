import { prisma } from "@/lib/db/client";

async function main() {
  // fi6880 (commenterId 1047248511494261) 今天被處理的完整記錄
  const logs = await prisma.dmLog.findMany({
    where: { commenterName: "fi6880" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  console.log("=== fi6880 dmLog 全記錄 ===");
  for (const l of logs) {
    console.log(
      `${l.createdAt.toISOString()} | ${l.status} | commentId=${l.commentId} | automation=${l.automationId}`
    );
  }

  // 今天所有 SENT（近 30 筆）
  const today = new Date(Date.now() - 30 * 3600 * 1000);
  const recent = await prisma.dmLog.findMany({
    where: { createdAt: { gte: today }, status: "SENT" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  console.log("\n=== 近 30 小時內所有 SENT ===");
  for (const l of recent) {
    console.log(
      `${l.createdAt.toISOString()} | ${l.commenterName} | ${l.commentId} | ${l.automationId}`
    );
  }
  const sent = recent.length;
  const byAutomation: Record<string, number> = {};
  for (const l of recent) {
    byAutomation[l.automationId] = (byAutomation[l.automationId] || 0) + 1;
  }
  console.log("\nSENT 總數:", sent, JSON.stringify(byAutomation));

  // ProcessedComment 今天處理的留言數（欄位是 seenAt）
  const pc = await prisma.processedComment.count({
    where: { seenAt: { gte: today } },
  });
  console.log("今天處理的留言數(ProcessedComment):", pc);
}

main().finally(() => prisma.$disconnect());
