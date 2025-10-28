/**
 * API Route: Bulk Assign Service Category
 * POST /api/services/bulk-assign-category
 * 
 * Assigns a service category to multiple services and syncs to SoftOne ERP
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { updateServiceInErp } from '@/lib/softone/services';

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

    const body = await request.json();
    const { serviceIds, serviceCategoryCode } = body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'Service IDs are required' },
        { status: 400 }
      );
    }

    // Fetch services to get their MTRL values for ERP sync
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      select: {
        id: true,
        name: true,
        mtrl: true,
      },
    });

    // Update services with the category code
    const result = await prisma.service.updateMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      data: {
        serviceCategoryCode: serviceCategoryCode || null,
      },
    });

    // Sync to SoftOne ERP
    const erpResults = [];
    const erpErrors = [];

    for (const service of services) {
      if (!service.mtrl) {
        erpResults.push({
          serviceId: service.id,
          serviceName: service.name,
          status: 'skipped',
          reason: 'No MTRL (service not in SoftOne)',
        });
        continue;
      }

      try {
        // Map serviceCategoryCode to MTRCATEGORY for SoftOne
        const updates: Record<string, any> = {};
        
        if (serviceCategoryCode) {
          updates.MTRCATEGORY = serviceCategoryCode;
        }

        console.log(`🔄 Syncing category to SoftOne for ${service.name}:`, updates);

        // Update in SoftOne ERP
        await updateServiceInErp(service.mtrl, updates);

        erpResults.push({
          serviceId: service.id,
          serviceName: service.name,
          mtrl: service.mtrl,
          status: 'success',
          syncedCategory: serviceCategoryCode,
        });
      } catch (error) {
        console.error(`❌ Failed to sync category for service ${service.id}:`, error);
        erpErrors.push({
          serviceId: service.id,
          serviceName: service.name,
          mtrl: service.mtrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const erpSuccessCount = erpResults.filter(r => r.status === 'success').length;
    const erpSkippedCount = erpResults.filter(r => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} service(s) in database. Synced ${erpSuccessCount} to SoftOne ERP (${erpSkippedCount} skipped, ${erpErrors.length} errors)`,
      count: result.count,
      erpStats: {
        synced: erpSuccessCount,
        skipped: erpSkippedCount,
        errors: erpErrors.length,
      },
      erpResults: erpResults.length > 0 ? erpResults : undefined,
      erpErrors: erpErrors.length > 0 ? erpErrors : undefined,
    });
  } catch (error) {
    console.error('Error bulk assigning category:', error);
    return NextResponse.json(
      { error: 'Failed to bulk assign category' },
      { status: 500 }
    );
  }
}


