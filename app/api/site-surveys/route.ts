import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { SurveyType } from "@prisma/client";
import { z } from "zod";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";

// Validation schema for creating a site survey
const createSiteSurveySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["COMPREHENSIVE", "VOIP", "CABLING", "WIFI", "DIGITAL_SIGNAGE", "HOTEL_TV", "NETWORK", "CCTV", "IOT"]).default("COMPREHENSIVE"), // Support legacy types but default to COMPREHENSIVE
  customerId: z.string().min(1, "Customer is required"),
  contactId: z.string().optional().nullable(),
  arrangedDate: z.string().optional().nullable(),
  assignFromId: z.string().optional().nullable(),
  assignToId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  status: z.string().optional().default("Scheduled"),
});

// GET all site surveys with pagination and search
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") as SurveyType | null;
    const status = searchParams.get("status") || "";
    const customerId = searchParams.get("customerId") || "";
    const assignedTo = searchParams.get("assignedTo") || "";
    const skip = (page - 1) * limit;

    const where: any = {};

    // Build search filter
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
        { city: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    // Add filters
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (assignedTo) {
      where.assignToId = assignedTo;
    }

    const [siteSurveys, total] = await Promise.all([
      prisma.siteSurvey.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone01: true,
            },
          },
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              mobilePhone: true,
            },
          },
          assignFrom: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.siteSurvey.count({ where }),
    ]);

    return NextResponse.json({
      siteSurveys,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching site surveys:", error);
    return NextResponse.json(
      { error: "Failed to fetch site surveys" },
      { status: 500 }
    );
  }
}

// POST create new site survey
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user has appropriate role
    if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createSiteSurveySchema.parse(body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Verify contact exists if provided
    if (validatedData.contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: validatedData.contactId },
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }
    }

    // Create the site survey
    const siteSurvey = await prisma.siteSurvey.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type as SurveyType,
        customerId: validatedData.customerId,
        contactId: validatedData.contactId || undefined,
        arrangedDate: validatedData.arrangedDate
          ? new Date(validatedData.arrangedDate)
          : null,
        assignFromId: validatedData.assignFromId || undefined,
        assignToId: validatedData.assignToId || undefined,
        address: validatedData.address,
        city: validatedData.city,
        phone: validatedData.phone,
        email: validatedData.email || undefined,
        status: validatedData.status,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignFrom: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send email notifications asynchronously (don't wait for completion)
    sendSiteSurveyNotifications(siteSurvey, session.user.id).catch((error) => {
      console.error("Failed to send site survey notifications:", error);
    });

    // Create calendar event for assignedTo user
    if (siteSurvey.assignTo?.email && siteSurvey.arrangedDate) {
      createSiteSurveyCalendarEvent(siteSurvey).catch((error) => {
        console.error("Failed to create calendar event:", error);
      });
    }

    return NextResponse.json(siteSurvey, { status: 201 });
  } catch (error) {
    console.error("Error creating site survey:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create site survey" },
      { status: 500 }
    );
  }
}

