import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, completedAt } = body;

    // Update the site survey status
    const updatedSurvey = await prisma.siteSurvey.update({
      where: { id },
      data: {
        status: status || 'COMPLETED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      survey: updatedSurvey
    });

  } catch (error) {
    console.error('Error completing site survey:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete site survey' 
      },
      { status: 500 }
    );
  }
}
