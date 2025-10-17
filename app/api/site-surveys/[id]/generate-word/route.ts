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
        files: {
          select: {
            id: true,
            name: true,
            url: true,
            filetype: true,
            description: true,
            createdAt: true,
          },
        },
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
    const companySettings = await prisma.companyDetails.findFirst();
    
    const companyDetails = {
      name: companySettings?.name || 'Your Company Name',
      logo: companySettings?.logo || undefined,
      address: companySettings?.address || undefined,
      city: companySettings?.city || undefined,
      phone: companySettings?.phone || undefined,
      email: companySettings?.email || undefined,
      website: companySettings?.website || undefined,
      vatNumber: companySettings?.vatNumber || undefined,
      registrationNumber: companySettings?.registrationNumber || undefined,
    };

    // Fetch equipment data if available
    let equipment = [];
    if (siteSurvey.cablingSurvey?.buildings) {
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
      
      equipment = extractEquipment(siteSurvey.cablingSurvey.buildings);
    }

    // Prepare survey data
    const surveyData = {
      id: siteSurvey.id,
      title: siteSurvey.title,
      description: siteSurvey.description,
      type: siteSurvey.type,
      status: siteSurvey.status,
      arrangedDate: siteSurvey.arrangedDate?.toISOString(),
      address: siteSurvey.address,
      city: siteSurvey.city,
      customer: {
        name: siteSurvey.customer.name,
        email: siteSurvey.customer.email,
        phone: siteSurvey.customer.phone01,
        address: siteSurvey.customer.address,
        city: siteSurvey.customer.city,
      },
      contact: siteSurvey.contact ? {
        name: siteSurvey.contact.name,
        email: siteSurvey.contact.email,
        phone: siteSurvey.contact.mobilePhone || siteSurvey.contact.workPhone,
      } : undefined,
      assignTo: siteSurvey.assignTo ? {
        name: siteSurvey.assignTo.name,
        email: siteSurvey.assignTo.email,
      } : undefined,
      createdAt: siteSurvey.createdAt.toISOString(),
      updatedAt: siteSurvey.updatedAt.toISOString(),
      files: siteSurvey.files.map(file => ({
        name: file.name,
        url: file.url,
        filetype: file.filetype,
        description: file.description,
      })),
      buildings: siteSurvey.cablingSurvey?.buildings || [],
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
