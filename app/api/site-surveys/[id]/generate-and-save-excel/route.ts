import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma as db } from "@/lib/db/prisma";
import { generateBuildingExcelReport } from "@/lib/excel/building-report-excel";
import { uploadToBunnyCDN } from "@/lib/bunny/upload";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: siteSurveyId } = await params;
    const body = await request.json();
    const { buildings, stepCompleted } = body;

    // Get site survey with lead info
    const siteSurvey = await db.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      select: {
        id: true,
        title: true,
        leadId: true,
        lead: {
          select: {
            id: true,
            title: true,
            leadNumber: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            assignee: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
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

    if (!siteSurvey.leadId) {
      return NextResponse.json(
        { error: "Site survey is not linked to a lead" },
        { status: 400 }
      );
    }

    // Generate Excel for each building
    const generatedFiles = [];
    
    for (let i = 0; i < buildings.length; i++) {
      const building = buildings[i];
      
      try {
        // Generate Excel workbook and convert to buffer
        const workbook = await generateBuildingExcelReport(building);
        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        
        // Determine version number
        const existingFiles = await db.file.findMany({
          where: {
            leadId: siteSurvey.leadId,
            filename: {
              startsWith: `SR-002-infrastructure-${building.name || 'building'}-v`,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const versionNumber = existingFiles.length + 1;
        const filename = `SR-002-infrastructure-${building.name || 'building'}-v${versionNumber}.xlsx`;
        
        // Upload to BunnyCDN
        const uploadResult = await uploadToBunnyCDN(buffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        // Save file record to database
        const fileRecord = await db.file.create({
          data: {
            filename,
            originalName: filename,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: buffer.length,
            url: uploadResult.url,
            uploadedById: session.user.id,
            leadId: siteSurvey.leadId,
            description: `Infrastructure report for ${building.name || 'building'} - Step ${stepCompleted} completion`,
          },
        });

        generatedFiles.push({
          buildingName: building.name,
          filename,
          fileId: fileRecord.id,
          url: uploadResult.url,
        });

      } catch (error) {
        console.error(`Error generating Excel for building ${building.name}:`, error);
        // Continue with other buildings even if one fails
      }
    }

    // Update lead status if infrastructure step is completed
    if (stepCompleted === 1 && siteSurvey.lead) {
      await db.lead.update({
        where: { id: siteSurvey.leadId },
        data: {
          stage: "LEAD_TECHNICAL_REVIEW", // Move to technical review stage
        },
      });

      // Create status change record
      await db.leadStatusChange.create({
        data: {
          leadId: siteSurvey.leadId,
          fromStatus: null,
          toStatus: "LEAD_TECHNICAL_REVIEW",
          changedBy: session.user.id,
          notes: `Infrastructure step completed - Excel reports generated`,
        },
      });

      // Send notification emails to lead owner and assignee
      const recipients = new Set<string>();
      if (siteSurvey.lead.owner?.email) {
        recipients.add(siteSurvey.lead.owner.email);
      }
      if (siteSurvey.lead.assignee?.email) {
        recipients.add(siteSurvey.lead.assignee.email);
      }
      recipients.delete(session.user.email); // Don't notify the person who completed it

      if (recipients.size > 0) {
        // Import email function
        const { sendEmailAsUser } = await import("@/lib/microsoft/app-auth");
        const { generateEmailSignature } = await import("@/lib/email/signature");
        
        const signature = await generateEmailSignature(session.user.id, db);
        const subject = `Infrastructure Step Completed: ${siteSurvey.lead.title}`;
        
        const body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🏗️ INFRASTRUCTURE STEP COMPLETED</h1>
              </div>
              
              <div style="padding: 30px;">
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                  <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">Site Survey Progress Update</h2>
                  <p style="margin: 0; color: #64748b; font-size: 14px;">The infrastructure planning step has been completed for lead <strong style="color: #1e293b;">${siteSurvey.lead.title}</strong></p>
                </div>
                
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Generated Files</h3>
                  <ul style="margin: 0; padding-left: 20px;">
                    ${generatedFiles.map(file => `
                      <li style="margin: 5px 0; color: #1e293b; font-size: 14px;">
                        <strong>${file.filename}</strong> - ${file.buildingName}
                      </li>
                    `).join('')}
                  </ul>
                </div>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">Lead:</td>
                      <td style="padding: 4px 0; color: #1e293b; font-size: 13px;">${siteSurvey.lead.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">Lead Number:</td>
                      <td style="padding: 4px 0; color: #1e293b; font-size: 13px;">${siteSurvey.lead.leadNumber || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">Site Survey:</td>
                      <td style="padding: 4px 0; color: #1e293b; font-size: 13px;">${siteSurvey.title}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">This notification was sent by KIMON CRM</p>
              </div>
            </div>
            ${signature}
          </body>
          </html>
        `;

        // Send emails
        const emailPromises = Array.from(recipients).map(email =>
          sendEmailAsUser(session.user.email, subject, body, [email]).catch(error => {
            console.error(`Failed to send email to ${email}:`, error);
          })
        );

        await Promise.allSettled(emailPromises);
      }
    }

    return NextResponse.json({
      success: true,
      filesGenerated: generatedFiles.length,
      files: generatedFiles,
      leadStatusUpdated: stepCompleted === 1,
    });

  } catch (error) {
    console.error("Error generating and saving Excel:", error);
    return NextResponse.json(
      { error: "Failed to generate and save Excel files" },
      { status: 500 }
    );
  }
}
