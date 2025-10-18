import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

interface SelectedElement {
  type: string;
  buildingIndex?: number;
  floorIndex?: number;
  rackIndex?: number;
  roomIndex?: number;
  connectionIndex?: number;
}

interface EquipmentItem {
  id: string;
  type: 'product' | 'service';
  itemId: string;
  name: string;
  brand?: string;
  category: string;
  unit: string;
  quantity: number;
  price: number;
  margin?: number;
  totalPrice: number;
  notes?: string;
  infrastructureElement?: SelectedElement;
}

interface SiteSurveyData {
  title: string;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
  };
  contact?: {
    name: string;
    email?: string;
    phone?: string;
  };
  assignTo?: {
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
  description?: string;
  files?: Array<{
    id: string;
    name: string;
    url: string;
    filetype: string;
    description?: string;
  }>;
}

interface Building {
  id?: string;
  name: string;
  code?: string;
  address?: string;
  notes?: string;
  centralRack?: CentralRack;
  floors: Floor[];
  images?: string[];
}

interface CentralRack {
  id?: string;
  name: string;
  code?: string;
  units?: number;
  location?: string;
  notes?: string;
  images?: string[];
  devices?: DeviceWithEquipment[];
}

interface Floor {
  id?: string;
  name: string;
  level?: number;
  blueprintUrl?: string;
  images?: string[];
  floorRacks?: FloorRack[];
  rooms?: Room[];
  expanded?: boolean;
}

interface FloorRack {
  id?: string;
  name: string;
  code?: string;
  units?: number;
  location?: string;
  notes?: string;
  images?: string[];
  devices?: DeviceWithEquipment[];
}

interface Room {
  id?: string;
  name: string;
  type: string;
  outlets: number;
  connectionType: string;
  isTypicalRoom?: boolean;
  notes?: string;
  devices?: DeviceWithEquipment[];
  identicalRoomsCount?: number;
}

interface DeviceWithEquipment {
  id?: string;
  type: string;
  name: string;
  brand?: string;
  model?: string;
  quantity?: number;
  notes?: string;
  itemType?: 'product' | 'service';
  equipmentId?: string;
  ipAddress?: string;
  phoneNumber?: string;
}

// Helper function to format placement information with actual building names
function getPlacementString(element?: SelectedElement, buildings?: Building[]): string {
  if (!element) return 'General';
  
  const parts: string[] = [];
  
  if (element.buildingIndex !== undefined && buildings && buildings[element.buildingIndex]) {
    const building = buildings[element.buildingIndex];
    parts.push(building.name);
    
    if (element.type === 'centralRack') {
      if (building.centralRack) {
        parts.push(building.centralRack.name || 'Central Rack');
      }
    } else if (element.floorIndex !== undefined && building.floors && building.floors[element.floorIndex]) {
      const floor = building.floors[element.floorIndex];
      parts.push(floor.name);
      
      if (element.type === 'floorRack' && element.rackIndex !== undefined && floor.floorRacks && floor.floorRacks[element.rackIndex]) {
        const rack = floor.floorRacks[element.rackIndex];
        parts.push(rack.name || `Rack ${element.rackIndex + 1}`);
      } else if (element.type === 'room' && element.roomIndex !== undefined && floor.rooms && floor.rooms[element.roomIndex]) {
        const room = floor.rooms[element.roomIndex];
        parts.push(room.name);
      }
    } else if (element.type === 'buildingConnection' && element.connectionIndex !== undefined) {
      parts.push(`Connection ${element.connectionIndex + 1}`);
    }
  } else {
    // Fallback to indices if buildings not provided
    if (element.buildingIndex !== undefined) {
      parts.push(`Building ${element.buildingIndex + 1}`);
    }
    if (element.floorIndex !== undefined) {
      parts.push(`Floor ${element.floorIndex + 1}`);
    }
    if (element.type === 'centralRack') {
      parts.push('Central Rack');
    } else if (element.type === 'floorRack' && element.rackIndex !== undefined) {
      parts.push(`Rack ${element.rackIndex + 1}`);
    } else if (element.type === 'room' && element.roomIndex !== undefined) {
      parts.push(`Room ${element.roomIndex + 1}`);
    } else if (element.type === 'buildingConnection' && element.connectionIndex !== undefined) {
      parts.push(`Connection ${element.connectionIndex + 1}`);
    }
  }
  
  return parts.length > 0 ? parts.join(' → ') : 'General';
}

