import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma as db } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";

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

    // Update the task
    const updatedTask = await db.leadTask.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(contactId !== undefined && { contactId }),
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
        await sendTaskNotificationEmails(updatedTask, lead, session.user.email, "status_changed");
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
      { status: divided_states   }
    );
  }
}

// Helper function to send notification emails
async function sendTaskNotificationEmails(
  task: any,
  lead: any,
  senderEmail: string,
  action: "created" | "status_changed"
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

    const subject = `Lead Task ${action === "created" ? "Created" : "Status Changed"}: ${task.title}`;
    
    const statusText = task.status === "NOT_STARTED" 
      ? "Not Started" 
      : task.status === "IN_PROGRESS"
      ? "In Progress"
      : "Completed";

    const body = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Lead Task Notification</h2>
        <p>A task for lead <strong>${lead.title}</strong> (${lead.leadNumber || 'No number'}) has been ${action === "created" ? "created" : "updated"}.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Task Details</h3>
          <p><strong>Title:</strong> ${task.title}</p>
          ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
          <p><strong>Status:</strong> ${statusText}</p>
          ${task.assignedTo ? `<p><strong>Assigned To:</strong> ${task.assignedTo.name}</p>` : ''}
          <p><strong>Created By:</strong> ${task.createdBy.name}</p>
        </div>
        
        <p><strong>Lead:</strong> ${lead.title}</p>
        <p><strong>Lead Number:</strong> ${lead.leadNumber || 'N/A'}</p>
        
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          This notification was sent by KIMON CRM
        </p>
      </div>
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

