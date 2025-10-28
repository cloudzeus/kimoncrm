import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/product-groupspecs
 * Fetch group specs, optionally filtered by mtrgroupCode
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
    const mtrgroupCode = searchParams.get('mtrgroupCode');

    const where = mtrgroupCode ? { mtrgroupCode } : {};

    const specs = await prisma.productGroupSpec.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { specName: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: specs,
    });
  } catch (error) {
    console.error('Error fetching group specs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group specs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/product-groupspecs
 * Create a new group spec
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

    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Manager access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { mtrgroupCode, specKey, specName, description, isRequired, order } = body;

    if (!mtrgroupCode || !specKey || !specName) {
      return NextResponse.json(
        { error: 'MtrgroupCode, specKey, and specName are required' },
        { status: 400 }
      );
    }

    // Use upsert to handle duplicates gracefully
    const spec = await prisma.productGroupSpec.upsert({
      where: {
        mtrgroupCode_specKey: {
          mtrgroupCode,
          specKey,
        },
      },
      update: {
        specName,
        description: description || null,
        isRequired: isRequired || false,
        order: order || 0,
      },
      create: {
        mtrgroupCode,
        specKey,
        specName,
        description: description || null,
        isRequired: isRequired || false,
        order: order || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: spec,
    });
  } catch (error: any) {
    console.error('Error creating group spec:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A spec with this key already exists for this group' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create group spec' },
      { status: 500 }
    );
  }
}
