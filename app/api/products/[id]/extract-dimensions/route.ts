import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { 
  extractDimensionsFromSpecs, 
  updateProductDimensions, 
  syncDimensionsToERP 
} from '@/lib/products/spec-extractor';

/**
 * POST /api/products/[id]/extract-dimensions
 * Extract dimensions and weight from product specifications and update the product
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

    const { id: productId } = await params;

    // Get product with specifications
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        specifications: {
          include: {
            translations: true,
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

    if (!product.specifications || product.specifications.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No specifications found for this product' 
      }, { status: 400 });
    }

    // Extract dimensions from specifications
    const extractionResult = extractDimensionsFromSpecs(product.specifications);

    if (!extractionResult.hasChanges) {
      return NextResponse.json({
        success: true,
        message: 'No dimension or weight information found in specifications',
        extractedSpecs: extractionResult.extractedSpecs,
        dimensions: extractionResult.dimensions,
      });
    }

    // Update product dimensions in database
    const dbUpdateResult = await updateProductDimensions(productId, extractionResult.dimensions);

    if (!dbUpdateResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update product dimensions in database',
      }, { status: 500 });
    }

    // Sync to SoftOne ERP if product has MTRL and is active
    let erpSyncResult = null;
    if (product.mtrl && product.isActive) {
      erpSyncResult = await syncDimensionsToERP(product.mtrl, extractionResult.dimensions);
    }

    return NextResponse.json({
      success: true,
      message: 'Dimensions extracted and updated successfully',
      extractedSpecs: extractionResult.extractedSpecs,
      dimensions: extractionResult.dimensions,
      databaseUpdate: {
        success: dbUpdateResult.success,
        updated: dbUpdateResult.updated,
      },
      erpSync: erpSyncResult ? {
        success: erpSyncResult.success,
        message: erpSyncResult.message,
      } : {
        success: false,
        message: 'Product not synced to ERP (no MTRL or inactive)',
      },
    });

  } catch (error) {
    console.error('Error extracting dimensions from specifications:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to extract dimensions from specifications' 
    }, { status: 500 });
  }
}
