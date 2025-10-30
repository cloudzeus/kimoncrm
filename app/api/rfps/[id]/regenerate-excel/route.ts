import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import ExcelJS from "exceljs";
import { bunnyPut } from "@/lib/bunny/upload";

/**
 * POST - Regenerate Excel file from existing RFP data
 * Creates new Excel file with current pricing data, uploads to BunnyCDN,
 * and maintains versioning
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rfpId } = await params;

    // Get RFP with all related data
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        lead: {
          select: {
            id: true,
            leadNumber: true,
            title: true,
          },
        },
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    if (!rfp.leadId) {
      return NextResponse.json(
        { error: "RFP is not linked to a lead" },
        { status: 400 }
      );
    }

    const requirements = rfp.requirements as any || {};
    const equipment = requirements.equipment || [];
    const totals = requirements.totals || {};
    const generalNotes = requirements.generalNotes || "";

    if (equipment.length === 0) {
      return NextResponse.json(
        { error: "No equipment data in RFP" },
        { status: 400 }
      );
    }

    const leadId = rfp.leadId;
    const leadNumber = rfp.lead?.leadNumber || "UNKNOWN";
    const customerName = rfp.customer?.name || "Customer";

    // Generate Excel using the same function as initial generation
    const workbook = await generatePricingExcel({
      equipment,
      leadNumber,
      customerName,
      siteSurveyTitle: rfp.title,
      rfpNumber: rfp.rfpNo || 'Draft',
      generalNotes,
      totals,
    });

    // Convert workbook to buffer
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    // Determine version number
    const baseFileName = `${leadNumber} - RFP Pricing`;
    const existingFiles = await prisma.file.findMany({
      where: {
        entityId: leadId,
        type: 'LEAD',
        name: {
          startsWith: baseFileName,
          contains: ' - v',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate next version number
    let versionNumber = 1;
    if (existingFiles.length > 0) {
      const versions = existingFiles
        .map(f => {
          const match = f.name.match(/ - v(\d+)\.xlsx$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(v => v > 0);
      
      if (versions.length > 0) {
        versionNumber = Math.max(...versions) + 1;
      }
    }

    // Check if we have reached max versions (10)
    if (existingFiles.length >= 10) {
      const oldestFile = existingFiles[existingFiles.length - 1];
      await prisma.file.delete({
        where: { id: oldestFile.id },
      });
    }

    // Create filename with version
    const filename = `${baseFileName} - v${versionNumber}.xlsx`;

    // Upload to BunnyCDN
    const timestamp = Date.now();
    const sanitizedFileName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const bunnyPath = `leads/${leadId}/rfp-pricing/${timestamp}_${sanitizedFileName}`;
    
    const uploadResult = await bunnyPut(bunnyPath, buffer);

    const products = equipment.filter((item: any) => item.type === 'product');
    const services = equipment.filter((item: any) => item.type === 'service');

    // Save file record to database linked to LEAD
    const fileRecord = await prisma.file.create({
      data: {
        name: filename,
        filetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        url: uploadResult.url,
        entityId: leadId,
        type: 'LEAD',
        description: `RFP Pricing Document (Regenerated) - ${products.length} products, ${services.length} services (v${versionNumber}) - RFP: ${rfp.rfpNo}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully regenerated pricing Excel',
      file: {
        filename,
        fileId: fileRecord.id,
        url: uploadResult.url,
        version: versionNumber,
        productsCount: products.length,
        servicesCount: services.length,
      },
      totals: {
        grandTotal: totals.grandTotal,
        productsTotal: totals.productsTotal,
        servicesTotal: totals.servicesTotal,
      },
    });

  } catch (error) {
    console.error("Error regenerating Excel:", error);
    return NextResponse.json(
      { 
        error: "Failed to regenerate Excel",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to generate pricing Excel (same as in generate-rfp route)
async function generatePricingExcel(data: {
  equipment: any[];
  leadNumber: string;
  customerName: string;
  siteSurveyTitle: string;
  rfpNumber: string;
  generalNotes: string;
  totals: any;
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KimonCRM';
  workbook.created = new Date();

  const products = data.equipment.filter((item: any) => item.type === 'product');
  const services = data.equipment.filter((item: any) => item.type === 'service');

  // TAB 1: PRICING SUMMARY
  const summarySheet = workbook.addWorksheet('PRICING SUMMARY');
  
  summarySheet.mergeCells('A1:H1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `RFP PRICING DOCUMENT`;
  titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' }
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 40;

  summarySheet.getCell('A3').value = 'RFP Number:';
  summarySheet.getCell('B3').value = data.rfpNumber;
  summarySheet.getCell('A4').value = 'Lead Number:';
  summarySheet.getCell('B4').value = data.leadNumber;
  summarySheet.getCell('A5').value = 'Customer:';
  summarySheet.getCell('B5').value = data.customerName;
  summarySheet.getCell('A6').value = 'Project:';
  summarySheet.getCell('B6').value = data.siteSurveyTitle;
  summarySheet.getCell('A7').value = 'Generated:';
  summarySheet.getCell('B7').value = new Date().toLocaleString();
  
  ['A3', 'A4', 'A5', 'A6', 'A7'].forEach(cell => {
    summarySheet.getCell(cell).font = { bold: true };
  });

  summarySheet.columns = [
    { width: 20 }, { width: 40 }, { width: 15 }, { width: 15 },
    { width: 15 }, { width: 15 }, { width: 15 }, { width: 20 }
  ];

  let row = 9;
  summarySheet.getCell(`A${row}`).value = 'PRICING SUMMARY';
  summarySheet.getCell(`A${row}`).font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E86AB' }
  };
  summarySheet.mergeCells(`A${row}:H${row}`);
  row++;

  summarySheet.getCell(`A${row}`).value = 'Category';
  summarySheet.getCell(`B${row}`).value = 'Items Count';
  summarySheet.getCell(`C${row}`).value = 'Subtotal (€)';
  summarySheet.getCell(`D${row}`).value = 'Margin (€)';
  summarySheet.getCell(`E${row}`).value = 'Total (€)';
  summarySheet.getRow(row).font = { bold: true };
  summarySheet.getRow(row).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F4F8' }
  };
  row++;

  // Products row
  summarySheet.getCell(`A${row}`).value = 'Products';
  summarySheet.getCell(`B${row}`).value = products.length;
  summarySheet.getCell(`C${row}`).value = data.totals.productsSubtotal;
  summarySheet.getCell(`C${row}`).numFmt = '€#,##0.00';
  summarySheet.getCell(`D${row}`).value = data.totals.productsMargin;
  summarySheet.getCell(`D${row}`).numFmt = '€#,##0.00';
  summarySheet.getCell(`E${row}`).value = data.totals.productsTotal;
  summarySheet.getCell(`E${row}`).numFmt = '€#,##0.00';
  row++;

  // Services row
  summarySheet.getCell(`A${row}`).value = 'Services';
  summarySheet.getCell(`B${row}`).value = services.length;
  summarySheet.getCell(`C${row}`).value = data.totals.servicesSubtotal;
  summarySheet.getCell(`C${row}`).numFmt = '€#,##0.00';
  summarySheet.getCell(`D${row}`).value = data.totals.servicesMargin;
  summarySheet.getCell(`D${row}`).numFmt = '€#,##0.00';
  summarySheet.getCell(`E${row}`).value = data.totals.servicesTotal;
  summarySheet.getCell(`E${row}`).numFmt = '€#,##0.00';
  row++;

  // Grand Total
  summarySheet.getCell(`A${row}`).value = 'GRAND TOTAL';
  summarySheet.getCell(`E${row}`).value = data.totals.grandTotal;
  summarySheet.getCell(`E${row}`).numFmt = '€#,##0.00';
  summarySheet.getRow(row).font = { size: 14, bold: true };
  summarySheet.getRow(row).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF6B6B' }
  };
  summarySheet.getRow(row).height = 30;

  // TAB 2: PRODUCTS
  if (products.length > 0) {
    const productsSheet = workbook.addWorksheet('PRODUCTS');
    
    productsSheet.columns = [
      { width: 10 }, { width: 35 }, { width: 20 }, { width: 20 },
      { width: 12 }, { width: 15 }, { width: 12 }, { width: 15 },
      { width: 40 }, { width: 40 }
    ];

    productsSheet.mergeCells('A1:J1');
    const prodTitleCell = productsSheet.getCell('A1');
    prodTitleCell.value = 'PRODUCTS PRICING';
    prodTitleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    prodTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E86AB' }
    };
    prodTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    productsSheet.getRow(1).height = 30;

    const headers = ['#', 'Product', 'Brand', 'Category', 'Qty', 'Unit Price (€)', 'Margin (%)', 'Total (€)', 'Location', 'Notes'];
    productsSheet.addRow(headers);
    const headerRow = productsSheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A90A4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    let currentRow = 3;
    products.forEach((product: any, index: number) => {
      const location = product.infrastructureElement 
        ? `${product.infrastructureElement.buildingName || ''} - ${product.infrastructureElement.floorName || ''} - ${product.infrastructureElement.elementName || ''}`
        : 'General';

      productsSheet.addRow([
        index + 1,
        product.name || 'N/A',
        product.brand || '-',
        product.category || 'N/A',
        product.quantity || 0,
        product.price || 0,
        product.margin || 0,
        product.totalPrice || 0,
        location,
        product.notes || ''
      ]);
      
      const dataRow = productsSheet.getRow(currentRow);
      dataRow.alignment = { vertical: 'middle' };
      dataRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' };
      dataRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
      dataRow.getCell(6).numFmt = '€#,##0.00';
      dataRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
      dataRow.getCell(7).numFmt = '0.00"%"';
      dataRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };
      dataRow.getCell(8).numFmt = '€#,##0.00';
      
      currentRow++;
    });

    productsSheet.addRow(['', '', '', '', '', '', 'SUBTOTAL:', data.totals.productsSubtotal, '', '']);
    productsSheet.getRow(currentRow).font = { bold: true };
    productsSheet.getRow(currentRow).getCell(7).alignment = { horizontal: 'right' };
    productsSheet.getRow(currentRow).getCell(8).alignment = { horizontal: 'right' };
    productsSheet.getRow(currentRow).getCell(8).numFmt = '€#,##0.00';
    currentRow++;

    productsSheet.addRow(['', '', '', '', '', '', 'MARGIN:', data.totals.productsMargin, '', '']);
    productsSheet.getRow(currentRow).font = { bold: true, color: { argb: 'FF27AE60' } };
    productsSheet.getRow(currentRow).getCell(7).alignment = { horizontal: 'right' };
    productsSheet.getRow(currentRow).getCell(8).alignment = { horizontal: 'right' };
    productsSheet.getRow(currentRow).getCell(8).numFmt = '€#,##0.00';
    currentRow++;

    productsSheet.addRow(['', '', '', '', '', '', 'TOTAL:', data.totals.productsTotal, '', '']);
    productsSheet.getRow(currentRow).font = { bold: true, size: 12 };
    productsSheet.getRow(currentRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' }
    };
    productsSheet.getRow(currentRow).getCell(7).alignment = { horizontal: 'right' };
    productsSheet.getRow(currentRow).getCell(8).alignment = { horizontal: 'right' };
    productsSheet.getRow(currentRow).getCell(8).numFmt = '€#,##0.00';

    for (let row = 2; row <= currentRow; row++) {
      for (let col = 1; col <= 10; col++) {
        const cell = productsSheet.getRow(row).getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      }
    }
  }

  // TAB 3: SERVICES
  if (services.length > 0) {
    const servicesSheet = workbook.addWorksheet('SERVICES');
    
    servicesSheet.columns = [
      { width: 10 }, { width: 35 }, { width: 20 }, { width: 12 },
      { width: 15 }, { width: 12 }, { width: 15 }, { width: 40 }, { width: 40 }
    ];

    servicesSheet.mergeCells('A1:I1');
    const servTitleCell = servicesSheet.getCell('A1');
    servTitleCell.value = 'SERVICES PRICING';
    servTitleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    servTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16A085' }
    };
    servTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    servicesSheet.getRow(1).height = 30;

    const headers = ['#', 'Service', 'Category', 'Qty', 'Unit Price (€)', 'Margin (%)', 'Total (€)', 'Location', 'Notes'];
    servicesSheet.addRow(headers);
    const headerRow = servicesSheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF27AE60' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    let currentRow = 3;
    services.forEach((service: any, index: number) => {
      const location = service.infrastructureElement 
        ? `${service.infrastructureElement.buildingName || ''} - ${service.infrastructureElement.floorName || ''} - ${service.infrastructureElement.elementName || ''}`
        : 'General';

      servicesSheet.addRow([
        index + 1,
        service.name || 'N/A',
        service.category || 'N/A',
        service.quantity || 0,
        service.price || 0,
        service.margin || 0,
        service.totalPrice || 0,
        location,
        service.notes || ''
      ]);
      
      const dataRow = servicesSheet.getRow(currentRow);
      dataRow.alignment = { vertical: 'middle' };
      dataRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
      dataRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' };
      dataRow.getCell(5).numFmt = '€#,##0.00';
      dataRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
      dataRow.getCell(6).numFmt = '0.00"%"';
      dataRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
      dataRow.getCell(7).numFmt = '€#,##0.00';
      
      currentRow++;
    });

    servicesSheet.addRow(['', '', '', '', '', 'SUBTOTAL:', data.totals.servicesSubtotal, '', '']);
    servicesSheet.getRow(currentRow).font = { bold: true };
    servicesSheet.getRow(currentRow).getCell(6).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).numFmt = '€#,##0.00';
    currentRow++;

    servicesSheet.addRow(['', '', '', '', '', 'MARGIN:', data.totals.servicesMargin, '', '']);
    servicesSheet.getRow(currentRow).font = { bold: true, color: { argb: 'FF27AE60' } };
    servicesSheet.getRow(currentRow).getCell(6).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).numFmt = '€#,##0.00';
    currentRow++;

    servicesSheet.addRow(['', '', '', '', '', 'TOTAL:', data.totals.servicesTotal, '', '']);
    servicesSheet.getRow(currentRow).font = { bold: true, size: 12 };
    servicesSheet.getRow(currentRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F8F5' }
    };
    servicesSheet.getRow(currentRow).getCell(6).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).numFmt = '€#,##0.00';

    for (let row = 2; row <= currentRow; row++) {
      for (let col = 1; col <= 9; col++) {
        const cell = servicesSheet.getRow(row).getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      }
    }
  }

  // TAB 4: NOTES
  if (data.generalNotes) {
    const notesSheet = workbook.addWorksheet('NOTES');
    
    notesSheet.mergeCells('A1:E1');
    const notesTitleCell = notesSheet.getCell('A1');
    notesTitleCell.value = 'ADDITIONAL NOTES';
    notesTitleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    notesTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7F8C8D' }
    };
    notesTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    notesSheet.getRow(1).height = 30;

    notesSheet.getCell('A3').value = data.generalNotes;
    notesSheet.getCell('A3').alignment = { vertical: 'top', wrapText: true };
    notesSheet.mergeCells('A3:E20');
    notesSheet.columns = [{ width: 80 }];
  }

  return workbook;
}

