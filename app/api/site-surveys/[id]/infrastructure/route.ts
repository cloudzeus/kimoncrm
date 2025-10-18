import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch infrastructure data for a site survey
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
        buildings: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Extract buildings and connections from the stored data
    const buildings = siteSurvey.buildings || [];
    
    // If buildings is stored as JSON, parse it
    let parsedBuildings = buildings;
    if (typeof buildings === 'string') {
      try {
        parsedBuildings = JSON.parse(buildings);
      } catch (e) {
        parsedBuildings = [];
      }
    }

    // Extract building connections if they exist
    const buildingConnections = Array.isArray(parsedBuildings) 
      ? parsedBuildings.filter((item: any) => item.type === 'connection')
      : [];

    const buildingStructures = Array.isArray(parsedBuildings)
      ? parsedBuildings.filter((item: any) => item.type !== 'connection')
      : parsedBuildings;

    return NextResponse.json({
      buildings: buildingStructures,
      buildingConnections,
    });

  } catch (error) {
    console.error('Error fetching infrastructure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch infrastructure data' },
      { status: 500 }
    );
  }
}

// POST - Save infrastructure data for a site survey
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { buildings, buildingConnections } = body;

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

    // Combine buildings and connections for storage
    const combinedData = [
      ...(buildings || []),
      ...(buildingConnections || []).map((conn: any) => ({ ...conn, type: 'connection' })),
    ];

    // Update the site survey with infrastructure data
    await prisma.siteSurvey.update({
      where: { id },
      data: {
        buildings: combinedData as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Infrastructure data saved successfully',
    });

  } catch (error) {
    console.error('Error saving infrastructure:', error);
    return NextResponse.json(
      { error: 'Failed to save infrastructure data' },
      { status: 500 }
    );
  }
}

