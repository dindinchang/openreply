import { prisma } from "../lib/db/client";
import { decryptToken } from "../lib/meta/oauth";

const IG_ID = "17841400517506754";

async function main() {
  const acct = await prisma.instagramAccount.findFirst();
  if (!acct) { console.log("no account"); return; }
  const token = decryptToken(acct.accessToken);
  const base = "https://graph.instagram.com";
  const h = { Authorization: "Bearer " + token };

  // 最近 40 篇貼文
  const media = await (await fetch(`${base}/${IG_ID}/media?fields=id,timestamp&limit=40`, { headers: h })).json();
  if (media.error) { console.log("media ERR:", JSON.stringify(media.error).slice(0,150)); return; }
  console.log("media count:", media.data.length);

  let found = 0;
  for (const m of media.data) {
    const r = await fetch(`${base}/${m.id}/comments?fields=id,text,username,timestamp&limit=100`, { headers: h });
    const j = await r.json();
    if (j.error) { console.log("comments ERR", m.id, JSON.stringify(j.error).slice(0,100)); continue; }
    const hits = (j.data || []).filter((c: any) => c.text && (c.text.includes("測試") || c.text.toLowerCase().includes("test")));
    if (hits.length) {
      found++;
      hits.forEach((c: any) => console.log("FOUND media", m.id, m.timestamp, "|", c.username, ":", c.text, "| commentId:", c.id));
    }
    await new Promise(r2 => setTimeout(r2, 250));
  }
  console.log("total hits:", found);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
