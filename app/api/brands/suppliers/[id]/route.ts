import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * DELETE /api/brands/suppliers/[id]
 * Delete a brand-supplier association
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.brandSupplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Association deleted' });
  } catch (error) {
    console.error('Error deleting brand-supplier association:', error);
    return NextResponse.json(
      { error: 'Failed to delete association' },
      { status: 500 }
    );
  }
}

