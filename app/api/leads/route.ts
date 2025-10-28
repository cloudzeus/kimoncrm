import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { DealStage, LeadStatus, LeadPriority } from "@prisma/client";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";

// Validation schema for creating a lead
const createLeadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  assignedCompanyId: z.string().optional().nullable(),
  stage: z.enum(["LEAD_NEW", "LEAD_WORKING", "LEAD_NURTURING", "LEAD_QUALIFIED", "LEAD_DISQUALIFIED", "OPP_PROSPECTING", "OPP_DISCOVERY", "OPP_QUALIFIED", "OPP_PROPOSAL", "OPP_NEGOTIATION", "OPP_CLOSED_WON", "OPP_CLOSED_LOST", "RFP_RECEIVED", "RFP_GO_NO_GO", "RFP_DRAFTING", "RFP_INTERNAL_REVIEW", "RFP_SUBMITTED", "RFP_CLARIFICATIONS", "RFP_AWARDED", "RFP_LOST", "RFP_CANCELLED", "QUOTE_DRAFT", "QUOTE_INTERNAL_REVIEW", "QUOTE_SENT", "QUOTE_NEGOTIATION", "QUOTE_ACCEPTED", "QUOTE_REJECTED", "QUOTE_EXPIRED"]).default("LEAD_NEW"),
  status: z.enum(["ACTIVE", "CLOSED", "ARCHIVED", "FROZEN"]).default("ACTIVE"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  source: z.string().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  requestedSiteSurvey: z.boolean().default(false),
  ownerId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
});

// GET all leads with filters, pagination, and search
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const ownerId = searchParams.get("ownerId");
    const customerId = searchParams.get("customerId");

    const where: any = {};

    // Search across title and description
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { leadNumber: { contains: search } },
      ];
    }

    if (stage) {
      where.stage = stage;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          contact: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              avatar: true,
              role: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              avatar: true,
              role: true,
            },
          },
          department: true,
          siteSurvey: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          assignedCompany: true,
          _count: {
            select: {
              quotes: true,
              rfps: true,
              projects: true,
              emails: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads", details: error.message },
      { status: 500 }
    );
  }
}

