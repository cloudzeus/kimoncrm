import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createTicketSchema = z.object({
  companyId: z.string(),
  contactId: z.string(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Description is required'),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).default('Normal'),
  supportContractId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'B2B') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, contactId, subject, body: description, priority, supportContractId } = createTicketSchema.parse(body);

    // Verify user has access to this company and contact
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        contact: {
          include: {
            company: {
              include: {
                supportContracts: {
                  include: {
                    sla: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.contact || user.contact.id !== contactId || user.contact.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get support contract and SLA if specified
    let slaDueAt: Date | null = null;
    let selectedSupportContract = null;

    if (supportContractId) {
      selectedSupportContract = await prisma.supportContract.findFirst({
        where: {
          id: supportContractId,
          companyId,
          isActive: true,
        },
        include: {
          sla: true,
        },
      });

      if (selectedSupportContract) {
        // Calculate SLA due date based on priority and response time
        const responseTimeHours = selectedSupportContract.sla.responseTimeHours;
        slaDueAt = new Date(Date.now() + (responseTimeHours * 60 * 60 * 1000));
      }
    }

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        companyId,
        contactId,
        supportContractId: supportContractId || null,
        subject,
        body: description,
        priority,
        slaDueAt,
        status: 'New',
      },
      include: {
        company: true,
        contact: true,
        supportContract: {
          include: {
            sla: true,
          },
        },
      },
    });

    // Create initial ticket message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        fromRole: 'customer',
        body: description,
      },
    });

    // Send email notification to support team
    try {
      await sendTicketNotificationEmail(ticket);
    } catch (emailError) {
      console.error('Failed to send ticket notification email:', emailError);
      // Don't fail the ticket creation if email fails
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'B2B') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Verify user has access to this company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { contact: true },
    });

    if (!user?.contact?.companyId || user.contact.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { companyId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        supportContract: {
          include: {
            sla: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

async function sendTicketNotificationEmail(ticket: any) {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  // For now, we'll just log the notification
  
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@company.com';
  const ticketUrl = `${process.env.APP_URL}/admin/tickets/${ticket.id}`;
  
  const emailContent = {
    to: supportEmail,
    subject: `New Support Ticket: ${ticket.subject}`,
    html: `
      <h2>New Support Ticket Created</h2>
      <p><strong>Company:</strong> ${ticket.company.name}</p>
      <p><strong>Contact:</strong> ${ticket.contact.firstName} ${ticket.contact.lastName}</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
      <p><strong>Priority:</strong> ${ticket.priority}</p>
      ${ticket.supportContract ? `<p><strong>SLA:</strong> ${ticket.supportContract.sla.name}</p>` : ''}
      <p><strong>Description:</strong></p>
      <p>${ticket.body}</p>
      <p><a href="${ticketUrl}">View and Respond to Ticket</a></p>
    `,
  };

  console.log('Ticket notification email:', emailContent);
  
  // TODO: Implement actual email sending
  // Example with SendGrid:
  // await sgMail.send(emailContent);
}
