import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateSiteSurveyWordDocument } from '@/lib/word/site-survey-doc';
import { uploadFileToBunny } from '@/lib/bunny/upload';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { equipment: bomEquipment } = body;

    // Fetch site survey data
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone01: true,
            address: true,
            city: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            workPhone: true,
          },
        },
        assignFrom: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            title: true,
            description: true,
            kind: true,
            createdAt: true,
          },
        },
        buildings: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Fetch company details
    const companySettings = await prisma.defaultCompanyData.findFirst();
    
    const companyDetails = {
      name: companySettings?.companyName || 'Your Company Name',
      logo: undefined,
      address: companySettings?.address || undefined,
      city: companySettings?.city || undefined,
      phone: companySettings?.phone1 || undefined,
      email: companySettings?.email || undefined,
      website: companySettings?.website || undefined,
      vatNumber: undefined,
      registrationNumber: undefined,
    };

    // Use BOM equipment if provided
    let equipment: any[] = [];
    
    if (bomEquipment && Array.isArray(bomEquipment) && bomEquipment.length > 0) {
      equipment = bomEquipment;
    }

    // Prepare survey data
    const surveyData = {
      id: siteSurvey.id,
      title: siteSurvey.title,
      description: siteSurvey.description,
      type: siteSurvey.type,
      status: siteSurvey.status,
      arrangedDate: siteSurvey.arrangedDate,
      address: siteSurvey.address,
      city: siteSurvey.city,
      phone: siteSurvey.phone,
      email: siteSurvey.email,
      customer: siteSurvey.customer,
      contact: siteSurvey.contact,
      assignFrom: siteSurvey.assignFrom,
      assignTo: siteSurvey.assignTo,
      createdAt: siteSurvey.createdAt,
      updatedAt: siteSurvey.updatedAt,
      buildings: siteSurvey.buildings,
      images: siteSurvey.images,
    };

    // Generate Word document
    const buffer = await generateSiteSurveyWordDocument(
      surveyData as any,
      companyDetails,
      equipment
    );

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `SiteSurvey_${siteSurvey.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.docx`;
    
    // Upload to BunnyCDN
    const uploadResult = await uploadFileToBunny(
      buffer,
      fileName,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    // Create file reference in database
    await prisma.file.create({
      data: {
        entityId: id,
        type: 'SITESURVEY',
        name: fileName,
        title: 'Site Survey Document',
        filetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: uploadResult.url,
        description: `Site Survey Word Document: ${siteSurvey.title}`,
        size: buffer.length,
      },
    });

    return NextResponse.json({
      success: true,
      fileName,
      url: uploadResult.url,
      message: 'Word document generated and uploaded successfully',
    });

  } catch (error) {
    console.error('Error generating and uploading Word document:', error);
    return NextResponse.json(
      { error: 'Failed to generate and upload Word document', details: (error as Error).message },
      { status: 500 }
    );
  }
}

