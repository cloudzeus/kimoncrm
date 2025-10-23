// @ts-nocheck
import ExcelJS from 'exceljs';
import { BuildingData } from '@/components/site-surveys/comprehensive-infrastructure-wizard';

export async function generateBuildingExcelReport(building: BuildingData) {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'KimonCRM';
  workbook.lastModifiedBy = 'KimonCRM';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  // Create styles
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' }, size: 14 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E86AB' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    border: {
      top: { style: 'thin' as const, color: { argb: '000000' } },
      left: { style: 'thin' as const, color: { argb: '000000' } },
      bottom: { style: 'thin' as const, color: { argb: '000000' } },
      right: { style: 'thin' as const, color: { argb: '000000' } }
    }
  };

  const subHeaderStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A23B72' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    border: {
      top: { style: 'thin' as const, color: { argb: '000000' } },
      left: { style: 'thin' as const, color: { argb: '000000' } },
      bottom: { style: 'thin' as const, color: { argb: '000000' } },
      right: { style: 'thin' as const, color: { argb: '000000' } }
    }
  };

  const dataStyle = {
    font: { size: 11 },
    border: {
      top: { style: 'thin' as const, color: { argb: 'CCCCCC' } },
      left: { style: 'thin' as const, color: { argb: 'CCCCCC' } },
      bottom: { style: 'thin' as const, color: { argb: 'CCCCCC' } },
      right: { style: 'thin' as const, color: { argb: 'CCCCCC' } }
    },
    alignment: { vertical: 'middle' as const }
  };

  const alternateRowStyle = {
    ...dataStyle,
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } }
  };

  // Helper function to collect all products and services
  const collectProductsAndServices = () => {
    const products = new Map();
    const services = new Map();
    const proposedDevices: any[] = [];

    // Process central rack
    if (building.centralRack) {
      // Cable terminations
      building.centralRack.cableTerminations?.forEach(term => {
        if (term.isFutureProposal && term.productId) {
          const productKey = term.productId;
          if (!products.has(productKey)) {
            products.set(productKey, {
              id: term.productId,
              name: term.productId, // Will be replaced with actual product name
              quantity: 0,
              type: 'Cable Termination',
              location: 'Central Rack'
            });
          }
          products.get(productKey).quantity += term.quantity || 1;
        }
        
        // Services
        term.services?.forEach(svc => {
          const serviceKey = svc.serviceId;
          if (!services.has(serviceKey)) {
            services.set(serviceKey, {
              id: svc.serviceId,
              name: svc.serviceId, // Will be replaced with actual service name
              quantity: 0,
              type: 'Cable Termination Service',
              location: 'Central Rack'
            });
          }
          services.get(serviceKey).quantity += svc.quantity;
        });
      });

      // Switches
      building.centralRack.switches?.forEach(sw => {
        if (sw.isFutureProposal) {
          proposedDevices.push({
            type: 'Switch',
            brand: sw.brand || '',
            model: sw.model || '',
            location: 'Central Rack',
            quantity: 1,
            productId: sw.productId,
            services: sw.services || []
          });
        }
      });

      // Routers
      building.centralRack.routers?.forEach(router => {
        if (router.isFutureProposal) {
          proposedDevices.push({
            type: 'Router',
            brand: router.brand || '',
            model: router.model || '',
            location: 'Central Rack',
            quantity: 1,
            productId: router.productId,
            services: router.services || []
          });
        }
      });

      // Servers
      building.centralRack.servers?.forEach(server => {
        if (server.isFutureProposal) {
          proposedDevices.push({
            type: 'Server',
            brand: server.brand || '',
            model: server.model || '',
            location: 'Central Rack',
            quantity: 1,
            productId: server.productId,
            services: server.services || []
          });
        }
      });
    }

    // Process floors
    building.floors.forEach(floor => {
      floor.racks?.forEach(rack => {
        // Floor rack terminations
        rack.cableTerminations?.forEach(term => {
          if (term.isFutureProposal && term.productId) {
            const productKey = term.productId;
            if (!products.has(productKey)) {
              products.set(productKey, {
                id: term.productId,
                name: term.productId,
                quantity: 0,
                type: 'Cable Termination',
                location: `${floor.name} - ${rack.name}`
              });
            }
            products.get(productKey).quantity += term.quantity || 1;
          }
          
          // Services
          term.services?.forEach(svc => {
            const serviceKey = svc.serviceId;
            if (!services.has(serviceKey)) {
              services.set(serviceKey, {
                id: svc.serviceId,
                name: svc.serviceId,
                quantity: 0,
                type: 'Cable Termination Service',
                location: `${floor.name} - ${rack.name}`
              });
            }
            services.get(serviceKey).quantity += svc.quantity;
          });
        });

        // Floor rack switches
        rack.switches?.forEach(sw => {
          if (sw.isFutureProposal) {
            proposedDevices.push({
              type: 'Switch',
              brand: sw.brand || '',
              model: sw.model || '',
              location: `${floor.name} - ${rack.name}`,
              quantity: 1,
              productId: sw.productId,
              services: sw.services || []
            });
          }
        });

        // Floor rack routers
        rack.routers?.forEach(router => {
          if (router.isFutureProposal) {
            proposedDevices.push({
              type: 'Router',
              brand: router.brand || '',
              model: router.model || '',
              location: `${floor.name} - ${rack.name}`,
              quantity: 1,
              productId: router.productId,
              services: router.services || []
            });
          }
        });
      });

      // Process rooms
      floor.rooms.forEach(room => {
        room.devices?.forEach(device => {
          if (device.isFutureProposal) {
            proposedDevices.push({
              type: device.type,
              brand: device.brand || '',
              model: device.model || '',
              location: `${floor.name} - ${room.name}`,
              quantity: device.quantity || 1,
              productId: device.productId,
              services: device.services || []
            });
          }
        });

        room.outlets?.forEach(outlet => {
          if (outlet.isFutureProposal) {
            proposedDevices.push({
              type: 'Outlet',
              brand: outlet.brand || '',
              model: outlet.model || '',
              location: `${floor.name} - ${room.name}`,
              quantity: outlet.quantity || 1,
              productId: outlet.productId,
              services: outlet.services || []
            });
          }
        });
      });
    });

    return {
      products: Array.from(products.values()),
      services: Array.from(services.values()),
      proposedDevices
    };
  };

  const { products, services, proposedDevices } = collectProductsAndServices();

  // TAB 1: CURRENT INFRASTRUCTURE
  const currentInfraSheet = workbook.addWorksheet('1. Current Infrastructure');
  
  currentInfraSheet.addRow(['CURRENT INFRASTRUCTURE REPORT']);
  currentInfraSheet.mergeCells('A1:H1');
  currentInfraSheet.getCell('A1').style = headerStyle;

  let currentRow = 3;

  // Building Overview
  currentInfraSheet.addRow(['BUILDING OVERVIEW']);
  currentInfraSheet.mergeCells(`A${currentRow}:H${currentRow}`);
  currentInfraSheet.getCell(`A${currentRow}`).style = subHeaderStyle;
  currentRow++;

  currentInfraSheet.addRow(['Building Name', building.name]);
  currentInfraSheet.addRow(['Total Floors', building.floors.length]);
  currentInfraSheet.addRow(['Has Central Rack', building.centralRack ? 'Yes' : 'No']);
  currentRow += 4;

  // Central Rack (if exists)
  if (building.centralRack) {
    currentInfraSheet.addRow(['CENTRAL RACK']);
    currentInfraSheet.mergeCells(`A${currentRow}:H${currentRow}`);
    currentInfraSheet.getCell(`A${currentRow}`).style = subHeaderStyle;
    currentRow++;

    currentInfraSheet.addRow(['Component', 'Brand', 'Model', 'Quantity', 'Type', 'Status', 'Notes', 'Location']);
    currentInfraSheet.getRow(currentRow).style = dataStyle;
    currentRow++;

    // Cable Terminations (OLD only)
    building.centralRack.cableTerminations?.forEach(term => {
      if (!term.isFutureProposal) {
        currentInfraSheet.addRow([
          'Cable Termination',
          term.cableType,
          '',
          term.quantity || 1,
          term.cableType,
          'Existing',
          term.notes || '',
          'Central Rack'
        ]);
        currentInfraSheet.getRow(currentRow).style = dataStyle;
        currentRow++;
      }
    });

    // Switches (OLD only)
    building.centralRack.switches?.forEach(sw => {
      if (!sw.isFutureProposal) {
        currentInfraSheet.addRow([
          'Switch',
          sw.brand || '',
          sw.model || '',
          1,
          'Network Switch',
          'Existing',
          sw.notes || '',
          'Central Rack'
        ]);
        currentInfraSheet.getRow(currentRow).style = dataStyle;
        currentRow++;
      }
    });

    // Routers (OLD only)
    building.centralRack.routers?.forEach(router => {
      if (!router.isFutureProposal) {
        currentInfraSheet.addRow([
          'Router',
          router.brand || '',
          router.model || '',
          1,
          'Network Router',
          'Existing',
          router.notes || '',
          'Central Rack'
        ]);
        currentInfraSheet.getRow(currentRow).style = dataStyle;
        currentRow++;
      }
    });

    // Servers (OLD only)
    building.centralRack.servers?.forEach(server => {
      if (!server.isFutureProposal) {
        currentInfraSheet.addRow([
          'Server',
          server.brand || '',
          server.model || '',
          1,
          'Server',
          'Existing',
          server.notes || '',
          'Central Rack'
        ]);
        currentInfraSheet.getRow(currentRow).style = dataStyle;
        currentRow++;
      }
    });
  }

  // Floors
  building.floors.forEach(floor => {
    currentInfraSheet.addRow([`FLOOR: ${floor.name}`]);
    currentInfraSheet.mergeCells(`A${currentRow}:H${currentRow}`);
    currentInfraSheet.getCell(`A${currentRow}`).style = subHeaderStyle;
    currentRow++;

    // Floor Racks (OLD only)
    floor.racks?.forEach(rack => {
      if (!rack.isFutureProposal) {
        currentInfraSheet.addRow([
          'Floor Rack',
          rack.brand || '',
          rack.model || '',
          1,
          'Floor Rack',
          'Existing',
          rack.notes || '',
          `${floor.name} - ${rack.name}`
        ]);
        currentInfraSheet.getRow(currentRow).style = dataStyle;
        currentRow++;

        // Rack Components
        rack.cableTerminations?.forEach(term => {
          if (!term.isFutureProposal) {
            currentInfraSheet.addRow([
              'Cable Termination',
              term.cableType,
              '',
              term.quantity || 1,
              term.cableType,
              'Existing',
              term.notes || '',
              `${floor.name} - ${rack.name}`
            ]);
            currentInfraSheet.getRow(currentRow).style = dataStyle;
            currentRow++;
          }
        });

        rack.switches?.forEach(sw => {
          if (!sw.isFutureProposal) {
            currentInfraSheet.addRow([
              'Switch',
              sw.brand || '',
              sw.model || '',
              1,
              'Network Switch',
              'Existing',
              sw.notes || '',
              `${floor.name} - ${rack.name}`
            ]);
            currentInfraSheet.getRow(currentRow).style = dataStyle;
            currentRow++;
          }
        });
      }
    });

    // Rooms
    floor.rooms.forEach(room => {
      currentInfraSheet.addRow([
        'Room',
        '',
        '',
        1,
        room.type || 'Room',
        'Existing',
        room.notes || '',
        `${floor.name} - ${room.name}`
      ]);
      currentInfraSheet.getRow(currentRow).style = dataStyle;
      currentRow++;

      // Room Devices (OLD only)
      room.devices?.forEach(device => {
        if (!device.isFutureProposal) {
          currentInfraSheet.addRow([
            'Device',
            device.brand || '',
            device.model || '',
            device.quantity || 1,
            device.type,
            'Existing',
            device.notes || '',
            `${floor.name} - ${room.name}`
          ]);
          currentInfraSheet.getRow(currentRow).style = dataStyle;
          currentRow++;
        }
      });

      // Room Outlets (OLD only)
      room.outlets?.forEach(outlet => {
        if (!outlet.isFutureProposal) {
          currentInfraSheet.addRow([
            'Outlet',
            outlet.brand || '',
            outlet.model || '',
            outlet.quantity || 1,
            'Network Outlet',
            'Existing',
            outlet.notes || '',
            `${floor.name} - ${room.name}`
          ]);
          currentInfraSheet.getRow(currentRow).style = dataStyle;
          currentRow++;
        }
      });
    });
  });

  // TAB 2: PROPOSED NEW DEVICES
  const proposedSheet = workbook.addWorksheet('2. Proposed New Devices');
  
  proposedSheet.addRow(['PROPOSED NEW DEVICES & ASSOCIATED PRODUCTS']);
  proposedSheet.mergeCells('A1:H1');
  proposedSheet.getCell('A1').style = headerStyle;

  currentRow = 3;

  proposedSheet.addRow(['Device Type', 'Brand', 'Model', 'Quantity', 'Location', 'Associated Product', 'Associated Services', 'Notes']);
  proposedSheet.getRow(currentRow).style = dataStyle;
  currentRow++;

  proposedDevices.forEach(device => {
    const servicesList = device.services.map(svc => `${svc.serviceId} (×${svc.quantity})`).join(', ');
    
    proposedSheet.addRow([
      device.type,
      device.brand,
      device.model,
      device.quantity,
      device.location,
      device.productId || '',
      servicesList,
      ''
    ]);
    proposedSheet.getRow(currentRow).style = dataStyle;
    currentRow++;
  });

  // TAB 3: PRICING
  const pricingSheet = workbook.addWorksheet('3. Pricing');
  
  pricingSheet.addRow(['PRODUCTS & SERVICES PRICING']);
  pricingSheet.mergeCells('A1:F1');
  pricingSheet.getCell('A1').style = headerStyle;

  currentRow = 3;

  // Products Pricing
  pricingSheet.addRow(['PRODUCTS PRICING']);
  pricingSheet.mergeCells(`A${currentRow}:F${currentRow}`);
  pricingSheet.getCell(`A${currentRow}`).style = subHeaderStyle;
  currentRow++;

  pricingSheet.addRow(['Product ID', 'Product Name', 'Quantity', 'Unit Price', 'Total Price', 'Notes']);
  pricingSheet.getRow(currentRow).style = dataStyle;
  currentRow++;

  products.forEach(product => {
    pricingSheet.addRow([
      product.id,
      product.name,
      product.quantity,
      '', // Unit price - to be filled manually
      '', // Total price - to be calculated
      ''
    ]);
    pricingSheet.getRow(currentRow).style = dataStyle;
    currentRow++;
  });

  currentRow++;

  // Services Pricing
  pricingSheet.addRow(['SERVICES PRICING']);
  pricingSheet.mergeCells(`A${currentRow}:F${currentRow}`);
  pricingSheet.getCell(`A${currentRow}`).style = subHeaderStyle;
  currentRow++;

  pricingSheet.addRow(['Service ID', 'Service Name', 'Quantity', 'Unit Price', 'Total Price', 'Notes']);
  pricingSheet.getRow(currentRow).style = dataStyle;
  currentRow++;

  services.forEach(service => {
    pricingSheet.addRow([
      service.id,
      service.name,
      service.quantity,
      '', // Unit price - to be filled manually
      '', // Total price - to be calculated
      ''
    ]);
    pricingSheet.getRow(currentRow).style = dataStyle;
    currentRow++;
  });

  // TAB 4: BOM BY BRAND
  const bomSheet = workbook.addWorksheet('4. BOM by Brand');
  
  bomSheet.addRow(['BILL OF MATERIALS - GROUPED BY BRAND']);
  bomSheet.mergeCells('A1:F1');
  bomSheet.getCell('A1').style = headerStyle;

  currentRow = 3;

  // Group products by brand (assuming brand is in product name or we'll use "Unknown")
  const productsByBrand = new Map();
  const servicesByBrand = new Map();

  products.forEach(product => {
    const brand = product.name.split(' ')[0] || 'Unknown'; // Simple brand extraction
    if (!productsByBrand.has(brand)) {
      productsByBrand.set(brand, []);
    }
    productsByBrand.get(brand).push(product);
  });

  services.forEach(service => {
    const brand = 'Services'; // Services don't have brands, group them together
    if (!servicesByBrand.has(brand)) {
      servicesByBrand.set(brand, []);
    }
    servicesByBrand.get(brand).push(service);
  });

  // Products by Brand
  productsByBrand.forEach((brandProducts, brand) => {
    bomSheet.addRow([`BRAND: ${brand}`]);
    bomSheet.mergeCells(`A${currentRow}:F${currentRow}`);
    bomSheet.getCell(`A${currentRow}`).style = subHeaderStyle;
    currentRow++;

    bomSheet.addRow(['Product ID', 'Product Name', 'Quantity', 'Unit Price', 'Total Price', 'Location']);
    bomSheet.getRow(currentRow).style = dataStyle;
    currentRow++;

    brandProducts.forEach(product => {
      bomSheet.addRow([
        product.id,
        product.name,
        product.quantity,
        '', // Unit price
        '', // Total price
        product.location
      ]);
      bomSheet.getRow(currentRow).style = dataStyle;
      currentRow++;
    });

    currentRow++;
  });

  // Services
  servicesByBrand.forEach((brandServices, brand) => {
    bomSheet.addRow([`${brand.toUpperCase()}`]);
    bomSheet.mergeCells(`A${currentRow}:F${currentRow}`);
    bomSheet.getCell(`A${currentRow}`).style = subHeaderStyle;
    currentRow++;

    bomSheet.addRow(['Service ID', 'Service Name', 'Quantity', 'Unit Price', 'Total Price', 'Location']);
    bomSheet.getRow(currentRow).style = dataStyle;
    currentRow++;

    brandServices.forEach(service => {
      bomSheet.addRow([
        service.id,
        service.name,
        service.quantity,
        '', // Unit price
        '', // Total price
        service.location
      ]);
      bomSheet.getRow(currentRow).style = dataStyle;
      currentRow++;
    });

    currentRow++;
  });

  // Auto-fit columns for all sheets
  [currentInfraSheet, proposedSheet, pricingSheet, bomSheet].forEach(sheet => {
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  });

  return workbook;
}