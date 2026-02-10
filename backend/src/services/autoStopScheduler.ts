import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { db } from '../db/client';
import { instances } from '../db/schema';
import { and, eq, isNotNull } from 'drizzle-orm';
import { stopContainer } from './containerService';
import { instanceService } from './instanceService';

/**
 * Auto-stop scheduler service
 * Checks every minute for instances that should be stopped based on:
 * - autoStopMinutes setting (not null)
 * - lastActivity timestamp + autoStopMinutes < now
 */
class AutoStopScheduler {
  private task: ScheduledTask | null = null;
  private isRunning = false;

  /**
   * Start the scheduler - runs every minute
   */
  start() {
    if (this.task) {
      console.log('⚠️  Auto-stop scheduler already running');
      return;
    }

    // Run every minute: '* * * * *'
    this.task = cron.schedule('* * * * *', async () => {
      await this.checkAndStopInstances();
    });

    console.log('✅ Auto-stop scheduler started (checks every minute)');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('🛑 Auto-stop scheduler stopped');
    }
  }

  /**
   * Main logic: find and stop idle instances
   */
  private async checkAndStopInstances() {
    if (this.isRunning) {
      console.log('⏭️  Skipping auto-stop check (previous check still running)');
      return;
    }

    this.isRunning = true;

    try {
      const nowSeconds = Math.floor(Date.now() / 1000); // Current time in seconds

      // Query instances that:
      // 1. Have auto_stop_minutes set (not null)
      // 2. Are currently running (per DB)
      const results = await db
        .select()
        .from(instances)
        .where(and(isNotNull(instances.autoStopMinutes), eq(instances.status, 'running')));

      const instancesToStop: Array<{
        id: string;
        containerName: string;
        idleMinutes: number;
        autoStopMinutes: number;
      }> = [];

      for (const instance of results) {
        if (instance.autoStopMinutes == null) continue;
        if (!instance.lastActivity) continue;

        const lastActivityMs =
          instance.lastActivity instanceof Date
            ? instance.lastActivity.getTime()
            : new Date(instance.lastActivity as any).getTime();
        const lastActivitySeconds = Math.floor(lastActivityMs / 1000);

        const idleSeconds = nowSeconds - lastActivitySeconds;
        const idleMinutes = Math.floor(idleSeconds / 60);
        const shouldStop = idleMinutes >= instance.autoStopMinutes;

        if (shouldStop) {
          instancesToStop.push({
            id: instance.id,
            containerName: instance.containerName,
            idleMinutes,
            autoStopMinutes: instance.autoStopMinutes,
          });
        }
      }

      if (instancesToStop.length === 0) {
        return;
      }

      console.log(`🕒 Auto-stop: found ${instancesToStop.length} idle instances`);

      // Stop each instance
      for (const inst of instancesToStop) {
        try {
          console.log(
            `  → Stopping ${inst.containerName} (idle: ${inst.idleMinutes}min, limit: ${inst.autoStopMinutes}min)`,
          );

          await stopContainer(inst.id);
          await instanceService.updateInstance(inst.id, {
            status: 'stopped',
            lastActivity: nowSeconds,
          });

          console.log(`  ✓ Stopped ${inst.containerName}`);
        } catch (error) {
          console.error(`  ✗ Failed to stop ${inst.containerName}:`, error);
        }
      }

      console.log(`✅ Auto-stop completed: ${instancesToStop.length} instances stopped`);
    } catch (error) {
      console.error('❌ Auto-stop scheduler error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger a check (useful for testing)
   */
  async triggerCheck() {
    console.log('🔄 Manually triggering auto-stop check...');
    await this.checkAndStopInstances();
  }
}

// Export singleton instance
export const autoStopScheduler = new AutoStopScheduler();
