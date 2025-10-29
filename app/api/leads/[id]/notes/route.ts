import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma as db } from "@/lib/db/prisma";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";
import { generateEmailSignature } from "@/lib/email/signature";

// GET /api/leads/[id]/notes - Get all notes for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Get the lead to check permissions
    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        assigneeId: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user is a participant or lead owner/assignee
    const isParticipant = await db.leadParticipant.findFirst({
      where: {
        leadId: id,
        userId: session.user.id,
      },
    });

    const isLeadOwnerOrAssignee = 
      lead.ownerId === session.user.id || 
      lead.assigneeId === session.user.id;

    // Check if user is assigned to any task in this lead
    const isTaskAssignee = await db.leadTaskAssignee.findFirst({
      where: {
        userId: session.user.id,
        task: {
          leadId: id,
        },
      },
    });

    if (!isParticipant && !isLeadOwnerOrAssignee && !isTaskAssignee && session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch all top-level notes (no parent) with their replies
    const notes = await db.leadNote.findMany({
      where: { 
        leadId: id,
        parentId: null, // Only top-level notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                avatar: true,
              },
            },
            attachments: {
              include: {
                file: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id]/notes - Create a new note or reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const { content, parentId, fileIds, notifyUserIds = [] } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Get the lead with participants
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
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
        participants: {
          include: {
            user: {
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

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Check if user has access to add notes
    const isParticipant = lead.participants.some(p => p.userId === session.user.id);
    const isLeadOwnerOrAssignee = 
      lead.ownerId === session.user.id || 
      lead.assigneeId === session.user.id;

    // Check if user is assigned to any task in this lead
    const isTaskAssignee = await db.leadTaskAssignee.findFirst({
      where: {
        userId: session.user.id,
        task: {
          leadId: id,
        },
      },
    });

    if (!isParticipant && !isLeadOwnerOrAssignee && !isTaskAssignee && session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // If replying, verify parent exists
    if (parentId) {
      const parentNote = await db.leadNote.findUnique({
        where: { id: parentId },
      });

      if (!parentNote || parentNote.leadId !== id) {
        return NextResponse.json(
          { error: "Parent note not found" },
          { status: 404 }
        );
      }
    }

    // Create the note
    const note = await db.leadNote.create({
      data: {
        leadId: id,
        userId: session.user.id,
        content,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
          },
        },
      },
    });

    // Attach files if provided
    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      await db.leadNoteAttachment.createMany({
        data: fileIds.map((fileId: string) => ({
          noteId: note.id,
          fileId,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch the complete note with attachments
    const completeNote = await db.leadNote.findUnique({
      where: { id: note.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
          },
        },
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    // Send email notifications to selected participants
    console.log('[LEAD NOTES] Sending email notifications for note:', note.id, 'to users:', notifyUserIds);
    await sendNoteNotificationEmails(
      completeNote || note,
      lead,
      session.user.email,
      session.user.id,
      !!parentId,
      notifyUserIds
    );
    console.log('[LEAD NOTES] Email notifications sent successfully');

    return NextResponse.json({ note: completeNote || note });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

// Helper function to send notification emails
async function sendNoteNotificationEmails(
  note: any,
  lead: any,
  senderEmail: string,
  senderUserId: string,
  isReply: boolean,
  notifyUserIds: string[] = []
) {
  try {
    const recipients = new Set<string>();

    // If specific users are selected, only notify them
    if (notifyUserIds.length > 0) {
      const selectedUsers = await db.user.findMany({
        where: { id: { in: notifyUserIds } },
        select: { email: true },
      });
      selectedUsers.forEach(user => {
        if (user.email) recipients.add(user.email);
      });
      console.log('[LEAD NOTES EMAIL] Notifying selected users:', Array.from(recipients));
    } else {
      // Otherwise, notify all participants (default behavior)
      // Add lead owner
      if (lead.owner?.email) {
        recipients.add(lead.owner.email);
      }

      // Add lead assignee
      if (lead.assignee?.email) {
        recipients.add(lead.assignee.email);
      }

      // Add all participants
      if (lead.participants && Array.isArray(lead.participants)) {
        lead.participants.forEach((participant: any) => {
          if (participant.user?.email) {
            recipients.add(participant.user.email);
          }
        });
      }

      // Get all task assignees for this lead
      const taskAssignees = await db.leadTaskAssignee.findMany({
        where: {
          task: {
            leadId: lead.id,
          },
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      taskAssignees.forEach((assignee) => {
        if (assignee.user?.email) {
          recipients.add(assignee.user.email);
        }
      });
      console.log('[LEAD NOTES EMAIL] Notifying all participants:', Array.from(recipients));
    }

    // Remove sender from recipients
    recipients.delete(senderEmail);

    console.log('[LEAD NOTES EMAIL] Recipients collected:', Array.from(recipients));
    
    if (recipients.size === 0) {
      console.log('[LEAD NOTES EMAIL] No recipients found, skipping email');
      return;
    }

    // Generate email signature
    const signature = await generateEmailSignature(senderUserId, db);

    const subject = `Lead ${isReply ? 'Reply' : 'Note'} - ${lead.title}`;
    
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
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">💬 NEW LEAD ${isReply ? 'REPLY' : 'NOTE'}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
              <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">Lead Information</h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">A new ${isReply ? 'reply' : 'note'} was added to lead <strong style="color: #1e293b;">${lead.title}</strong></p>
              ${lead.leadNumber ? `<p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Lead Number: <strong>${lead.leadNumber}</strong></p>` : ''}
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
                <div>
                  <h3 style="margin: 0; color: #0f172a; font-size: 16px;">${note.user.name || 'Unknown User'}</h3>
                  <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">${new Date(note.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div style="color: #1e293b; font-size: 14px; line-height: 1.6;">
                ${note.content.replace(/\n/g, '<br>')}
              </div>
              ${note.attachments && note.attachments.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; font-weight: 600;">Attachments (${note.attachments.length}):</p>
                  ${note.attachments.map((att: any) => `
                    <div style="display: inline-block; background-color: #f1f5f9; padding: 8px 12px; border-radius: 4px; margin-right: 8px; margin-bottom: 8px;">
                      <span style="color: #475569; font-size: 12px;">📎 ${att.file.name}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
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
    console.error("Error sending note notification emails:", error);
    // Don't throw - email failures shouldn't prevent note creation
  }
}

