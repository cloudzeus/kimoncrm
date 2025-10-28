import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma as db } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";

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

    const { title, description, assignedToId, contactId, dueDate, reminderDate } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Get the lead to check permissions and get related users
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        owner: true,
        assignee: true,
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

    // Create the task
    const task = await db.leadTask.create({
      data: {
        leadId: id,
        title,
        description,
        assignedToId,
        contactId,
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
      },
    });

    // Send notification emails
    await sendTaskNotificationEmails(task, lead, session.user.email, "created");

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
supported by KIMON CRM
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
    // Don't throw - email failures shouldn't prevent task creation
  }
}

