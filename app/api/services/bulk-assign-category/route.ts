/**
 * API Route: Bulk Assign Service Category
 * POST /api/services/bulk-assign-category
 * 
 * Assigns a service category to multiple services
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

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

    return NextResponse.json({
      success: true,
      message: `${result.count} services updated successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error bulk assigning category:', error);
    return NextResponse.json(
      { error: 'Failed to bulk assign category' },
      { status: 500 }
    );
  }
}

