import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateSiteSurveyWordDocument } from '@/lib/word/site-survey-doc';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        cablingSurvey: true,
        voipSurvey: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Fetch company details from settings
    const companySettings = await prisma.defaultCompanyData.findFirst();
    
    const companyDetails = {
      name: companySettings?.companyName || 'Your Company Name',
      logo: undefined, // Logo URL would need to be fetched from FileRef if needed
      address: companySettings?.address || undefined,
      city: companySettings?.city || undefined,
      phone: companySettings?.phone1 || undefined,
      email: companySettings?.email || undefined,
      website: companySettings?.website || undefined,
      vatNumber: undefined,
      registrationNumber: undefined,
    };

    // Fetch equipment data if available
    let equipment = [];
    if (siteSurvey.buildings && siteSurvey.buildings.length > 0) {
      // Extract equipment from buildings structure
      const extractEquipment = (buildings: any[]) => {
        const items: any[] = [];
        buildings.forEach(building => {
          if (building.centralRacks) {
            building.centralRacks.forEach((rack: any) => {
              if (rack.devices) {
                rack.devices.forEach((device: any) => {
                  items.push({
                    name: device.name,
                    type: device.type,
                    brand: device.brand,
                    model: device.model,
                    quantity: device.quantity || 1,
                    notes: device.notes,
                    placement: `Building: ${building.name}, Central Rack: ${rack.name}`,
                  });
                });
              }
            });
          }
          if (building.floors) {
            building.floors.forEach((floor: any) => {
              if (floor.rooms) {
                floor.rooms.forEach((room: any) => {
                  if (room.devices) {
                    room.devices.forEach((device: any) => {
                      items.push({
                        name: device.name,
                        type: device.type,
                        brand: device.brand,
                        model: device.model,
                        quantity: device.quantity || 1,
                        notes: device.notes,
                        placement: `Building: ${building.name}, Floor: ${floor.name}, Room: ${room.name}`,
                      });
                    });
                  }
                });
              }
              if (floor.floorRacks) {
                floor.floorRacks.forEach((rack: any) => {
                  if (rack.devices) {
                    rack.devices.forEach((device: any) => {
                      items.push({
                        name: device.name,
                        type: device.type,
                        brand: device.brand,
                        model: device.model,
                        quantity: device.quantity || 1,
                        notes: device.notes,
                        placement: `Building: ${building.name}, Floor: ${floor.name}, Floor Rack: ${rack.name}`,
                      });
                    });
                  }
                });
              }
            });
          }
        });
        return items;
      };
      
      equipment = extractEquipment(siteSurvey.buildings);
    }

    // Prepare survey data
    const surveyData = {
      id: siteSurvey.id,
      title: siteSurvey.title,
      description: siteSurvey.description || undefined,
      type: siteSurvey.type,
      status: siteSurvey.status,
      arrangedDate: siteSurvey.arrangedDate?.toISOString(),
      address: siteSurvey.address || undefined,
      city: siteSurvey.city || undefined,
      customer: {
        name: siteSurvey.customer.name,
        email: siteSurvey.customer.email || undefined,
        phone: siteSurvey.customer.phone01 || undefined,
        address: siteSurvey.customer.address || undefined,
        city: siteSurvey.customer.city || undefined,
      },
      contact: siteSurvey.contact ? {
        name: siteSurvey.contact.name,
        email: siteSurvey.contact.email || undefined,
        phone: siteSurvey.contact.mobilePhone || siteSurvey.contact.workPhone || undefined,
      } : undefined,
      assignTo: siteSurvey.assignTo ? {
        name: siteSurvey.assignTo.name,
        email: siteSurvey.assignTo.email || undefined,
      } : undefined,
      createdAt: siteSurvey.createdAt.toISOString(),
      updatedAt: siteSurvey.updatedAt.toISOString(),
      files: siteSurvey.images.map(image => ({
        name: image.title || 'Untitled',
        url: image.url,
        filetype: image.kind,
        description: image.description,
      })),
      buildings: siteSurvey.buildings || [],
      voipSurvey: siteSurvey.voipSurvey,
      cablingSurvey: siteSurvey.cablingSurvey,
    };

    // Generate Word document
    const wordBuffer = await generateSiteSurveyWordDocument(
      surveyData,
      companyDetails,
      equipment
    );

    // Return the Word document
    return new NextResponse(wordBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Site-Survey-${siteSurvey.title.replace(/[^a-zA-Z0-9]/g, '-')}-${siteSurvey.id}.docx"`,
        'Content-Length': wordBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating Word document:', error);
    return NextResponse.json(
      { error: 'Failed to generate Word document' },
      { status: 500 }
    );
  }
}
