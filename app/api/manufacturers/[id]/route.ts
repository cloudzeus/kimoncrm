/**
 * API Route: Individual Manufacturer Operations
 * GET /api/manufacturers/[id] - Get manufacturer by ID
 * PUT /api/manufacturers/[id] - Update manufacturer
 * DELETE /api/manufacturers/[id] - Delete manufacturer
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/manufacturers/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id },
      include: {
        logo: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!manufacturer) {
      return NextResponse.json(
        { error: 'Manufacturer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: manufacturer,
    });
  } catch (error) {
    console.error('Error fetching manufacturer:', error);
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
 * PUT /api/manufacturers/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { code, name, isActive } = body;

    const manufacturer = await prisma.manufacturer.update({
      where: { id },
      data: {
        code: code !== undefined ? code : undefined,
        mtrmanfctr: code !== undefined ? code : undefined,
        softoneCode: code !== undefined ? code : undefined,
        name: name !== undefined ? name : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: manufacturer,
    });
  } catch (error) {
    console.error('Error updating manufacturer:', error);
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
 * DELETE /api/manufacturers/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if manufacturer has products
    const productCount = await prisma.product.count({
      where: { manufacturerId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete manufacturer with ${productCount} associated products` },
        { status: 400 }
      );
    }

    await prisma.manufacturer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Manufacturer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting manufacturer:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

