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
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    }
  };

  const subHeaderStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A23B72' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    }
  };

  const dataStyle = {
    font: { size: 11 },
    border: {
      top: { style: 'thin', color: { argb: 'CCCCCC' } },
      left: { style: 'thin', color: { argb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
      right: { style: 'thin', color: { argb: 'CCCCCC' } }
    },
    alignment: { vertical: 'middle' }
  };

  const alternateRowStyle = {
    ...dataStyle,
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } }
  };

  const sectionHeaderStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' }, size: 13 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F18F01' } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    }
  };

  const categoryStyle = {
    font: { bold: true, size: 11, color: { argb: '2E86AB' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F4F8' } },
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: '2E86AB' } },
      left: { style: 'thin', color: { argb: '2E86AB' } },
      bottom: { style: 'thin', color: { argb: '2E86AB' } },
      right: { style: 'thin', color: { argb: '2E86AB' } }
    }
  };

  const highlightStyle = {
    ...dataStyle,
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4E6' } },
    font: { size: 11, bold: true }
  };

  // 0. EXECUTIVE SUMMARY SHEET (ALL IN ONE)
  const execSheet = workbook.addWorksheet('📋 Executive Summary');
  
  // Title
  execSheet.addRow(['BUILDING INFRASTRUCTURE COMPLETE REPORT']);
  execSheet.mergeCells('A1:H1');
  execSheet.getCell('A1').style = {
    ...headerStyle,
    font: { bold: true, color: { argb: 'FFFFFF' }, size: 16 }
  };
  execSheet.getRow(1).height = 30;

  // Building Information Section
  execSheet.addRow([]);
  execSheet.addRow(['🏢 BUILDING INFORMATION']);
  execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
  execSheet.getCell(`A${execSheet.rowCount}`).style = sectionHeaderStyle;
  execSheet.getRow(execSheet.rowCount).height = 25;
  
  execSheet.addRow(['Building Name', building.name, '', 'Building Code', building.code || 'N/A', '', '', '']);
  execSheet.addRow(['Address', building.address || 'N/A', '', 'Total Floors', building.floors.length, '', '', '']);
  execSheet.addRow(['Notes', building.notes || 'N/A', '', 'Central Rack', building.centralRack ? 'Yes' : 'No', '', '', '']);
  
  for (let i = execSheet.rowCount - 3; i <= execSheet.rowCount; i++) {
    execSheet.getRow(i).eachCell((cell, colNumber) => {
      if (colNumber === 1 || colNumber === 4) {
        cell.style = highlightStyle;
      } else {
        cell.style = dataStyle;
      }
    });
  }

  // Quick Stats Section
  let totalRooms = 0;
  let totalOutlets = 0;
  let totalDevices = 0;
  building.floors.forEach(floor => {
    totalRooms += floor.rooms.length;
    floor.rooms.forEach(room => {
      totalOutlets += room.outlets.length;
      totalDevices += room.devices.reduce((sum, d) => sum + (d.quantity || 1), 0);
    });
  });

  execSheet.addRow([]);
  execSheet.addRow(['📊 QUICK STATISTICS']);
  execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
  execSheet.getCell(`A${execSheet.rowCount}`).style = sectionHeaderStyle;
  execSheet.getRow(execSheet.rowCount).height = 25;
  
  execSheet.addRow(['Total Floors', building.floors.length, '', 'Total Rooms', totalRooms, '', '', '']);
  execSheet.addRow(['Total Outlets', totalOutlets, '', 'Total Devices', totalDevices, '', '', '']);
  execSheet.addRow(['Switches', building.centralRack?.switches.length || 0, '', 'Routers', building.centralRack?.routers.length || 0, '', '', '']);
  execSheet.addRow(['Servers', building.centralRack?.servers.length || 0, '', 'Cable Terminations', building.centralRack?.cableTerminations.length || 0, '', '', '']);
  
  for (let i = execSheet.rowCount - 4; i <= execSheet.rowCount; i++) {
    execSheet.getRow(i).eachCell((cell, colNumber) => {
      if (colNumber === 1 || colNumber === 4) {
        cell.style = highlightStyle;
      } else {
        cell.style = dataStyle;
      }
    });
  }

  // Central Rack Section
  if (building.centralRack) {
    const rack = building.centralRack;
    
    execSheet.addRow([]);
    execSheet.addRow(['🖥️ CENTRAL RACK']);
    execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
    execSheet.getCell(`A${execSheet.rowCount}`).style = sectionHeaderStyle;
    execSheet.getRow(execSheet.rowCount).height = 25;
    
    execSheet.addRow(['Rack Name', rack.name, '', 'Location', rack.location || 'N/A', '', '', '']);
    execSheet.addRow(['Units', rack.units || 'N/A', '', 'Code', rack.code || 'N/A', '', '', '']);
    
    for (let i = execSheet.rowCount - 2; i <= execSheet.rowCount; i++) {
      execSheet.getRow(i).eachCell((cell, colNumber) => {
        if (colNumber === 1 || colNumber === 4) {
          cell.style = highlightStyle;
        } else {
          cell.style = dataStyle;
        }
      });
    }

    // Cable Terminations
    if (rack.cableTerminations.length > 0) {
      execSheet.addRow([]);
      execSheet.addRow(['  🔌 Cable Terminations']);
      execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
      execSheet.getCell(`A${execSheet.rowCount}`).style = categoryStyle;
      
      execSheet.addRow(['Type', 'Qty', 'From', 'To', 'Fibers', 'Terminated', 'Future', 'Notes']);
      execSheet.getRow(execSheet.rowCount).eachCell((cell) => {
        cell.style = subHeaderStyle;
      });

      rack.cableTerminations.forEach((term, index) => {
        const row = execSheet.addRow([
          term.cableType,
          term.quantity,
          term.fromLocation || '',
          term.toLocation || '',
          term.totalFibers || '',
          term.terminatedFibers || '',
          term.isFutureProposal ? '✓' : '',
          (term.notes || '').substring(0, 30)
        ]);
        row.eachCell((cell) => {
          cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
        });
      });
    }

    // Switches
    if (rack.switches.length > 0) {
      execSheet.addRow([]);
      execSheet.addRow(['  🔀 Switches']);
      execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
      execSheet.getCell(`A${execSheet.rowCount}`).style = categoryStyle;
      
      execSheet.addRow(['Name', 'Brand', 'Model', 'IP', 'Ports', 'PoE', 'Services', 'Future']);
      execSheet.getRow(execSheet.rowCount).eachCell((cell) => {
        cell.style = subHeaderStyle;
      });

      rack.switches.forEach((sw, index) => {
        const row = execSheet.addRow([
          sw.name || '',
          sw.brand || '',
          sw.model || '',
          sw.ip || '',
          sw.ports.length,
          sw.poeEnabled ? `${sw.poePortsCount || 0}` : 'No',
          sw.services?.length || 0,
          sw.isFutureProposal ? '✓' : ''
        ]);
        row.eachCell((cell) => {
          cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
        });
      });
    }

    // Routers
    if (rack.routers.length > 0) {
      execSheet.addRow([]);
      execSheet.addRow(['  🌐 Routers']);
      execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
      execSheet.getCell(`A${execSheet.rowCount}`).style = categoryStyle;
      
      execSheet.addRow(['Name', 'Brand', 'Model', 'IP', 'Interfaces', 'VLANs', 'Services', 'Future']);
      execSheet.getRow(execSheet.rowCount).eachCell((cell) => {
        cell.style = subHeaderStyle;
      });

      rack.routers.forEach((router, index) => {
        const row = execSheet.addRow([
          router.name || '',
          router.brand || '',
          router.model || '',
          router.ip || '',
          router.interfaces?.length || 0,
          router.vlans?.length || 0,
          router.services?.length || 0,
          router.isFutureProposal ? '✓' : ''
        ]);
        row.eachCell((cell) => {
          cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
        });
      });
    }

    // PBX
    if (rack.pbx) {
      execSheet.addRow([]);
      execSheet.addRow(['  ☎️ PBX System']);
      execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
      execSheet.getCell(`A${execSheet.rowCount}`).style = categoryStyle;
      
      const pbx = rack.pbx;
      execSheet.addRow(['Brand', pbx.brand || '', 'Type', pbx.type, 'IP', pbx.ip || '', 'PMS', pbx.pmsIntegration ? pbx.pmsName || 'Yes' : 'No']);
      execSheet.addRow(['Extensions', pbx.extensions?.length || 0, 'Trunk Lines', pbx.trunkLines?.length || 0, '', '', '', '']);
      
      for (let i = execSheet.rowCount - 2; i <= execSheet.rowCount; i++) {
        execSheet.getRow(i).eachCell((cell, colNumber) => {
          if ([1, 3, 5, 7].includes(colNumber)) {
            cell.style = highlightStyle;
          } else {
            cell.style = dataStyle;
          }
        });
      }
    }

    // Servers
    if (rack.servers.length > 0) {
      execSheet.addRow([]);
      execSheet.addRow(['  💾 Servers']);
      execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
      execSheet.getCell(`A${execSheet.rowCount}`).style = categoryStyle;
      
      execSheet.addRow(['Name', 'Type', 'Brand', 'Model', 'IP', 'Virtual', 'VMs', 'Future']);
      execSheet.getRow(execSheet.rowCount).eachCell((cell) => {
        cell.style = subHeaderStyle;
      });

      rack.servers.forEach((server, index) => {
        const row = execSheet.addRow([
          server.name,
          server.type,
          server.brand || '',
          server.model || '',
          server.ip || '',
          server.isVirtualized ? server.hypervisor || 'Yes' : 'No',
          server.virtualMachines?.length || 0,
          server.isFutureProposal ? '✓' : ''
        ]);
        row.eachCell((cell) => {
          cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
        });
      });
    }
  }

  // Floors Summary
  execSheet.addRow([]);
  execSheet.addRow(['🏗️ FLOORS OVERVIEW']);
  execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
  execSheet.getCell(`A${execSheet.rowCount}`).style = sectionHeaderStyle;
  execSheet.getRow(execSheet.rowCount).height = 25;
  
  execSheet.addRow(['Floor', 'Level', 'Typical', 'Rooms', 'Outlets', 'Devices', 'PCs', 'Phones']);
  execSheet.getRow(execSheet.rowCount).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  building.floors.forEach((floor, index) => {
    let floorDevices = 0;
    let floorPCs = 0;
    let floorPhones = 0;
    let floorOutlets = 0;
    
    floor.rooms.forEach(room => {
      floorOutlets += room.outlets.length;
      room.devices.forEach(device => {
        const qty = device.quantity || 1;
        floorDevices += qty;
        if (device.type === 'PC') floorPCs += qty;
        if (device.type === 'PHONE' || device.type === 'VOIP_PHONE') floorPhones += qty;
      });
    });

    const row = execSheet.addRow([
      floor.name,
      floor.level,
      floor.isTypical ? `Yes (×${floor.repeatCount || 1})` : 'No',
      floor.rooms.length,
      floorOutlets,
      floorDevices,
      floorPCs,
      floorPhones
    ]);
    row.eachCell((cell) => {
      cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
    });
  });

  // Rooms Detail (condensed)
  execSheet.addRow([]);
  execSheet.addRow(['🚪 ROOMS SUMMARY']);
  execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
  execSheet.getCell(`A${execSheet.rowCount}`).style = sectionHeaderStyle;
  execSheet.getRow(execSheet.rowCount).height = 25;
  
  execSheet.addRow(['Room', 'Floor', 'Number', 'Type', 'Outlets', 'Devices', 'PCs', 'Phones']);
  execSheet.getRow(execSheet.rowCount).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  let roomIndex = 0;
  building.floors.forEach(floor => {
    floor.rooms.forEach(room => {
      const pcCount = room.devices.filter(d => d.type === 'PC').reduce((sum, d) => sum + (d.quantity || 1), 0);
      const phoneCount = room.devices.filter(d => d.type === 'PHONE' || d.type === 'VOIP_PHONE').reduce((sum, d) => sum + (d.quantity || 1), 0);
      const deviceCount = room.devices.reduce((sum, d) => sum + (d.quantity || 1), 0);
      
      const row = execSheet.addRow([
        room.name,
        floor.name,
        room.number || '',
        room.type,
        room.outlets.length,
        deviceCount,
        pcCount,
        phoneCount
      ]);
      row.eachCell((cell) => {
        cell.style = roomIndex % 2 === 0 ? dataStyle : alternateRowStyle;
      });
      roomIndex++;
    });
  });

  // Device Type Summary
  const deviceTypeCount: { [key: string]: number } = {};
  building.floors.forEach(floor => {
    floor.rooms.forEach(room => {
      room.devices.forEach(device => {
        const qty = device.quantity || 1;
        deviceTypeCount[device.type] = (deviceTypeCount[device.type] || 0) + qty;
      });
    });
  });

  execSheet.addRow([]);
  execSheet.addRow(['📱 DEVICE TYPE DISTRIBUTION']);
  execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
  execSheet.getCell(`A${execSheet.rowCount}`).style = sectionHeaderStyle;
  execSheet.getRow(execSheet.rowCount).height = 25;
  
  execSheet.addRow(['Device Type', 'Total Count', 'Percentage', '', '', '', '', '']);
  execSheet.getRow(execSheet.rowCount).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  const totalDevicesForPct = Object.values(deviceTypeCount).reduce((sum, count) => sum + count, 0);
  let deviceTypeIndex = 0;
  Object.entries(deviceTypeCount).forEach(([type, count]) => {
    const percentage = ((count / totalDevicesForPct) * 100).toFixed(1);
    const row = execSheet.addRow([
      type,
      count,
      `${percentage}%`,
      '', '', '', '', ''
    ]);
    row.eachCell((cell) => {
      cell.style = deviceTypeIndex % 2 === 0 ? dataStyle : alternateRowStyle;
    });
    deviceTypeIndex++;
  });

  // Set column widths for executive summary
  execSheet.getColumn(1).width = 25;
  execSheet.getColumn(2).width = 20;
  execSheet.getColumn(3).width = 20;
  execSheet.getColumn(4).width = 20;
  execSheet.getColumn(5).width = 15;
  execSheet.getColumn(6).width = 15;
  execSheet.getColumn(7).width = 15;
  execSheet.getColumn(8).width = 15;

  // Add some spacing rows at the end
  execSheet.addRow([]);
  execSheet.addRow(['═══════════════════════════════════════════════════════════════════════════════════════']);
  execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
  execSheet.getCell(`A${execSheet.rowCount}`).style = {
    font: { size: 10, color: { argb: '999999' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  execSheet.addRow(['Generated by KimonCRM Building Infrastructure Report System']);
  execSheet.mergeCells(`A${execSheet.rowCount}:H${execSheet.rowCount}`);
  execSheet.getCell(`A${execSheet.rowCount}`).style = {
    font: { size: 10, italic: true, color: { argb: '999999' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // 1. BUILDING OVERVIEW SHEET
  const overviewSheet = workbook.addWorksheet('Building Overview');
  
  // Building Information
  overviewSheet.addRow(['BUILDING INFORMATION']);
  overviewSheet.mergeCells('A1:D1');
  overviewSheet.getCell('A1').style = headerStyle;
  
  overviewSheet.addRow(['Name', building.name, 'Code', building.code || 'N/A']);
  overviewSheet.addRow(['Address', building.address || 'N/A', 'Notes', building.notes || 'N/A']);
  overviewSheet.addRow(['Floors Count', building.floors.length, 'Central Rack', building.centralRack ? 'Yes' : 'No']);
  
  // Apply styles to building info
  for (let i = 2; i <= 4; i++) {
    overviewSheet.getRow(i).eachCell((cell) => {
      cell.style = dataStyle;
    });
  }

  // Central Rack Summary
  if (building.centralRack) {
    overviewSheet.addRow([]);
    overviewSheet.addRow(['CENTRAL RACK SUMMARY']);
    overviewSheet.mergeCells(`A${overviewSheet.rowCount}:D${overviewSheet.rowCount}`);
    overviewSheet.getCell(`A${overviewSheet.rowCount}`).style = subHeaderStyle;
    
    const rack = building.centralRack;
    overviewSheet.addRow(['Rack Name', rack.name, 'Units', rack.units || 'N/A']);
    overviewSheet.addRow(['Location', rack.location || 'N/A', 'Code', rack.code || 'N/A']);
    overviewSheet.addRow(['Switches', rack.switches.length, 'Routers', rack.routers.length]);
    overviewSheet.addRow(['Servers', rack.servers.length, 'Cable Terminations', rack.cableTerminations.length]);
    
    // Apply styles
    for (let i = overviewSheet.rowCount - 4; i <= overviewSheet.rowCount; i++) {
      overviewSheet.getRow(i).eachCell((cell) => {
        cell.style = dataStyle;
      });
    }
  }

  // Set column widths
  overviewSheet.getColumn(1).width = 20;
  overviewSheet.getColumn(2).width = 30;
  overviewSheet.getColumn(3).width = 20;
  overviewSheet.getColumn(4).width = 30;

  // 2. FLOORS DETAIL SHEET
  const floorsSheet = workbook.addWorksheet('Floors Detail');
  
  floorsSheet.addRow(['FLOORS DETAILED INFORMATION']);
  floorsSheet.mergeCells('A1:H1');
  floorsSheet.getCell('A1').style = headerStyle;
  
  floorsSheet.addRow(['Floor Name', 'Level', 'Typical', 'Repeat Count', 'Rooms', 'Racks', 'Notes', 'Status']);
  floorsSheet.getRow(2).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  building.floors.forEach((floor, index) => {
    const row = floorsSheet.addRow([
      floor.name,
      floor.level,
      floor.isTypical ? 'Yes' : 'No',
      floor.repeatCount || 1,
      floor.rooms.length,
      floor.racks?.length || 0,
      floor.notes || '',
      'Active'
    ]);
    
    row.eachCell((cell, colNumber) => {
      cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
    });
  });

  // Set column widths
  floorsSheet.getColumn(1).width = 25;
  floorsSheet.getColumn(2).width = 10;
  floorsSheet.getColumn(3).width = 12;
  floorsSheet.getColumn(4).width = 15;
  floorsSheet.getColumn(5).width = 10;
  floorsSheet.getColumn(6).width = 10;
  floorsSheet.getColumn(7).width = 30;
  floorsSheet.getColumn(8).width = 12;

  // 3. ROOMS DETAIL SHEET
  const roomsSheet = workbook.addWorksheet('Rooms Detail');
  
  roomsSheet.addRow(['ROOMS DETAILED INFORMATION']);
  roomsSheet.mergeCells('A1:J1');
  roomsSheet.getCell('A1').style = headerStyle;
  
  roomsSheet.addRow(['Room Name', 'Floor', 'Number', 'Type', 'Outlets', 'Devices', 'PCs', 'Phones', 'Other Devices', 'Notes']);
  roomsSheet.getRow(2).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  let rowIndex = 0;
  building.floors.forEach(floor => {
    floor.rooms.forEach(room => {
      const pcCount = room.devices.filter(d => d.type === 'PC').length;
      const phoneCount = room.devices.filter(d => d.type === 'PHONE' || d.type === 'VOIP_PHONE').length;
      const otherCount = room.devices.filter(d => !['PC', 'PHONE', 'VOIP_PHONE'].includes(d.type)).length;
      
      const row = roomsSheet.addRow([
        room.name,
        floor.name,
        room.number || '',
        room.type,
        room.outlets.length,
        room.devices.length,
        pcCount,
        phoneCount,
        otherCount,
        room.notes || ''
      ]);
      
      row.eachCell((cell) => {
        cell.style = rowIndex % 2 === 0 ? dataStyle : alternateRowStyle;
      });
      rowIndex++;
    });
  });

  // Set column widths
  roomsSheet.getColumn(1).width = 25;
  roomsSheet.getColumn(2).width = 20;
  roomsSheet.getColumn(3).width = 12;
  roomsSheet.getColumn(4).width = 15;
  roomsSheet.getColumn(5).width = 10;
  roomsSheet.getColumn(6).width = 10;
  roomsSheet.getColumn(7).width = 8;
  roomsSheet.getColumn(8).width = 10;
  roomsSheet.getColumn(9).width = 15;
  roomsSheet.getColumn(10).width = 30;

  // 4. DEVICES DETAIL SHEET
  const devicesSheet = workbook.addWorksheet('Devices Detail');
  
  devicesSheet.addRow(['DEVICES DETAILED INFORMATION']);
  devicesSheet.mergeCells('A1:K1');
  devicesSheet.getCell('A1').style = headerStyle;
  
  devicesSheet.addRow(['Device Type', 'Room', 'Floor', 'Brand', 'Model', 'IP Address', 'Quantity', 'Connected To', 'Services', 'Notes', 'Status']);
  devicesSheet.getRow(2).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  rowIndex = 0;
  building.floors.forEach(floor => {
    floor.rooms.forEach(room => {
      room.devices.forEach(device => {
        const outletConnection = device.notes?.includes('Connected to outlet:') 
          ? device.notes.split('Connected to outlet:')[1]?.split(')')[0]?.trim() || 'N/A'
          : 'N/A';
        
        const row = devicesSheet.addRow([
          device.type,
          room.name,
          floor.name,
          device.brand || '',
          device.model || '',
          device.ip || '',
          device.quantity || 1,
          outletConnection,
          device.services.length,
          device.notes || '',
          'Active'
        ]);
        
        row.eachCell((cell) => {
          cell.style = rowIndex % 2 === 0 ? dataStyle : alternateRowStyle;
        });
        rowIndex++;
      });
    });
  });

  // Set column widths
  devicesSheet.getColumn(1).width = 15;
  devicesSheet.getColumn(2).width = 20;
  devicesSheet.getColumn(3).width = 15;
  devicesSheet.getColumn(4).width = 15;
  devicesSheet.getColumn(5).width = 20;
  devicesSheet.getColumn(6).width = 15;
  devicesSheet.getColumn(7).width = 10;
  devicesSheet.getColumn(8).width = 20;
  devicesSheet.getColumn(9).width = 10;
  devicesSheet.getColumn(10).width = 30;
  devicesSheet.getColumn(11).width = 12;

  // 5. OUTLETS DETAIL SHEET
  const outletsSheet = workbook.addWorksheet('Outlets Detail');
  
  outletsSheet.addRow(['OUTLETS DETAILED INFORMATION']);
  outletsSheet.mergeCells('A1:I1');
  outletsSheet.getCell('A1').style = headerStyle;
  
  outletsSheet.addRow(['Outlet Label', 'Room', 'Floor', 'Type', 'Terminates To', 'Cable Type', 'Port Number', 'Quantity', 'Status']);
  outletsSheet.getRow(2).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  rowIndex = 0;
  building.floors.forEach(floor => {
    floor.rooms.forEach(room => {
      room.outlets.forEach(outlet => {
        const row = outletsSheet.addRow([
          outlet.label,
          room.name,
          floor.name,
          outlet.type,
          outlet.connection?.toDevice || '',
          outlet.connection?.cableType || '',
          outlet.connection?.fromDevice || '',
          outlet.quantity || 1,
          'Active'
        ]);
        
        row.eachCell((cell) => {
          cell.style = rowIndex % 2 === 0 ? dataStyle : alternateRowStyle;
        });
        rowIndex++;
      });
    });
  });

  // Set column widths
  outletsSheet.getColumn(1).width = 20;
  outletsSheet.getColumn(2).width = 20;
  outletsSheet.getColumn(3).width = 15;
  outletsSheet.getColumn(4).width = 15;
  outletsSheet.getColumn(5).width = 25;
  outletsSheet.getColumn(6).width = 15;
  outletsSheet.getColumn(7).width = 15;
  outletsSheet.getColumn(8).width = 10;
  outletsSheet.getColumn(9).width = 12;

  // 6. CABLE TERMINATIONS DETAIL SHEET
  if (building.centralRack && building.centralRack.cableTerminations.length > 0) {
    const cableTermSheet = workbook.addWorksheet('Cable Terminations');
    
    cableTermSheet.addRow(['CABLE TERMINATIONS DETAILED INFORMATION']);
    cableTermSheet.mergeCells('A1:I1');
    cableTermSheet.getCell('A1').style = headerStyle;
    
    cableTermSheet.addRow(['Cable Type', 'Quantity', 'From Location', 'To Location', 'Total Fibers', 'Terminated Fibers', 'Services', 'Future Proposal', 'Notes']);
    cableTermSheet.getRow(2).eachCell((cell) => {
      cell.style = subHeaderStyle;
    });

    building.centralRack.cableTerminations.forEach((termination, index) => {
      const row = cableTermSheet.addRow([
        termination.cableType,
        termination.quantity,
        termination.fromLocation || '',
        termination.toLocation || '',
        termination.totalFibers || '',
        termination.terminatedFibers || '',
        termination.services?.length || 0,
        termination.isFutureProposal ? 'Yes' : 'No',
        termination.notes || ''
      ]);
      
      row.eachCell((cell) => {
        cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
      });
    });

    // Set column widths
    cableTermSheet.getColumn(1).width = 15;
    cableTermSheet.getColumn(2).width = 10;
    cableTermSheet.getColumn(3).width = 20;
    cableTermSheet.getColumn(4).width = 20;
    cableTermSheet.getColumn(5).width = 12;
    cableTermSheet.getColumn(6).width = 15;
    cableTermSheet.getColumn(7).width = 10;
    cableTermSheet.getColumn(8).width = 15;
    cableTermSheet.getColumn(9).width = 30;
  }

  // 7. SWITCHES DETAIL SHEET
  if (building.centralRack && building.centralRack.switches.length > 0) {
    const switchesSheet = workbook.addWorksheet('Switches Detail');
    
    switchesSheet.addRow(['SWITCHES DETAILED INFORMATION']);
    switchesSheet.mergeCells('A1:L1');
    switchesSheet.getCell('A1').style = headerStyle;
    
    switchesSheet.addRow(['Name', 'Brand', 'Model', 'IP Address', 'Total Ports', 'PoE Enabled', 'PoE Ports', 'VLANs', 'Connections', 'Services', 'Future Proposal', 'Notes']);
    switchesSheet.getRow(2).eachCell((cell) => {
      cell.style = subHeaderStyle;
    });

    building.centralRack.switches.forEach((switch_, index) => {
      const row = switchesSheet.addRow([
        switch_.name || '',
        switch_.brand || '',
        switch_.model || '',
        switch_.ip || '',
        switch_.ports.length,
        switch_.poeEnabled ? 'Yes' : 'No',
        switch_.poePortsCount || 0,
        switch_.vlans?.length || 0,
        switch_.connections?.length || 0,
        switch_.services?.length || 0,
        switch_.isFutureProposal ? 'Yes' : 'No',
        switch_.proposalNotes || ''
      ]);
      
      row.eachCell((cell) => {
        cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
      });
    });

    // Set column widths
    switchesSheet.getColumn(1).width = 20;
    switchesSheet.getColumn(2).width = 15;
    switchesSheet.getColumn(3).width = 20;
    switchesSheet.getColumn(4).width = 15;
    switchesSheet.getColumn(5).width = 12;
    switchesSheet.getColumn(6).width = 12;
    switchesSheet.getColumn(7).width = 12;
    switchesSheet.getColumn(8).width = 10;
    switchesSheet.getColumn(9).width = 12;
    switchesSheet.getColumn(10).width = 10;
    switchesSheet.getColumn(11).width = 15;
    switchesSheet.getColumn(12).width = 30;
  }

  // 8. SWITCH PORTS DETAIL SHEET
  if (building.centralRack && building.centralRack.switches.length > 0) {
    const switchPortsSheet = workbook.addWorksheet('Switch Ports Detail');
    
    switchPortsSheet.addRow(['SWITCH PORTS DETAILED INFORMATION']);
    switchPortsSheet.mergeCells('A1:J1');
    switchPortsSheet.getCell('A1').style = headerStyle;
    
    switchPortsSheet.addRow(['Switch Name', 'Port Number', 'Port Type', 'Speed', 'PoE', 'Status', 'VLAN', 'Connected To', 'Notes', 'Switch IP']);
    switchPortsSheet.getRow(2).eachCell((cell) => {
      cell.style = subHeaderStyle;
    });

    let portRowIndex = 0;
    building.centralRack.switches.forEach((switch_) => {
      switch_.ports.forEach((port) => {
        const row = switchPortsSheet.addRow([
          switch_.name || '',
          port.number,
          port.type,
          port.speed || '',
          port.isPoe ? 'Yes' : 'No',
          port.status || '',
          port.vlanId || '',
          port.connectedTo || '',
          '',
          switch_.ip || ''
        ]);
        
        row.eachCell((cell) => {
          cell.style = portRowIndex % 2 === 0 ? dataStyle : alternateRowStyle;
        });
        portRowIndex++;
      });
    });

    // Set column widths
    switchPortsSheet.getColumn(1).width = 20;
    switchPortsSheet.getColumn(2).width = 12;
    switchPortsSheet.getColumn(3).width = 15;
    switchPortsSheet.getColumn(4).width = 12;
    switchPortsSheet.getColumn(5).width = 8;
    switchPortsSheet.getColumn(6).width = 12;
    switchPortsSheet.getColumn(7).width = 12;
    switchPortsSheet.getColumn(8).width = 20;
    switchPortsSheet.getColumn(9).width = 25;
    switchPortsSheet.getColumn(10).width = 15;
  }

  // 9. ROUTERS DETAIL SHEET
  if (building.centralRack && building.centralRack.routers.length > 0) {
    const routersSheet = workbook.addWorksheet('Routers Detail');
    
    routersSheet.addRow(['ROUTERS DETAILED INFORMATION']);
    routersSheet.mergeCells('A1:K1');
    routersSheet.getCell('A1').style = headerStyle;
    
    routersSheet.addRow(['Name', 'Brand', 'Model', 'IP Address', 'Interfaces', 'VLANs', 'Connections', 'Services', 'Future Proposal', 'Notes']);
    routersSheet.getRow(2).eachCell((cell) => {
      cell.style = subHeaderStyle;
    });

    building.centralRack.routers.forEach((router, index) => {
      const row = routersSheet.addRow([
        router.name || '',
        router.brand || '',
        router.model || '',
        router.ip || '',
        router.interfaces?.length || 0,
        router.vlans?.length || 0,
        router.connections?.length || 0,
        router.services?.length || 0,
        router.isFutureProposal ? 'Yes' : 'No',
        router.proposalNotes || ''
      ]);
      
      row.eachCell((cell) => {
        cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
      });
    });

    // Set column widths
    routersSheet.getColumn(1).width = 20;
    routersSheet.getColumn(2).width = 15;
    routersSheet.getColumn(3).width = 20;
    routersSheet.getColumn(4).width = 15;
    routersSheet.getColumn(5).width = 12;
    routersSheet.getColumn(6).width = 10;
    routersSheet.getColumn(7).width = 12;
    routersSheet.getColumn(8).width = 10;
    routersSheet.getColumn(9).width = 15;
    routersSheet.getColumn(10).width = 30;
  }

  // 10. ROUTER INTERFACES DETAIL SHEET
  if (building.centralRack && building.centralRack.routers.length > 0) {
    const routerInterfacesSheet = workbook.addWorksheet('Router Interfaces');
    
    routerInterfacesSheet.addRow(['ROUTER INTERFACES DETAILED INFORMATION']);
    routerInterfacesSheet.mergeCells('A1:H1');
    routerInterfacesSheet.getCell('A1').style = headerStyle;
    
    routerInterfacesSheet.addRow(['Router Name', 'Interface Name', 'Type', 'Status', 'Speed', 'VLAN', 'Notes', 'Router IP']);
    routerInterfacesSheet.getRow(2).eachCell((cell) => {
      cell.style = subHeaderStyle;
    });

    let interfaceRowIndex = 0;
    building.centralRack.routers.forEach((router) => {
      router.interfaces?.forEach((interface_) => {
        const row = routerInterfacesSheet.addRow([
          router.name || '',
          interface_.name,
          interface_.type,
          interface_.status || '',
          interface_.speed || '',
          interface_.vlanId || '',
          '',
          router.ip || ''
        ]);
        
        row.eachCell((cell) => {
          cell.style = interfaceRowIndex % 2 === 0 ? dataStyle : alternateRowStyle;
        });
        interfaceRowIndex++;
      });
    });

    // Set column widths
    routerInterfacesSheet.getColumn(1).width = 20;
    routerInterfacesSheet.getColumn(2).width = 20;
    routerInterfacesSheet.getColumn(3).width = 15;
    routerInterfacesSheet.getColumn(4).width = 12;
    routerInterfacesSheet.getColumn(5).width = 12;
    routerInterfacesSheet.getColumn(6).width = 12;
    routerInterfacesSheet.getColumn(7).width = 25;
    routerInterfacesSheet.getColumn(8).width = 15;
  }

  // 11. PBX DETAIL SHEET
  if (building.centralRack && building.centralRack.pbx) {
    const pbxSheet = workbook.addWorksheet('PBX Detail');
    
    pbxSheet.addRow(['PBX DETAILED INFORMATION']);
    pbxSheet.mergeCells('A1:F1');
    pbxSheet.getCell('A1').style = headerStyle;
    
    const pbx = building.centralRack.pbx;
    
    // PBX Basic Info
    pbxSheet.addRow([]);
    pbxSheet.addRow(['PBX BASIC INFORMATION']);
    pbxSheet.mergeCells(`A${pbxSheet.rowCount}:F${pbxSheet.rowCount}`);
    pbxSheet.getCell(`A${pbxSheet.rowCount}`).style = subHeaderStyle;
    
    pbxSheet.addRow(['Brand', pbx.brand || '', 'Model', pbx.model || '', '', '']);
    pbxSheet.addRow(['Type', pbx.type, 'IP Address', pbx.ip || '', '', '']);
    pbxSheet.addRow(['Connection', pbx.connection || '', 'Extensions', pbx.extensions?.length || 0, '', '']);
    pbxSheet.addRow(['PMS Integration', pbx.pmsIntegration ? 'Yes' : 'No', 'PMS Name', pbx.pmsName || '', '', '']);

    // Apply styles
    for (let i = pbxSheet.rowCount - 4; i <= pbxSheet.rowCount; i++) {
      pbxSheet.getRow(i).eachCell((cell) => {
        cell.style = dataStyle;
      });
    }

    // Trunk Lines
    if (pbx.trunkLines && pbx.trunkLines.length > 0) {
      pbxSheet.addRow([]);
      pbxSheet.addRow(['TRUNK LINES']);
      pbxSheet.mergeCells(`A${pbxSheet.rowCount}:F${pbxSheet.rowCount}`);
      pbxSheet.getCell(`A${pbxSheet.rowCount}`).style = subHeaderStyle;
      
      pbxSheet.addRow(['Type', 'Provider', 'Phone Numbers', 'Channels', 'Notes', '']);
      pbxSheet.getRow(pbxSheet.rowCount).eachCell((cell) => {
        cell.style = subHeaderStyle;
      });

      pbx.trunkLines.forEach((line, index) => {
        const row = pbxSheet.addRow([
          line.type,
          line.provider || '',
          line.phoneNumbers?.join(', ') || '',
          line.channels || '',
          line.notes || '',
          ''
        ]);
        
        row.eachCell((cell) => {
          cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
        });
      });
    }

    // Extensions
    if (pbx.extensions && pbx.extensions.length > 0) {
      pbxSheet.addRow([]);
      pbxSheet.addRow(['EXTENSIONS']);
      pbxSheet.mergeCells(`A${pbxSheet.rowCount}:F${pbxSheet.rowCount}`);
      pbxSheet.getCell(`A${pbxSheet.rowCount}`).style = subHeaderStyle;
      
      pbxSheet.addRow(['Extension Number', 'Name', 'Department', 'Device Type', 'Notes', '']);
      pbxSheet.getRow(pbxSheet.rowCount).eachCell((cell) => {
        cell.style = subHeaderStyle;
      });

      pbx.extensions.forEach((ext, index) => {
        const row = pbxSheet.addRow([
          ext.number || '',
          ext.name || '',
          ext.department || '',
          ext.deviceType || '',
          ext.notes || '',
          ''
        ]);
        
        row.eachCell((cell) => {
          cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
        });
      });
    }

    // Set column widths
    pbxSheet.getColumn(1).width = 20;
    pbxSheet.getColumn(2).width = 20;
    pbxSheet.getColumn(3).width = 25;
    pbxSheet.getColumn(4).width = 15;
    pbxSheet.getColumn(5).width = 30;
    pbxSheet.getColumn(6).width = 15;
  }

  // 12. SERVERS DETAIL SHEET
  if (building.centralRack && building.centralRack.servers.length > 0) {
    const serversSheet = workbook.addWorksheet('Servers Detail');
    
    serversSheet.addRow(['SERVERS DETAILED INFORMATION']);
    serversSheet.mergeCells('A1:L1');
    serversSheet.getCell('A1').style = headerStyle;
    
    serversSheet.addRow(['Name', 'Type', 'Brand', 'Model', 'IP Address', 'Virtualized', 'Hypervisor', 'VMs Count', 'Services', 'Future Proposal', 'Notes']);
    serversSheet.getRow(2).eachCell((cell) => {
      cell.style = subHeaderStyle;
    });

    building.centralRack.servers.forEach((server, index) => {
      const row = serversSheet.addRow([
        server.name,
        server.type,
        server.brand || '',
        server.model || '',
        server.ip || '',
        server.isVirtualized ? 'Yes' : 'No',
        server.hypervisor || '',
        server.virtualMachines?.length || 0,
        server.services?.length || 0,
        server.isFutureProposal ? 'Yes' : 'No',
        server.notes || ''
      ]);
      
      row.eachCell((cell) => {
        cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
      });
    });

    // Set column widths
    serversSheet.getColumn(1).width = 20;
    serversSheet.getColumn(2).width = 15;
    serversSheet.getColumn(3).width = 15;
    serversSheet.getColumn(4).width = 20;
    serversSheet.getColumn(5).width = 15;
    serversSheet.getColumn(6).width = 12;
    serversSheet.getColumn(7).width = 20;
    serversSheet.getColumn(8).width = 12;
    serversSheet.getColumn(9).width = 10;
    serversSheet.getColumn(10).width = 15;
    serversSheet.getColumn(11).width = 30;
  }

  // 13. VIRTUAL MACHINES DETAIL SHEET
  if (building.centralRack && building.centralRack.servers.some(s => s.virtualMachines && s.virtualMachines.length > 0)) {
    const vmsSheet = workbook.addWorksheet('Virtual Machines');
    
    vmsSheet.addRow(['VIRTUAL MACHINES DETAILED INFORMATION']);
    vmsSheet.mergeCells('A1:K1');
    vmsSheet.getCell('A1').style = headerStyle;
    
    vmsSheet.addRow(['Host Server', 'VM Name', 'OS', 'Purpose', 'CPU Cores', 'RAM', 'Storage', 'IP Address', 'Status', 'Notes']);
    vmsSheet.getRow(2).eachCell((cell) => {
      cell.style = subHeaderStyle;
    });

    let vmRowIndex = 0;
    building.centralRack.servers.forEach((server) => {
      server.virtualMachines?.forEach((vm) => {
        const row = vmsSheet.addRow([
          server.name,
          vm.name,
          vm.os || '',
          vm.purpose || '',
          vm.cpu || '',
          vm.ram || '',
          vm.storage || '',
          vm.ip || '',
          vm.status || '',
          vm.notes || ''
        ]);
        
        row.eachCell((cell) => {
          cell.style = vmRowIndex % 2 === 0 ? dataStyle : alternateRowStyle;
        });
        vmRowIndex++;
      });
    });

    // Set column widths
    vmsSheet.getColumn(1).width = 20;
    vmsSheet.getColumn(2).width = 25;
    vmsSheet.getColumn(3).width = 20;
    vmsSheet.getColumn(4).width = 25;
    vmsSheet.getColumn(5).width = 12;
    vmsSheet.getColumn(6).width = 12;
    vmsSheet.getColumn(7).width = 15;
    vmsSheet.getColumn(8).width = 15;
    vmsSheet.getColumn(9).width = 12;
    vmsSheet.getColumn(10).width = 30;
  }

  // 14. PIVOT TABLES SHEET
  const pivotSheet = workbook.addWorksheet('Pivot Tables');
  
  // Device Type Summary Pivot
  pivotSheet.addRow(['DEVICE TYPE SUMMARY']);
  pivotSheet.mergeCells('A1:D1');
  pivotSheet.getCell('A1').style = headerStyle;
  
  pivotSheet.addRow(['Device Type', 'Count', 'Percentage', 'Floors']);
  pivotSheet.getRow(2).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  // Calculate device type summary
  const pivotDeviceTypeCount: { [key: string]: { count: number; floors: Set<string> } } = {};
  building.floors.forEach(floor => {
    floor.rooms.forEach(room => {
      room.devices.forEach(device => {
        if (!pivotDeviceTypeCount[device.type]) {
          pivotDeviceTypeCount[device.type] = { count: 0, floors: new Set() };
        }
        pivotDeviceTypeCount[device.type].count += device.quantity || 1;
        pivotDeviceTypeCount[device.type].floors.add(floor.name);
      });
    });
  });

  const totalPivotDevices = Object.values(pivotDeviceTypeCount).reduce((sum, data) => sum + data.count, 0);
  
  Object.entries(pivotDeviceTypeCount).forEach(([type, data], index) => {
    const percentage = ((data.count / totalPivotDevices) * 100).toFixed(1);
    const floors = Array.from(data.floors).join(', ');
    
    const row = pivotSheet.addRow([type, data.count, `${percentage}%`, floors]);
    row.eachCell((cell) => {
      cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
    });
  });

  // Floor Summary Pivot
  pivotSheet.addRow([]);
  pivotSheet.addRow([]);
  pivotSheet.addRow(['FLOOR SUMMARY']);
  pivotSheet.mergeCells(`A${pivotSheet.rowCount}:E${pivotSheet.rowCount}`);
  pivotSheet.getCell(`A${pivotSheet.rowCount}`).style = headerStyle;
  
  pivotSheet.addRow(['Floor Name', 'Rooms', 'Total Devices', 'PCs', 'Phones', 'Other Devices']);
  pivotSheet.getRow(pivotSheet.rowCount).eachCell((cell) => {
    cell.style = subHeaderStyle;
  });

  building.floors.forEach((floor, index) => {
    let totalDevices = 0;
    let pcCount = 0;
    let phoneCount = 0;
    let otherCount = 0;
    
    floor.rooms.forEach(room => {
      room.devices.forEach(device => {
        const quantity = device.quantity || 1;
        totalDevices += quantity;
        
        if (device.type === 'PC') pcCount += quantity;
        else if (device.type === 'PHONE' || device.type === 'VOIP_PHONE') phoneCount += quantity;
        else otherCount += quantity;
      });
    });
    
    const row = pivotSheet.addRow([
      floor.name,
      floor.rooms.length,
      totalDevices,
      pcCount,
      phoneCount,
      otherCount
    ]);
    
    row.eachCell((cell) => {
      cell.style = index % 2 === 0 ? dataStyle : alternateRowStyle;
    });
  });

  // Set column widths
  pivotSheet.getColumn(1).width = 20;
  pivotSheet.getColumn(2).width = 10;
  pivotSheet.getColumn(3).width = 15;
  pivotSheet.getColumn(4).width = 15;
  pivotSheet.getColumn(5).width = 15;
  pivotSheet.getColumn(6).width = 15;

  // Generate the Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
