import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { saveCablingData } from "./save-helper";

const saveCablingSurveySchema = z.object({
  buildings: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    code: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
    centralRack: z.object({
      id: z.string().optional(),
      name: z.string(),
      code: z.string().optional().nullable(),
      units: z.number().optional().nullable(),
      location: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      images: z.array(z.string()).optional(),
      cableTerminations: z.array(z.object({
        type: z.string(),
        count: z.number(),
      })).optional(),
      fiberTerminations: z.array(z.object({
        type: z.string(),
        totalStrands: z.number(),
        terminatedStrands: z.number(),
      })).optional(),
      devices: z.array(z.object({
        id: z.string().optional(),
        type: z.string(),
        name: z.string(),
        brand: z.string().optional().nullable(),
        model: z.string().optional().nullable(),
        ipAddress: z.string().optional().nullable(),
        phoneNumber: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })).optional(),
    }).optional(),
    floors: z.array(z.object({
      id: z.string().optional(),
      name: z.string(),
      level: z.number().optional().nullable(),
      blueprintUrl: z.string().optional().nullable(),
      similarToFloorId: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      images: z.array(z.string()).optional(),
      expanded: z.boolean().optional(),
      floorRacks: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        code: z.string().optional().nullable(),
        units: z.number().optional().nullable(),
        location: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        images: z.array(z.string()).optional(),
        cableTerminations: z.array(z.object({
          type: z.string(),
          count: z.number(),
        })).optional(),
        fiberTerminations: z.array(z.object({
          type: z.string(),
          totalStrands: z.number(),
          terminatedStrands: z.number(),
        })).optional(),
        devices: z.array(z.object({
          id: z.string().optional(),
          type: z.string(),
          name: z.string(),
          brand: z.string().optional().nullable(),
          model: z.string().optional().nullable(),
          ipAddress: z.string().optional().nullable(),
          phoneNumber: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
        })).optional(),
      })).optional(),
      rooms: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        number: z.string().optional().nullable(),
        type: z.string(),
        connectionType: z.string(),
        floorPlanUrl: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        outlets: z.number(),
        images: z.array(z.string()).optional(),
        devices: z.array(z.object({
          id: z.string().optional(),
          type: z.string(),
          name: z.string(),
          brand: z.string().optional().nullable(),
          model: z.string().optional().nullable(),
          ipAddress: z.string().optional().nullable(),
          phoneNumber: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
        })).optional(),
      })),
    })),
  })),
  buildingConnections: z.array(z.object({
    id: z.string(),
    fromBuilding: z.number(),
    toBuilding: z.number(),
    connectionType: z.string(),
    description: z.string().optional().nullable(),
    distance: z.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cablingSurvey = await prisma.cablingSurvey.findUnique({
      where: { siteSurveyId: id },
      include: {
        siteSurvey: {
          include: {
            customer: true,
            contact: true,
            assignFrom: true,
            assignTo: true,
            buildings: {
              include: {
                centralRack: {
                  include: {
                    devices: {
                      include: {
                        ports: true,
                      },
                    },
                    images: true,
                  },
                },
            floors: {
              include: {
                floorRacks: {
                  include: {
                    devices: {
                      include: {
                        ports: true,
                      },
                    },
                    images: true,
                  },
                },
                rooms: {
                      include: {
                        outlets: {
                          include: {
                            portPorts: true,
                          },
                        },
                        images: true,
                      },
                    },
                    images: true,
                  },
                },
                images: true,
              },
            },
            pathways: true,
            cableRuns: {
              include: {
                terminations: {
                  include: {
                    port: true,
                  },
                },
                tests: true,
                images: true,
              },
            },
            images: true,
          },
        },
      },
    });

    if (!cablingSurvey) {
      return NextResponse.json({ error: "Cabling survey not found" }, { status: 404 });
    }

    // Parse the JSON data from generalNotes field
    let buildings = [];
    if (cablingSurvey.generalNotes) {
      try {
        buildings = JSON.parse(cablingSurvey.generalNotes);
        console.log("Parsed buildings from generalNotes:", buildings);
        console.log("Number of buildings:", buildings.length);
      } catch (e) {
        console.error("Error parsing cabling survey generalNotes:", e);
      }
    } else {
      console.log("No generalNotes found in cabling survey");
    }

    // Parse building connections
    let buildingConnections = [];
    if (cablingSurvey.buildingConnections) {
      try {
        buildingConnections = JSON.parse(cablingSurvey.buildingConnections);
      } catch (e) {
        console.error("Error parsing building connections:", e);
      }
    }

    return NextResponse.json({
      ...cablingSurvey,
      siteSurvey: {
        ...cablingSurvey.siteSurvey,
        buildings: buildings,
      },
      buildingConnections: buildingConnections,
    });
  } catch (error) {
    console.error("Error fetching cabling survey:", error);
    return NextResponse.json(
      { error: "Failed to fetch cabling survey" },
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
    
    console.log("Received save request for survey:", id);
    console.log("Data:", JSON.stringify(body, null, 2));
    
    // Validate the request body
    const validatedData = saveCablingSurveySchema.parse(body);
    
    // Save all the data using the helper function
    await saveCablingData(id, validatedData.buildings, validatedData.buildingConnections || []);
    
    console.log("Cabling survey saved successfully");

    return NextResponse.json({ 
      success: true, 
      message: "Cabling survey saved successfully" 
    });
  } catch (error: any) {
    console.error("Error saving cabling survey:", error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to save cabling survey" },
      { status: 500 }
    );
  }
}