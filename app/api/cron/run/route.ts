import { NextRequest, NextResponse } from "next/server";
import { setupCronJobs } from "@/lib/jobs/cron";
import { requireAdmin } from "@/lib/auth/guards";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    await setupCronJobs();
    
    return NextResponse.json({ 
      success: true, 
      message: "Cron jobs configured successfully" 
    });
  } catch (error) {
    console.error("Cron setup error:", error);
    return NextResponse.json(
      { message: "Failed to setup cron jobs" },
      { status: 500 }
    );
  }
}
