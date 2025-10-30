import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

/**
 * GET /api/proposals/[id]
 * Get proposal by ID with all related data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        rfp: {
          include: {
            customer: true,
            contact: true,
          },
        },
        customer: true,
        contact: true,
        lead: true,
        siteSurvey: true,
        generatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return Response.json({ success: true, proposal });
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/proposals/[id]
 * Update proposal fields (including AI-generated content edits)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      projectTitle,
      projectDescription,
      projectScope,
      projectDuration,
      projectStartDate,
      projectEndDate,
      infrastructureDesc,
      technicalDesc,
      productsDesc,
      servicesDesc,
      scopeOfWork,
      status,
      stage,
      notes,
    } = body;

    const updateData: any = {};
    
    // Only update fields that are provided
    if (projectTitle !== undefined) updateData.projectTitle = projectTitle;
    if (projectDescription !== undefined) updateData.projectDescription = projectDescription;
    if (projectScope !== undefined) updateData.projectScope = projectScope;
    if (projectDuration !== undefined) updateData.projectDuration = projectDuration;
    if (projectStartDate !== undefined) updateData.projectStartDate = projectStartDate ? new Date(projectStartDate) : null;
    if (projectEndDate !== undefined) updateData.projectEndDate = projectEndDate ? new Date(projectEndDate) : null;
    if (infrastructureDesc !== undefined) updateData.infrastructureDesc = infrastructureDesc;
    if (technicalDesc !== undefined) updateData.technicalDesc = technicalDesc;
    if (productsDesc !== undefined) updateData.productsDesc = productsDesc;
    if (servicesDesc !== undefined) updateData.servicesDesc = servicesDesc;
    if (scopeOfWork !== undefined) updateData.scopeOfWork = scopeOfWork;
    if (status !== undefined) updateData.status = status;
    if (stage !== undefined) updateData.stage = stage;
    if (notes !== undefined) updateData.notes = notes;

    const proposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
      include: {
        rfp: {
          include: {
            customer: true,
            contact: true,
          },
        },
        customer: true,
        contact: true,
        lead: true,
        siteSurvey: true,
      },
    });

    return Response.json({
      success: true,
      proposal,
      message: 'Proposal updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating proposal:', error);
    return Response.json(
      { error: error.message || 'Failed to update proposal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proposals/[id]
 * Delete a proposal
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.proposal.delete({
      where: { id },
    });

    return Response.json({
      success: true,
      message: 'Proposal deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting proposal:', error);
    return Response.json(
      { error: error.message || 'Failed to delete proposal' },
      { status: 500 }
    );
  }
}

