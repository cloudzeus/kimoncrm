import { createCalendarEvent } from "@/lib/microsoft/app-auth";

/**
 * Generate the direct URL to a lead in the CRM system
 */
export function generateLeadUrl(leadId: string): string {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  return `${baseUrl}/leads/${leadId}`;
}

/**
 * Create a Microsoft Calendar event for a lead task
 */
export async function createLeadTaskCalendarEvent(
  task: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    assignedTo?: { email: string; name: string } | null;
    createdBy: { email: string; name: string };
  },
  lead: {
    id: string;
    title: string;
    leadNumber?: string | null;
  },
  creatorEmail: string
): Promise<void> {
  try {
    // Only create calendar event if task has a due date and assigned user
    if (!task.dueDate || !task.assignedTo?.email) {
      console.log("Skipping calendar event: No due date or assignee");
      return;
    }

    const leadUrl = generateLeadUrl(lead.id);
    
    // Calculate event duration (default to 1 hour)
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

    // Build event subject
    const subject = `📋 Lead Task: ${task.title}`;

    // Build event body with lead information and direct link
    const eventBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h3 style="color: #2563eb; margin-bottom: 20px;">🎯 Lead Task Details</h3>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b;">Task Information</h4>
          <p style="margin: 0; color: #64748b;"><strong>Title:</strong> ${task.title}</p>
          ${task.description ? `<p style="margin: 5px 0 0 0; color: #64748b;"><strong>Description:</strong> ${task.description}</p>` : ""}
        </div>

        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b;">Lead Information</h4>
          <p style="margin: 0; color: #64748b;"><strong>Lead:</strong> ${lead.title}</p>
          ${lead.leadNumber ? `<p style="margin: 5px 0 0 0; color: #64748b;"><strong>Lead Number:</strong> ${lead.leadNumber}</p>` : ""}
        </div>

        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b;">🔗 Quick Actions</h4>
          <p style="margin: 0;">
            <a href="${leadUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 10px;">
              📋 View Lead in CRM
            </a>
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
            Click the button above to directly navigate to the lead and review this task.
          </p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b;">📅 Task Assignment</h4>
          <p style="margin: 0; color: #64748b;"><strong>Assigned To:</strong> ${task.assignedTo.name}</p>
          <p style="margin: 5px 0 0 0; color: #64748b;"><strong>Created By:</strong> ${task.createdBy.name}</p>
          <p style="margin: 5px 0 0 0; color: #64748b;"><strong>Due Date:</strong> ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}</p>
        </div>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;" />
        
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          This calendar event was automatically created by KIMON CRM when a lead task was assigned.
          <br />
          <strong>Direct Link:</strong> <a href="${leadUrl}" style="color: #2563eb;">${leadUrl}</a>
        </p>
      </div>
    `;

    // Create the calendar event for the assigned user
    await createCalendarEvent(task.assignedTo.email, {
      subject,
      body: eventBody,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      location: `Lead: ${lead.title}`,
      attendees: [creatorEmail], // Include the task creator as attendee
    });

    console.log(`Calendar event created for task "${task.title}" assigned to ${task.assignedTo.email}`);
  } catch (error) {
    // Log the error but don't throw - calendar integration is optional
    console.warn("Failed to create calendar event for lead task:", error);
  }
}

/**
 * Update or create a calendar event when a task is updated
 * Note: Microsoft Graph doesn't easily support updating existing events without event ID,
 * so we create a new event if the due date changes significantly
 */
export async function updateLeadTaskCalendarEvent(
  task: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    assignedTo?: { email: string; name: string } | null;
    createdBy: { email: string; name: string };
  },
  lead: {
    id: string;
    title: string;
    leadNumber?: string | null;
  },
  updaterEmail: string,
  previousTask?: {
    dueDate?: Date | null;
    assignedTo?: { email: string; name: string } | null;
  }
): Promise<void> {
  try {
    // Check if we need to create a new calendar event
    const shouldCreateEvent = 
      task.dueDate && 
      task.assignedTo?.email && 
      (
        // New due date added
        !previousTask?.dueDate ||
        // Due date changed significantly (more than 1 hour difference)
        Math.abs(task.dueDate.getTime() - previousTask.dueDate.getTime()) > 60 * 60 * 1000 ||
        // Assignee changed
        task.assignedTo.email !== previousTask?.assignedTo?.email
      );

    if (shouldCreateEvent) {
      await createLeadTaskCalendarEvent(task, lead, updaterEmail);
      console.log(`Calendar event updated for task "${task.title}"`);
    }
  } catch (error) {
    console.warn("Failed to update calendar event for lead task:", error);
  }
}
