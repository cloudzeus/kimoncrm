import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['Draft', 'Submitted', 'Under Review', 'Awarded', 'Rejected']),
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
// Verify RFP exists
    const rfp = await prisma.rFP.findUnique({
      where: { id: id },
      include: {
        company: true,
        contact: true,
        opportunity: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, note } = updateStatusSchema.parse(body);

    // Don't update if status hasn't changed
    if (rfp.status === status) {
      return NextResponse.json(rfp);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update RFP status
      const updatedRFP = await tx.rFP.update({
        where: { id: id },
        data: { status },
        include: {
          company: true,
          contact: true,
          opportunity: true,
        },
      });

      // Record status change
      await tx.rFPStatusChange.create({
        data: {
          rfpId: id,
          fromStatus: rfp.status,
          toStatus: status,
          changedBy: session.user.id,
          note,
        },
      });

      return updatedRFP;
    });

    // TODO: Send email notifications if needed
    // await sendStatusChangeNotification({
    //   entityType: 'rfp',
    //   entity: result,
    //   fromStatus: rfp.status,
    //   toStatus: status,
    //   changedBy: session.user,
    // });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating RFP status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update RFP status' },
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
const statusHistory = await prisma.rFPStatusChange.findMany({
      where: { rfpId: id },
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
    console.error('Error fetching RFP status history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}