// Helper function to consolidate duplicate equipment items
interface ConsolidatedItem {
  itemId: string;
  type: 'product' | 'service';
  name: string;
  brand?: string;
  category: string;
  unit: string;
  totalQuantity: number;
  price: number;
  totalPrice: number;
  placements: string[];
  notes: string[];
}

function consolidateEquipment(equipment: EquipmentItem[], buildings?: Building[]): ConsolidatedItem[] {
  const consolidated = new Map<string, ConsolidatedItem>();

  equipment.forEach(item => {
    const key = `${item.type}-${item.itemId}-${item.name}-${item.price}`;
    
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.totalQuantity += item.quantity;
      existing.totalPrice += item.totalPrice;
      
      const placement = getPlacementString(item.infrastructureElement, buildings);
      if (!existing.placements.includes(placement)) {
        existing.placements.push(placement);
      }
      
      if (item.notes && !existing.notes.includes(item.notes)) {
        existing.notes.push(item.notes);
      }
    } else {
      consolidated.set(key, {
        itemId: item.itemId,
        type: item.type,
        name: item.name,
        brand: item.brand,
        category: item.category,
        unit: item.unit,
        totalQuantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        placements: [getPlacementString(item.infrastructureElement, buildings)],
        notes: item.notes ? [item.notes] : [],
      });
    }
  });

  return Array.from(consolidated.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { equipment, siteSurveyData, buildings }: { 
      equipment: EquipmentItem[], 
      siteSurveyData?: SiteSurveyData,
      buildings?: Building[]
    } = body;

    if (!equipment || equipment.length === 0) {
      return NextResponse.json(
        { error: 'No equipment data provided' },
        { status: 400 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'KIMON CRM';
    workbook.lastModifiedBy = 'KIMON CRM';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create Project Information Sheet (first)
    await createProjectInfoSheet(workbook, siteSurveyData);
    
    // Create Site Structure Sheet (second)
    if (buildings && buildings.length > 0) {
      await createSiteStructureSheet(workbook, buildings, siteSurveyData);
    }
    
    // Create File Links Sheet (third)
    await createFileLinksSheet(workbook, siteSurveyData);
    
    // Create BOM Summary Sheet
    await createBOMSummarySheet(workbook, equipment, siteSurveyData, buildings);
    
    // Create Detailed BOM Sheet
    await createDetailedBOMSheet(workbook, equipment, siteSurveyData, buildings);
    
    // Create Products Only Sheet
    await createProductsSheet(workbook, equipment);
    
    // Create Services Only Sheet
    await createServicesSheet(workbook, equipment);
    
    // Create Cost Analysis Sheet
    await createCostAnalysisSheet(workbook, equipment);

    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="BOM_${siteSurveyData?.title || 'Survey'}_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating BOM Excel:', error);
    return NextResponse.json(
      { error: 'Failed to generate BOM Excel file' },
      { status: 500 }
    );
  }
}

async function createBOMSummarySheet(
  workbook: ExcelJS.Workbook, 
  equipment: EquipmentItem[], 
  siteSurveyData?: SiteSurveyData,
  buildings?: Building[]
) {
  const worksheet = workbook.addWorksheet('BOM Summary', {
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }
  });

  // Consolidate equipment
  const consolidatedEquipment = consolidateEquipment(equipment, buildings);

  // Header with project info
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'BILL OF MATERIALS SUMMARY';
  worksheet.getCell('A1').font = { size: 18, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getCell('A1').font = { color: { argb: 'FFFFFFFF' } };

  // Project Information
  if (siteSurveyData) {
    worksheet.getCell('A3').value = 'Project:';
    worksheet.getCell('B3').value = siteSurveyData.title;
    worksheet.getCell('A3').font = { bold: true };

    if (siteSurveyData.customer) {
      worksheet.getCell('A4').value = 'Customer:';
      worksheet.getCell('B4').value = siteSurveyData.customer.name;
      worksheet.getCell('A4').font = { bold: true };
    }

    worksheet.getCell('A5').value = 'Generated:';
    worksheet.getCell('B5').value = new Date().toLocaleDateString();
    worksheet.getCell('A5').font = { bold: true };
  }

  // Summary Statistics
  const products = equipment.filter(item => item.type === 'product');
  const services = equipment.filter(item => item.type === 'service');
  const totalQuantity = equipment.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = equipment.reduce((sum, item) => sum + item.totalPrice, 0);

  worksheet.getCell('A7').value = 'SUMMARY STATISTICS';
  worksheet.getCell('A7').font = { size: 14, bold: true };
  worksheet.getCell('A7').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' }
  };

  worksheet.getCell('A8').value = 'Total Items:';
  worksheet.getCell('B8').value = equipment.length;
  worksheet.getCell('A8').font = { bold: true };

  worksheet.getCell('A9').value = 'Products:';
  worksheet.getCell('B9').value = products.length;
  worksheet.getCell('A9').font = { bold: true };

  worksheet.getCell('A10').value = 'Services:';
  worksheet.getCell('B10').value = services.length;
  worksheet.getCell('A10').font = { bold: true };

  worksheet.getCell('A11').value = 'Total Quantity:';
  worksheet.getCell('B11').value = totalQuantity;
  worksheet.getCell('A11').font = { bold: true };

  worksheet.getCell('A12').value = 'Total Price:';
  worksheet.getCell('B12').value = `€${totalPrice.toFixed(2)}`;
  worksheet.getCell('A12').font = { bold: true };
  worksheet.getCell('B12').font = { bold: true, color: { argb: 'FF00B050' } };

  // Category Breakdown
  const categories = equipment.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  worksheet.getCell('A14').value = 'CATEGORY BREAKDOWN';
  worksheet.getCell('A14').font = { size: 14, bold: true };
  worksheet.getCell('A14').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' }
  };

  let row = 15;
  Object.entries(categories).forEach(([category, total]) => {
    worksheet.getCell(`A${row}`).value = category;
    worksheet.getCell(`B${row}`).value = `€${total.toFixed(2)}`;
    row++;
  });

  // Style the worksheet
  worksheet.columns = [
    { width: 25 },
    { width: 20 },
  ];
}

