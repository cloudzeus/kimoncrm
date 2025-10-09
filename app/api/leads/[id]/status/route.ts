import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted']),
  note: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const { id } = await params;
// Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: id },
      include: {
        company: true,
        contact: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, note } = updateStatusSchema.parse(body);

    // Don't update if status hasn't changed
    if (lead.status === status) {
      return NextResponse.json(lead);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update lead status
      const updatedLead = await tx.lead.update({
        where: { id: id },
        data: { status },
        include: {
          company: true,
          contact: true,
        },
      });

      // Record status change
      await tx.leadStatusChange.create({
        data: {
          leadId: id,
          fromStatus: lead.status,
          toStatus: status,
          changedBy: session.user.id,
          note,
        },
      });

      return updatedLead;
    });

    // TODO: Send email notifications if needed
    // await sendStatusChangeNotification({
    //   entityType: 'lead',
    //   entity: result,
    //   fromStatus: lead.status,
    //   toStatus: status,
    //   changedBy: session.user,
    // });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating lead status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update lead status' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const { id } = await params;
const statusHistory = await prisma.leadStatusChange.findMany({
      where: { leadId: id },
      include: {
        changedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(statusHistory);
  } catch (error) {
    console.error('Error fetching lead status history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}

