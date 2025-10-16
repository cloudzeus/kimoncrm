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
        where: { OR: conditions }
      });

      if (existingProduct) {
        return NextResponse.json({
          success: false,
          error: 'Product with this EAN or Manufacturer Code already exists',
          isDuplicate: true
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
          create: aiData.specifications.map((spec: any) => ({
            specKey: spec.specKey,
            order: spec.order || 0,
            translations: {
              create: spec.translations || [
                {
                  languageCode: 'en',
                  specName: spec.specName || spec.specKey,
                  specValue: spec.specValue || '',
                },
                {
                  languageCode: 'el',
                  specName: spec.specName || spec.specKey,
                  specValue: spec.specValue || '',
                }
              ]
            }
          }))
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
      const erpResult = await insertProductToSoftOne({
        name: productData.name,
        code1: productData.code1 || '',
        code2: productData.code2 || '',
        brandId: productData.brandId,
        categoryId: productData.categoryId,
        manufacturerId: productData.manufacturerId,
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
