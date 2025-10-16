/**
 * API Route: Sync Manufacturers from SoftOne ERP
 * POST /api/manufacturers/sync
 * 
 * Fetches all manufacturers from SoftOne ERP and syncs them to the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { fetchAllManufacturers, mapSoftOneManufacturerToModel } from '@/lib/softone/manufacturers';

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

    // Only admin users can sync manufacturers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('Starting manufacturer sync from SoftOne...');
    
    // Fetch all manufacturers from SoftOne
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
        } else {
          createdCount++;
        }
      } catch (error) {
        console.error(`Error processing manufacturer ${softoneManufacturer.CODE}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Manufacturer sync completed',
      stats: {
        total: softoneData.total,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
      },
    });
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

