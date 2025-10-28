import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'CLOSED', 'ON_HOLD']).optional(),
  stage: z.enum(['OPP_PROSPECTING', 'OPP_DISCOVERY', 'OPP_QUALIFIED', 'OPP_PROPOSAL', 'OPP_NEGOTIATION', 'OPP_CLOSED_WON', 'OPP_CLOSED_LOST']).optional(),
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
// Verify opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: id },
      include: {
        customer: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData = updateStatusSchema.parse(body);

    // Don't update if nothing has changed
    const hasStatusChange = updateData.status && updateData.status.toUpperCase() !== opportunity.status;
    const hasStageChange = updateData.stage && updateData.stage !== opportunity.stage;

    if (!hasStatusChange && !hasStageChange) {
      return NextResponse.json(opportunity);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update opportunity
      const updatedOpportunity = await tx.opportunity.update({
        where: { id: id },
      data: {
        ...(updateData.status && { status: updateData.status as any }),
        ...(updateData.stage && { stage: updateData.stage as any }),
      },
      include: {
        customer: true,
      },
      });

      // Record status change
      await tx.opportunityStatusChange.create({
        data: {
          opportunityId: id,
          fromStatus: opportunity.status,
          toStatus: updateData.status || opportunity.status,
          changedBy: session.user.id,
          note: updateData.note,
        },
      });

      return updatedOpportunity;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating opportunity status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update opportunity status' },
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
const statusHistory = await prisma.opportunityStatusChange.findMany({
      where: { opportunityId: id },
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
    console.error('Error fetching opportunity status history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}

