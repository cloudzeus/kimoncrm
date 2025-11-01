/**
 * API Route: Add Product to ERP
 * POST /api/products/[id]/add-to-erp
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { insertProductToSoftOne } from '@/lib/softone/insert-product';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[add-to-erp] Starting ERP insertion process');
    const session = await auth();
    
    if (!session?.user) {
      console.log('[add-to-erp] Unauthorized - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow ADMIN, MANAGER, and EMPLOYEE roles
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      console.log('[add-to-erp] Forbidden - invalid role:', session.user.role);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id: productId } = await params;
    console.log('[add-to-erp] Product ID:', productId);

    // Get the product with all related data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        manufacturer: true,
        category: true,
        unit: true,
      },
    });

    if (!product) {
      console.log('[add-to-erp] Product not found:', productId);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('[add-to-erp] Product found:', product.name, 'MTRL:', product.mtrl);

    // Check if product is already in ERP
    if (product.mtrl) {
      console.log('[add-to-erp] Product already in ERP with MTRL:', product.mtrl);
      return NextResponse.json(
        { error: 'Product is already in ERP' },
        { status: 400 }
      );
    }

    // Validate required fields for ERP insertion
    if (!product.brandId || !product.categoryId || !product.manufacturerId || !product.unitId) {
      console.log('[add-to-erp] Missing required fields:', {
        brandId: product.brandId,
        categoryId: product.categoryId,
        manufacturerId: product.manufacturerId,
        unitId: product.unitId
      });
      return NextResponse.json(
        { error: 'Product is missing required fields for ERP insertion (Brand, Category, Manufacturer, or Unit)' },
        { status: 400 }
      );
    }

    console.log('[add-to-erp] Calling insertProductToSoftOne with data:', {
      name: product.name,
      code1: product.code1,
      code2: product.code2,
      brandId: product.brandId,
      categoryId: product.categoryId,
      manufacturerId: product.manufacturerId,
      unitId: product.unitId,
    });

    // Insert to ERP
    const erpResult = await insertProductToSoftOne({
      name: product.name,
      code1: product.code1 || '',
      code2: product.code2 || '',
      brandId: product.brandId,
      categoryId: product.categoryId,
      manufacturerId: product.manufacturerId,
      unitId: product.unitId,
      width: product.width ? Number(product.width) : undefined,
      length: product.length ? Number(product.length) : undefined,
      height: product.height ? Number(product.height) : undefined,
      weight: product.weight ? Number(product.weight) : undefined,
      isActive: product.isActive,
      skipDuplicateCheck: true, // Skip duplicate check since this is an existing product
    });

    console.log('[add-to-erp] ERP Result:', JSON.stringify(erpResult, null, 2));

    if (erpResult.success) {
      console.log('[add-to-erp] ERP insertion successful. Updating product with MTRL:', erpResult.mtrl, 'Code:', erpResult.generatedCode);
      // Update product with MTRL and generated code from ERP
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          mtrl: erpResult.mtrl?.toString() || null,
          code: erpResult.generatedCode || product.code || null,
        },
        include: {
          brand: true,
          manufacturer: true,
          category: true,
          unit: true,
        },
      });

      console.log('[add-to-erp] Product updated successfully');
      return NextResponse.json({
        success: true,
        data: updatedProduct,
        message: 'Product added to ERP successfully'
      });
    } else {
      console.error('[add-to-erp] ERP insertion failed:', erpResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: erpResult.error || 'Failed to add product to ERP'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[add-to-erp] Exception caught:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}