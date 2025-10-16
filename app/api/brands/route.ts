/**
 * API Route: Brands
 * GET /api/brands - List all brands
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        logo: true,
        image: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

