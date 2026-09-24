// 查 Campaign 設定與最近 DM 記錄，確認「追蹤→小禮物」兩段式是否啟用
import { prisma } from "@/lib/db/client";

async function main() {
  const automations = await prisma.automation.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      postId: true,
      matchAnyPost: true,
      keywords: true,
      dmTriggerEnabled: true,
      openingDmEnabled: true,
      openingDmMessage: true,
      openingDmButtonLabel: true,
      requireFollow: true,
      followPromptMessage: true,
      followPromptButtonLabel: true,
      followUpEnabled: true,
      followUpDelayMinutes: true,
      linkButtonLabel: true,
      workspaceId: true,
    },
  });
  console.log("=== AUTOMATIONS ===");
  console.log(JSON.stringify(automations, null, 2));

  const logs = await prisma.dmLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      commentId: true,
      commenterName: true,
      status: true,
      createdAt: true,
      automationId: true,
    },
  });
  console.log("=== RECENT DMLOGS ===");
  console.log(JSON.stringify(logs, null, 2));
}

main().finally(() => prisma.$disconnect());
