import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateSiteSurveyWordDocument } from '@/lib/word/site-survey-doc';

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

    // Use BOM equipment if provided, otherwise extract from buildings
    let equipment: any[] = [];
    
    if (bomEquipment && Array.isArray(bomEquipment) && bomEquipment.length > 0) {
      // Use equipment from BOM tab
      console.log('Using BOM equipment data:', bomEquipment.length, 'items');
      equipment = bomEquipment;
    } else if (siteSurvey.buildings && siteSurvey.buildings.length > 0) {
      // Fallback to extracting from buildings structure
      console.log('Extracting equipment from buildings structure');
      equipment = await extractEquipmentFromBuildings(siteSurvey.buildings);
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
      assignTo: siteSurvey.assignTo && siteSurvey.assignTo.name ? {
        name: siteSurvey.assignTo.name,
        email: siteSurvey.assignTo.email || undefined,
      } : undefined,
      createdAt: siteSurvey.createdAt.toISOString(),
      updatedAt: siteSurvey.updatedAt.toISOString(),
      files: siteSurvey.images.map(image => ({
        name: image.title || 'Untitled',
        url: image.url,
        filetype: image.kind,
        description: image.description || undefined,
      })),
      buildings: siteSurvey.buildings || [],
      voipSurvey: siteSurvey.voipSurvey,
      cablingSurvey: siteSurvey.cablingSurvey,
    };

    // Generate Word document
    console.log('Starting Word document generation...');
    const wordBuffer = await generateSiteSurveyWordDocument(
      surveyData,
      companyDetails,
      equipment
    );
    console.log('Word document generated successfully, buffer size:', wordBuffer.length);

    // Generate safe filename
    const safeTitle = siteSurvey.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
    const filename = `Site-Survey-${safeTitle}-${siteSurvey.id.substring(0, 8)}.docx`;
    
    // Return the Word document
    return new NextResponse(new Uint8Array(wordBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
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

// Helper function to extract equipment from buildings
async function extractEquipmentFromBuildings(buildings: any[]) {
  const items: any[] = [];
  const productIds: string[] = [];
  const serviceIds: string[] = [];
  
  // First pass: collect all equipment
  buildings.forEach(building => {
    if (building.centralRack) {
      if (building.centralRack.devices) {
        building.centralRack.devices.forEach((device: any) => {
          if (device.itemType === 'product' && device.equipmentId) {
            productIds.push(device.equipmentId);
            items.push({
              ...device,
              placement: `Building: ${building.name}, Central Rack: ${building.centralRack.name}`,
            });
          } else if (device.itemType === 'service' && device.equipmentId) {
            serviceIds.push(device.equipmentId);
            items.push({
              ...device,
              placement: `Building: ${building.name}, Central Rack: ${building.centralRack.name}`,
            });
          } else if (!device.itemType) {
            // Regular device (not equipment)
            items.push({
              name: device.name,
              type: device.type,
              brand: device.brand,
              model: device.model,
              quantity: device.quantity || 1,
              notes: device.notes,
              placement: `Building: ${building.name}, Central Rack: ${building.centralRack.name}`,
            });
          }
        });
      }
    }
    if (building.floors) {
      building.floors.forEach((floor: any) => {
        if (floor.rooms) {
          floor.rooms.forEach((room: any) => {
            if (room.devices) {
              room.devices.forEach((device: any) => {
                if (device.itemType === 'product' && device.equipmentId) {
                  productIds.push(device.equipmentId);
                  items.push({
                    ...device,
                    placement: `Building: ${building.name}, Floor: ${floor.name}, Room: ${room.name}`,
                  });
                } else if (device.itemType === 'service' && device.equipmentId) {
                  serviceIds.push(device.equipmentId);
                  items.push({
                    ...device,
                    placement: `Building: ${building.name}, Floor: ${floor.name}, Room: ${room.name}`,
                  });
                } else if (!device.itemType) {
                  items.push({
                    name: device.name,
                    type: device.type,
                    brand: device.brand,
                    model: device.model,
                    quantity: device.quantity || 1,
                    notes: device.notes,
                    placement: `Building: ${building.name}, Floor: ${floor.name}, Room: ${room.name}`,
                  });
                }
              });
            }
          });
        }
        if (floor.floorRacks) {
          floor.floorRacks.forEach((rack: any) => {
            if (rack.devices) {
              rack.devices.forEach((device: any) => {
                if (device.itemType === 'product' && device.equipmentId) {
                  productIds.push(device.equipmentId);
                  items.push({
                    ...device,
                    placement: `Building: ${building.name}, Floor: ${floor.name}, Floor Rack: ${rack.name}`,
                  });
                } else if (device.itemType === 'service' && device.equipmentId) {
                  serviceIds.push(device.equipmentId);
                  items.push({
                    ...device,
                    placement: `Building: ${building.name}, Floor: ${floor.name}, Floor Rack: ${rack.name}`,
                  });
                } else if (!device.itemType) {
                  items.push({
                    name: device.name,
                    type: device.type,
                    brand: device.brand,
                    model: device.model,
                    quantity: device.quantity || 1,
                    notes: device.notes,
                    placement: `Building: ${building.name}, Floor: ${floor.name}, Floor Rack: ${rack.name}`,
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  // Second pass: fetch full product/service details from database
  const productsMap = new Map();
  const servicesMap = new Map();

  // Fetch products with all details
  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        brand: true,
        category: true,
        manufacturer: true,
        unit: true,
        images: true,
        specifications: true,
      },
    });
    
    products.forEach(product => {
      productsMap.set(product.id, product);
    });
  }

  // Fetch services with all details
  if (serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      include: {
        brand: true,
        translations: true,
      },
    });
    
    services.forEach(service => {
      servicesMap.set(service.id, service);
    });
  }

  // Third pass: enrich items with full details
  return items.map(item => {
    if (item.itemType === 'product' && item.equipmentId) {
      const product = productsMap.get(item.equipmentId);
      if (product) {
        return {
          ...item,
          name: product.name,
          brand: product.brand?.name,
          category: product.category?.name,
          model: product.code,
          price: product.price,
          unit: product.unit?.name,
          description: product.description,
          images: product.images?.map((img: any) => ({
            url: img.url,
            alt: img.alt,
          })),
          specifications: product.specifications?.map((spec: any) => ({
            name: spec.name,
            value: spec.value,
          })),
        };
      }
    } else if (item.itemType === 'service' && item.equipmentId) {
      const service = servicesMap.get(item.equipmentId);
      if (service) {
        // Get description from translations (default to first available)
        const description = service.translations?.[0]?.description || null;
        
        return {
          ...item,
          name: service.name,
          category: service.mtrcategory || service.serviceCategoryCode,
          description: description,
        };
      }
    }
    return item;
  });
}

// Keep GET method for backward compatibility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Call POST method with empty body
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ equipment: [] }),
  });
  
  return POST(postRequest, { params });
}
