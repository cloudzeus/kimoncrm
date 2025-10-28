import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * PUT /api/product-groupspecs/[id]
 * Update a group spec
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Manager access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { specName, description, isRequired, order } = body;

    const spec = await prisma.productGroupSpec.update({
      where: { id },
      data: {
        ...(specName !== undefined && { specName }),
        ...(description !== undefined && { description }),
        ...(isRequired !== undefined && { isRequired }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({
      success: true,
      data: spec,
    });
  } catch (error: any) {
    console.error('Error updating group spec:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Group spec not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update group spec' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/product-groupspecs/[id]
 * Delete a group spec
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Manager access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.productGroupSpec.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Group spec deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting group spec:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Group spec not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete group spec' },
      { status: 500 }
    );
  }
}