async function createDetailedBOMSheet(
  workbook: ExcelJS.Workbook, 
  equipment: EquipmentItem[], 
  siteSurveyData?: SiteSurveyData,
  buildings?: Building[]
) {
  const worksheet = workbook.addWorksheet('Detailed BOM', {
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }
  });

  // Consolidate equipment for detailed view
  const consolidatedEquipment = consolidateEquipment(equipment, buildings);
  
  // Headers
  const headers = [
    'Item #', 'Type', 'Name', 'Brand', 'Category', 'Unit', 
    'Unit Price', 'Quantity', 'Total Price', 'Placement', 'Notes'
  ];

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    cell.alignment = { horizontal: 'center' };
  });

  // Data rows with consolidated items
  consolidatedEquipment.forEach((item, index) => {
    const row = index + 2;
    worksheet.getCell(row, 1).value = index + 1;
    worksheet.getCell(row, 2).value = item.type.toUpperCase();
    worksheet.getCell(row, 3).value = item.name;
    worksheet.getCell(row, 4).value = item.brand || '';
    worksheet.getCell(row, 5).value = item.category;
    worksheet.getCell(row, 6).value = item.unit;
    worksheet.getCell(row, 7).value = item.price;
    worksheet.getCell(row, 8).value = item.totalQuantity;
    worksheet.getCell(row, 9).value = item.totalPrice;
    worksheet.getCell(row, 10).value = item.placements.join(', ');
    worksheet.getCell(row, 11).value = item.notes.join('; ') || '';

    // Format currency cells
    worksheet.getCell(row, 7).numFmt = '€#,##0.00';
    worksheet.getCell(row, 9).numFmt = '€#,##0.00';
    
    // Wrap text for placement and notes
    worksheet.getCell(row, 10).alignment = { wrapText: true, vertical: 'top' };
    worksheet.getCell(row, 11).alignment = { wrapText: true, vertical: 'top' };
  });

  // Add totals row
  const totalRow = consolidatedEquipment.length + 3;
  worksheet.getCell(totalRow, 8).value = 'TOTAL:';
  worksheet.getCell(totalRow, 8).font = { bold: true };
  worksheet.getCell(totalRow, 9).value = consolidatedEquipment.reduce((sum, item) => sum + item.totalPrice, 0);
  worksheet.getCell(totalRow, 9).font = { bold: true };
  worksheet.getCell(totalRow, 9).numFmt = '€#,##0.00';

  // Style the worksheet
  worksheet.columns = [
    { width: 8 },   // Item #
    { width: 12 },  // Type
    { width: 30 },  // Name
    { width: 15 },  // Brand
    { width: 15 },  // Category
    { width: 10 },  // Unit
    { width: 12 },  // Unit Price
    { width: 10 },  // Quantity
    { width: 12 },  // Total Price
    { width: 30 },  // Placement
    { width: 25 },  // Notes
  ];

  // Add borders to all cells - fixed for ExcelJS compatibility
  for (let row = 1; row <= consolidatedEquipment.length + 1; row++) {
    for (let col = 1; col <= headers.length; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }
}

