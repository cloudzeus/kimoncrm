import { NextResponse } from "next/server";
import { initializeCronJobs } from "@/lib/jobs/cron-scheduler";

/**
 * Initialize cron jobs manually
 * GET /api/jobs/init
 */
export async function GET() {
  try {
    initializeCronJobs();
    return NextResponse.json({ 
      success: true, 
      message: "Cron jobs initialized" 
    });
  } catch (error) {
    console.error("Error initializing cron jobs:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

