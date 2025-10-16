/**
 * Cron Job: Sync Updated Products from SoftOne ERP
 * POST /api/cron/sync-products
 * 
 * Fetches products updated in the last 15 minutes from SoftOne ERP
 * Should be triggered every 15 minutes by cron scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { fetchUpdatedProducts, mapSoftOneProductToModel } from '@/lib/softone/products';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting incremental product sync from SoftOne...');
    
    // Fetch updated products from SoftOne (last 15 minutes)
    const softoneData = await fetchUpdatedProducts();
    
    console.log(`Fetched ${softoneData.total} updated products from SoftOne`);
    console.log(`Window: ${softoneData.window_start} to ${softoneData.window_end}`);

    if (softoneData.total === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products to sync',
        stats: {
          total: 0,
          created: 0,
          updated: 0,
          errors: 0,
        },
      });
    }

    // Process updated products
    const products = softoneData.result;
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const softoneProduct of products) {
      try {
        const mappedProduct = mapSoftOneProductToModel(softoneProduct);

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
          where: { mtrl: mappedProduct.mtrl! },
        });

        // Check if brand exists by code (mtrmark)
        let brandId: string | null = null;
        if (mappedProduct.mtrmark) {
          const brand = await prisma.brand.findUnique({
            where: { code: mappedProduct.mtrmark },
          });
          brandId = brand?.id || null;
        }

        // Check if manufacturer exists by code (mtrmanfctr)
        let manufacturerId: string | null = null;
        if (mappedProduct.mtrmanfctr) {
          const manufacturer = await prisma.manufacturer.findUnique({
            where: { code: mappedProduct.mtrmanfctr },
          });
          manufacturerId = manufacturer?.id || null;
        }

        // Upsert product
        await prisma.product.upsert({
          where: { mtrl: mappedProduct.mtrl! },
          create: {
            ...mappedProduct,
            brandId,
            manufacturerId,
          },
          update: {
            ...mappedProduct,
            brandId,
            manufacturerId,
          },
        });

        if (existingProduct) {
          updatedCount++;
          console.log(`Updated product: ${mappedProduct.code} - ${mappedProduct.name}`);
        } else {
          createdCount++;
          console.log(`Created product: ${mappedProduct.code} - ${mappedProduct.name}`);
        }
      } catch (error) {
        console.error(`Error processing product ${softoneProduct.CODE}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: 'Product sync completed',
      stats: {
        total: softoneData.total,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
      },
      window: {
        start: softoneData.window_start,
        end: softoneData.window_end,
      },
    };

    console.log('Product sync completed:', result.stats);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

