/**
 * Cron Job: Sync Manufacturers from SoftOne ERP
 * POST /api/cron/sync-manufacturers
 * 
 * Fetches manufacturers from SoftOne ERP and syncs to database
 * Should be triggered periodically by cron scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { fetchAllManufacturers, mapSoftOneManufacturerToModel } from '@/lib/softone/manufacturers';

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

    console.log('Starting manufacturer sync from SoftOne...');
    
    // Fetch manufacturers from SoftOne
    const softoneData = await fetchAllManufacturers();
    
    console.log(`Fetched ${softoneData.total} manufacturers from SoftOne`);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const softoneManufacturer of softoneData.result) {
      try {
        const mappedManufacturer = mapSoftOneManufacturerToModel(softoneManufacturer);

        // Check if manufacturer exists
        const existingManufacturer = await prisma.manufacturer.findUnique({
          where: { mtrmanfctr: mappedManufacturer.mtrmanfctr! },
        });

        // Upsert manufacturer
        await prisma.manufacturer.upsert({
          where: { mtrmanfctr: mappedManufacturer.mtrmanfctr! },
          create: mappedManufacturer,
          update: mappedManufacturer,
        });

        if (existingManufacturer) {
          updatedCount++;
          console.log(`Updated manufacturer: ${mappedManufacturer.code} - ${mappedManufacturer.name}`);
        } else {
          createdCount++;
          console.log(`Created manufacturer: ${mappedManufacturer.code} - ${mappedManufacturer.name}`);
        }
      } catch (error) {
        console.error(`Error processing manufacturer ${softoneManufacturer.CODE}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: 'Manufacturer sync completed',
      total: softoneData.total,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
    };

    console.log('Manufacturer sync completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing manufacturers:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

