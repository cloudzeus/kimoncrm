/**
 * API Route: Manufacturers CRUD
 * GET /api/manufacturers - List all manufacturers with filters
 * POST /api/manufacturers - Create a new manufacturer
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/manufacturers
 * List all manufacturers with optional filters
 */
export async function GET(request: NextRequest) {
  try {
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

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { mtrmanfctr: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get total count
    const total = await prisma.manufacturer.count({ where });

    // Get manufacturers with pagination
    const manufacturers = await prisma.manufacturer.findMany({
      where,
      include: {
        logo: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: manufacturers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manufacturers
 * Create a new manufacturer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow ADMIN role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, name, isActive } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Check if manufacturer with same code already exists
    const existing = await prisma.manufacturer.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Manufacturer with this code already exists' },
        { status: 400 }
      );
    }

    // Create manufacturer
    const manufacturer = await prisma.manufacturer.create({
      data: {
        mtrmanfctr: code,
        code,
        name,
        isActive: isActive !== undefined ? isActive : true,
        softoneCode: code,
      },
    });

    return NextResponse.json({
      success: true,
      data: manufacturer,
    });
  } catch (error) {
    console.error('Error creating manufacturer:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

