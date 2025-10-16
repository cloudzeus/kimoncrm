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
        if (result.total === 0) {
          console.log("✅ Customer sync completed: No new or updated customers");
        } else {
          console.log(
            `✅ Customer sync completed: ${result.created} created, ${result.updated} updated (${result.total} total in window)`
          );
        }
      } else {
        console.error("❌ Customer sync failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error executing customer sync cron job:", error);
    }
  });

  // Supplier sync job - runs every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏰ Running supplier sync cron job...");
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
      const cronSecret = process.env.CRON_SECRET;
      
      const response = await fetch(`${baseUrl}/api/cron/sync-suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
        },
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.total === 0) {
          console.log("✅ Supplier sync completed: No new or updated suppliers");
        } else {
          console.log(
            `✅ Supplier sync completed: ${result.created} created, ${result.updated} updated (${result.total} total in window)`
          );
        }
      } else {
        console.error("❌ Supplier sync failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error executing supplier sync cron job:", error);
    }
  });

  // Product sync job - runs every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("⏰ Running product sync cron job...");
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
      const cronSecret = process.env.CRON_SECRET;
      
      const response = await fetch(`${baseUrl}/api/cron/sync-products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
        },
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.stats?.total === 0) {
          console.log("✅ Product sync completed: No new or updated products");
        } else {
          console.log(
            `✅ Product sync completed: ${result.stats?.created || 0} created, ${result.stats?.updated || 0} updated (${result.stats?.total || 0} total in window)`
          );
        }
      } else {
        console.error("❌ Product sync failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error executing product sync cron job:", error);
    }
  });

  // Manufacturer sync job - runs every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏰ Running manufacturer sync cron job...");
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
      const cronSecret = process.env.CRON_SECRET;
      
      const response = await fetch(`${baseUrl}/api/cron/sync-manufacturers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
        },
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.total === 0) {
          console.log("✅ Manufacturer sync completed: No manufacturers");
        } else {
          console.log(
            `✅ Manufacturer sync completed: ${result.created || 0} created, ${result.updated || 0} updated (${result.total || 0} total)`
          );
        }
      } else {
        console.error("❌ Manufacturer sync failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error executing manufacturer sync cron job:", error);
    }
  });

  // Stock sync job - runs every 4 hours
  cron.schedule("0 */4 * * *", async () => {
    console.log("⏰ Running stock sync cron job...");
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
      const cronSecret = process.env.CRON_SECRET;
      
      const response = await fetch(`${baseUrl}/api/cron/sync-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
        },
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(
          `✅ Stock sync completed in ${result.duration}: ` +
          `AIC (${result.aic.created}/${result.aic.updated}/${result.aic.skipped}), ` +
          `NETCORE (${result.netcore.created}/${result.netcore.updated}/${result.netcore.skipped})`
        );
      } else {
        console.error("❌ Stock sync failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error executing stock sync cron job:", error);
    }
  });

  isSchedulerInitialized = true;
  console.log("✅ Cron job scheduler initialized");
  console.log("   - Customer sync: Every 10 minutes");
  console.log("   - Supplier sync: Every 10 minutes");
  console.log("   - Product sync: Every 15 minutes");
  console.log("   - Manufacturer sync: Every 6 hours");
  console.log("   - Stock sync: Every 4 hours");
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

