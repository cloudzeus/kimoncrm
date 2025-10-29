import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma as db } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";
import { generateEmailSignature } from "@/lib/email/signature";
import { createLeadTaskCalendarEvent } from "@/lib/calendar/lead-task-calendar";
import { updateTaskDescriptionWithAttribution } from "@/lib/tasks/user-attribution";

// GET /api/leads/[id]/tasks - Get all tasks for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const tasks = await db.leadTask.findMany({
      where: { leadId: id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { order: "asc" },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id]/tasks - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const { title, description, assignedToId, contactId, dueDate, reminderDate, assigneeIds } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Get the lead to check permissions and get related users
    const lead = await db.lead.findUnique({
      where: { id },
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
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Get the highest order for tasks in NOT_STARTED status
    const maxOrder = await db.leadTask.findMany({
      where: {
        leadId: id,
        status: "NOT_STARTED",
      },
      orderBy: {
        order: "desc",
      },
      take: 1,
    });

    const newOrder = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;

    // Parse dates if provided
    const dueDateParsed = dueDate ? new Date(dueDate) : null;
    const reminderDateParsed = reminderDate ? new Date(reminderDate) : null;

    // Add user attribution to description if provided
    const attributedDescription = description 
      ? updateTaskDescriptionWithAttribution(session.user.name || 'Unknown User', description)
      : null;

    // Validate contactId if provided
    let validatedContactId = null;
    if (contactId && contactId.trim() !== '') {
      const contactExists = await db.contact.findUnique({
        where: { id: contactId },
      });
      if (contactExists) {
        validatedContactId = contactId;
      }
    }

    // Create the task
    const task = await db.leadTask.create({
      data: {
        leadId: id,
        title,
        description: attributedDescription,
        assignedToId: assignedToId || null,
        contactId: validatedContactId,
        dueDate: dueDateParsed,
        reminderDate: reminderDateParsed,
        createdById: session.user.id,
        status: "NOT_STARTED",
        order: newOrder,
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
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignees: {
          include: {
            user: {
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

    // Handle multiple assignees if provided
    if (assigneeIds && assigneeIds.length > 0) {
      await db.leadTaskAssignee.createMany({
        data: assigneeIds.map((userId: string) => ({
          taskId: task.id,
          userId,
        })),
        skipDuplicates: true,
      });

      // Refetch the task with assignees for email notification
      const taskWithAssignees = await db.leadTask.findUnique({
        where: { id: task.id },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          contact: {
            select: { id: true, name: true, email: true },
          },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      // Send notification emails with updated task
      await sendTaskNotificationEmails(taskWithAssignees || task, lead, session.user.email, "created", session.user.id);
    } else {
      // Send notification emails
      await sendTaskNotificationEmails(task, lead, session.user.email, "created", session.user.id);
    }

      // Create calendar events for all assignees if task has due date
      if (task.dueDate) {
        const taskForCalendar = {
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          createdBy: {
            email: task.createdBy.email,
            name: task.createdBy.name || 'Unknown User'
          }
        };

        // Create calendar event for multiple assignees (new field)
        if (assigneeIds && assigneeIds.length > 0) {
          // Get user emails for assignees
          const assigneeUsers = await db.user.findMany({
            where: { id: { in: assigneeIds } },
            select: { id: true, email: true, name: true }
          });

          // Create calendar event for each assignee
          for (const user of assigneeUsers) {
            await createLeadTaskCalendarEvent(
              {
                ...taskForCalendar,
                assignedTo: {
                  email: user.email,
                  name: user.name || 'Unknown User'
                }
              },
              lead,
              session.user.email
            );
          }
        } 
        // Fallback to old single assignee if present
        else if (task.assignedTo) {
          await createLeadTaskCalendarEvent(
            {
              ...taskForCalendar,
              assignedTo: {
                email: task.assignedTo.email,
                name: task.assignedTo.name || 'Unknown User'
              }
            },
            lead,
            session.user.email
          );
        }
      }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// Helper function to send notification emails
async function sendTaskNotificationEmails(
  task: any,
  lead: any,
  senderEmail: string,
  action: "created" | "status_changed",
  senderUserId?: string
) {
  try {
    // Collect unique email addresses
    const recipients = new Set<string>();

    // Add lead manager (owner)
    if (lead.owner?.email) {
      recipients.add(lead.owner.email);
    }

    // Add lead assignee
    if (lead.assignee?.email) {
      recipients.add(lead.assignee.email);
    }

    // Add task assignee (old single assignee field)
    if (task.assignedTo?.email) {
      recipients.add(task.assignedTo.email);
    }

    // Add multiple task assignees (new field)
    if (task.assignees && Array.isArray(task.assignees)) {
      task.assignees.forEach((assignee: any) => {
        if (assignee.user?.email) {
          recipients.add(assignee.user.email);
        }
      });
    }

    // Remove sender from recipients
    recipients.delete(senderEmail);

    if (recipients.size === 0) return;

    // Generate email signature
    const signature = senderUserId ? await generateEmailSignature(senderUserId, db) : '';

    const subject = `Lead Task ${action === "created" ? "Created" : "Status Changed"}: ${task.title}`;
    
    const statusText = task.status === "NOT_STARTED" 
      ? "Not Started" 
      : task.status === "IN_PROGRESS"
      ? "In Progress"
      : "Completed";

    const statusColor = task.status === "NOT_STARTED" ? "#6b7280" : task.status === "IN_PROGRESS" ? "#3b82f6" : "#10b981";
    
    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🎯 LEAD TASK ${action === "created" ? "CREATED" : "UPDATED"}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${statusColor};">
              <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">Task Information</h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">A task for lead <strong style="color: #1e293b;">${lead.title}</strong></p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Task Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600; width: 40%;">Title:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${task.title}</td>
                </tr>
                ${task.description ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Description:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${task.description}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Status:</td>
                  <td style="padding: 8px 0;">
                    <span style="display: inline-block; background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${statusText}</span>
                  </td>
                </tr>
                ${task.assignees && task.assignees.length > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Assigned To:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${task.assignees.map((a: any) => a.user.name).join(', ')}</td>
                </tr>
                ` : task.assignedTo ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Assigned To:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${task.assignedTo.name}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Created By:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${task.createdBy.name}</td>
                </tr>
                ${task.dueDate ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Due Date:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${new Date(task.dueDate).toLocaleDateString()}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">Lead:</td>
                  <td style="padding: 4px 0; color: #1e293b; font-size: 13px;">${lead.title}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">Lead Number:</td>
                  <td style="padding: 4px 0; color: #1e293b; font-size: 13px;">${lead.leadNumber || 'N/A'}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">This notification was sent by KIMON CRM</p>
          </div>
        </div>
        ${signature}
      </body>
      </html>
    `;

    // Send email to each recipient
    const emailPromises = Array.from(recipients).map(email =>
      sendEmailAsUser(senderEmail, subject, body, [email]).catch(error => {
        console.error(`Failed to send email to ${email}:`, error);
      })
    );

    await Promise.allSettled(emailPromises);
  } catch (error) {
    console.error("Error sending task notification emails:", error);
    // Don't throw - email failures shouldn't prevent task creation
  }
}

