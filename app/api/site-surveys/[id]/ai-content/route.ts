import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET - Load AI content for a site survey
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: siteSurveyId } = await params;

    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      select: { infrastructureData: true },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    const infrastructureData = siteSurvey.infrastructureData as any;
    const aiContent = infrastructureData?.aiContent || null;

    return NextResponse.json({ aiContent });

  } catch (error: any) {
    console.error('Error loading AI content:', error);
    return NextResponse.json(
      { error: 'Failed to load AI content', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Save AI content for a site survey
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: siteSurveyId } = await params;
    const body = await request.json();
    const { aiContent } = body;

    // Get current infrastructure data
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      select: { infrastructureData: true },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Merge AI content into infrastructure data
    const currentInfraData = (siteSurvey.infrastructureData as any) || {};
    const updatedInfraData = {
      ...currentInfraData,
      aiContent,
    };

    // Update the site survey
    await prisma.siteSurvey.update({
      where: { id: siteSurveyId },
      data: { infrastructureData: updatedInfraData },
    });

    console.log('✅ AI content saved successfully');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error saving AI content:', error);
    return NextResponse.json(
      { error: 'Failed to save AI content', details: error.message },
      { status: 500 }
    );
  }
}
