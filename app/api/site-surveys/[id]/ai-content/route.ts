import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * Save/Load AI-generated technical descriptions for proposals
 */

// GET - Load AI content
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
      select: {
        infrastructureData: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json({ error: 'Site survey not found' }, { status: 404 });
    }

    const infrastructureData = siteSurvey.infrastructureData as any;
    const aiContent = infrastructureData?.aiContent || {
      infrastructureDesc: '',
      technicalDesc: '',
      productsDesc: '',
      servicesDesc: '',
      scopeOfWork: '',
    };

    return NextResponse.json(aiContent);
  } catch (error) {
    console.error('Error loading AI content:', error);
    return NextResponse.json(
      { error: 'Failed to load AI content' },
      { status: 500 }
    );
  }
}

// POST - Save AI content
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
    const aiContent = await request.json();

    // Validate aiContent
    if (!aiContent || typeof aiContent !== 'object') {
      return NextResponse.json({ error: 'Invalid AI content' }, { status: 400 });
    }

    // Get existing infrastructureData
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      select: {
        infrastructureData: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json({ error: 'Site survey not found' }, { status: 404 });
    }

    // Merge AI content into infrastructureData
    const existingData = (siteSurvey.infrastructureData as any) || {};
    const updatedData = {
      ...existingData,
      aiContent,
    };

    // Update site survey
    await prisma.siteSurvey.update({
      where: { id: siteSurveyId },
      data: {
        infrastructureData: updatedData,
      },
    });

    console.log('✅ AI content saved to site survey:', siteSurveyId);

    return NextResponse.json({ 
      success: true,
      message: 'AI content saved successfully' 
    });
  } catch (error) {
    console.error('Error saving AI content:', error);
    return NextResponse.json(
      { error: 'Failed to save AI content' },
      { status: 500 }
    );
  }
}

