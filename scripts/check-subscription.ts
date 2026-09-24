// 查 IG subscribed_apps（確認 webhook 訂閱狀態）
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
  if (!acc) { console.log("NO_IG_ACCOUNT"); process.exit(0); }
  const token = await decryptToken(acc.accessToken);
  console.log("IG id:", acc.instagramId);

  // 試兩個端點
  for (const base of ["https://graph.instagram.com", "https://graph.facebook.com"]) {
    const url = `${base}/v26.0/me/subscribed_apps?access_token=${token}`;
    try {
      const r = await fetch(url);
      const j: any = await r.json();
      if (j && j.data) {
        console.log("OK endpoint:", base);
        console.log(JSON.stringify(j.data, null, 1));
        break;
      } else {
        console.log("FAIL endpoint:", base, JSON.stringify(j).slice(0, 200));
      }
    } catch (e: any) {
      console.log("ERR endpoint:", base, e.message);
    }
  }
  await client.end();
}
main();
