import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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
        infrastructureData: true,
        equipment: true,
        siteConnections: true,
        futureInfrastructureData: true,
        futureEquipment: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json({ error: "Site survey not found" }, { status: 404 });
    }

    return NextResponse.json({
      infrastructureData: siteSurvey.infrastructureData,
      equipment: siteSurvey.equipment,
      siteConnections: siteSurvey.siteConnections,
      futureInfrastructureData: siteSurvey.futureInfrastructureData,
      futureEquipment: siteSurvey.futureEquipment,
    });
  } catch (error) {
    console.error("Error fetching comprehensive infrastructure data:", error);
    return NextResponse.json(
      { error: "Failed to fetch infrastructure data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      infrastructureData, 
      equipment, 
      siteConnections, 
      futureInfrastructureData, 
      futureEquipment,
      completedStep 
    } = body;

    // Validate that the site survey exists
    const existingSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      select: { id: true, completedSteps: true },
    });

    if (!existingSurvey) {
      return NextResponse.json({ error: "Site survey not found" }, { status: 404 });
    }

    // Update completed steps
    const completedSteps = { ...(existingSurvey.completedSteps as any || {}), ...(completedStep ? { [`step${completedStep}`]: true } : {}) };

    // Update the site survey with comprehensive infrastructure data
    const updatedSurvey = await prisma.siteSurvey.update({
      where: { id },
      data: {
        infrastructureData: infrastructureData || null,
        equipment: equipment || null,
        siteConnections: siteConnections || null,
        futureInfrastructureData: futureInfrastructureData || null,
        futureEquipment: futureEquipment || null,
        completedSteps: completedSteps,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        infrastructureData: true,
        equipment: true,
        siteConnections: true,
        futureInfrastructureData: true,
        futureEquipment: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSurvey,
    });
  } catch (error) {
    console.error("Error updating comprehensive infrastructure data:", error);
    return NextResponse.json(
      { error: "Failed to update infrastructure data" },
      { status: 500 }
    );
  }
}
