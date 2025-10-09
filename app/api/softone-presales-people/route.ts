import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/softone-presales-people - Get all SoftOne presales people
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const presalesPeople = await prisma.softOnePresalesPeople.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      presalesPeople,
      total: presalesPeople.length
    });

  } catch (error) {
    console.error('SoftOne Presales People fetch error:', error);
    return NextResponse.json(
      { message: "Failed to fetch presales people", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

