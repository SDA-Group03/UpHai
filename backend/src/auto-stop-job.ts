import { db } from "./db/client";
import { instances } from "./db/schema";
import { eq } from "drizzle-orm";
import { stopContainer } from "./services/containerService";

/**
 * Auto-stop Background Job
 * 
 * Checks all running instances and stops those that have exceeded
 * their auto-stop idle time.
 * 
 * # Install PM2
npm install -g pm2

# Run as cron job
pm2 start auto-stop-job.ts 
 * Run this as a cron job every 5 minutes:#
 */

interface InstanceRecord {
  id: string;
  containerName: string;
  autoStopMinutes: number | null;
  lastActivity: Date | null;
  status: string;
}

export async function checkAndStopIdleContainers() {
  console.log(`🔍 [${new Date().toISOString()}] Checking for idle containers...`);

  try {
    // Get all running instances
    const runningInstances = await db
      .select({
        id: instances.id,
        containerName: instances.containerName,
        autoStopMinutes: instances.autoStopMinutes,
        lastActivity: instances.lastActivity,
        status: instances.status,
      })
      .from(instances)
      .where(eq(instances.status, "running"));

    console.log(`📊 Found ${runningInstances.length} running instances`);

    let stoppedCount = 0;

    for (const instance of runningInstances) {
      // Skip if auto-stop is disabled (null)
      if (instance.autoStopMinutes === null) {
        continue;
      }

      const lastActivity = instance.lastActivity || new Date();
      const idleMinutes = (Date.now() - lastActivity.getTime()) / (1000 * 60);

      if (idleMinutes >= instance.autoStopMinutes) {
        console.log(
          `⏰ Stopping ${instance.containerName} (idle for ${Math.round(idleMinutes)}min, limit: ${instance.autoStopMinutes}min)`
        );

        try {
          // Stop the container
          await stopContainer(instance.id);

          // Update database status
          await db
            .update(instances)
            .set({ status: "stopped" })
            .where(eq(instances.id, instance.id));

          stoppedCount++;
          console.log(`✅ Stopped ${instance.containerName}`);
        } catch (error) {
          console.error(`❌ Failed to stop ${instance.containerName}:`, error);
        }
      }
    }

    console.log(`✨ Auto-stop job completed. Stopped ${stoppedCount} containers.`);
  } catch (error) {
    console.error("❌ Auto-stop job failed:", error);
    throw error;
  }
}

// Run immediately if this file is executed directly
if (import.meta.main) {
  checkAndStopIdleContainers()
    .then(() => {
      console.log("👋 Job finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// Export for use in cron scheduler
export default checkAndStopIdleContainers;