async function createProductsSheet(workbook: ExcelJS.Workbook, equipment: EquipmentItem[]) {
  const products = equipment.filter(item => item.type === 'product');
  const worksheet = workbook.addWorksheet('Products Only');

  const headers = ['Name', 'Brand', 'Category', 'Unit Price', 'Quantity', 'Total Price', 'Notes'];
  
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    cell.font = { color: { argb: 'FFFFFFFF' } };
  });

  products.forEach((item, index) => {
    const row = index + 2;
    worksheet.getCell(row, 1).value = item.name;
    worksheet.getCell(row, 2).value = item.brand || '';
    worksheet.getCell(row, 3).value = item.category;
    worksheet.getCell(row, 4).value = item.price;
    worksheet.getCell(row, 5).value = item.quantity;
    worksheet.getCell(row, 6).value = item.totalPrice;
    worksheet.getCell(row, 7).value = item.notes || '';

    worksheet.getCell(row, 4).numFmt = '€#,##0.00';
    worksheet.getCell(row, 6).numFmt = '€#,##0.00';
  });

  worksheet.columns = [
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 10 },
    { width: 12 },
    { width: 25 },
  ];
}

async function createServicesSheet(workbook: ExcelJS.Workbook, equipment: EquipmentItem[]) {
  const services = equipment.filter(item => item.type === 'service');
  const worksheet = workbook.addWorksheet('Services Only');

  const headers = ['Name', 'Category', 'Unit Price', 'Quantity', 'Total Price', 'Notes'];
  
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC5504B' }
    };
    cell.font = { color: { argb: 'FFFFFFFF' } };
  });

  services.forEach((item, index) => {
    const row = index + 2;
    worksheet.getCell(row, 1).value = item.name;
    worksheet.getCell(row, 2).value = item.category;
    worksheet.getCell(row, 3).value = item.price;
    worksheet.getCell(row, 4).value = item.quantity;
    worksheet.getCell(row, 5).value = item.totalPrice;
    worksheet.getCell(row, 6).value = item.notes || '';

    worksheet.getCell(row, 3).numFmt = '€#,##0.00';
    worksheet.getCell(row, 5).numFmt = '€#,##0.00';
  });

  worksheet.columns = [
    { width: 30 },
    { width: 15 },
    { width: 12 },
    { width: 10 },
    { width: 12 },
    { width: 25 },
  ];
}

