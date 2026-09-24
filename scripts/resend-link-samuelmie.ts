import { prisma } from "../lib/db/client";
import { decryptToken } from "../lib/meta/oauth";
import { sendDirectMessageWithLinkButton } from "../lib/meta/client";
import { buildTrackedUrl } from "../lib/tracking/message";

async function main() {
  const acct = await prisma.instagramAccount.findFirst();
  const automation = await prisma.automation.findUnique({
    where: { id: "cmt4sd1eb00008kdcd39pu7h9" }, // B 活動
    include: { trackedLinks: true },
  });
  if (!acct || !automation || automation.trackedLinks.length === 0) {
    throw new Error("missing acct/automation/link");
  }
  const token = decryptToken(acct.accessToken);
  const link = automation.trackedLinks[0];
  const url = buildTrackedUrl(link.slug);
  console.log("link url:", url);

  const SAMUELMIE = "4624383947847226"; // samuelmie 的 IG user id
  const text = "感謝追蹤！這是你的禮物 👇";
  const r = await sendDirectMessageWithLinkButton(
    token,
    acct.instagramId,
    SAMUELMIE,
    text,
    [{ title: "🎵 聽 DINDIN FLIP", url }]
  );
  console.log("LINK DM RESULT:", JSON.stringify(r));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
