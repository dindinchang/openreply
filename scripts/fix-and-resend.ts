import { prisma } from "../lib/db/client";
import { decryptToken } from "../lib/meta/oauth";

const GOOD_MSG = "🎧 感謝你的留言！歡迎追蹤 @dindin_chang 🙌 這是由 OpenReply 自動發送的訊息。";

async function main() {
  // 1) 修正 DB 的 dmMessage（正確 UTF-8）
  const upd = await prisma.automation.update({
    where: { id: "cmt4obbn50006ewdcji3hm46f" },
    data: { dmMessage: GOOD_MSG },
  });
  console.log("DB dmMessage fixed:", upd.dmMessage.slice(0, 40));

  // 2) 補發正確 DM 給 samuelmie（第一封是亂碼）
  const acct = await prisma.instagramAccount.findFirst();
  if (!acct) throw new Error("no account");
  const token = decryptToken(acct.accessToken);
  const target = "4624383947847226"; // samuelmie 真實 IG user id
  const r = await fetch(`https://graph.instagram.com/v25.0/${acct.instagramId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient: { id: target }, message: { text: GOOD_MSG } }),
  });
  const j = await r.json();
  if (j.id) console.log("RESEND DM OK, msg id:", j.id);
  else console.log("RESEND result:", JSON.stringify(j));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