async function createCostAnalysisSheet(workbook: ExcelJS.Workbook, equipment: EquipmentItem[]) {
  const worksheet = workbook.addWorksheet('Cost Analysis');

  // Category analysis
  const categoryTotals = equipment.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { count: 0, total: 0, quantity: 0 };
    }
    acc[item.category].count++;
    acc[item.category].total += item.totalPrice;
    acc[item.category].quantity += item.quantity;
    return acc;
  }, {} as Record<string, { count: number; total: number; quantity: number }>);

  worksheet.getCell('A1').value = 'CATEGORY COST ANALYSIS';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getCell('A1').font = { color: { argb: 'FFFFFFFF' } };

  const headers = ['Category', 'Items', 'Quantity', 'Total Cost', 'Avg. Cost per Item'];
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(3, index + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' }
    };
  });

  let row = 4;
  Object.entries(categoryTotals).forEach(([category, data]) => {
    worksheet.getCell(row, 1).value = category;
    worksheet.getCell(row, 2).value = data.count;
    worksheet.getCell(row, 3).value = data.quantity;
    worksheet.getCell(row, 4).value = data.total;
    worksheet.getCell(row, 5).value = data.total / data.count;

    worksheet.getCell(row, 4).numFmt = '€#,##0.00';
    worksheet.getCell(row, 5).numFmt = '€#,##0.00';
    row++;
  });

  // Add totals
  const totalRow = row + 1;
  worksheet.getCell(totalRow, 1).value = 'TOTAL';
  worksheet.getCell(totalRow, 1).font = { bold: true };
  worksheet.getCell(totalRow, 2).value = equipment.length;
  worksheet.getCell(totalRow, 2).font = { bold: true };
  worksheet.getCell(totalRow, 3).value = equipment.reduce((sum, item) => sum + item.quantity, 0);
  worksheet.getCell(totalRow, 3).font = { bold: true };
  worksheet.getCell(totalRow, 4).value = equipment.reduce((sum, item) => sum + item.totalPrice, 0);
  worksheet.getCell(totalRow, 4).font = { bold: true };
  worksheet.getCell(totalRow, 4).numFmt = '€#,##0.00';

  worksheet.columns = [
    { width: 20 },
    { width: 10 },
    { width: 12 },
    { width: 15 },
    { width: 18 },
  ];
}

async function createProjectInfoSheet(workbook: ExcelJS.Workbook, siteSurveyData?: SiteSurveyData) {
  const worksheet = workbook.addWorksheet('Project Information');

  worksheet.getCell('A1').value = 'PROJECT INFORMATION';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getCell('A1').font = { color: { argb: 'FFFFFFFF' } };

  if (siteSurveyData) {
    const info = [
      ['Project Name:', siteSurveyData.title],
      ['Customer:', siteSurveyData.customer?.name || 'N/A'],
      ['Customer Email:', siteSurveyData.customer?.email || 'N/A'],
      ['Customer Phone:', siteSurveyData.customer?.phone || 'N/A'],
      ['Contact Person:', siteSurveyData.contact?.name || 'N/A'],
      ['Contact Email:', siteSurveyData.contact?.email || 'N/A'],
      ['Contact Phone:', siteSurveyData.contact?.phone || 'N/A'],
      ['Assigned To:', siteSurveyData.assignTo?.name || 'N/A'],
      ['Created:', new Date(siteSurveyData.createdAt).toLocaleDateString()],
      ['Last Updated:', new Date(siteSurveyData.updatedAt).toLocaleDateString()],
      ['BOM Generated:', new Date().toLocaleDateString()],
    ];

    info.forEach(([label, value], index) => {
      const row = index + 3;
      worksheet.getCell(row, 1).value = label;
      worksheet.getCell(row, 1).font = { bold: true };
      worksheet.getCell(row, 2).value = value;
    });
  }

  worksheet.columns = [
    { width: 20 },
    { width: 30 },
  ];
}

