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
}

// Helper function to format placement information
function getPlacementString(element?: SelectedElement): string {
  if (!element) return 'General';
  
  const parts: string[] = [];
  
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

function consolidateEquipment(equipment: EquipmentItem[]): ConsolidatedItem[] {
  const consolidated = new Map<string, ConsolidatedItem>();

  equipment.forEach(item => {
    const key = `${item.type}-${item.itemId}-${item.name}-${item.price}`;
    
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.totalQuantity += item.quantity;
      existing.totalPrice += item.totalPrice;
      
      const placement = getPlacementString(item.infrastructureElement);
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
        placements: [getPlacementString(item.infrastructureElement)],
        notes: item.notes ? [item.notes] : [],
      });
    }
  });

  return Array.from(consolidated.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { equipment, siteSurveyData }: { 
      equipment: EquipmentItem[], 
      siteSurveyData?: SiteSurveyData 
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

    // Create BOM Summary Sheet
    await createBOMSummarySheet(workbook, equipment, siteSurveyData);
    
    // Create Detailed BOM Sheet
    await createDetailedBOMSheet(workbook, equipment, siteSurveyData);
    
    // Create Products Only Sheet
    await createProductsSheet(workbook, equipment);
    
    // Create Services Only Sheet
    await createServicesSheet(workbook, equipment);
    
    // Create Cost Analysis Sheet
    await createCostAnalysisSheet(workbook, equipment);
    
    // Create Project Information Sheet
    await createProjectInfoSheet(workbook, siteSurveyData);

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
  siteSurveyData?: SiteSurveyData
) {
  const worksheet = workbook.addWorksheet('BOM Summary', {
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }
  });

  // Consolidate equipment
  const consolidatedEquipment = consolidateEquipment(equipment);

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
  siteSurveyData?: SiteSurveyData
) {
  const worksheet = workbook.addWorksheet('Detailed BOM', {
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 }
  });

  // Consolidate equipment for detailed view
  const consolidatedEquipment = consolidateEquipment(equipment);
  
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
