import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { DealStage, LeadStatus, LeadPriority } from "@prisma/client";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";

// Validation schema for updating a lead
const updateLeadSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  assignedCompanyId: z.string().optional().nullable(),
  stage: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  source: z.string().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  requestedSiteSurvey: z.boolean().optional(),
  ownerId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
  reviewDate: z.string().optional().nullable(),
});

// GET a specific lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        contact: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: true,
        siteSurvey: {
          select: {
            id: true,
            title: true,
            status: true,
            type: true,
          },
        },
        assignedCompany: true,
        quotes: {
          include: {
            contact: true,
          },
        },
        rfps: {
          include: {
            contact: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            startAt: true,
            endAt: true,
          },
        },
        statusChanges: {
          include: {
            changedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        emails: {
          include: {
            messages: {
              orderBy: { receivedAt: "desc" },
              take: 5,
            },
          },
          orderBy: { lastMessageAt: "desc" },
          take: 10,
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH update a lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLeadSchema.parse(body);

    // Get current lead to track status changes
    const currentLead = await prisma.lead.findUnique({
      where: { id },
      select: { status: true, stage: true },
    });

    if (!currentLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = { ...validatedData };

    if (validatedData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(validatedData.expectedCloseDate);
    }

    if (validatedData.reviewDate) {
      updateData.reviewDate = new Date(validatedData.reviewDate);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        contact: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: true,
        siteSurvey: true,
        assignedCompany: true,
      },
    });

    // Track status changes
    if (validatedData.status && validatedData.status !== currentLead.status) {
      await prisma.leadStatusChange.create({
        data: {
          leadId: id,
          fromStatus: currentLead.status,
          toStatus: validatedData.status,
          changedBy: session.user.id,
          note: body.note || "Status updated",
        },
      });

      // Send notification email to all participants using session user's email
      try {
        // Import and call the notification function
        const { sendLeadNotifications } = await import("./notify/route");
        await sendLeadNotifications(lead, session.user.email!);
      } catch (emailError) {
        console.error("Error sending status change notifications:", emailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("Error updating lead:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update lead", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or manager
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead", details: error.message },
      { status: 500 }
    );
  }
}