async function createSiteStructureSheet(
  workbook: ExcelJS.Workbook, 
  buildings: Building[], 
  siteSurveyData?: SiteSurveyData
) {
  const worksheet = workbook.addWorksheet('Site Structure', {
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }
  });

  // Header
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'SITE STRUCTURE HIERARCHY';
  worksheet.getCell('A1').font = { size: 18, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getCell('A1').font = { color: { argb: 'FFFFFFFF' } };

  // Project info
  if (siteSurveyData) {
    worksheet.getCell('A3').value = 'Project:';
    worksheet.getCell('B3').value = siteSurveyData.title;
    worksheet.getCell('A3').font = { bold: true };

    if (siteSurveyData.description) {
      worksheet.getCell('A4').value = 'Description:';
      worksheet.getCell('B4').value = siteSurveyData.description;
      worksheet.getCell('A4').font = { bold: true };
      worksheet.getCell('B4').alignment = { wrapText: true };
    }

    worksheet.getCell('A5').value = 'Generated:';
    worksheet.getCell('B5').value = new Date().toLocaleDateString();
    worksheet.getCell('A5').font = { bold: true };
  }

  // Headers for structure table
  const headers = ['Level', 'Type', 'Name', 'Code', 'Location/Details', 'Devices', 'Images', 'Blueprints', 'Notes'];
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(7, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    cell.alignment = { horizontal: 'center' };
  });

  let row = 8;

  // Process each building
  buildings.forEach((building, buildingIndex) => {
    // Building row
    worksheet.getCell(row, 1).value = '1';
    worksheet.getCell(row, 2).value = 'Building';
    worksheet.getCell(row, 3).value = building.name;
    worksheet.getCell(row, 4).value = building.code || '';
    worksheet.getCell(row, 5).value = building.address || '';
    worksheet.getCell(row, 6).value = '';
    
    // Building Images
    if (building.images && building.images.length > 0) {
      worksheet.getCell(row, 7).value = {
        text: `View (${building.images.length})`,
        hyperlink: building.images[0]
      };
      worksheet.getCell(row, 7).font = { 
        color: { argb: 'FF0000FF' },
        underline: true 
      };
    } else {
      worksheet.getCell(row, 7).value = '';
    }
    
    worksheet.getCell(row, 8).value = ''; // Blueprints (buildings don't have blueprints)
    worksheet.getCell(row, 9).value = building.notes || '';
    
    // Style building row
    for (let col = 1; col <= 9; col++) {
      const cell = worksheet.getCell(row, col);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      cell.font = { bold: true };
      // Reset hyperlink color and underline for images column
      if (col === 7 && building.images && building.images.length > 0) {
        cell.font = { 
          bold: true,
          color: { argb: 'FF0000FF' },
          underline: true 
        };
      }
    }
    row++;

    // Central Rack
    if (building.centralRack) {
      worksheet.getCell(row, 1).value = '2';
      worksheet.getCell(row, 2).value = 'Central Rack';
      worksheet.getCell(row, 3).value = building.centralRack.name;
      worksheet.getCell(row, 4).value = building.centralRack.code || '';
      worksheet.getCell(row, 5).value = building.centralRack.location || '';
      worksheet.getCell(row, 6).value = building.centralRack.devices?.length || 0;
      
      // Central Rack Images
      if (building.centralRack.images && building.centralRack.images.length > 0) {
        worksheet.getCell(row, 7).value = {
          text: `View (${building.centralRack.images.length})`,
          hyperlink: building.centralRack.images[0]
        };
        worksheet.getCell(row, 7).font = { 
          color: { argb: 'FF0000FF' },
          underline: true 
        };
      } else {
        worksheet.getCell(row, 7).value = '';
      }
      
      worksheet.getCell(row, 8).value = ''; // Blueprints
      worksheet.getCell(row, 9).value = building.centralRack.notes || '';
      
      // Style central rack row
      for (let col = 1; col <= 9; col++) {
        const cell = worksheet.getCell(row, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7F3FF' }
        };
        // Reset hyperlink color and underline for images column
        if (col === 7 && building.centralRack.images && building.centralRack.images.length > 0) {
          cell.font = { 
            color: { argb: 'FF0000FF' },
            underline: true 
          };
        }
      }
      row++;

      // Central Rack Devices
      if (building.centralRack.devices && building.centralRack.devices.length > 0) {
        building.centralRack.devices.forEach((device) => {
          worksheet.getCell(row, 1).value = '3';
          worksheet.getCell(row, 2).value = 'Device';
          worksheet.getCell(row, 3).value = device.name;
          worksheet.getCell(row, 4).value = device.model || '';
          worksheet.getCell(row, 5).value = `${device.type}${device.brand ? ` (${device.brand})` : ''}`;
          worksheet.getCell(row, 6).value = device.quantity || 1;
          worksheet.getCell(row, 7).value = ''; // Devices don't have images
          worksheet.getCell(row, 8).value = ''; // Devices don't have blueprints
          worksheet.getCell(row, 9).value = device.notes || '';
          row++;
        });
      }
    }

    // Process floors
    building.floors.forEach((floor, floorIndex) => {
      worksheet.getCell(row, 1).value = '2';
      worksheet.getCell(row, 2).value = 'Floor';
      worksheet.getCell(row, 3).value = floor.name;
      worksheet.getCell(row, 4).value = floor.level?.toString() || '';
      worksheet.getCell(row, 5).value = `Level ${floor.level || floorIndex + 1}`;
      worksheet.getCell(row, 6).value = '';
      
      // Floor Images
      if (floor.images && floor.images.length > 0) {
        worksheet.getCell(row, 7).value = {
          text: `View (${floor.images.length})`,
          hyperlink: floor.images[0]
        };
        worksheet.getCell(row, 7).font = { 
          color: { argb: 'FF0000FF' },
          underline: true 
        };
      } else {
        worksheet.getCell(row, 7).value = '';
      }
      
      // Floor Blueprint
      if (floor.blueprintUrl) {
        worksheet.getCell(row, 8).value = {
          text: 'View Blueprint',
          hyperlink: floor.blueprintUrl
        };
        worksheet.getCell(row, 8).font = { 
          color: { argb: 'FF0000FF' },
          underline: true 
        };
      } else {
        worksheet.getCell(row, 8).value = '';
      }
      
      worksheet.getCell(row, 9).value = '';
      
      // Style floor row
      for (let col = 1; col <= 9; col++) {
        const cell = worksheet.getCell(row, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7F3FF' }
        };
        // Reset hyperlink colors
        if ((col === 7 && floor.images && floor.images.length > 0) || 
            (col === 8 && floor.blueprintUrl)) {
          cell.font = { 
            color: { argb: 'FF0000FF' },
            underline: true 
          };
        }
      }
      row++;

      // Floor Racks
      if (floor.floorRacks) {
        floor.floorRacks.forEach((rack, rackIndex) => {
          worksheet.getCell(row, 1).value = '3';
          worksheet.getCell(row, 2).value = 'Floor Rack';
          worksheet.getCell(row, 3).value = rack.name;
          worksheet.getCell(row, 4).value = rack.code || '';
          worksheet.getCell(row, 5).value = rack.location || '';
          worksheet.getCell(row, 6).value = rack.devices?.length || 0;
          
          // Floor Rack Images
          if (rack.images && rack.images.length > 0) {
            worksheet.getCell(row, 7).value = {
              text: `View (${rack.images.length})`,
              hyperlink: rack.images[0]
            };
            worksheet.getCell(row, 7).font = { 
              color: { argb: 'FF0000FF' },
              underline: true 
            };
          } else {
            worksheet.getCell(row, 7).value = '';
          }
          
          worksheet.getCell(row, 8).value = ''; // No blueprints for racks
          worksheet.getCell(row, 9).value = rack.notes || '';
          row++;

          // Floor Rack Devices
          if (rack.devices && rack.devices.length > 0) {
            rack.devices.forEach((device) => {
              worksheet.getCell(row, 1).value = '4';
              worksheet.getCell(row, 2).value = 'Device';
              worksheet.getCell(row, 3).value = device.name;
              worksheet.getCell(row, 4).value = device.model || '';
              worksheet.getCell(row, 5).value = `${device.type}${device.brand ? ` (${device.brand})` : ''}`;
              worksheet.getCell(row, 6).value = device.quantity || 1;
              worksheet.getCell(row, 7).value = ''; // No images
              worksheet.getCell(row, 8).value = ''; // No blueprints
              worksheet.getCell(row, 9).value = device.notes || '';
              row++;
            });
          }
        });
      }

      // Rooms
      if (floor.rooms) {
        floor.rooms.forEach((room, roomIndex) => {
          worksheet.getCell(row, 1).value = '3';
          worksheet.getCell(row, 2).value = 'Room';
          worksheet.getCell(row, 3).value = room.name;
          worksheet.getCell(row, 4).value = room.type;
          worksheet.getCell(row, 5).value = `${room.outlets} outlets, ${room.connectionType}${room.identicalRoomsCount ? ` (×${room.identicalRoomsCount})` : ''}`;
          worksheet.getCell(row, 6).value = room.devices?.length || 0;
          worksheet.getCell(row, 7).value = ''; // Rooms don't have images in this structure
          worksheet.getCell(row, 8).value = ''; // Rooms don't have blueprints
          worksheet.getCell(row, 9).value = room.notes || '';
          row++;

          // Room Devices
          if (room.devices && room.devices.length > 0) {
            room.devices.forEach((device) => {
              worksheet.getCell(row, 1).value = '4';
              worksheet.getCell(row, 2).value = 'Device';
              worksheet.getCell(row, 3).value = device.name;
              worksheet.getCell(row, 4).value = device.model || '';
              worksheet.getCell(row, 5).value = `${device.type}${device.brand ? ` (${device.brand})` : ''}`;
              worksheet.getCell(row, 6).value = device.quantity || 1;
              worksheet.getCell(row, 7).value = ''; // No images
              worksheet.getCell(row, 8).value = ''; // No blueprints
              worksheet.getCell(row, 9).value = device.notes || '';
              row++;
            });
          }
        });
      }
    });

    // Add spacing between buildings
    row++;
  });

  // Add borders to all cells
  for (let r = 7; r < row; r++) {
    for (let c = 1; c <= 9; c++) {
      const cell = worksheet.getCell(r, c);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }

  // Set column widths
  worksheet.columns = [
    { width: 8 },   // Level
    { width: 15 },  // Type
    { width: 25 },  // Name
    { width: 15 },  // Code
    { width: 30 },  // Location/Details
    { width: 10 },  // Devices
    { width: 15 },  // Images
    { width: 15 },  // Blueprints
    { width: 25 },  // Notes
  ];
}

