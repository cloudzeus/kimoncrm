/**
 * API Route: Services List
 * GET /api/services
 * 
 * Fetches all services from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const serviceCategoryCode = searchParams.get('serviceCategoryCode');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { mtrl: { contains: search } },
      ];
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    if (serviceCategoryCode) {
      where.serviceCategoryCode = serviceCategoryCode;
    }

    // Get total count
    const total = await prisma.service.count({ where });

    // Define allowed sort fields
    const allowedSortFields = ['name', 'code', 'mtrl', 'createdAt', 'updatedAt'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    // Get services
    const services = await prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [validSortBy]: validSortOrder,
      },
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
      data: services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

