import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";

const voipSurveySchema = z.object({
  oldPbxModel: z.string().optional(),
  oldPbxDescription: z.string().optional(),
  oldPbxDevices: z.array(z.object({
    type: z.enum(["Αναλογική", "Ψηφιακή", "VOIP"]),
    model: z.string(),
    number: z.string(),
    location: z.string().optional(),
  })).optional(),
  providerName: z.string().optional(),
  providerLines: z.array(z.object({
    type: z.enum(["PSTN", "ISDN", "PRI", "SIP"]),
    lines: z.string(),
    phoneNumber: z.string().optional(),
  })).optional(),
  internetFeedType: z.string().optional(),
  internetFeedSpeed: z.string().optional(),
  networkDevices: z.array(z.object({
    type: z.enum(["ROUTER", "POE", "SWITCH", "ATA", "FIREWALL", "GATEWAY"]),
    deviceName: z.string(),
    deviceIp: z.string().optional(),
  })).optional(),
  cablingStatus: z.string().optional(),
  pbxBrand: z.string().optional(),
  conChannelsNum: z.string().optional(),
  extensionsNum: z.string().optional(),
  hotelPms: z.string().optional(),
});

// GET VOIP survey details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const voipSurvey = await prisma.voipSurvey.findUnique({
      where: { siteSurveyId: id },
      include: {
        siteSurvey: {
          include: {
            customer: true,
            contact: true,
            assignFrom: true,
            assignTo: true,
          },
        },
      },
    });

    if (!voipSurvey) {
      return NextResponse.json(
        { error: "VOIP survey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(voipSurvey);
  } catch (error) {
    console.error("Error fetching VOIP survey:", error);
    return NextResponse.json(
      { error: "Failed to fetch VOIP survey" },
      { status: 500 }
    );
  }
}

// POST/PUT create or update VOIP survey
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = voipSurveySchema.parse(body);

    // Verify site survey exists and is VOIP type
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    if (siteSurvey.type !== "VOIP") {
      return NextResponse.json(
        { error: "Site survey is not a VOIP survey" },
        { status: 400 }
      );
    }

    // Check if VOIP survey already exists
    const existing = await prisma.voipSurvey.findUnique({
      where: { siteSurveyId: id },
    });

    // Use transaction to update both VOIP survey and site survey status
    const result = await prisma.$transaction(async (tx) => {
      // Create or update VOIP survey
      const voipSurvey = existing
        ? await tx.voipSurvey.update({
            where: { siteSurveyId: id },
            data: validatedData,
          })
        : await tx.voipSurvey.create({
            data: {
              siteSurveyId: id,
              ...validatedData,
            },
          });

      // Update site survey status to Completed
      await tx.siteSurvey.update({
        where: { id },
        data: { status: "Completed" },
      });

      return voipSurvey;
    });

    // Send email notifications asynchronously
    sendVoipSurveyNotifications(siteSurvey, session.user.email!).catch((error) => {
      console.error("Failed to send VOIP survey notifications:", error);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving VOIP survey:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save VOIP survey" },
      { status: 500 }
    );
  }
}

// DELETE VOIP survey
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.voipSurvey.delete({
      where: { siteSurveyId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting VOIP survey:", error);
    return NextResponse.json(
      { error: "Failed to delete VOIP survey" },
      { status: 500 }
    );
  }
}

// Helper function to send email notifications
async function sendVoipSurveyNotifications(siteSurvey: any, senderEmail: string) {
  try {
    // Validate assignFrom and assignTo have emails
    if (!siteSurvey.assignFrom?.email) {
      console.log("AssignFrom user has no email for VOIP survey completion");
      return;
    }

    if (!siteSurvey.assignTo?.email) {
      console.log("AssignTo user has no email for VOIP survey completion");
      return;
    }

    // Email will be sent FROM assignFrom account
    const fromEmail = siteSurvey.assignFrom.email;
    
    // Main recipients (TO) - only assignTo
    const recipients = [siteSurvey.assignTo.email];
    
    // CC recipients - assignFrom to stay in the loop
    const ccRecipients = [siteSurvey.assignFrom.email];

    // Build email subject with tracking ID
    const subject = `VOIP Survey Completed - ${siteSurvey.title} [SS-${siteSurvey.id}]`;
    
    // Build email body
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2980b9;">VOIP Site Survey Completed</h2>
        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Survey ID:</strong> SS-${siteSurvey.id}</p>
          <p><strong>Title:</strong> ${siteSurvey.title}</p>
          <p><strong>Type:</strong> ${siteSurvey.type}</p>
          <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">Completed</span></p>
          <p><strong>Customer:</strong> ${siteSurvey.customer.name}</p>
          ${siteSurvey.contact ? `<p><strong>Contact:</strong> ${siteSurvey.contact.name}</p>` : ""}
          ${siteSurvey.arrangedDate ? `<p><strong>Arranged Date & Time:</strong> ${new Date(siteSurvey.arrangedDate).toLocaleString()}</p>` : ""}
        </div>
        <div style="background-color: #d5f4e6; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #27ae60;">✓ VOIP Technical Details Completed</h3>
          <p style="margin: 5px 0;">All VOIP survey technical details have been documented and saved.</p>
          <p style="margin: 5px 0;">The site survey status has been updated to <strong>Completed</strong>.</p>
        </div>
        ${siteSurvey.address ? `<p><strong>Location:</strong> ${siteSurvey.address}${siteSurvey.city ? ", " + siteSurvey.city : ""}</p>` : ""}
        <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196f3;">
          <p style="margin: 0;"><strong>Assigned From:</strong> ${siteSurvey.assignFrom?.name || "N/A"}</p>
          <p style="margin: 10px 0 0 0;"><strong>Assigned To:</strong> ${siteSurvey.assignTo?.name || "N/A"}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from your CRM system. The VOIP survey has been completed and all technical details have been documented.
        </p>
      </div>
    `;

    // Send email using application-level permissions (from assignFrom, to assignTo, cc assignFrom)
    await sendEmailAsUser(fromEmail, subject, emailBody, recipients, ccRecipients);
    
    console.log(`VOIP survey completion notification sent from ${fromEmail} to: ${recipients.join(", ")}, cc: ${ccRecipients.join(", ")}`);
  } catch (error) {
    console.error("Error in sendVoipSurveyNotifications:", error);
    // Don't throw - we don't want to fail the save if email fails
  }
}


