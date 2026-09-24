import { prisma } from "../lib/db/client";

async function main() {
  const automations = await prisma.automation.findMany({
    where: {
      OR: [{ postId: "17998765432109876" }, { matchAnyPost: true }],
      isActive: true,
      instagramAccount: { instagramId: "17841400517506754" },
    },
  });
  console.log("found:", automations.length);
  automations.forEach((a) => console.log(a.id, a.name, a.matchAnyPost, a.isActive));
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
