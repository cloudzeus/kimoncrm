import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/products/check-duplicate
 * Check if a product with the same EAN or Manufacturer Code already exists
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eanCode, manufacturerCode } = body;

    const conditions = [];
    
    if (eanCode) {
      conditions.push({ code1: eanCode });
    }
    
    if (manufacturerCode) {
      conditions.push({ code2: manufacturerCode });
    }

    if (conditions.length === 0) {
      return NextResponse.json({
        success: true,
        isDuplicate: false
      });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: conditions
      },
      select: {
        id: true,
        name: true,
        code: true,
        code1: true,
        code2: true,
        mtrl: true,
        brand: {
          select: {
            name: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      isDuplicate: !!existingProduct,
      existingProduct: existingProduct || null
    });

  } catch (error) {
    console.error('Error checking duplicate:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check for duplicates'
    }, { status: 500 });
  }
}
