import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { insertProductToSoftOne } from '@/lib/softone/insert-product';

/**
 * POST /api/products/[id]/add-to-erp
 * Add an existing product to SoftOne ERP
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the product with all required data
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, code: true } },
        category: { select: { id: true, softoneCode: true } },
        manufacturer: { select: { id: true, code: true } },
        unit: { select: { id: true, softoneCode: true } },
      },
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Check if already in ERP
    if (product.mtrl) {
      return NextResponse.json({
        success: false,
        error: 'Product is already in ERP (MTRL exists)'
      }, { status: 400 });
    }

    // Check required fields
    if (!product.brand || !product.category) {
      return NextResponse.json({
        success: false,
        error: 'Product must have brand and category to be added to ERP'
      }, { status: 400 });
    }

    console.log('📤 Sending to ERP:', {
      name: product.name,
      brandId: product.brandId,
      categoryId: product.categoryId,
      hasBrand: !!product.brand,
      hasCategory: !!product.category,
    });

    // Insert to ERP (skip duplicate check since this is an existing product)
    const erpResult = await insertProductToSoftOne({
      name: product.name,
      code1: product.code1 || '',
      code2: product.code2 || '',
      brandId: product.brandId,
      categoryId: product.categoryId,
      manufacturerId: product.manufacturerId || '',
      unitId: product.unitId || '',
      width: product.width ? Number(product.width) : undefined,
      length: product.length ? Number(product.length) : undefined,
      height: product.height ? Number(product.height) : undefined,
      weight: product.weight ? Number(product.weight) : undefined,
      isActive: product.isActive,
      skipDuplicateCheck: true, // Skip duplicate check for existing products
    });

    console.log('📥 ERP Result:', erpResult);

    if (!erpResult.success) {
      console.error('❌ ERP insertion failed:', erpResult.error);
      return NextResponse.json({
        success: false,
        error: erpResult.error || 'Failed to insert product to ERP',
        isDuplicate: erpResult.isDuplicate
      }, { status: 400 });
    }

    // Update product with MTRL and generated code
    await prisma.product.update({
      where: { id },
      data: {
        mtrl: erpResult.mtrl?.toString() || null,
        code: erpResult.generatedCode || null,
      },
    });

    return NextResponse.json({
      success: true,
      generatedCode: erpResult.generatedCode,
      mtrl: erpResult.mtrl,
      message: 'Product added to ERP successfully'
    });

  } catch (error) {
    console.error('Error adding product to ERP:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add product to ERP'
    }, { status: 500 });
  }
}
