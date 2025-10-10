import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/currencies/public - Get all currencies (public endpoint for forms)
 */
export async function GET() {
  try {
    const currencies = await prisma.currency.findMany({
      select: {
        socurrency: true,
        name: true,
        shortcut: true,
        symbol: true,
        intercode: true,
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      currencies,
    });

  } catch (error) {
    console.error('Currencies fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

