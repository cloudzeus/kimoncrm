import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateProductSpecs, regenerateProductSpecsWithOpenAI } from '@/lib/ai/generate-product-specs';

/**
 * POST /api/products/generate-specs-bulk
 * Generate specifications for multiple selected products
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productIds, force } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      );
    }

    // Fetch products with their spec counts
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { specifications: true } },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        processedCount: 0,
        message: 'No products found',
      });
    }

    let processedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Helper function to delay between AI calls
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Process products in parallel with 30ms delay between AI calls
    const processProduct = async (product: any, index: number) => {
      // Skip if product already has specifications (unless force is true)
      if (!force && product._count.specifications > 0) {
        console.log(`Skipping product ${product.id} - already has ${product._count.specifications} specs`);
        return { success: true, skipped: true };
      }

      // Add delay before each AI call (staggered by index to avoid hitting rate limits)
      await delay(index * 30);
      
      try {
        // Fetch existing specs if regenerating
        let existingSpecs: any[] = [];
        if (force && product._count.specifications > 0) {
          existingSpecs = await prisma.productSpec.findMany({
            where: { productId: product.id },
            include: { translations: true },
          });
        }

        // Generate specifications using AI
        const generatedSpecs = force && existingSpecs.length > 0
          ? await regenerateProductSpecsWithOpenAI(
              {
                name: product.name,
                eanCode: product.code1,
                manufacturerCode: product.code2,
                brand: product.brand?.name,
                category: product.category?.name,
                mtrgroupCode: product.mtrgroup,
              },
              existingSpecs,
              ['en', 'el']
            )
          : await generateProductSpecs(
              {
                name: product.name,
                eanCode: product.code1,
                manufacturerCode: product.code2,
                brand: product.brand?.name,
                category: product.category?.name,
                mtrgroupCode: product.mtrgroup,
              },
              ['en', 'el']
            );

        // Log generated specs for debugging
        console.log(`📋 Product: ${product.name}`);
        console.log(`   Generated ${generatedSpecs.length} specs:`);
        generatedSpecs.forEach((spec: any, idx: number) => {
          const enTrans = spec.translations?.en || {};
          console.log(`   ${idx + 1}. ${spec.specKey}: ${enTrans.specName} = ${enTrans.specValue}`);
        });

        // Delete existing specifications
        await prisma.productSpec.deleteMany({
          where: { productId: product.id },
        });

        // Fetch group specs for this product
        let groupSpecsMap = new Map();
        if (product.mtrgroup) {
          const groupSpecs = await prisma.productGroupSpec.findMany({
            where: { mtrgroupCode: product.mtrgroup },
          });
          groupSpecsMap = new Map(groupSpecs.map(spec => [spec.specKey, spec.id]));
        }

        // Create new specifications
        let order = 0;
        for (const spec of generatedSpecs) {
          const groupSpecId = groupSpecsMap.get(spec.specKey) || null;

          // Validate and prepare translations
          const translationsToCreate = Object.entries(spec.translations || {})
            .filter(([langCode, translation]: [string, any]) => {
              if (!translation || typeof translation !== 'object') {
                console.warn(`Product ${product.id}: Invalid translation for spec ${spec.specKey}, language ${langCode}`);
                return false;
              }
              if (!translation.specName || !translation.specValue) {
                console.warn(`Product ${product.id}: Missing specName or specValue for spec ${spec.specKey}, language ${langCode}`);
                return false;
              }
              return true;
            })
            .map(([langCode, translation]: [string, any]) => ({
              languageCode: langCode,
              specName: translation.specName,
              specValue: translation.specValue,
            }));

          // Skip if no valid translations
          if (translationsToCreate.length === 0) {
            console.warn(`Product ${product.id}: Skipping spec ${spec.specKey} - no valid translations`);
            continue;
          }

          await prisma.productSpec.create({
            data: {
              productId: product.id,
              specKey: spec.specKey,
              order: order++,
              groupSpecId,
              aiProvider: spec.aiProvider || null,
              translations: {
                create: translationsToCreate,
              },
            },
          });
        }

        return { success: true };
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        throw error;
      }
    };

    // Process all products in parallel
    const results = await Promise.allSettled(
      products.map((product, index) => processProduct(product, index))
    );

    // Count results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          skippedCount++;
        } else {
          processedCount++;
        }
      } else {
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      skippedCount,
      errorCount,
      totalProducts: products.length,
      message: `Generated specifications for ${processedCount} products${skippedCount > 0 ? `, ${skippedCount} skipped (already have specs)` : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });
  } catch (error) {
    console.error('Error generating specs in bulk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate specifications' },
      { status: 500 }
    );
  }
}
