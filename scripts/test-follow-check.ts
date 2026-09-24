// 實測 is_user_follow_business 對 chenlulu969 的回應
import { prisma } from "@/lib/db/client";
import { decryptToken } from "@/lib/meta/oauth";

const IG_BASE = "https://graph.instagram.com/v26.0";

async function main() {
  const account = await prisma.instagramAccount.findFirst({
    select: { id: true, instagramId: true, username: true, accessToken: true },
  });
  if (!account) {
    console.log("no account");
    return;
  }
  const token = decryptToken(account.accessToken);
  console.log("business IG id:", account.instagramId, "user:", account.username);

  // chenlulu969 的 IGSID
  const tests = ["1039664412004668"];
  for (const id of tests) {
    const url = `${IG_BASE}/${id}?fields=is_user_follow_business&access_token=${token}`;
    const res = await fetch(url);
    const text = await res.text();
    console.log(`GET /${id} -> ${res.status}: ${text.slice(0, 300)}`);
  }
}

main().finally(() => prisma.$disconnect());
