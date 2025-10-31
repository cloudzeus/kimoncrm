import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateProductAnalysisBuffer } from '@/lib/word/product-analysis-generator';

/**
 * POST /api/products/[id]/generate-analysis
 * Generate Product Analysis Word document
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

    // Fetch product with all related data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        manufacturer: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            shortcut: true,
          },
        },
        translations: {
          select: {
            id: true,
            languageCode: true,
            name: true,
            description: true,
            shortDescription: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            isDefault: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        specifications: {
          select: {
            id: true,
            specKey: true,
            order: true,
            translations: {
              select: {
                id: true,
                languageCode: true,
                specName: true,
                specValue: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Transform product data
    const productData = {
      id: product.id,
      name: product.name,
      brand: product.brand?.name,
      manufacturer: product.manufacturer?.name,
      category: product.category?.name,
      images: product.images.map(img => ({
        url: img.url,
        alt: img.alt || undefined,
        isDefault: img.isDefault,
      })),
      translations: product.translations.map(t => ({
        languageCode: t.languageCode,
        name: t.name ?? undefined,
        description: t.description ?? undefined,
        shortDescription: t.shortDescription ?? undefined,
      })),
      specifications: product.specifications,
      width: product.width ? Number(product.width) : undefined,
      height: product.height ? Number(product.height) : undefined,
      length: product.length ? Number(product.length) : undefined,
      weight: product.weight ? Number(product.weight) : undefined,
      unit: product.unit ? {
        name: product.unit.name,
        shortcut: product.unit.shortcut || '',
      } : undefined,
    };

    // Generate the Word document
    const buffer = await generateProductAnalysisBuffer(productData);

    // Get Greek product name or fallback to default
    const greekTranslation = product.translations.find(t => t.languageCode === 'el');
    const fileName = `${greekTranslation?.name || product.name}_Αναλυση.docx`;
    // Use ASCII-safe filename and UTF-8 encoded filename* parameter for better compatibility
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9Α-Ωα-ωίϊΐόάέύϋΰήώ_\-\s]/g, '_');
    const encodedFileName = encodeURIComponent(sanitizedFileName);

    // Return the document as a proper binary response
    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Product_Analysis.docx"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating product analysis document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate document',
      },
      { status: 500 }
    );
  }
}

