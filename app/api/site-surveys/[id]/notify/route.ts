import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";
import { generateVoipSurveyExcel } from "@/lib/excel/voip-survey-excel";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the site survey with all related data
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
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

    if (!siteSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Validate assignFrom and assignTo
    if (!siteSurvey.assignFrom?.email) {
      return NextResponse.json(
        { error: "AssignFrom user must have an email address." },
        { status: 400 }
      );
    }

    if (!siteSurvey.assignTo?.email) {
      return NextResponse.json(
        { error: "AssignTo user must have an email address." },
        { status: 400 }
      );
    }

    // Email will be sent FROM assignFrom account
    const senderEmail = siteSurvey.assignFrom.email;
    
    // Main recipients (TO)
    const recipients: string[] = [siteSurvey.assignTo.email];
    
    // CC recipients (assignFrom to stay in the loop)
    const ccRecipients: string[] = [siteSurvey.assignFrom.email];

    console.log("Site Survey email configuration:", {
      from: senderEmail,
      to: recipients,
      cc: ccRecipients,
    });

    // Build email subject with tracking ID
    const subject = `${siteSurvey.title} [SS-${siteSurvey.id}]`;
    
    // Build email body
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Site Survey Assignment</h2>
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

    // Generate Excel attachment if VOIP survey
    let excelAttachment = null;
    if (siteSurvey.type === "VOIP") {
      try {
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

        if (voipSurvey) {
          const excelBlob = await generateVoipSurveyExcel(voipSurvey as any);
          const arrayBuffer = await excelBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          excelAttachment = {
            filename: `SS-${id}-VOIP-Survey.xlsx`,
            content: buffer.toString("base64"),
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          };
        }
      } catch (excelError) {
        console.error("Error generating Excel attachment:", excelError);
        // Continue without attachment if Excel generation fails
      }
    }

    // Send email using application-level permissions
    try {
      console.log("Sending email from:", senderEmail, "to:", recipients, "cc:", ccRecipients);
      
      await sendEmailWithAttachment(senderEmail, subject, emailBody, recipients, ccRecipients, excelAttachment);

      console.log("Email sent successfully");

      return NextResponse.json({
        success: true,
        message: `Email sent successfully from ${siteSurvey.assignFrom.name} to ${siteSurvey.assignTo.name}${excelAttachment ? " with Excel attachment" : ""}`,
        from: senderEmail,
        to: recipients,
        cc: ccRecipients,
      });
    } catch (graphError: any) {
      console.error("Microsoft Graph API error:", graphError);
      
      return NextResponse.json(
        { error: graphError.message || "Failed to send email via Microsoft Graph" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

// Helper function to send email with attachment
async function sendEmailWithAttachment(
  senderEmail: string,
  subject: string,
  body: string,
  recipients: string[],
  ccRecipients: string[],
  attachment: { filename: string; content: string; mimeType: string } | null
) {
  const { getAppAccessToken } = await import("@/lib/microsoft/app-auth");
  const accessToken = await getAppAccessToken();

  const emailPayload: any = {
    message: {
      subject: subject,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: recipients.map(email => ({
        emailAddress: {
          address: email,
        },
      })),
      ccRecipients: ccRecipients.map(email => ({
        emailAddress: {
          address: email,
        },
      })),
    },
    saveToSentItems: true,
  };

  // Add attachment if provided
  if (attachment) {
    emailPayload.message.attachments = [
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: attachment.filename,
        contentType: attachment.mimeType,
        contentBytes: attachment.content,
      },
    ];
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Microsoft Graph API error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });

    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: { message: errorText } };
    }

    throw new Error(
      errorData.error?.message || `Failed to send email: ${response.status}`
    );
  }
}


