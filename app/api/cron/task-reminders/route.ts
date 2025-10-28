import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";
import { generateEmailSignature } from "@/lib/email/signature";

/**
 * POST /api/cron/task-reminders - Send task reminders for tasks due tomorrow
 * This endpoint is called by the cron job daily
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔔 Running task reminders cron job...");

    // Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find tasks with reminder date tomorrow
    const tasksToRemind = await db.leadTask.findMany({
      where: {
        reminderDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: {
          not: "COMPLETED",
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            title: true,
            leadNumber: true,
            owner: {
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

    console.log(`📋 Found ${tasksToRemind.length} tasks with reminders for tomorrow`);

    if (tasksToRemind.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No task reminders to send",
        count: 0,
      });
    }

    // Group tasks by assignee to send consolidated emails
    const tasksByAssignee = new Map<string, typeof tasksToRemind>();
    
    for (const task of tasksToRemind) {
      if (task.assignedTo?.email) {
        const email = task.assignedTo.email;
        if (!tasksByAssignee.has(email)) {
          tasksByAssignee.set(email, []);
        }
        tasksByAssignee.get(email)!.push(task);
      }
    }

    let emailsSent = 0;
    const emailPromises: Promise<void>[] = [];

    // Send reminder emails
    for (const [assigneeEmail, tasks] of tasksByAssignee) {
      const assigneeName = tasks[0].assignedTo?.name || "User";
      
      emailPromises.push(
        sendTaskReminderEmail(assigneeEmail, assigneeName, tasks)
          .then(() => {
            emailsSent++;
            console.log(`✅ Reminder sent to ${assigneeEmail} for ${tasks.length} task(s)`);
          })
          .catch((error) => {
            console.error(`❌ Failed to send reminder to ${assigneeEmail}:`, error);
          })
      );
    }

    // Wait for all emails to be sent
    await Promise.allSettled(emailPromises);

    console.log(`🔔 Task reminders job completed: ${emailsSent} emails sent`);

    return NextResponse.json({
      success: true,
      message: `Task reminders sent successfully`,
      count: emailsSent,
      tasksProcessed: tasksToRemind.length,
    });
  } catch (error) {
    console.error("❌ Error in task reminders cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Send reminder email to a user for their tasks
 */
async function sendTaskReminderEmail(
  recipientEmail: string,
  recipientName: string,
  tasks: any[]
): Promise<void> {
  try {
    const subject = `🔔 Task Reminder: ${tasks.length} task${tasks.length > 1 ? 's' : ''} due tomorrow`;
    
    // Generate email signature (use system email for sending)
    const systemEmail = process.env.SYSTEM_EMAIL || "noreply@kimoncrm.com";
    
    // Build task list HTML
    const taskListHtml = tasks.map((task, index) => {
      const leadUrl = `${process.env.APP_URL || 'http://localhost:3000'}/leads/${task.lead.id}`;
      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
      const statusColor = task.status === "NOT_STARTED" ? "#6b7280" : "#3b82f6";
      const statusText = task.status === "NOT_STARTED" ? "Not Started" : "In Progress";
      
      return `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #1e293b; font-size: 16px;">${task.title}</h4>
            <span style="background-color: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${statusText}</span>
          </div>
          
          ${task.description ? `
          <p style="margin: 10px 0; color: #64748b; font-size: 14px; line-height: 1.5;">${task.description}</p>
          ` : ''}
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9;">
            <table style="width: 100%; font-size: 13px;">
              <tr>
                <td style="color: #64748b; padding: 2px 0; width: 30%;"><strong>Lead:</strong></td>
                <td style="color: #1e293b; padding: 2px 0;">${task.lead.title}</td>
              </tr>
              ${task.lead.leadNumber ? `
              <tr>
                <td style="color: #64748b; padding: 2px 0;"><strong>Lead #:</strong></td>
                <td style="color: #1e293b; padding: 2px 0;">${task.lead.leadNumber}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="color: #64748b; padding: 2px 0;"><strong>Due Date:</strong></td>
                <td style="color: #1e293b; padding: 2px 0;">${dueDate}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;"><strong>Created By:</strong></td>
                <td style="color: #1e293b; padding: 2px 0;">${task.createdBy.name}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 15px;">
            <a href="${leadUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              📋 View Lead & Task
            </a>
          </div>
        </div>
      `;
    }).join('');

    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🔔 TASK REMINDER</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due tomorrow</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
              <h2 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">👋 Hello ${recipientName}!</h2>
              <p style="margin: 0; color: #92400e; font-size: 14px;">This is a friendly reminder about your upcoming tasks. Please review and take action as needed.</p>
            </div>
            
            <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📋 Your Tasks Due Tomorrow</h3>
            
            ${taskListHtml}
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center;">
              <h4 style="margin: 0 0 10px 0; color: #1e293b;">💡 Quick Tips</h4>
              <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; text-align: left;">
                <li>Click "View Lead & Task" to access the full details</li>
                <li>Update task status as you make progress</li>
                <li>Add notes or comments to keep everyone informed</li>
                <li>Contact the lead owner if you need clarification</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">This reminder was sent automatically by KIMON CRM</p>
            <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">To manage your notification preferences, visit your profile settings</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using system account
    await sendEmailAsUser(systemEmail, subject, body, [recipientEmail]);
  } catch (error) {
    console.error(`Error sending reminder email to ${recipientEmail}:`, error);
    throw error;
  }
}
