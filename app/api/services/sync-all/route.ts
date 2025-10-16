/**
 * API Route: Sync All Services from SoftOne ERP
 * POST /api/services/sync-all
 * 
 * Fetches all services from SoftOne ERP and syncs them to the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { fetchAllServices, mapSoftOneServiceToModel } from '@/lib/softone/services';

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

    // Only admin users can sync services
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('Starting full service sync from SoftOne...');
    
    // Fetch all services from SoftOne
    const softoneData = await fetchAllServices();
    
    const totalServices = softoneData['Total Products'] || softoneData.result?.length || 0;
    console.log(`Fetched ${totalServices} services from SoftOne`);

    // Process services in batches to avoid overwhelming the database
    const batchSize = 100;
    const services = softoneData.result;
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (softoneService) => {
          try {
            const mappedService = mapSoftOneServiceToModel(softoneService);

            // Check if service exists
            const existingService = await prisma.service.findUnique({
              where: { mtrl: mappedService.mtrl! },
              select: { id: true },
            });

            // Upsert service
            await prisma.service.upsert({
              where: { mtrl: mappedService.mtrl! },
              create: mappedService,
              update: mappedService,
            });

            if (existingService) {
              updatedCount++;
            } else {
              createdCount++;
            }
          } catch (error) {
            console.error(`Error processing service ${softoneService.CODE}:`, error);
            errorCount++;
          }
        })
      );

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(services.length / batchSize)}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Services synced successfully',
      stats: {
        total: services.length,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('Error syncing services:', error);
    return NextResponse.json(
      { error: 'Failed to sync services', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

