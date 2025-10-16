import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * PUT /api/products/[id]/specifications/[specId]
 * Update a specific product specification
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; specId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId, specId } = await params;
    const body = await request.json();
    const { translations } = body;

    // Verify the specification belongs to the product
    const spec = await prisma.productSpec.findFirst({
      where: {
        id: specId,
        productId: productId,
      },
    });

    if (!spec) {
      return NextResponse.json({ 
        success: false, 
        error: 'Specification not found or does not belong to this product' 
      }, { status: 404 });
    }

    // Update each translation
    for (const [langCode, fields] of Object.entries(translations)) {
      const { specName, specValue } = fields as { specName: string; specValue: string };
      
      await prisma.productSpecTranslation.upsert({
        where: {
          specId_languageCode: {
            specId: specId,
            languageCode: langCode,
          },
        },
        update: {
          specName,
          specValue,
        },
        create: {
          specId: specId,
          languageCode: langCode,
          specName,
          specValue,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Specification updated successfully' 
    });

  } catch (error) {
    console.error('Error updating specification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update specification' 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id]/specifications/[specId]
 * Delete a specific product specification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; specId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId, specId } = await params;

    // Verify the specification belongs to the product
    const spec = await prisma.productSpec.findFirst({
      where: {
        id: specId,
        productId: productId,
      },
    });

    if (!spec) {
      return NextResponse.json({ 
        success: false, 
        error: 'Specification not found or does not belong to this product' 
      }, { status: 404 });
    }

    // Delete the specification (cascade will delete translations)
    await prisma.productSpec.delete({
      where: { id: specId },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Specification deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting specification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete specification' 
    }, { status: 500 });
  }
}
