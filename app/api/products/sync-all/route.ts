/**
 * API Route: Sync All Products from SoftOne ERP
 * POST /api/products/sync-all
 * 
 * Fetches all products from SoftOne ERP and syncs them to the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { fetchAllProducts, mapSoftOneProductToModel } from '@/lib/softone/products';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin users can sync products
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('Starting full product sync from SoftOne...');
    
    // Fetch all products from SoftOne
    const softoneData = await fetchAllProducts();
    
    console.log(`Fetched ${softoneData.total} products from SoftOne`);

    // Process products in batches to avoid overwhelming the database
    const batchSize = 100;
    const products = softoneData.result;
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (softoneProduct) => {
          try {
            const mappedProduct = mapSoftOneProductToModel(softoneProduct);

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

            // Check if this is a new product or update
            const existingProduct = await prisma.product.findUnique({
              where: { mtrl: mappedProduct.mtrl! },
              select: { id: true },
            });

            if (existingProduct) {
              updatedCount++;
            } else {
              createdCount++;
            }
          } catch (error) {
            console.error(`Error processing product ${softoneProduct.CODE}:`, error);
            errorCount++;
          }
        })
      );

      console.log(`Processed batch ${i / batchSize + 1}/${Math.ceil(products.length / batchSize)}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Product sync completed',
      stats: {
        total: softoneData.total,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
      },
    });
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