// POST create a new lead
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLeadSchema.parse(body);

    // Generate lead number if not provided
    const latestLead = await prisma.lead.findFirst({
      orderBy: { createdAt: "desc" },
      select: { leadNumber: true },
    });

    let leadNumber = "LL001";
    if (latestLead?.leadNumber) {
      const match = latestLead.leadNumber.match(/(\d+)$/);
      if (match) {
        const number = parseInt(match[1]) + 1;
        leadNumber = `LL${number.toString().padStart(3, "0")}`;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        ...validatedData,
        leadNumber,
        stage: validatedData.stage as DealStage,
        status: validatedData.status as LeadStatus,
        priority: validatedData.priority as LeadPriority,
        expectedCloseDate: validatedData.expectedCloseDate
          ? new Date(validatedData.expectedCloseDate)
          : null,
      },
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
        department: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assignedCompany: true,
      },
    });

    // Create initial status change record
    if (session.user) {
      await prisma.leadStatusChange.create({
        data: {
          leadId: lead.id,
          fromStatus: null,
          toStatus: lead.status,
          changedBy: session.user.id,
          note: "Lead created",
        },
      });
    }

    // Send email notifications
    try {
      await sendLeadNotifications(lead, session.user);
    } catch (emailError) {
      console.error("Error sending lead notifications:", emailError);
      // Don't fail the request if email fails
    }

    // If site survey was requested, create it
    if (validatedData.requestedSiteSurvey && lead.customerId) {
      try {
        const siteSurvey = await prisma.siteSurvey.create({
          data: {
            title: `Site Survey - ${lead.title}`,
            description: lead.description || undefined,
            type: "COMPREHENSIVE",
            customerId: lead.customerId,
            contactId: lead.contactId || undefined,
            assignFromId: lead.ownerId || undefined,
            assignToId: lead.assigneeId || undefined,
            status: "Scheduled",
            leadId: lead.id,
          },
        });
        console.log(`Created site survey ${siteSurvey.id} for lead ${lead.id}`);
      } catch (surveyError) {
        console.error("Error creating site survey:", surveyError);
        // Don't fail the request if site survey creation fails
      }
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create lead", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to send lead notification emails
async function sendLeadNotifications(lead: any, creator: any) {
  try {
    
    // Need the creator's email to send on their behalf
    if (!creator?.email) {
      console.log("Creator has no email for lead:", lead.id);
      return;
    }

    // Collect all recipients
    const recipients: string[] = [];
    const ccRecipients: string[] = [];

    // Add creator as main recipient
    if (creator.email) {
      recipients.push(creator.email);
    }

    // Add owner if exists and is different from creator
    if (lead.owner?.email && lead.owner.email !== creator.email) {
      if (!recipients.includes(lead.owner.email)) {
        recipients.push(lead.owner.email);
      }
    }

    // Add assignee if exists and is different from creator and owner
    if (lead.assignee?.email) {
      if (!recipients.includes(lead.assignee.email) && lead.assignee.email !== creator.email && lead.assignee.email !== lead.owner?.email) {
        recipients.push(lead.assignee.email);
      }
    }

    // Add department manager if department is assigned
    if (lead.department?.manager?.email) {
      const managerEmail = lead.department.manager.email;
      if (!recipients.includes(managerEmail) && managerEmail !== creator.email) {
        recipients.push(managerEmail);
      }
    }

    // Add department email group if exists
    if (lead.department?.emailGroup) {
      if (!ccRecipients.includes(lead.department.emailGroup)) {
        ccRecipients.push(lead.department.emailGroup);
      }
    }

    // If no recipients, skip sending
    if (recipients.length === 0) {
      console.log("No recipients found for lead:", lead.id);
      return;
    }

    // Build email subject with LL-id for tracking
    const subject = `New Lead Created: ${lead.leadNumber} - ${lead.title}`;

    // Build email body
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Lead Created: ${lead.leadNumber}</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Lead ID:</strong> ${lead.leadNumber}</p>
          <p><strong>Title:</strong> ${lead.title}</p>
          ${lead.description ? `<p><strong>Description:</strong> ${lead.description}</p>` : ''}
          ${lead.customer ? `<p><strong>Customer:</strong> ${lead.customer.name}</p>` : ''}
          ${lead.contact ? `<p><strong>Contact:</strong> ${lead.contact.name}${lead.contact.email ? ` (${lead.contact.email})` : ''}</p>` : ''}
          <p><strong>Stage:</strong> ${lead.stage}</p>
          <p><strong>Status:</strong> ${lead.status}</p>
          <p><strong>Priority:</strong> ${lead.priority}</p>
          ${lead.owner ? `<p><strong>Owner:</strong> ${lead.owner.name}</p>` : ''}
          ${lead.assignee ? `<p><strong>Assigned To:</strong> ${lead.assignee.name}</p>` : ''}
          ${lead.department ? `<p><strong>Department:</strong> ${lead.department.name}</p>` : ''}
          ${lead.assignedCompany ? `<p><strong>Assigned Company:</strong> ${lead.assignedCompany.name}</p>` : ''}
          ${lead.estimatedValue ? `<p><strong>Estimated Value:</strong> €${lead.estimatedValue.toLocaleString()}</p>` : ''}
          ${lead.expectedCloseDate ? `<p><strong>Expected Close Date:</strong> ${new Date(lead.expectedCloseDate).toLocaleDateString()}</p>` : ''}
          ${lead.requestedSiteSurvey ? `<p><strong>Site Survey:</strong> Requested</p>` : ''}
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from your CRM system. Please do not reply to this email.<br>
          Lead ID: ${lead.leadNumber}
        </p>
      </div>
    `;

    // Send email using the creator's email as the sender
    await sendEmailAsUser(creator.email, subject, emailBody, recipients, ccRecipients);

    console.log(`Lead notification sent from ${creator.email} to: ${recipients.join(", ")}, cc: ${ccRecipients.join(", ")}`);
  } catch (error) {
    console.error("Error in sendLeadNotifications:", error);
    // Don't throw - we don't want to fail the creation if email fails
  }
}