async function createFileLinksSheet(
  workbook: ExcelJS.Workbook, 
  siteSurveyData?: SiteSurveyData
) {
  if (!siteSurveyData?.files || siteSurveyData.files.length === 0) {
    return;
  }

  const worksheet = workbook.addWorksheet('File Links', {
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }
  });

  // Header
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = 'ATTACHED FILES & BLUEPRINTS';
  worksheet.getCell('A1').font = { size: 18, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getCell('A1').font = { color: { argb: 'FFFFFFFF' } };

  // Project info
  worksheet.getCell('A3').value = 'Project:';
  worksheet.getCell('B3').value = siteSurveyData.title;
  worksheet.getCell('A3').font = { bold: true };

  worksheet.getCell('A4').value = 'Generated:';
  worksheet.getCell('B4').value = new Date().toLocaleDateString();
  worksheet.getCell('A4').font = { bold: true };

  // Headers for file table
  const headers = ['File Name', 'Type', 'Description', 'Download Link'];
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(6, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    cell.alignment = { horizontal: 'center' };
  });

  // File data rows
  siteSurveyData.files.forEach((file, index) => {
    const row = index + 7;
    worksheet.getCell(row, 1).value = file.name;
    worksheet.getCell(row, 2).value = file.filetype.toUpperCase();
    worksheet.getCell(row, 3).value = file.description || '';
    
    // Make the URL a proper hyperlink
    worksheet.getCell(row, 4).value = {
      text: 'Download',
      hyperlink: file.url
    };
    worksheet.getCell(row, 4).font = { 
      color: { argb: 'FF0000FF' },
      underline: true 
    };
    
    // Add borders
    for (let col = 1; col <= 4; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  });

  // Set column widths
  worksheet.columns = [
    { width: 30 },  // File Name
    { width: 15 },  // Type
    { width: 40 },  // Description
    { width: 50 },  // Download Link
  ];
}
