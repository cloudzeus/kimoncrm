import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch equipment data for a site survey
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      select: {
        id: true,
        equipment: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Parse equipment if it's stored as JSON string
    let equipment = siteSurvey.equipment || [];
    if (typeof equipment === 'string') {
      try {
        equipment = JSON.parse(equipment);
      } catch (e) {
        equipment = [];
      }
    }

    return NextResponse.json({
      equipment: Array.isArray(equipment) ? equipment : [],
    });

  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment data' },
      { status: 500 }
    );
  }
}

// POST - Save equipment data for a site survey
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { equipment } = body;

    // Verify site survey exists
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Update the site survey with equipment data
    await prisma.siteSurvey.update({
      where: { id },
      data: {
        equipment: equipment as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Equipment data saved successfully',
    });

  } catch (error) {
    console.error('Error saving equipment:', error);
    return NextResponse.json(
      { error: 'Failed to save equipment data' },
      { status: 500 }
    );
  }
}

