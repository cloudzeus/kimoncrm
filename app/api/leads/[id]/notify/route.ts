import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";

// POST - Send notifications for a lead to all participants
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: leadId } = await params;

    // Fetch the lead with all necessary data
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
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
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Send notification email to all participants using session user's email
    await sendLeadNotifications(lead, session.user.email!);

    return NextResponse.json({ 
      success: true,
      message: "Notifications sent successfully" 
    });
  } catch (error: any) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to send lead notification emails
async function sendLeadNotifications(lead: any, senderEmail: string) {
  try {

    // Collect all recipients
    const recipients: string[] = [];
    const ccRecipients: string[] = [];

    // Add owner if exists
    if (lead.owner?.email) {
      recipients.push(lead.owner.email);
    }

    // Add assignee if exists and is different from owner
    if (lead.assignee?.email && lead.assignee.email !== lead.owner?.email) {
      recipients.push(lead.assignee.email);
    }

    // Add department manager if department is assigned
    if (lead.department?.manager?.email) {
      const managerEmail = lead.department.manager.email;
      if (!recipients.includes(managerEmail)) {
        recipients.push(managerEmail);
      }
    }

    // Add department email group if exists
    if (lead.department?.emailGroup) {
      if (!recipients.includes(lead.department.emailGroup)) {
        recipients.push(lead.department.emailGroup);
      }
    }

    // If no recipients, skip sending
    if (recipients.length === 0) {
      console.log("No recipients found for lead:", lead.id);
      return;
    }

    // Build email subject with LL-id for tracking
    const subject = `Lead Update: ${lead.leadNumber} - ${lead.title}`;

    // Build improved email body with company signature
    const emailBody = await buildLeadEmailBody(lead);

    // Send email using the sales department email as sender
    await sendEmailAsUser(senderEmail, subject, emailBody, recipients, ccRecipients);

    console.log(`Lead notification sent from ${senderEmail} to: ${recipients.join(", ")}, cc: ${ccRecipients.join(", ")}`);
  } catch (error) {
    console.error("Error in sendLeadNotifications:", error);
    throw error;
  }
}

// Build improved email body with company signature
async function buildLeadEmailBody(lead: any): Promise<string> {
  // Get company data for signature
  const companyData = await prisma.defaultCompanyData.findFirst({
    include: {
      logo: true,
    },
  });

  const logoUrl = companyData?.logo?.url || "";
  const companyName = companyData?.companyName || "";
  const address = companyData?.address || "";
  const city = companyData?.city || "";
  const zip = companyData?.zip || "";
  const phone1 = companyData?.phone1 || "";
  const phone2 = companyData?.phone2 || "";
  const email = companyData?.email || "";
  const website = companyData?.website || "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
    
    <!-- Header with logo -->
    ${logoUrl ? `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <img src="${logoUrl}" alt="${companyName}" style="max-width: 200px; height: auto; background-color: white; padding: 10px; border-radius: 8px;" />
    </div>
    ` : ''}
    
    <!-- Main Content -->
    <div style="padding: 40px;">
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Lead Update: ${lead.leadNumber}</h2>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Lead ID:</strong> ${lead.leadNumber}</p>
        <p style="margin: 5px 0;"><strong>Title:</strong> ${lead.title}</p>
        ${lead.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${lead.description}</p>` : ''}
        ${lead.customer ? `<p style="margin: 5px 0;"><strong>Customer:</strong> ${lead.customer.name}${lead.customer.code ? ` (${lead.customer.code})` : ''}</p>` : ''}
        ${lead.contact ? `<p style="margin: 5px 0;"><strong>Contact:</strong> ${lead.contact.name}${lead.contact.email ? ` (${lead.contact.email})` : ''}</p>` : ''}
        <p style="margin: 5px 0;"><strong>Stage:</strong> <span style="background-color: #e0e7ff; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${lead.stage}</span></p>
        <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background-color: ${lead.status === 'ACTIVE' ? '#d1fae5' : '#fef3c7'}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${lead.status}</span></p>
        <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="background-color: ${lead.priority === 'HIGH' || lead.priority === 'URGENT' ? '#fee2e2' : '#e0e7ff'}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${lead.priority}</span></p>
        ${lead.owner ? `<p style="margin: 5px 0;"><strong>Owner:</strong> ${lead.owner.name}</p>` : ''}
        ${lead.assignee ? `<p style="margin: 5px 0;"><strong>Assigned To:</strong> ${lead.assignee.name}</p>` : ''}
        ${lead.department ? `<p style="margin: 5px 0;"><strong>Department:</strong> ${lead.department.name}</p>` : ''}
        ${lead.assignedCompany ? `<p style="margin: 5px 0;"><strong>Subcontractor:</strong> ${lead.assignedCompany.name}</p>` : ''}
        ${lead.estimatedValue ? `<p style="margin: 5px 0;"><strong>Estimated Value:</strong> €${lead.estimatedValue.toLocaleString()}</p>` : ''}
        ${lead.expectedCloseDate ? `<p style="margin: 5px 0;"><strong>Expected Close Date:</strong> ${new Date(lead.expectedCloseDate).toLocaleDateString()}</p>` : ''}
        ${lead.requestedSiteSurvey ? `<p style="margin: 5px 0;"><strong>Site Survey:</strong> <span style="color: #059669;">✓ Requested</span></p>` : ''}
      </div>
    </div>
    
    <!-- Company Signature -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white;">
      <div style="text-align: center;">
        <h3 style="margin: 0 0 15px 0; font-size: 20px;">${companyName}</h3>
        ${address || city || zip ? `<p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">${address}${city ? `, ${city}` : ''}${zip ? ` ${zip}` : ''}</p>` : ''}
        ${phone1 || phone2 ? `<p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">${phone1}${phone2 ? ` | ${phone2}` : ''}</p>` : ''}
        ${email ? `<p style="margin: 5px 0; font-size: 14px; opacity: 0.9;"><a href="mailto:${email}" style="color: white; text-decoration: underline;">${email}</a></p>` : ''}
        ${website ? `<p style="margin: 5px 0; font-size: 14px; opacity: 0.9;"><a href="${website}" style="color: white; text-decoration: underline;">${website}</a></p>` : ''}
      </div>
      
      <!-- Social Media Icons -->
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
        <p style="margin: 0 0 10px 0; font-size: 12px; opacity: 0.8;">Follow Us:</p>
        <div style="display: flex; justify-content: center; gap: 15px;">
          ${companyData?.website ? `<a href="${companyData.website}" style="color: white; text-decoration: none;">🌐 Website</a>` : ''}
          ${email ? `<a href="mailto:${email}" style="color: white; text-decoration: none;">✉️ Email</a>` : ''}
          ${phone1 ? `<a href="tel:${phone1}" style="color: white; text-decoration: none;">📞 Call</a>` : ''}
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p style="margin: 5px 0;">This is an automated notification from your CRM system.</p>
      <p style="margin: 5px 0;">Lead ID: ${lead.leadNumber} | Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

