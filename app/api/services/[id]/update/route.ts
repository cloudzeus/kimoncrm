/**
 * API Route: Update Service
 * PUT /api/services/[id]/update
 * 
 * Updates a service's details including brand assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow ADMIN, MANAGER, and EMPLOYEE roles
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, brandId, isActive } = body;

    // Build update data object (only include fields that are provided)
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (brandId !== undefined) {
      updateData.brandId = brandId || null;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update service
    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        translations: {
          include: {
            language: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

