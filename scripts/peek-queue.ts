// 看 queue 裡剩餘的 job（等待/延遲）是哪些
import { getDMQueue } from "@/lib/queue/client";

async function main() {
  const queue = getDMQueue();
  const counts = await queue.getJobCounts("waiting", "active", "delayed", "failed");
  console.log("counts:", JSON.stringify(counts));

  const jobs = await queue.getJobs(["waiting", "delayed", "active"], 0, 20);
  for (const j of jobs) {
    console.log(
      `#${j.id} ${j.name} attempt=${j.attemptsMade} delay=${j.delay} data=${JSON.stringify(j.data)}`
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
