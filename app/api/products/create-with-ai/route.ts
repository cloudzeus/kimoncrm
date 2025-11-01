import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { insertProductToSoftOne } from '@/lib/softone/insert-product';

/**
 * POST /api/products/create-with-ai
 * Create a product with AI-generated specifications and translations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productData,
      aiData,
      insertToERP,
    } = body;

    // Check for duplicates first
    if (productData.code1 || productData.code2) {
      const conditions = [];
      
      if (productData.code1) {
        conditions.push({ code1: productData.code1 });
      }
      
      if (productData.code2) {
        conditions.push({ code2: productData.code2 });
      }

      const existingProduct = await prisma.product.findFirst({
        where: { OR: conditions },
        select: {
          id: true,
          name: true,
          code1: true,
          code2: true,
        }
      });

      if (existingProduct) {
        const duplicateFields = [];
        if (productData.code1 && existingProduct.code1 === productData.code1) {
          duplicateFields.push(`EAN Code: ${productData.code1}`);
        }
        if (productData.code2 && existingProduct.code2 === productData.code2) {
          duplicateFields.push(`Manufacturer Code: ${productData.code2}`);
        }
        
        return NextResponse.json({
          success: false,
          error: `Product already exists with: ${duplicateFields.join(', ')}\n\nExisting Product:\nID: ${existingProduct.id}\nName: ${existingProduct.name}\nEAN: ${existingProduct.code1 || 'N/A'}\nManufacturer Code: ${existingProduct.code2 || 'N/A'}`,
          isDuplicate: true,
          duplicateProduct: {
            id: existingProduct.id,
            name: existingProduct.name,
            code1: existingProduct.code1,
            code2: existingProduct.code2,
          }
        }, { status: 400 });
      }
    }

    // Find default unit if not provided
    let finalUnitId = productData.unitId;
    if (!finalUnitId) {
      const defaultUnit = await prisma.unit.findFirst({
        where: { softoneCode: '101' }
      });
      finalUnitId = defaultUnit?.id || null;
    }

    // Step 1: Create product in database first (without mtrl and code)
    const product = await prisma.product.create({
      data: {
        code: productData.code || null,
        code1: productData.code1 || null,
        code2: productData.code2 || null,
        name: productData.name,
        mtrgroup: productData.mtrgroupCode || null,
        mtrmark: productData.mtrmark || null,
        mtrmanfctr: productData.mtrmanfctr || null,
        brandId: productData.brandId,
        categoryId: productData.categoryId,
        manufacturerId: productData.manufacturerId || null,
        unitId: finalUnitId,
        width: productData.width ? parseFloat(productData.width) : null,
        length: productData.length ? parseFloat(productData.length) : null,
        height: productData.height ? parseFloat(productData.height) : null,
        weight: productData.weight ? parseFloat(productData.weight) : null,
        isActive: productData.isActive !== false,
        // Create specifications if provided
        specifications: aiData?.specifications ? {
          create: (await Promise.all(
            aiData.specifications.map(async (spec: any) => {
              // Find matching group spec to link
              let groupSpecId = null;
              if (productData.mtrgroupCode) {
                const groupSpec = await prisma.productGroupSpec.findUnique({
                  where: {
                    mtrgroupCode_specKey: {
                      mtrgroupCode: productData.mtrgroupCode,
                      specKey: spec.specKey
                    }
                  }
                });
                if (groupSpec) groupSpecId = groupSpec.id;
              }

              // Handle both array format and object format for translations
              let translationsToCreate;
              if (Array.isArray(spec.translations)) {
                // Array format
                translationsToCreate = spec.translations.filter((t: any) => 
                  t && t.specName && t.specValue
                );
              } else if (spec.translations && typeof spec.translations === 'object') {
                // Object format (from AI)
                translationsToCreate = Object.entries(spec.translations)
                  .filter(([_, translation]: [string, any]) => 
                    translation && translation.specName && translation.specValue
                  )
                  .map(([langCode, translation]: [string, any]) => ({
                    languageCode: langCode,
                    specName: translation.specName,
                    specValue: translation.specValue,
                  }));
              } else {
                // Fallback: create from specName/specValue at top level
                translationsToCreate = [
                  {
                    languageCode: 'en',
                    specName: spec.specName || spec.specKey || 'Unknown',
                    specValue: spec.specValue || 'N/A',
                  },
                  {
                    languageCode: 'el',
                    specName: spec.specName || spec.specKey || 'Unknown',
                    specValue: spec.specValue || 'N/A',
                  }
                ];
              }

              // Skip if no valid translations
              if (!translationsToCreate || translationsToCreate.length === 0) {
                console.warn(`Skipping spec ${spec.specKey} - no valid translations`);
                return null;
              }

              return {
                specKey: spec.specKey,
                order: spec.order || 0,
                groupSpecId,
                aiProvider: spec.aiProvider || null,
                translations: {
                  create: translationsToCreate
                }
              };
            })
          )).filter(Boolean) // Remove null entries
        } : undefined,
        // Create translations if provided
        translations: aiData?.translations ? {
          create: aiData.translations.map((trans: any) => ({
            languageCode: trans.languageCode,
            name: trans.name || null,
            shortDescription: trans.shortDescription || null,
            description: trans.description || null,
          }))
        } : undefined,
      },
      include: {
        brand: true,
        category: true,
        manufacturer: true,
        unit: true,
        specifications: {
          include: {
            translations: true
          }
        },
        translations: true,
      }
    });

    // Step 2: Insert to ERP if requested and update product with MTRL and generated code
    if (insertToERP) {
      // Validate required fields for ERP insertion
      if (!productData.brandId || !productData.categoryId || !finalUnitId) {
        return NextResponse.json({
          success: true,
          data: product,
          erpInserted: false,
          erpError: 'Missing required fields for ERP insertion (brand, category, or unit)',
          message: 'Product created in database, but ERP insertion failed: Missing required fields'
        });
      }

      const erpResult = await insertProductToSoftOne({
        name: productData.name,
        code1: productData.code1 || '',
        code2: productData.code2 || '',
        brandId: productData.brandId,
        categoryId: productData.categoryId,
        manufacturerId: productData.manufacturerId || null,
        unitId: finalUnitId,
        width: productData.width ? parseFloat(productData.width) : undefined,
        length: productData.length ? parseFloat(productData.length) : undefined,
        height: productData.height ? parseFloat(productData.height) : undefined,
        weight: productData.weight ? parseFloat(productData.weight) : undefined,
        isActive: productData.isActive !== false,
      });

      if (erpResult.success) {
        // Step 3: Update product with MTRL and generated code from ERP
        await prisma.product.update({
          where: { id: product.id },
          data: {
            mtrl: erpResult.mtrl?.toString() || null,
            code: erpResult.generatedCode || null,
          },
        });

        return NextResponse.json({
          success: true,
          data: product,
          erpInserted: true,
          generatedCode: erpResult.generatedCode,
          mtrl: erpResult.mtrl,
          message: 'Product created and inserted to ERP successfully'
        });
      } else {
        // ERP insertion failed, but product is still saved in DB
        return NextResponse.json({
          success: true,
          data: product,
          erpInserted: false,
          erpError: erpResult.error,
          message: 'Product created in database, but ERP insertion failed: ' + erpResult.error
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: product,
      erpInserted: false,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product with AI data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product'
    }, { status: 500 });
  }
}
