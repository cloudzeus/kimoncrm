import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * PUT /api/products/[id]/translations/[translationId]
 * Update a specific product translation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; translationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId, translationId } = await params;
    const body = await request.json();
    const { name, shortDescription, description } = body;

    // Verify the translation belongs to the product
    const translation = await prisma.productTranslation.findFirst({
      where: {
        id: translationId,
        productId: productId,
      },
    });

    if (!translation) {
      return NextResponse.json({ 
        success: false, 
        error: 'Translation not found or does not belong to this product' 
      }, { status: 404 });
    }

    // Update the translation
    const updatedTranslation = await prisma.productTranslation.update({
      where: { id: translationId },
      data: {
        name: name || null,
        shortDescription: shortDescription || null,
        description: description || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedTranslation,
      message: 'Translation updated successfully' 
    });

  } catch (error) {
    console.error('Error updating translation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update translation' 
    }, { status: 500 });
  }
}
