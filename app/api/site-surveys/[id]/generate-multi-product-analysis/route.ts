import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { generateMultiProductAnalysisBuffer } from "@/lib/word/product-analysis-generator";

/**
 * POST - Generate Multi-Product Analysis Document
 * Fetches multiple products by IDs and generates a single Word document containing all product analyses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id: siteSurveyId } = await params;
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return new Response(JSON.stringify({ error: "No product IDs provided" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Generating analysis for ${productIds.length} products from site survey ${siteSurveyId}`);

    // Fetch all products with their related data
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        brand: {
          select: {
            name: true,
          },
        },
        manufacturer: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        translations: {
          select: {
            languageCode: true,
            name: true,
            description: true,
            shortDescription: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
          select: {
            url: true,
            alt: true,
            isDefault: true,
          },
        },
        specifications: {
          orderBy: {
            order: 'asc',
          },
          include: {
            translations: {
              select: {
                languageCode: true,
                specName: true,
                specValue: true,
              },
            },
          },
        },
        unit: {
          select: {
            name: true,
            shortcut: true,
          },
        },
      },
    });

    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "No products found with provided IDs" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${products.length} products, generating analysis document...`);

    // Transform products to match ProductData interface
    const productData = products.map(product => ({
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
    }));

    // Generate the Word document with all products
    const buffer = await generateMultiProductAnalysisBuffer(productData);

    const fileName = `Product_Analysis_${products.length}_Products.docx`;
    const encodedFileName = encodeURIComponent(fileName);

    console.log(`Successfully generated analysis document for ${products.length} products`);

    // Return the document as a proper binary response
    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating multi-product analysis document:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate document',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

