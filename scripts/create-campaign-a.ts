import { prisma } from "../lib/db/client";

async function main() {
  // 停用舊的測試活動（避免同一留言觸發兩個活動）
  await prisma.automation.updateMany({
    where: { name: { contains: "測試自動DM" } },
    data: { isActive: false },
  });
  console.log("old test campaign disabled");

  const ws = await prisma.workspace.findFirst();
  const acct = await prisma.instagramAccount.findFirst();
  if (!ws || !acct) throw new Error("missing ws/acct");

  const a = await prisma.automation.create({
    data: {
      workspaceId: ws.id,
      instagramAccountId: acct.id,
      name: "全部留言-感謝追蹤",
      matchAnyPost: true,
      matchAnyWord: true,
      keywords: [],
      openingDmEnabled: true,
      openingDmMessage:
        "🎧 哇！謝謝你來留言 🙌\n喜歡我的音樂嗎？先追蹤 @dindin_chang，我準備了小禮物要給你 👇",
      openingDmButtonLabel: "✅ 我追蹤了",
      requireFollow: true,
      followPromptMessage: "還沒看到你追蹤喔～追蹤後再按一次 👇",
      followPromptButtonLabel: "✅ 我追蹤了",
      dmMessage: "感謝追蹤！之後我會繼續分享音樂，敬請期待 🎧",
      linkButtonLabel: null,
      isActive: true,
      wholeWordMatch: false,
    },
  });
  console.log("Campaign A created:", a.id);
  console.log("name:", a.name);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
