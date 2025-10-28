import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateProductSpecs } from '@/lib/ai/generate-product-specs';

/**
 * GET /api/products/[id]/specifications
 * Get all specifications for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    const specifications = await prisma.productSpec.findMany({
      where: { productId },
      include: {
        translations: {
          include: {
            language: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, data: specifications });
  } catch (error) {
    console.error('Error fetching product specifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch specifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/specifications
 * Generate specifications using AI or create/update manually
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { action, specifications, languages } = body;

    // Fetch product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (action === 'generate') {
      // Generate specifications using AI
      const supportedLanguages = languages || ['en', 'el'];

      const generatedSpecs = await generateProductSpecs(
        {
          name: product.name,
          eanCode: product.code1,
          manufacturerCode: product.code2,
          brand: product.brand?.name,
          category: product.category?.name,
          mtrgroupCode: product.mtrgroup,
        },
        supportedLanguages
      );

      // Delete existing specifications for this product
      await prisma.productSpec.deleteMany({
        where: { productId },
      });

      // Create new specifications with translations
      let order = 0;
      for (const spec of generatedSpecs) {
        // Find matching group spec to link
        let groupSpecId = null;
        if (product.mtrgroup) {
          const groupSpec = await prisma.productGroupSpec.findUnique({
            where: {
              mtrgroupCode_specKey: {
                mtrgroupCode: product.mtrgroup,
                specKey: spec.specKey
              }
            }
          });
          if (groupSpec) groupSpecId = groupSpec.id;
        }

        const createdSpec = await prisma.productSpec.create({
          data: {
            productId,
            specKey: spec.specKey,
            order: order++,
            groupSpecId,
            aiProvider: spec.aiProvider || null,
            translations: {
              create: Object.entries(spec.translations).map(([langCode, translation]) => ({
                languageCode: langCode,
                specName: translation.specName,
                specValue: translation.specValue,
              })),
            },
          },
          include: {
            translations: true,
          },
        });
      }

      // Fetch all created specifications
      const specifications = await prisma.productSpec.findMany({
        where: { productId },
        include: {
          translations: {
            include: {
              language: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      });

      return NextResponse.json({
        success: true,
        message: `Generated ${specifications.length} specifications`,
        data: specifications,
      });
    } else if (action === 'save') {
      // Manually save/update specifications
      if (!specifications || !Array.isArray(specifications)) {
        return NextResponse.json(
          { success: false, error: 'Invalid specifications data' },
          { status: 400 }
        );
      }

      // Delete existing specifications
      await prisma.productSpec.deleteMany({
        where: { productId },
      });

      // Create new specifications
      for (const spec of specifications) {
        await prisma.productSpec.create({
          data: {
            productId,
            specKey: spec.specKey,
            order: spec.order || 0,
            translations: {
              create: spec.translations.map((t: any) => ({
                languageCode: t.languageCode,
                specName: t.specName,
                specValue: t.specValue,
              })),
            },
          },
        });
      }

      // Fetch all created specifications
      const updatedSpecifications = await prisma.productSpec.findMany({
        where: { productId },
        include: {
          translations: {
            include: {
              language: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      });

      return NextResponse.json({
        success: true,
        message: 'Specifications saved successfully',
        data: updatedSpecifications,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "generate" or "save".' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing product specifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to manage specifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]/specifications
 * Delete all specifications for a product
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

    const { id: productId } = await params;

    await prisma.productSpec.deleteMany({
      where: { productId },
    });

    return NextResponse.json({
      success: true,
      message: 'All specifications deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product specifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete specifications' },
      { status: 500 }
    );
  }
}

