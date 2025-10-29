import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma as db } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";
import { generateEmailSignature } from "@/lib/email/signature";
import { updateLeadTaskCalendarEvent } from "@/lib/calendar/lead-task-calendar";
import { updateTaskDescriptionWithAttribution } from "@/lib/tasks/user-attribution";

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

    const { title, description, assignedToId, contactId, status, order, dueDate, reminderDate, assigneeIds } = body;

    // If status is being changed, record it
    const statusChanged = status && status !== currentTask.status;

    // Parse dates if provided
    const dueDateParsed = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined;
    const reminderDateParsed = reminderDate !== undefined ? (reminderDate ? new Date(reminderDate) : null) : undefined;

    // Handle description with user attribution if provided
    let attributedDescription = undefined;
    if (description !== undefined) {
      attributedDescription = updateTaskDescriptionWithAttribution(
        session.user.name || 'Unknown User',
        description,
        currentTask.description,
        true // This is an update
      );
    }

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

    // Handle multiple assignees if provided
    if (assigneeIds !== undefined) {
      // Delete existing assignees
      await db.leadTaskAssignee.deleteMany({
        where: { taskId },
      });
      
      // Create new assignees
      if (assigneeIds.length > 0) {
        await db.leadTaskAssignee.createMany({
          data: assigneeIds.map((userId: string) => ({
            taskId,
            userId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Update the task
    const updatedTask = await db.leadTask.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(attributedDescription !== undefined && { description: attributedDescription }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
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
        try {
          console.log("=== Task Status Changed - Sending Notifications ===");
          console.log("Task ID:", taskId);
          console.log("Status Changed:", currentTask.status, "→", status);
          console.log("Sender Email:", session.user.email);
          await sendTaskNotificationEmails(updatedTask, lead, session.user.email, "status_changed", session.user.id);
          console.log("Notification emails sent successfully");
        } catch (emailError) {
          console.error("Failed to send notification emails:", emailError);
          // Don't fail the request if email fails
        }
      }
    }

    // Update calendar event if due date or assignee changed
    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        leadNumber: true,
      },
    });

    if (lead) {
      // Transform the task data to match our function signature
      const taskForCalendar = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        dueDate: updatedTask.dueDate,
        assignedTo: updatedTask.assignedTo ? {
          email: updatedTask.assignedTo.email,
          name: updatedTask.assignedTo.name || 'Unknown User'
        } : null,
        createdBy: {
          email: updatedTask.createdBy.email,
          name: updatedTask.createdBy.name || 'Unknown User'
        }
      };

      const previousTaskForCalendar = currentTask.assignedTo ? {
        dueDate: currentTask.dueDate,
        assignedTo: {
          email: currentTask.assignedTo.email,
          name: currentTask.assignedTo.name || 'Unknown User'
        }
      } : {
        dueDate: currentTask.dueDate,
        assignedTo: null
      };

      await updateLeadTaskCalendarEvent(
        taskForCalendar,
        lead,
        session.user.email,
        previousTaskForCalendar
      );
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
    console.log("\n--- sendTaskNotificationEmails ---");
    console.log("Action:", action);
    console.log("Sender:", senderEmail);
    console.log("Sender User ID:", senderUserId);
    
    // Collect unique email addresses
    const recipients = new Set<string>();

    // Add lead manager (owner)
    if (lead.owner?.email) {
      console.log("Adding lead owner:", lead.owner.email);
      recipients.add(lead.owner.email);
    }

    // Add lead assignee
    if (lead.assignee?.email) {
      console.log("Adding lead assignee:", lead.assignee.email);
      recipients.add(lead.assignee.email);
    }

    // Add task assignee
    if (task.assignedTo?.email) {
      console.log("Adding task assignee:", task.assignedTo.email);
      recipients.add(task.assignedTo.email);
    }

    // Remove sender from recipients
    recipients.delete(senderEmail);
    
    console.log("Final recipients:", Array.from(recipients));

    if (recipients.size === 0) {
      console.log("⚠ No recipients to send to (all were sender)");
      return;
    }

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
    console.log("\n--- Sending emails ---");
    console.log("Email subject:", subject);
    const emailPromises = Array.from(recipients).map(email => {
      console.log(`Sending to: ${email}`);
      return sendEmailAsUser(senderEmail, subject, body, [email])
        .then(() => {
          console.log(`✓ Email sent successfully to ${email}`);
        })
        .catch(error => {
          console.error(`✗ Failed to send email to ${email}:`, error.message);
          console.error("Full error:", error);
        });
    });

    await Promise.allSettled(emailPromises);
    console.log("--- Email sending complete ---\n");
  } catch (error) {
    console.error("Error sending task notification emails:", error);
    // Don't throw - email failures shouldn't prevent task updates
  }
}

