import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import ExcelJS from 'exceljs';
import { uploadFileToBunny } from '@/lib/bunny/upload';

export const dynamic = 'force-dynamic';

interface EquipmentItem {
  id: string;
  itemId: string;
  name: string;
  type: 'product' | 'service';
  brand?: string;
  category: string;
  unit: string;
  quantity: number;
  price: number;
  margin?: number;
  totalPrice: number;
  notes?: string;
  infrastructureElement?: any;
}

interface Building {
  name: string;
  code?: string;
  address?: string;
  floors: any[];
  centralRacks: any[];
}

interface ConsolidatedItem {
  itemId: string;
  name: string;
  type: 'product' | 'service';
  brand?: string;
  category: string;
  unit: string;
  price: number;
  totalQuantity: number;
  totalPrice: number;
  placements: string[];
  notes: string[];
}

function consolidateEquipment(equipment: EquipmentItem[], buildings?: Building[]): ConsolidatedItem[] {
  const consolidated = new Map<string, ConsolidatedItem>();

  equipment.forEach((item) => {
    const key = `${item.itemId}-${item.type}`;
    
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.totalQuantity += item.quantity;
      existing.totalPrice += item.totalPrice;
      
      if (item.infrastructureElement) {
        const locationName = getLocationName(item.infrastructureElement, buildings);
        if (locationName && !existing.placements.includes(locationName)) {
          existing.placements.push(locationName);
        }
      }
      
      if (item.notes && !existing.notes.includes(item.notes)) {
        existing.notes.push(item.notes);
      }
    } else {
      const placements: string[] = [];
      if (item.infrastructureElement) {
        const locationName = getLocationName(item.infrastructureElement, buildings);
        if (locationName) {
          placements.push(locationName);
        }
      }
      
      consolidated.set(key, {
        itemId: item.itemId,
        name: item.name,
        type: item.type,
        brand: item.brand,
        category: item.category,
        unit: item.unit,
        price: item.price,
        totalQuantity: item.quantity,
        totalPrice: item.totalPrice,
        placements,
        notes: item.notes ? [item.notes] : [],
      });
    }
  });

  return Array.from(consolidated.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getLocationName(element: any, buildings?: Building[]): string {
  if (!element) return 'General';
  
  const parts: string[] = [];
  
  if (element.buildingName) {
    parts.push(element.buildingName);
  }
  
  if (element.floorName) {
    parts.push(element.floorName);
  }
  
  if (element.rackName) {
    parts.push(element.rackName);
  }
  
  if (element.roomName) {
    parts.push(element.roomName);
  }
  
  return parts.length > 0 ? parts.join(' → ') : 'General';
}

async function generateBOMExcel(equipment: EquipmentItem[], siteSurveyData: any, buildings?: Building[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'KIMON CRM';
  workbook.created = new Date();

  // Create BOM Summary Sheet
  const summarySheet = workbook.addWorksheet('BOM Summary');
  
  // Header
  summarySheet.mergeCells('A1:H1');
  summarySheet.getCell('A1').value = 'BILL OF MATERIALS SUMMARY';
  summarySheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };
  summarySheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };

  // Project Info
  if (siteSurveyData) {
    summarySheet.getCell('A3').value = 'Project:';
    summarySheet.getCell('B3').value = siteSurveyData.title;
    summarySheet.getCell('A3').font = { bold: true };
    
    if (siteSurveyData.customer) {
      summarySheet.getCell('A4').value = 'Customer:';
      summarySheet.getCell('B4').value = siteSurveyData.customer.name;
      summarySheet.getCell('A4').font = { bold: true };
    }
    
    summarySheet.getCell('A5').value = 'Generated:';
    summarySheet.getCell('B5').value = new Date().toLocaleDateString();
    summarySheet.getCell('A5').font = { bold: true };
  }

  // Consolidated equipment
  const consolidatedEquipment = consolidateEquipment(equipment, buildings);

  // Create detailed BOM sheet
  const detailSheet = workbook.addWorksheet('Detailed BOM');
  const headers = ['Item #', 'Type', 'Name', 'Brand', 'Category', 'Unit', 'Unit Price', 'Quantity', 'Total Price', 'Placement', 'Notes'];
  
  headers.forEach((header, index) => {
    const cell = detailSheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    cell.alignment = { horizontal: 'center' };
  });

  // Data rows
  consolidatedEquipment.forEach((item, index) => {
    const row = index + 2;
    detailSheet.getCell(row, 1).value = index + 1;
    detailSheet.getCell(row, 2).value = item.type.toUpperCase();
    detailSheet.getCell(row, 3).value = item.name;
    detailSheet.getCell(row, 4).value = item.brand || '';
    detailSheet.getCell(row, 5).value = item.category;
    detailSheet.getCell(row, 6).value = item.unit;
    detailSheet.getCell(row, 7).value = item.price;
    detailSheet.getCell(row, 8).value = item.totalQuantity;
    detailSheet.getCell(row, 9).value = item.totalPrice;
    detailSheet.getCell(row, 10).value = item.placements.join(', ');
    detailSheet.getCell(row, 11).value = item.notes.join('; ');

    detailSheet.getCell(row, 7).numFmt = '€#,##0.00';
    detailSheet.getCell(row, 9).numFmt = '€#,##0.00';
  });

  // Adjust column widths
  detailSheet.columns = [
    { width: 8 },
    { width: 10 },
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 10 },
    { width: 12 },
    { width: 10 },
    { width: 12 },
    { width: 25 },
    { width: 30 }
  ];

  return await workbook.xlsx.writeBuffer();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { equipment, buildings } = body;

    // Fetch site survey data
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Generate Excel file
    const arrayBuffer = await generateBOMExcel(equipment, siteSurvey, buildings);
    const buffer = Buffer.from(arrayBuffer);
    
    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `BOM_${siteSurvey.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;
    
    // Upload to BunnyCDN
    const uploadResult = await uploadFileToBunny(
      buffer,
      fileName,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Create file reference in database
    await prisma.file.create({
      data: {
        entityId: id,
        type: 'SITESURVEY',
        name: fileName,
        title: 'BOM Excel',
        filetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: uploadResult.url,
        description: `BOM Excel for site survey: ${siteSurvey.title}`,
        size: buffer.length,
      },
    });

    return NextResponse.json({
      success: true,
      fileName,
      url: uploadResult.url,
      message: 'BOM Excel generated and uploaded successfully',
    });

  } catch (error) {
    console.error('Error generating and uploading BOM:', error);
    return NextResponse.json(
      { error: 'Failed to generate and upload BOM Excel', details: (error as Error).message },
      { status: 500 }
    );
  }
}

