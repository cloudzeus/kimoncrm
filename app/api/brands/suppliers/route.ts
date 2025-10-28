import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/brands/suppliers
 * Get all brand-supplier associations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = request.nextUrl.searchParams.get('brandId');
    const supplierId = request.nextUrl.searchParams.get('supplierId');

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (supplierId) where.supplierId = supplierId;

    const associations = await prisma.brandSupplier.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
            afm: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: associations });
  } catch (error) {
    console.error('Error fetching brand-supplier associations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brands/suppliers
 * Create a new brand-supplier association
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, supplierId } = body;

    if (!brandId || !supplierId) {
      return NextResponse.json(
        { error: 'brandId and supplierId are required' },
        { status: 400 }
      );
    }

    // Check if association already exists
    const existing = await prisma.brandSupplier.findUnique({
      where: {
        brandId_supplierId: {
          brandId,
          supplierId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Association already exists' },
        { status: 409 }
      );
    }

    const association = await prisma.brandSupplier.create({
      data: {
        brandId,
        supplierId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
            afm: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: association }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand-supplier association:', error);
    return NextResponse.json(
      { error: 'Failed to create association' },
      { status: 500 }
    );
  }
}

