// 查 trackedLinks 與 automation 的禮物/後續設定
import { prisma } from "@/lib/db/client";

async function main() {
  const links = await prisma.trackedLink.findMany({
    select: { id: true, workspaceId: true, slug: true, label: true, destinationUrl: true, createdAt: true },
  });
  console.log("=== TRACKED LINKS ===");
  console.log(JSON.stringify(links, null, 2));

  // followUpMessage / dmMessage 等欄位（用 raw query 避免 generated client 缺欄位）
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, name, "followUpEnabled", "followUpMessage", "dmMessage", "linkButtonLabel", "openingDmMessage" FROM "Automation" WHERE "isActive" = true`
  );
  console.log("=== AUTOMATION RAW ===");
  console.log(JSON.stringify(rows, null, 2));
}

main().finally(() => prisma.$disconnect());
