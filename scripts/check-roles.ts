// 查 app roles（唯讀），確認 IG tester 是否已加入
import { readFileSync } from 'fs';
import 'dotenv/config';

const APP_ID = process.env.FACEBOOK_APP_ID || '1047108361407125';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;

if (!APP_SECRET) {
  console.error('缺少 FACEBOOK_APP_SECRET / INSTAGRAM_APP_SECRET');
  process.exit(1);
}

const appToken = `${APP_ID}|${APP_SECRET}`;
const url = `https://graph.facebook.com/v26.0/${APP_ID}/roles?access_token=${appToken}`;

async function main() {
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
