/**
 * Job initialization module
 * This module exports job-related functions and initializes them if in server environment
 */

// Only initialize cron jobs on the server side
if (typeof window === "undefined") {
  // Dynamic import to avoid client-side execution
  import("./cron-scheduler").then((module) => {
    module.initializeCronJobs();
  });
}

export { initializeCronJobs, stopCronJobs } from "./cron-scheduler";

