import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired']),
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
// Verify quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: id },
      include: {
        company: true,
        contact: true,
        lead: true,
        opportunity: true,
        rfp: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, note } = updateStatusSchema.parse(body);

    // Don't update if status hasn't changed
    if (quote.status === status) {
      return NextResponse.json(quote);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id: id },
        data: { status },
        include: {
          company: true,
          contact: true,
          lead: true,
          opportunity: true,
          rfp: true,
        },
      });

      // Record status change
      await tx.quoteStatusChange.create({
        data: {
          quoteId: id,
          fromStatus: quote.status,
          toStatus: status,
          changedBy: session.user.id,
          note,
        },
      });

      return updatedQuote;
    });

    // TODO: Send email notifications if needed
    // await sendStatusChangeNotification({
    //   entityType: 'quote',
    //   entity: result,
    //   fromStatus: quote.status,
    //   toStatus: status,
    //   changedBy: session.user,
    // });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating quote status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update quote status' },
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
const statusHistory = await prisma.quoteStatusChange.findMany({
      where: { quoteId: id },
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
    console.error('Error fetching quote status history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}

