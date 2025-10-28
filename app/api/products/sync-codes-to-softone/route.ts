import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { updateProductInErp } from '@/lib/softone/products';

/**
 * POST /api/products/sync-codes-to-softone
 * Bulk sync EAN and manufacturer codes to SoftOne ERP
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Fetch products with their codes and MTRL
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        mtrl: true,
        code1: true, // EAN code
        code2: true, // Manufacturer code
      },
    });

    const results = [];
    const errors = [];

    for (const product of products) {
      // Skip if no MTRL (not synced to SoftOne yet)
      if (!product.mtrl) {
        results.push({
          productId: product.id,
          productName: product.name,
          status: 'skipped',
          reason: 'No MTRL (product not in SoftOne)',
        });
        continue;
      }

      // Skip if no codes to sync
      if (!product.code1 && !product.code2) {
        results.push({
          productId: product.id,
          productName: product.name,
          status: 'skipped',
          reason: 'No EAN or manufacturer codes to sync',
        });
        continue;
      }

      try {
        // Build update object with only non-null codes
        const updates: Record<string, string> = {};
        
        if (product.code1) {
          updates.CODE1 = product.code1; // EAN code field in SoftOne
        }
        
        if (product.code2) {
          updates.CODE2 = product.code2; // Manufacturer code field in SoftOne
        }

        console.log(`🔄 Syncing codes to SoftOne for ${product.name}:`, updates);

        // Update in SoftOne ERP
        await updateProductInErp(parseInt(product.mtrl), updates);

        results.push({
          productId: product.id,
          productName: product.name,
          mtrl: product.mtrl,
          status: 'success',
          syncedCodes: updates,
        });
      } catch (error) {
        console.error(`❌ Failed to sync codes for product ${product.id}:`, error);
        errors.push({
          productId: product.id,
          productName: product.name,
          mtrl: product.mtrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: products.length,
        synced: successCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error syncing codes to SoftOne:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync codes to SoftOne',
      },
      { status: 500 }
    );
  }
}
