import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { proposedInfrastructure, equipment } = body;

    console.log('Saving equipment for site survey:', id);
    console.log('Proposed Infrastructure:', proposedInfrastructure);
    console.log('Equipment:', equipment);

    // Verify site survey exists
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Delete existing proposed infrastructure for this site survey
    await prisma.proposedProductAssociation.deleteMany({
      where: { siteSurveyId: id },
    });
    
    await prisma.proposedOutlet.deleteMany({
      where: {
        proposedRoom: {
          siteSurveyId: id,
        },
      },
    });

    await prisma.proposedRoom.deleteMany({
      where: { siteSurveyId: id },
    });

    await prisma.proposedFloorRack.deleteMany({
      where: { siteSurveyId: id },
    });

    await prisma.proposedCentralRack.deleteMany({
      where: { siteSurveyId: id },
    });

    await prisma.proposedConnection.deleteMany({
      where: { siteSurveyId: id },
    });

    // Save proposed central racks
    if (proposedInfrastructure?.proposedCentralRacks?.length > 0) {
      for (const rack of proposedInfrastructure.proposedCentralRacks) {
        const createdRack = await prisma.proposedCentralRack.create({
          data: {
            siteSurveyId: id,
            buildingId: rack.buildingId,
            name: rack.name,
            code: rack.code,
            units: rack.units,
            location: rack.location,
            notes: rack.notes,
          },
        });

        // Save associated products/services
        if (rack.associatedProducts?.length > 0) {
          for (const product of rack.associatedProducts) {
            await prisma.proposedProductAssociation.create({
              data: {
                siteSurveyId: id,
                productId: product.itemId,
                quantity: product.quantity,
                price: product.price || 0,
                margin: product.margin || 0,
                notes: product.notes,
                proposedCentralRackId: createdRack.id,
              },
            });
          }
        }
      }
    }

    // Save proposed floor racks
    if (proposedInfrastructure?.proposedFloorRacks?.length > 0) {
      for (const rack of proposedInfrastructure.proposedFloorRacks) {
        const createdRack = await prisma.proposedFloorRack.create({
          data: {
            siteSurveyId: id,
            floorId: rack.floorId,
            name: rack.name,
            code: rack.code,
            units: rack.units,
            location: rack.location,
            notes: rack.notes,
          },
        });

        // Save associated products/services
        if (rack.associatedProducts?.length > 0) {
          for (const product of rack.associatedProducts) {
            await prisma.proposedProductAssociation.create({
              data: {
                siteSurveyId: id,
                productId: product.itemId,
                quantity: product.quantity,
                price: product.price || 0,
                margin: product.margin || 0,
                notes: product.notes,
                proposedFloorRackId: createdRack.id,
              },
            });
          }
        }
      }
    }

    // Save proposed rooms
    if (proposedInfrastructure?.proposedRooms?.length > 0) {
      for (const room of proposedInfrastructure.proposedRooms) {
        const createdRoom = await prisma.proposedRoom.create({
          data: {
            siteSurveyId: id,
            floorId: room.floorId,
            name: room.name,
            type: room.type,
            connectionType: room.connectionType,
            isTypicalRoom: room.isTypicalRoom || false,
            identicalRoomsCount: room.identicalRoomsCount,
            notes: room.notes,
          },
        });

        // Save outlets
        if (room.proposedOutlets?.length > 0) {
          for (const outlet of room.proposedOutlets) {
            await prisma.proposedOutlet.create({
              data: {
                proposedRoomId: createdRoom.id,
                name: outlet.name,
                type: outlet.type,
                quantity: outlet.quantity || 1,
                notes: outlet.notes,
              },
            });
          }
        }

        // Save associated products/services
        if (room.associatedProducts?.length > 0) {
          for (const product of room.associatedProducts) {
            await prisma.proposedProductAssociation.create({
              data: {
                siteSurveyId: id,
                productId: product.itemId,
                quantity: product.quantity,
                price: product.price || 0,
                margin: product.margin || 0,
                notes: product.notes,
                proposedRoomId: createdRoom.id,
              },
            });
          }
        }
      }
    }

    // Save proposed connections
    if (proposedInfrastructure?.proposedConnections?.length > 0) {
      for (const connection of proposedInfrastructure.proposedConnections) {
        const createdConnection = await prisma.proposedConnection.create({
          data: {
            siteSurveyId: id,
            fromBuildingId: connection.fromBuildingId,
            toBuildingId: connection.toBuildingId,
            connectionType: connection.connectionType,
            description: connection.description,
            distance: connection.distance,
            notes: connection.notes,
          },
        });

        // Save associated products/services
        if (connection.associatedProducts?.length > 0) {
          for (const product of connection.associatedProducts) {
            await prisma.proposedProductAssociation.create({
              data: {
                siteSurveyId: id,
                productId: product.itemId,
                quantity: product.quantity,
                price: product.price || 0,
                margin: product.margin || 0,
                notes: product.notes,
                proposedConnectionId: createdConnection.id,
              },
            });
          }
        }
      }
    }

    // Save standalone equipment (not associated with proposed infrastructure)
    if (equipment?.length > 0) {
      for (const item of equipment) {
        // Only save if it's a product or service and has an itemId
        if ((item.type === 'product' || item.type === 'service') && item.itemId) {
          await prisma.proposedProductAssociation.create({
            data: {
              siteSurveyId: id,
              productId: item.itemId,
              quantity: item.quantity,
              price: item.price || 0,
              margin: item.margin || 0,
              notes: item.notes,
              // Don't associate with any specific infrastructure element
            },
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Equipment and proposed infrastructure saved successfully' 
    });

  } catch (error) {
    console.error('Error saving equipment:', error);
    return NextResponse.json(
      { error: 'Failed to save equipment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to load saved equipment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch all proposed infrastructure
    const [proposedCentralRacks, proposedFloorRacks, proposedRooms, proposedConnections, standaloneEquipment] = await Promise.all([
      prisma.proposedCentralRack.findMany({
        where: { siteSurveyId: id },
        include: {
          building: true,
          associations: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                  unit: true,
                },
              },
            },
          },
        },
      }),
      prisma.proposedFloorRack.findMany({
        where: { siteSurveyId: id },
        include: {
          floor: {
            include: {
              building: true,
            },
          },
          associations: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                  unit: true,
                },
              },
            },
          },
        },
      }),
      prisma.proposedRoom.findMany({
        where: { siteSurveyId: id },
        include: {
          floor: {
            include: {
              building: true,
            },
          },
          outlets: true,
          associations: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                  unit: true,
                },
              },
            },
          },
        },
      }),
      prisma.proposedConnection.findMany({
        where: { siteSurveyId: id },
        include: {
          fromBuilding: true,
          toBuilding: true,
          associations: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                  unit: true,
                },
              },
            },
          },
        },
      }),
      prisma.proposedProductAssociation.findMany({
        where: {
          siteSurveyId: id,
          proposedCentralRackId: null,
          proposedFloorRackId: null,
          proposedRoomId: null,
          proposedOutletId: null,
          proposedConnectionId: null,
        },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              unit: true,
            },
          },
        },
      }),
    ]);

    // Transform data to match frontend format
    const equipment = standaloneEquipment.map(assoc => ({
      id: `product-${assoc.productId}-${assoc.id}`,
      type: 'product',
      itemId: assoc.productId,
      name: assoc.product.name,
      brand: assoc.product.brand?.name,
      category: assoc.product.category?.name,
      unit: assoc.product.unit?.name || 'Each',
      quantity: assoc.quantity,
      price: parseFloat(assoc.price.toString()),
      margin: parseFloat(assoc.margin.toString()),
      totalPrice: parseFloat(assoc.price.toString()) * assoc.quantity * (1 + parseFloat(assoc.margin.toString()) / 100),
      notes: assoc.notes,
    }));

    const proposedInfrastructure = {
      proposedCentralRacks: proposedCentralRacks.map(rack => ({
        id: rack.id,
        buildingId: rack.buildingId,
        name: rack.name,
        code: rack.code,
        units: rack.units,
        location: rack.location,
        notes: rack.notes,
        associatedProducts: rack.associations.map(assoc => ({
          id: `product-${assoc.productId}-${assoc.id}`,
          type: 'product',
          itemId: assoc.productId,
          name: assoc.product.name,
          brand: assoc.product.brand?.name,
          category: assoc.product.category?.name,
          unit: assoc.product.unit?.name || 'Each',
          quantity: assoc.quantity,
          price: parseFloat(assoc.price.toString()),
          margin: parseFloat(assoc.margin.toString()),
          totalPrice: parseFloat(assoc.price.toString()) * assoc.quantity * (1 + parseFloat(assoc.margin.toString()) / 100),
          notes: assoc.notes,
        })),
      })),
      proposedFloorRacks: proposedFloorRacks.map(rack => ({
        id: rack.id,
        floorId: rack.floorId,
        name: rack.name,
        code: rack.code,
        units: rack.units,
        location: rack.location,
        notes: rack.notes,
        associatedProducts: rack.associations.map(assoc => ({
          id: `product-${assoc.productId}-${assoc.id}`,
          type: 'product',
          itemId: assoc.productId,
          name: assoc.product.name,
          brand: assoc.product.brand?.name,
          category: assoc.product.category?.name,
          unit: assoc.product.unit?.name || 'Each',
          quantity: assoc.quantity,
          price: parseFloat(assoc.price.toString()),
          margin: parseFloat(assoc.margin.toString()),
          totalPrice: parseFloat(assoc.price.toString()) * assoc.quantity * (1 + parseFloat(assoc.margin.toString()) / 100),
          notes: assoc.notes,
        })),
      })),
      proposedRooms: proposedRooms.map(room => ({
        id: room.id,
        floorId: room.floorId,
        name: room.name,
        type: room.type,
        connectionType: room.connectionType,
        isTypicalRoom: room.isTypicalRoom,
        identicalRoomsCount: room.identicalRoomsCount,
        notes: room.notes,
        proposedOutlets: room.outlets.map(outlet => ({
          id: outlet.id,
          name: outlet.name,
          type: outlet.type,
          quantity: outlet.quantity,
          notes: outlet.notes,
        })),
        associatedProducts: room.associations.map(assoc => ({
          id: `product-${assoc.productId}-${assoc.id}`,
          type: 'product',
          itemId: assoc.productId,
          name: assoc.product.name,
          brand: assoc.product.brand?.name,
          category: assoc.product.category?.name,
          unit: assoc.product.unit?.name || 'Each',
          quantity: assoc.quantity,
          price: parseFloat(assoc.price.toString()),
          margin: parseFloat(assoc.margin.toString()),
          totalPrice: parseFloat(assoc.price.toString()) * assoc.quantity * (1 + parseFloat(assoc.margin.toString()) / 100),
          notes: assoc.notes,
        })),
      })),
      proposedConnections: proposedConnections.map(conn => ({
        id: conn.id,
        fromBuildingId: conn.fromBuildingId,
        toBuildingId: conn.toBuildingId,
        connectionType: conn.connectionType,
        description: conn.description,
        distance: conn.distance ? parseFloat(conn.distance.toString()) : null,
        notes: conn.notes,
        associatedProducts: conn.associations.map(assoc => ({
          id: `product-${assoc.productId}-${assoc.id}`,
          type: 'product',
          itemId: assoc.productId,
          name: assoc.product.name,
          brand: assoc.product.brand?.name,
          category: assoc.product.category?.name,
          unit: assoc.product.unit?.name || 'Each',
          quantity: assoc.quantity,
          price: parseFloat(assoc.price.toString()),
          margin: parseFloat(assoc.margin.toString()),
          totalPrice: parseFloat(assoc.price.toString()) * assoc.quantity * (1 + parseFloat(assoc.margin.toString()) / 100),
          notes: assoc.notes,
        })),
      })),
    };

    return NextResponse.json({
      equipment,
      proposedInfrastructure,
    });

  } catch (error) {
    console.error('Error loading equipment:', error);
    return NextResponse.json(
      { error: 'Failed to load equipment' },
      { status: 500 }
    );
  }
}

