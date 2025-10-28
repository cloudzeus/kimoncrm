import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/debug/emails
 * Debug endpoint to check if there are any emails in the database
 */
export async function GET(request: NextRequest) {
  try {
    // Count email threads
    const threadCount = await prisma.emailThread.count();
    
    // Count email messages
    const messageCount = await prisma.emailMessage.count();
    
    // Get some sample threads if they exist
    const sampleThreads = await prisma.emailThread.findMany({
      take: 5,
      include: {
        messages: {
          take: 2,
        },
      },
    });

    // Get some sample messages if they exist
    const sampleMessages = await prisma.emailMessage.findMany({
      take: 5,
      select: {
        id: true,
        fromEmail: true,
        subject: true,
        receivedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        threadCount,
        messageCount,
        sampleThreads,
        sampleMessages,
      },
    });
  } catch (error: any) {
    console.error("Error checking emails:", error);
    return NextResponse.json(
      { error: "Failed to check emails", details: error.message },
      { status: 500 }
    );
  }
}
