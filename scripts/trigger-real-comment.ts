// 觸發真實 IG comments webhook：用 DINDIN token 在自己最新貼文留言
import { Client } from "pg";
import crypto from "crypto";

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function decryptToken(encryptedBase64: string) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const buf = Buffer.from(encryptedBase64, "base64");
  const iv = buf.subarray(0, 16);
  const tag = buf.subarray(16, 32);
  const data = buf.subarray(32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

async function main() {
  await client.connect();
  const a = await client.query('SELECT id, "instagramId", "accessToken" FROM "InstagramAccount" LIMIT 1');
  const acc = a.rows[0];
  const token = await decryptToken(acc.accessToken);

  // 最新貼文
  const media = await fetch(
    `https://graph.instagram.com/v26.0/${acc.instagramId}/media?fields=id,timestamp&limit=3&access_token=${encodeURIComponent(token)}`
  ).then((r) => r.json());
  console.log("recent media:", JSON.stringify(media.data?.map((m: any) => ({ id: m.id, ts: m.timestamp }))));

  const target = media.data[0];
  // 留言（DINDIN 自己貼文留言）
  const r = await fetch(
    `https://graph.instagram.com/v26.0/${target.id}/comments?message=${encodeURIComponent("測試 webhook")}&access_token=${encodeURIComponent(token)}`,
    { method: "POST" }
  );
  const j = await r.json();
  console.log("comment POST:", JSON.stringify(j));
  await client.end();
}

main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
