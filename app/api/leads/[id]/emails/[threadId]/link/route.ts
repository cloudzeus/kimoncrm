import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: leadId, threadId } = await params;

    // Verify the lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Find the email thread
    const emailThread = await prisma.emailThread.findFirst({
      where: {
        OR: [
          { id: threadId },
          { externalId: threadId },
        ],
      },
    });

    if (!emailThread) {
      return NextResponse.json({ error: "Email thread not found" }, { status: 404 });
    }

    // Link the email thread to the lead
    const updatedThread = await prisma.emailThread.update({
      where: { id: emailThread.id },
      data: { leadId },
    });

    return NextResponse.json({
      success: true,
      data: updatedThread,
      message: "Email linked to lead successfully",
    });
  } catch (error: any) {
    console.error("Error linking email to lead:", error);
    return NextResponse.json(
      { error: "Failed to link email", details: error.message },
      { status: 500 }
    );
  }
}

