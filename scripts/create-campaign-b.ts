import { prisma } from "../lib/db/client";
import { generateTrackedLinkSlug } from "../lib/tracking/server";

const POST_ID = "17967888602914963";
const POST_URL = "https://www.instagram.com/p/DZo2f4AtU1L/";
const LINK_URL =
  "https://www.dropbox.com/scl/fi/tv91zvx35iuqppw6rik13/DINDIN-FLIP.mp3?rlkey=hzfs65a78vofkdi8g7ej9by6i&st=ovcyxzb4&dl=0";

async function main() {
  const ws = await prisma.workspace.findFirst();
  const acct = await prisma.instagramAccount.findFirst();
  if (!ws || !acct) throw new Error("missing ws/acct");

  const b = await prisma.automation.create({
    data: {
      workspaceId: ws.id,
      instagramAccountId: acct.id,
      name: "特定影片-贈送混音",
      postId: POST_ID,
      postUrl: POST_URL,
      matchAnyPost: false,
      matchAnyWord: true,
      keywords: [],
      openingDmEnabled: true,
      openingDmMessage:
        "🎧 哇！謝謝你來留言 🙌\n喜歡我的音樂嗎？先追蹤 @dindin_chang，我準備了小禮物要給你 👇",
      openingDmButtonLabel: "✅ 我追蹤了",
      requireFollow: true,
      followPromptMessage: "還沒看到你追蹤喔～追蹤後再按一次 👇",
      followPromptButtonLabel: "✅ 我追蹤了",
      dmMessage: "感謝追蹤！這是你的禮物 👇",
      linkButtonLabel: "🎵 聽 DINDIN FLIP",
      isActive: true,
      wholeWordMatch: false,
    },
  });

  const link = await prisma.trackedLink.create({
    data: {
      workspaceId: ws.id,
      automationId: b.id,
      slug: generateTrackedLinkSlug(),
      label: "🎵 聽 DINDIN FLIP",
      destinationUrl: LINK_URL,
    },
  });
  console.log("Campaign B created:", b.id);
  console.log("postId:", b.postId);
  console.log("trackedLink:", JSON.stringify(link));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
