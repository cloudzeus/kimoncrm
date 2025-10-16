import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { fetchAicAvailability, fetchNetcoreAvailability } from '@/lib/softone/stock';

/**
 * POST /api/cron/sync-stock
 * Sync product stock from AIC and NETCORE warehouses
 * Runs every 30 minutes via cron
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting stock sync...');
    const startTime = Date.now();

    let aicUpdated = 0;
    let aicCreated = 0;
    let aicSkipped = 0;
    let netcoreUpdated = 0;
    let netcoreCreated = 0;
    let netcoreSkipped = 0;

    // Sync AIC warehouse
    try {
      console.log('📦 Fetching AIC availability...');
      const aicData = await fetchAicAvailability();
      console.log(`✅ Found ${aicData.total} AIC stock records`);

      for (const item of aicData.result) {
        try {
          const qty = parseInt(item.BALANCE) || 0;

          // Find product by MTRL or CODE
          const product = await prisma.product.findFirst({
            where: {
              OR: [
                { mtrl: item.MTRL },
                { code: item.CODE },
              ],
            },
            select: { id: true },
          });

          if (!product) {
            aicSkipped++;
            continue;
          }

          // Check if stock record exists
          const existingStock = await prisma.productStock.findUnique({
            where: {
              productId_warehouse: {
                productId: product.id,
                warehouse: 'AIC',
              },
            },
          });

          if (existingStock) {
            // Only update if quantity changed
            if (existingStock.qty !== qty) {
              await prisma.productStock.update({
                where: { id: existingStock.id },
                data: { qty },
              });
              aicUpdated++;
            } else {
              aicSkipped++;
            }
          } else {
            // Create new stock record
            await prisma.productStock.create({
              data: {
                productId: product.id,
                warehouse: 'AIC',
                qty,
              },
            });
            aicCreated++;
          }
        } catch (error) {
          console.error(`Error processing AIC stock for MTRL ${item.MTRL}:`, error);
          aicSkipped++;
        }
      }
    } catch (error) {
      console.error('Error syncing AIC availability:', error);
    }

    // Sync NETCORE warehouse
    try {
      console.log('📦 Fetching NETCORE availability...');
      const netcoreData = await fetchNetcoreAvailability();
      console.log(`✅ Found ${netcoreData.total} NETCORE stock records`);

      for (const item of netcoreData.result) {
        try {
          const qty = parseInt(item.BALANCE) || 0;

          // Find product by MTRL or CODE
          const product = await prisma.product.findFirst({
            where: {
              OR: [
                { mtrl: item.MTRL },
                { code: item.CODE },
              ],
            },
            select: { id: true },
          });

          if (!product) {
            netcoreSkipped++;
            continue;
          }

          // Check if stock record exists
          const existingStock = await prisma.productStock.findUnique({
            where: {
              productId_warehouse: {
                productId: product.id,
                warehouse: 'NETCORE',
              },
            },
          });

          if (existingStock) {
            // Only update if quantity changed
            if (existingStock.qty !== qty) {
              await prisma.productStock.update({
                where: { id: existingStock.id },
                data: { qty },
              });
              netcoreUpdated++;
            } else {
              netcoreSkipped++;
            }
          } else {
            // Create new stock record
            await prisma.productStock.create({
              data: {
                productId: product.id,
                warehouse: 'NETCORE',
                qty,
              },
            });
            netcoreCreated++;
          }
        } catch (error) {
          console.error(`Error processing NETCORE stock for MTRL ${item.MTRL}:`, error);
          netcoreSkipped++;
        }
      }
    } catch (error) {
      console.error('Error syncing NETCORE availability:', error);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const summary = {
      success: true,
      message: 'Stock sync completed',
      duration: `${duration}s`,
      aic: {
        created: aicCreated,
        updated: aicUpdated,
        skipped: aicSkipped,
        total: aicCreated + aicUpdated + aicSkipped,
      },
      netcore: {
        created: netcoreCreated,
        updated: netcoreUpdated,
        skipped: netcoreSkipped,
        total: netcoreCreated + netcoreUpdated + netcoreSkipped,
      },
      totalProcessed: aicCreated + aicUpdated + aicSkipped + netcoreCreated + netcoreUpdated + netcoreSkipped,
    };

    console.log('📊 Stock sync summary:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Stock sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Stock sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

