import { prisma } from "@/lib/db/prisma";

export async function saveCablingData(siteSurveyId: string, buildings: any[], buildingConnections: any[] = []) {
  // Ensure cabling survey exists
  await prisma.cablingSurvey.upsert({
    where: { siteSurveyId },
    update: {},
    create: { siteSurveyId },
  });

  // Process each building
  for (const buildingData of buildings) {
    const building = await prisma.building.upsert({
      where: { 
        siteSurveyId_name: { 
          siteSurveyId, 
          name: buildingData.name 
        } 
      },
      update: {
        code: buildingData.code,
        address: buildingData.address,
        notes: buildingData.notes,
      },
      create: {
        siteSurveyId,
        name: buildingData.name,
        code: buildingData.code,
        address: buildingData.address,
        notes: buildingData.notes,
      },
    });

    // Save building images
    if (buildingData.images && buildingData.images.length > 0) {
      // Delete old images
      await prisma.imageAsset.deleteMany({
        where: { buildingId: building.id },
      });
      
      // Create new images
      for (const imageUrl of buildingData.images) {
        await prisma.imageAsset.create({
          data: {
            kind: "PHOTO",
            url: imageUrl,
            buildingId: building.id,
          },
        });
      }
    }

    // Process central rack
    if (buildingData.centralRack) {
      const centralRack = await prisma.centralRack.upsert({
        where: { buildingId: building.id },
        update: {
          name: buildingData.centralRack.name,
          code: buildingData.centralRack.code,
          units: buildingData.centralRack.units,
          location: buildingData.centralRack.location,
          notes: buildingData.centralRack.notes,
          cableTerminations: buildingData.centralRack.cableTerminations || [],
          fiberTerminations: buildingData.centralRack.fiberTerminations || [],
        },
        create: {
          buildingId: building.id,
          name: buildingData.centralRack.name,
          code: buildingData.centralRack.code,
          units: buildingData.centralRack.units,
          location: buildingData.centralRack.location,
          notes: buildingData.centralRack.notes,
          cableTerminations: buildingData.centralRack.cableTerminations || [],
          fiberTerminations: buildingData.centralRack.fiberTerminations || [],
        },
      });

      // Save central rack images
      if (buildingData.centralRack.images && buildingData.centralRack.images.length > 0) {
        await prisma.imageAsset.deleteMany({
          where: { centralRackId: centralRack.id },
        });
        
        for (const imageUrl of buildingData.centralRack.images) {
          await prisma.imageAsset.create({
            data: {
              kind: "PHOTO",
              url: imageUrl,
              centralRackId: centralRack.id,
            },
          });
        }
      }

      // Save central rack devices
      if (buildingData.centralRack.devices && buildingData.centralRack.devices.length > 0) {
        await prisma.device.deleteMany({
          where: { centralRackId: centralRack.id },
        });
        
        for (const deviceData of buildingData.centralRack.devices) {
          await prisma.device.create({
            data: {
              type: deviceData.type as any,
              vendor: deviceData.brand,
              model: deviceData.model,
              label: deviceData.name,
              mgmtIp: deviceData.ipAddress,
              notes: deviceData.phoneNumber ? `Phone: ${deviceData.phoneNumber}` : deviceData.notes,
              centralRackId: centralRack.id,
            },
          });
        }
      }
    }

    // Process floors
    for (const floorData of buildingData.floors) {
      const floor = await prisma.floor.upsert({
        where: { 
          buildingId_name: { 
            buildingId: building.id, 
            name: floorData.name 
          } 
        },
        update: {
          level: floorData.level,
          blueprintUrl: floorData.blueprintUrl,
          similarToFloorId: floorData.similarToFloorId,
          notes: floorData.notes,
        },
        create: {
          buildingId: building.id,
          name: floorData.name,
          level: floorData.level,
          blueprintUrl: floorData.blueprintUrl,
          similarToFloorId: floorData.similarToFloorId,
          notes: floorData.notes,
        },
      });

      // Save floor images
      if (floorData.images && floorData.images.length > 0) {
        await prisma.imageAsset.deleteMany({
          where: { floorId: floor.id },
        });
        
        for (const imageUrl of floorData.images) {
          await prisma.imageAsset.create({
            data: {
              kind: "PHOTO",
              url: imageUrl,
              floorId: floor.id,
            },
          });
        }
      }

      // Process floor racks (multiple per floor)
      if (floorData.floorRacks && floorData.floorRacks.length > 0) {
        // Delete old floor racks for this floor
        await prisma.floorRack.deleteMany({
          where: { floorId: floor.id },
        });
        
        for (const rackData of floorData.floorRacks) {
          const floorRack = await prisma.floorRack.create({
            data: {
              floorId: floor.id,
              name: rackData.name,
              code: rackData.code,
              units: rackData.units,
              location: rackData.location,
              notes: rackData.notes,
              cableTerminations: rackData.cableTerminations || [],
              fiberTerminations: rackData.fiberTerminations || [],
            },
          });

          // Save floor rack images
          if (rackData.images && rackData.images.length > 0) {
            for (const imageUrl of rackData.images) {
              await prisma.imageAsset.create({
                data: {
                  kind: "PHOTO",
                  url: imageUrl,
                  floorRackId: floorRack.id,
                },
              });
            }
          }

          // Save floor rack devices
          if (rackData.devices && rackData.devices.length > 0) {
            for (const deviceData of rackData.devices) {
              await prisma.device.create({
                data: {
                  type: deviceData.type as any,
                  vendor: deviceData.brand,
                  model: deviceData.model,
                  label: deviceData.name,
                  mgmtIp: deviceData.ipAddress,
                  notes: deviceData.phoneNumber ? `Phone: ${deviceData.phoneNumber}` : deviceData.notes,
                  floorRackId: floorRack.id,
                },
              });
            }
          }
        }
      }

      // Process rooms
      for (const roomData of floorData.rooms) {
        const room = await prisma.room.upsert({
          where: { 
            floorId_name: { 
              floorId: floor.id, 
              name: roomData.name 
            } 
          },
          update: {
            number: roomData.number,
            type: roomData.type as any,
            connectionType: roomData.connectionType as any,
            floorPlanUrl: roomData.floorPlanUrl,
            notes: roomData.notes,
          },
          create: {
            floorId: floor.id,
            name: roomData.name,
            number: roomData.number,
            type: roomData.type as any,
            connectionType: roomData.connectionType as any,
            floorPlanUrl: roomData.floorPlanUrl,
            notes: roomData.notes,
          },
        });

        // Save room images
        if (roomData.images && roomData.images.length > 0) {
          await prisma.imageAsset.deleteMany({
            where: { roomId: room.id },
          });
          
          for (const imageUrl of roomData.images) {
            await prisma.imageAsset.create({
              data: {
                kind: "PHOTO",
                url: imageUrl,
                roomId: room.id,
              },
            });
          }
        }

        // Note: Room devices are stored in JSON format within the Room table
        // The Device model only supports devices attached to CentralRack or FloorRack
        // Room-level devices are handled differently and don't create Device records
      }
    }
  }

  // Save buildings and building connections to cabling survey
  console.log("Saving buildings to generalNotes:", buildings);
  console.log("Number of buildings to save:", buildings.length);
  console.log("Building connections to save:", buildingConnections);
  
  await prisma.cablingSurvey.update({
    where: { siteSurveyId },
    data: {
      generalNotes: JSON.stringify(buildings),
      buildingConnections: buildingConnections.length > 0 ? JSON.stringify(buildingConnections) : null,
    },
  });
  
  console.log("Buildings saved successfully to generalNotes");
}

