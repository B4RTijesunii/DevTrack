import cron from "node-cron";
import { prisma } from "./prisma.js";
import { syncUser } from "../services/sync.js";


export function startCronJobs() {
  cron.schedule("0 */4 * * *", async () => {
    console.log("[cron] Starting scheduled sync for all users...");
    const users = await prisma.user.findMany({
      select: { id: true, username: true },
    });

    for (const user of users) {
      try {
        const summary = await syncUser(user.id);
        console.log(`[cron] Synced ${user.username}:`, summary);
      } catch (err) {
        console.error(`[cron] Sync failed for ${user.username}:`, err.message);
      }
    }
  });

  console.log("[cron] Scheduled sync job registered (every 4 hours)");
}
