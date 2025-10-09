import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/districts/list - Fetch districts from database with translations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch districts from database with translations and country info
    const districts = await prisma.district.findMany({
      include: {
        country: {
          select: {
            name: true,
            softoneCode: true
          }
        },
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
      districts,
      total: districts.length
    });

  } catch (error) {
    console.error('Districts list error:', error);
    
    return NextResponse.json(
      { message: "Failed to fetch districts", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

