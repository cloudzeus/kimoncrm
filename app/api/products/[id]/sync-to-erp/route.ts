/**
 * API Route: Sync Product to ERP
 * POST /api/products/[id]/sync-to-erp
 * 
 * Updates or creates a product in SoftOne ERP
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { updateProductInErp, createProductInErp } from '@/lib/softone/products';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow ADMIN, MANAGER, and EMPLOYEE roles
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get product from database
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            code: true,
          },
        },
        manufacturer: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product should be synced (must be active and have mtrl for updates)
    if (!product.isActive && product.mtrl) {
      return NextResponse.json(
        { error: 'Cannot sync inactive product with existing ERP record. Please activate the product first.' },
        { status: 400 }
      );
    }

    let erpResponse;
    let isUpdate = false;

    // If product has mtrl and is active, update it in ERP
    if (product.mtrl && product.isActive) {
      isUpdate = true;
      
      // Prepare update fields (only send what's needed)
      const updateFields: any = {};
      
      if (product.name) {
        updateFields.NAME = product.name;
      }

      if (product.code) {
        updateFields.CODE = product.code;
      }

      // Update CODE1 (Manufacturer Code) if available
      if (product.code1) {
        updateFields.CODE1 = product.code1;
      }

      // Update CODE2 (EAN Code) if available
      if (product.code2) {
        updateFields.CODE2 = product.code2;
      }

      if (product.brand?.code) {
        updateFields.MTRMARK = product.brand.code;
      }

      if (product.manufacturer?.code) {
        updateFields.MTRMANFCTR = product.manufacturer.code;
      }

      if (product.width !== null) {
        updateFields.DIM1 = product.width.toString();
      }

      if (product.length !== null) {
        updateFields.DIM2 = product.length.toString();
      }

      if (product.height !== null) {
        updateFields.DIM3 = product.height.toString();
      }

      if (product.weight !== null) {
        updateFields.GWEIGHT = product.weight.toString();
      }

      // Add remarks to track the update
      updateFields.REMARKS = `Updated from CRM at ${new Date().toISOString()}`;

      try {
        erpResponse = await updateProductInErp(parseInt(product.mtrl), updateFields);
      } catch (error) {
        console.error('Error updating product in ERP:', error);
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to update product in ERP',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } 
    // Otherwise, create new product in ERP
    else {
      if (!product.code || !product.name) {
        return NextResponse.json(
          { error: 'Product must have code and name to be synced to ERP' },
          { status: 400 }
        );
      }

      // Prepare additional fields
      const additionalFields: any = {};
      
      // Add CODE1 (Manufacturer Code) if available
      if (product.code1) {
        additionalFields.CODE1 = product.code1;
      }

      // Add CODE2 (EAN Code) if available
      if (product.code2) {
        additionalFields.CODE2 = product.code2;
      }

      if (product.brand?.code) {
        additionalFields.MTRMARK = product.brand.code;
      }

      if (product.manufacturer?.code) {
        additionalFields.MTRMANFCTR = product.manufacturer.code;
      }

      if (product.width !== null) {
        additionalFields.DIM1 = product.width.toString();
      }

      if (product.length !== null) {
        additionalFields.DIM2 = product.length.toString();
      }

      if (product.height !== null) {
        additionalFields.DIM3 = product.height.toString();
      }

      if (product.weight !== null) {
        additionalFields.GWEIGHT = product.weight.toString();
      }

      try {
        erpResponse = await createProductInErp(product.code, product.name, additionalFields);
      } catch (error) {
        console.error('Error creating product in ERP:', error);
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to create product in ERP',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Update product in database with ERP sync info
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        mtrl: erpResponse.MTRL?.toString() || product.mtrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: isUpdate ? 'Product updated in ERP' : 'Product created in ERP',
      data: updatedProduct,
      erpResponse: {
        mtrl: erpResponse.MTRL,
        errorcode: erpResponse.errorcode,
      },
    });
  } catch (error) {
    console.error('Error syncing product to ERP:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

