import cron from "node-cron";

/**
 * Cron job scheduler for automatic background tasks
 * This file sets up all scheduled jobs for the application
 */

let isSchedulerInitialized = false;

/**
 * Initialize all cron jobs
 * Should be called once when the application starts
 */
export function initializeCronJobs() {
  if (isSchedulerInitialized) {
    console.log("⏰ Cron scheduler already initialized, skipping...");
    return;
  }

  console.log("⏰ Initializing cron job scheduler...");

  // Customer sync job - runs every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏰ Running customer sync cron job...");
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
      const cronSecret = process.env.CRON_SECRET;
      
      const response = await fetch(`${baseUrl}/api/cron/sync-customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
        },
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(
          `✅ Customer sync completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`
        );
      } else {
        console.error("❌ Customer sync failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error executing customer sync cron job:", error);
    }
  });

  isSchedulerInitialized = true;
  console.log("✅ Cron job scheduler initialized");
  console.log("   - Customer sync: Every 10 minutes");
}

/**
 * Stop all cron jobs
 * Useful for graceful shutdown
 */
export function stopCronJobs() {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  isSchedulerInitialized = false;
  console.log("⏰ All cron jobs stopped");
}

