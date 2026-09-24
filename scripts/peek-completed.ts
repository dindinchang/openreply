// 看最近 completed jobs 內容
import { getDMQueue } from "@/lib/queue/client";

async function main() {
  const queue = getDMQueue();
  const jobs = await queue.getJobs(["completed"], 0, 10);
  for (const j of jobs) {
    console.log(
      `#${j.id} ${j.name} finished=${j.finishedOn ? new Date(j.finishedOn).toISOString() : "?"} data=${JSON.stringify(j.data)}`
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
