import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma as db } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";
import { generateEmailSignature } from "@/lib/email/signature";

// PATCH /api/leads/[id]/tasks/[taskId] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await requireAuth();
    const { id, taskId } = await params;
    const body = await request.json();

    // Get the current task
    const currentTask = await db.leadTask.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!currentTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    if (currentTask.leadId !== id) {
      return NextResponse.json(
        { error: "Task does not belong to this lead" },
        { status: 400 }
      );
    }

    const { title, description, assignedToId, contactId, status, order, dueDate, reminderDate } = body;

    // If status is being changed, record it
    const statusChanged = status && status !== currentTask.status;

    // Parse dates if provided
    const dueDateParsed = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined;
    const reminderDateParsed = reminderDate !== undefined ? (reminderDate ? new Date(reminderDate) : null) : undefined;

    // Validate contactId if provided
    let validatedContactId = currentTask.contactId;
    if (contactId !== undefined) {
      if (contactId && contactId.trim() !== '') {
        const contactExists = await db.contact.findUnique({
          where: { id: contactId },
        });
        validatedContactId = contactExists ? contactId : null;
      } else {
        validatedContactId = null;
      }
    }

    // Update the task
    const updatedTask = await db.leadTask.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(validatedContactId !== undefined && { contactId: validatedContactId }),
        ...(status && { status }),
        ...(order !== undefined && { order }),
        ...(dueDateParsed !== undefined && { dueDate: dueDateParsed }),
        ...(reminderDateParsed !== undefined && { reminderDate: reminderDateParsed }),
      },
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
      },
    });

    // Record status change if applicable
    if (statusChanged) {
      await db.leadTaskStatusChange.create({
        data: {
          taskId,
          fromStatus: currentTask.status,
          toStatus: status,
          changedBy: session.user.id,
        },
      });

      // Get the lead for notification
      const lead = await db.lead.findUnique({
        where: { id },
        include: {
          owner: true,
          assignee: true,
        },
      });

      // Send notification emails
      if (lead) {
        await sendTaskNotificationEmails(updatedTask, lead, session.user.email, "status_changed", session.user.id);
      }
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id]/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await requireAuth();
    const { id, taskId } = await params;

    // Check if task exists and belongs to the lead
    const task = await db.leadTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    if (task.leadId !== id) {
      return NextResponse.json(
        { error: "Task does not belong to this lead" },
        { status: 400 }
      );
    }

    // Delete the task (cascade will handle related records)
    await db.leadTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
      return NextResponse.json(
      { error: "Failed to delete task" },
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

    // Add task assignee
    if (task.assignedTo?.email) {
      recipients.add(task.assignedTo.email);
    }

    // Remove sender from recipients
    recipients.delete(senderEmail);

    if (recipients.size === 0) return;

    // Generate email signature
    const signature = senderUserId ? await generateEmailSignature(senderUserId, db) : '';

    const subject = `Lead Task ${action === "created" ? "Created" : "Status Changed"}: ${task.title}`;
    
    const statusColor = task.status === "NOT_STARTED" ? "#6b7280" : task.status === "IN_PROGRESS" ? "#3b82f6" : "#10b981";
    
    const statusText = task.status === "NOT_STARTED" 
      ? "Not Started" 
      : task.status === "IN_PROGRESS"
      ? "In Progress"
      : "Completed";

    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🎯 LEAD TASK ${action === "created" ? "CREATED" : "UPDATED"}</h1>
          </div>
          
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
                ${task.assignedTo ? `
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
    // Don't throw - email failures shouldn't prevent task updates
  }
}