// Helper function to send email notifications
async function sendSiteSurveyNotifications(siteSurvey: any, userId: string) {
  try {
    // Validate assignFrom and assignTo have emails
    if (!siteSurvey.assignFrom?.email) {
      console.log("AssignFrom user has no email for site survey:", siteSurvey.id);
      return;
    }

    if (!siteSurvey.assignTo?.email) {
      console.log("AssignTo user has no email for site survey:", siteSurvey.id);
      return;
    }

    // Email will be sent FROM assignFrom account
    const senderEmail = siteSurvey.assignFrom.email;
    
    // Main recipients (TO) - only assignTo
    const recipients = [siteSurvey.assignTo.email];
    
    // CC recipients - assignFrom to stay in the loop
    const ccRecipients = [siteSurvey.assignFrom.email];

    console.log("Site Survey email config:", {
      from: senderEmail,
      to: recipients,
      cc: ccRecipients,
    });

    // Build email subject with tracking ID: SS-{surveyId}
    const subject = `${siteSurvey.title} [SS-${siteSurvey.id}]`;
    
    // Build email body
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Site Survey Assignment</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Survey ID:</strong> SS-${siteSurvey.id}</p>
          <p><strong>Title:</strong> ${siteSurvey.title}</p>
          <p><strong>Type:</strong> ${siteSurvey.type}</p>
          <p><strong>Status:</strong> ${siteSurvey.status}</p>
          <p><strong>Customer:</strong> ${siteSurvey.customer.name}</p>
          ${siteSurvey.contact ? `<p><strong>Contact:</strong> ${siteSurvey.contact.name}</p>` : ""}
          ${siteSurvey.arrangedDate ? `<p><strong>Arranged Date & Time:</strong> ${new Date(siteSurvey.arrangedDate).toLocaleString()}</p>` : ""}
          ${siteSurvey.address ? `<p><strong>Address:</strong> ${siteSurvey.address}</p>` : ""}
          ${siteSurvey.city ? `<p><strong>City:</strong> ${siteSurvey.city}</p>` : ""}
          ${siteSurvey.phone ? `<p><strong>Phone:</strong> ${siteSurvey.phone}</p>` : ""}
          ${siteSurvey.email ? `<p><strong>Email:</strong> ${siteSurvey.email}</p>` : ""}
        </div>
        ${siteSurvey.description ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Description</h3>
          <p style="white-space: pre-wrap;">${siteSurvey.description}</p>
        </div>
        ` : ""}
        <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196f3;">
          <p style="margin: 0;"><strong>Assigned From:</strong> ${siteSurvey.assignFrom?.name || "N/A"}</p>
          <p style="margin: 10px 0 0 0;"><strong>Assigned To:</strong> ${siteSurvey.assignTo?.name || "N/A"}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from your CRM system. Please do not reply to this email.
        </p>
      </div>
    `;

    // Send email using application-level permissions (from assignFrom, to assignTo, cc assignFrom)
    await sendEmailAsUser(senderEmail, subject, emailBody, recipients, ccRecipients);
    
    console.log(`Site survey notification sent from ${senderEmail} to: ${recipients.join(", ")}, cc: ${ccRecipients.join(", ")}`);
  } catch (error) {
    console.error("Error in sendSiteSurveyNotifications:", error);
    // Don't throw - we don't want to fail the creation if email fails
  }
}

// Helper function to create calendar event
async function createSiteSurveyCalendarEvent(siteSurvey: any) {
  try {
    if (!siteSurvey.assignTo?.email || !siteSurvey.arrangedDate) {
      console.log("Cannot create calendar event: missing assignTo email or arranged date");
      return;
    }

    const { createCalendarEvent } = await import("@/lib/microsoft/app-auth");

    // Build location string
    const location = [siteSurvey.address, siteSurvey.city]
      .filter(Boolean)
      .join(", ") || "TBD";

    // Build event body with all survey details
    const eventBody = `
      <div style="font-family: Arial, sans-serif;">
        <h3>Site Survey Details</h3>
        <p><strong>Survey ID:</strong> SS-${siteSurvey.id}</p>
        <p><strong>Type:</strong> ${siteSurvey.type}</p>
        <p><strong>Customer:</strong> ${siteSurvey.customer.name}</p>
        ${siteSurvey.contact ? `<p><strong>Contact:</strong> ${siteSurvey.contact.name}</p>` : ""}
        ${siteSurvey.phone ? `<p><strong>Phone:</strong> ${siteSurvey.phone}</p>` : ""}
        ${siteSurvey.email ? `<p><strong>Email:</strong> ${siteSurvey.email}</p>` : ""}
        ${siteSurvey.description ? `
        <hr/>
        <p><strong>Description:</strong></p>
        <p style="white-space: pre-wrap;">${siteSurvey.description}</p>
        ` : ""}
        <hr/>
        <p><strong>Assigned From:</strong> ${siteSurvey.assignFrom?.name || "N/A"}</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This is an automated calendar event from your CRM system.
        </p>
      </div>
    `;

    // Add attendees (assignFrom if available)
    const attendees = [];
    if (siteSurvey.assignFrom?.email) {
      attendees.push(siteSurvey.assignFrom.email);
    }

    await createCalendarEvent(siteSurvey.assignTo.email, {
      subject: `[Site Survey] ${siteSurvey.title}`,
      body: eventBody,
      start: siteSurvey.arrangedDate,
      end: siteSurvey.arrangedDate, // Will add 2 hours automatically
      location: location,
      attendees: attendees,
    });

    console.log(`Calendar event created for ${siteSurvey.assignTo.email}`);
  } catch (error) {
    console.warn("Calendar event creation skipped (missing permissions):", (error as Error).message);
    // Don't throw - we don't want to fail the creation if calendar event fails
  }
}

