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
        leadContacts: {
          include: {
            linkedContact: {
              select: {
                id: true,
                name: true,
                email: true,
                mobilePhone: true,
                workPhone: true,
              },
            },
            linkedCustomer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone01: true,
              },
            },
            linkedSupplier: {
              select: {
                id: true,
                name: true,
                email: true,
                phone01: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Convert Decimal to number for client components
    const serializedLead = {
      ...lead,
      estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
    };

    return NextResponse.json(serializedLead);
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

    // Convert empty strings to null for optional fields to avoid foreign key violations
    const cleanedData = {
      ...validatedData,
      customerId: validatedData.customerId !== undefined ? (validatedData.customerId && validatedData.customerId !== "" ? validatedData.customerId : null) : undefined,
      contactId: validatedData.contactId !== undefined ? (validatedData.contactId && validatedData.contactId !== "" ? validatedData.contactId : null) : undefined,
      assignedCompanyId: validatedData.assignedCompanyId !== undefined ? (validatedData.assignedCompanyId && validatedData.assignedCompanyId !== "" ? validatedData.assignedCompanyId : null) : undefined,
      ownerId: validatedData.ownerId !== undefined ? (validatedData.ownerId && validatedData.ownerId !== "" ? validatedData.ownerId : null) : undefined,
      assigneeId: validatedData.assigneeId !== undefined ? (validatedData.assigneeId && validatedData.assigneeId !== "" ? validatedData.assigneeId : null) : undefined,
      departmentId: validatedData.departmentId !== undefined ? (validatedData.departmentId && validatedData.departmentId !== "" ? validatedData.departmentId : null) : undefined,
    };

    // Prepare update data
    const updateData: any = { ...cleanedData };

    if (cleanedData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(cleanedData.expectedCloseDate);
    }

    if (cleanedData.reviewDate) {
      updateData.reviewDate = new Date(cleanedData.reviewDate);
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
    if (cleanedData.status && cleanedData.status !== currentLead.status) {
      await prisma.leadStatusChange.create({
        data: {
          leadId: id,
          fromStatus: currentLead.status,
          toStatus: cleanedData.status,
          changedBy: session.user.id,
          note: body.note || "Status updated",
        },
      });

      // Send notification email to all participants using session user's email
      try {
        // Call the notification endpoint
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/leads/${id}/notify`, {
          method: 'POST',
        });
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

    // Check for related records that would prevent deletion
    const relatedData = await prisma.lead.findUnique({
      where: { id },
      select: {
        quotes: { select: { id: true } },
        rfps: { select: { id: true } },
        projects: { select: { id: true } },
        proposals: { select: { id: true } },
        opportunities: { select: { id: true } },
      },
    });

    if (!relatedData) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // If there are important related records, prevent deletion
    const hasImportantRecords = 
      relatedData.quotes.length > 0 ||
      relatedData.rfps.length > 0 ||
      relatedData.projects.length > 0 ||
      relatedData.proposals.length > 0 ||
      relatedData.opportunities.length > 0;

    if (hasImportantRecords) {
      return NextResponse.json(
        { 
          error: "Cannot delete lead with related quotes, RFPs, projects, proposals, or opportunities. Please delete or unlink them first.",
          details: {
            quotes: relatedData.quotes.length,
            rfps: relatedData.rfps.length,
            projects: relatedData.projects.length,
            proposals: relatedData.proposals.length,
            opportunities: relatedData.opportunities.length,
          }
        },
        { status: 400 }
      );
    }

    // Use transaction to clean up related records that allow null leadId
    await prisma.$transaction(async (tx) => {
      // Unlink site survey if exists (leadId is nullable)
      await tx.siteSurvey.updateMany({
        where: { leadId: id },
        data: { leadId: null },
      });

      // Unlink email threads (leadId is nullable)
      await tx.emailThread.updateMany({
        where: { leadId: id },
        data: { leadId: null },
      });

      // Delete the lead (cascade will handle LeadContacts, LeadTasks, LeadNotes, LeadParticipants, LeadStatusChanges)
      await tx.lead.delete({
        where: { id },
      });
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

