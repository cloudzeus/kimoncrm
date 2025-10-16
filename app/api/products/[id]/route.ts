import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { createProductInErp, updateProductInErp } from '@/lib/softone/products';

/**
 * GET /api/products/[id]
 * Get detailed product information by ID
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

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manufacturer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            softoneCode: true,
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
            shortDescription: true,
            description: true,
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
        stock: {
          select: {
            id: true,
            warehouse: true,
            qty: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product details' }, { status: 500 });
  }
}

/**
 * PUT /api/products/[id]
 * Update product information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN, MANAGER, and EMPLOYEE roles
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { brand: true, manufacturer: true, category: true }
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    // Handle brand update
    if (body.brandId !== undefined) {
      updateData.brandId = body.brandId || null;
      if (body.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: body.brandId },
          select: { code: true }
        });
        updateData.mtrmark = brand?.code || null;
      } else {
        updateData.mtrmark = null;
      }
    }

    // Handle category update
    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId || null;
    }

    // Handle manufacturer update
    if (body.manufacturerId !== undefined) {
      updateData.manufacturerId = body.manufacturerId || null;
      if (body.manufacturerId) {
        const manufacturer = await prisma.manufacturer.findUnique({
          where: { id: body.manufacturerId },
          select: { code: true }
        });
        updateData.mtrmanfctr = manufacturer?.code || null;
      } else {
        updateData.mtrmanfctr = null;
      }
    }

    // Handle other fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.code1 !== undefined) updateData.code1 = body.code1;
    if (body.code2 !== undefined) updateData.code2 = body.code2;
    if (body.width !== undefined) updateData.width = body.width ? parseFloat(body.width) : null;
    if (body.length !== undefined) updateData.length = body.length ? parseFloat(body.length) : null;
    if (body.height !== undefined) updateData.height = body.height ? parseFloat(body.height) : null;
    if (body.weight !== undefined) updateData.weight = body.weight ? parseFloat(body.weight) : null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Update product in database
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manufacturer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            softoneCode: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            shortcut: true,
          },
        },
      },
    });

    // Sync with SoftOne ERP if the product has an ERP ID (mtrl) and syncToERP is true
    let erpSyncResult = null;
    const shouldSyncToERP = body.syncToERP !== false; // Default to true for backward compatibility
    
    if (existingProduct.mtrl && shouldSyncToERP) {
      try {
        // Prepare ERP update data
        const erpUpdateData: Record<string, any> = {};
        
        // Map brand changes to ERP
        if (body.brandId !== undefined && updateData.mtrmark !== undefined) {
          erpUpdateData.MTRMARK = updateData.mtrmark;
        }
        
        // Map manufacturer changes to ERP
        if (body.manufacturerId !== undefined && updateData.mtrmanfctr !== undefined) {
          erpUpdateData.MTRMANFCTR = updateData.mtrmanfctr;
        }
        
        // Map category changes to ERP (if we have the SoftOne category code)
        if (body.categoryId !== undefined && updatedProduct.category?.softoneCode) {
          erpUpdateData.MTRCATEGORY = updatedProduct.category.softoneCode;
        }

        // Map other fields to ERP format
        if (body.name !== undefined) erpUpdateData.NAME = body.name;
        if (body.code !== undefined) erpUpdateData.CODE = body.code;
        if (body.code1 !== undefined) erpUpdateData.CODE1 = body.code1;
        if (body.code2 !== undefined) erpUpdateData.CODE2 = body.code2;
        if (body.width !== undefined) erpUpdateData.DIM1 = body.width;
        if (body.length !== undefined) erpUpdateData.DIM2 = body.length;
        if (body.height !== undefined) erpUpdateData.DIM3 = body.height;
        if (body.weight !== undefined) erpUpdateData.GWEIGHT = body.weight;
        if (body.isActive !== undefined) erpUpdateData.ISACTIVE = body.isActive ? '1' : '0';

        // Only sync to ERP if there are actual changes
        if (Object.keys(erpUpdateData).length > 0) {
          erpSyncResult = await updateProductInErp(
            parseInt(existingProduct.mtrl), 
            erpUpdateData
          );
        }
      } catch (erpError) {
        console.error('Error syncing product to ERP:', erpError);
        // Don't fail the entire update if ERP sync fails
        erpSyncResult = { success: false, error: erpError instanceof Error ? erpError.message : 'ERP sync failed' };
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      erpSync: erpSyncResult,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product
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

    // Only allow ADMIN and MANAGER roles
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Delete product
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product'
      },
      { status: 500 }
    );
  }
}