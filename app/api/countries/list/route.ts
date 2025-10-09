import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/countries/list - Fetch countries from database with translations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch countries from database with translations
    const countries = await prisma.country.findMany({
      include: {
        translations: {
          select: {
            languageCode: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      countries,
      total: countries.length
    });

  } catch (error) {
    console.error('Countries list error:', error);
    
    return NextResponse.json(
      { message: "Failed to fetch countries", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

