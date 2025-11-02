import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import ExcelJS from "exceljs";
import { bunnyPut } from "@/lib/bunny/upload";
import { createSafeFilename } from "@/lib/utils/greeklish";

/**
 * POST - Generate RFP (Request for Proposal) with Pricing Excel
 * Creates RFP database record with pricing data, generates Excel file,
 * uploads to BunnyCDN, links to lead, and maintains versioning (max 10 versions)
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

    const { id: siteSurveyId } = await params;
    const body = await request.json();
    const { equipment, generalNotes } = body;

    console.log('📊 RFP Generation API - Received data:', {
      siteSurveyId,
      equipmentCount: equipment?.length || 0,
      hasEquipment: !!equipment,
      isArray: Array.isArray(equipment),
      generalNotes: generalNotes?.substring(0, 100) || 'none'
    });

    if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
      console.error('❌ RFP API: No equipment data provided');
      return NextResponse.json(
        { error: "No equipment data provided" },
        { status: 400 }
      );
    }

    // Get site survey with lead info
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      include: {
        lead: {
          select: {
            id: true,
            leadNumber: true,
            title: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
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
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Determine if we're linking to a lead or customer
    const isLinkedToLead = !!siteSurvey.leadId;
    const isLinkedToCustomer = !!siteSurvey.customerId;

    if (!isLinkedToLead && !isLinkedToCustomer) {
      return NextResponse.json(
        { error: "Site survey is not linked to a lead or customer" },
        { status: 400 }
      );
    }

    // Use lead info if available, otherwise use customer info
    const entityId = siteSurvey.leadId || siteSurvey.customerId;
    const entityType = isLinkedToLead ? 'LEAD' : 'CUSTOMER';
    const referenceNumber = siteSurvey.lead?.leadNumber || siteSurvey.customer?.name || "REF";
    const leadId = siteSurvey.leadId; // Keep for RFP creation (RFPs might require leads)
    const customerName = siteSurvey.customer?.name || "Customer";

    // Separate products and services
    const products = equipment.filter((item: any) => item.type === 'product');
    const services = equipment.filter((item: any) => item.type === 'service');

    console.log('📦 RFP API - Separated equipment:', {
      productsCount: products.length,
      servicesCount: services.length,
      sampleProduct: products[0],
      sampleService: services[0]
    });

    // Calculate totals
    const productsSubtotal = products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
    const productsMargin = products.reduce((sum: number, p: any) => {
      const basePrice = p.price * p.quantity;
      return sum + (basePrice * ((p.margin || 0) / 100));
    }, 0);
    const productsTotal = productsSubtotal + productsMargin;

    const servicesSubtotal = services.reduce((sum: number, s: any) => sum + (s.price * s.quantity), 0);
    const servicesMargin = services.reduce((sum: number, s: any) => {
      const basePrice = s.price * s.quantity;
      return sum + (basePrice * ((s.margin || 0) / 100));
    }, 0);
    const servicesTotal = servicesSubtotal + servicesMargin;

    const grandTotal = productsTotal + servicesTotal;

    // Create or update RFP record
    let rfp = await prisma.rFP.findFirst({
      where: {
        leadId: leadId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const rfpData = {
      equipment: equipment.map((item: any) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        brand: item.brand,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        margin: item.margin || 0,
        totalPrice: item.totalPrice,
        notes: item.notes,
        infrastructureElement: item.infrastructureElement,
        manufacturerCode: item.manufacturerCode,
        eanCode: item.eanCode,
      })),
      generalNotes,
      totals: {
        productsSubtotal,
        productsMargin,
        productsTotal,
        servicesSubtotal,
        servicesMargin,
        servicesTotal,
        grandTotal,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.email,
    };

    if (rfp) {
      // Update existing RFP
      rfp = await prisma.rFP.update({
        where: { id: rfp.id },
        data: {
          requirements: rfpData as any,
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new RFP
      const rfpNumber = await generateRFPNumber();
      rfp = await prisma.rFP.create({
        data: {
          rfpNo: rfpNumber,
          title: `RFP for ${siteSurvey.title}`,
          description: `Request for Proposal generated from site survey: ${siteSurvey.title}`,
          requirements: rfpData as any,
          customerId: siteSurvey.customerId,
          contactId: siteSurvey.contactId,
          leadId: leadId,
          status: 'IN_PROGRESS',
          stage: 'RFP_DRAFTING',
          assigneeId: session.user.id,
        },
      });
    }

    // Generate Pricing Excel
    const workbook = await generatePricingExcel({
      equipment,
      leadNumber: referenceNumber, // Use referenceNumber (lead number or customer name)
      customerName,
      siteSurveyTitle: siteSurvey.title,
      rfpNumber: rfp.rfpNo || 'Draft',
      generalNotes,
      totals: {
        productsSubtotal,
        productsMargin,
        productsTotal,
        servicesSubtotal,
        servicesMargin,
        servicesTotal,
        grandTotal,
      },
    });

    // Convert workbook to buffer
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    // Determine version number
    const baseFileName = `${referenceNumber} - RFP Pricing`;
    const existingFiles = await prisma.file.findMany({
      where: {
        entityId: entityId!,
        type: entityType,
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
      // Delete the oldest version
      const oldestFile = existingFiles[existingFiles.length - 1];
      await prisma.file.delete({
        where: { id: oldestFile.id },
      });
    }

    // Create safe filename with Greeklish conversion
    const filename = createSafeFilename(referenceNumber, 'RFP Pricing', versionNumber, '.xlsx');

    // Upload to BunnyCDN
    const timestamp = Date.now();
    const entityFolder = entityType === 'LEAD' ? 'leads' : 'customers';
    const bunnyPath = `${entityFolder}/${entityId}/rfp-pricing/${timestamp}_${filename}`;
    
    const uploadResult = await bunnyPut(bunnyPath, buffer);

    // Save file record to database linked to LEAD or CUSTOMER
    const fileRecord = await prisma.file.create({
      data: {
        name: filename,
        filetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: buffer.length,
        url: uploadResult.url,
        entityId: entityId!,
        type: entityType,
        description: `RFP Pricing Document - ${products.length} products, ${services.length} services (v${versionNumber}) - RFP: ${rfp.rfpNo}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully generated RFP with pricing document',
      rfp: {
        id: rfp.id,
        rfpNo: rfp.rfpNo,
        status: rfp.status,
        stage: rfp.stage,
      },
      file: {
        filename,
        fileId: fileRecord.id,
        url: uploadResult.url,
        version: versionNumber,
        productsCount: products.length,
        servicesCount: services.length,
      },
      totals: {
        grandTotal,
        productsTotal,
        servicesTotal,
        totalMargin: productsMargin + servicesMargin,
      },
    });

  } catch (error) {
    console.error("❌ Error in generate-rfp:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Failed to generate RFP",
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to generate RFP number
async function generateRFPNumber(): Promise<string> {
  const latestRFP = await prisma.rFP.findFirst({
    where: {
      rfpNo: {
        startsWith: 'RFP',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!latestRFP || !latestRFP.rfpNo) {
    return 'RFP0001';
  }

  const match = latestRFP.rfpNo.match(/RFP(\d+)/);
  if (match) {
    const number = parseInt(match[1]) + 1;
    return `RFP${number.toString().padStart(4, '0')}`;
  }

  return 'RFP0001';
}

// Helper function to generate pricing Excel
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

  // ==== TAB 1: PRICING SUMMARY ====
  const summarySheet = workbook.addWorksheet('PRICING SUMMARY');
  
  // Title
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

  // Header Info
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
    { width: 20 },
    { width: 40 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 20 }
  ];

  // Summary Table
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
  const grandTotalRow = summarySheet.getRow(row);
  grandTotalRow.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  // Only color cells A and E (label and total)
  grandTotalRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF6B6B' }
  };
  grandTotalRow.getCell(5).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF6B6B' }
  };
  grandTotalRow.height = 30;

  // ==== TAB 2: PRODUCTS & SERVICES (COMBINED) ====
  const itemsSheet = workbook.addWorksheet('PRODUCTS & SERVICES');
  
  itemsSheet.columns = [
    { width: 10 },  // #
    { width: 8 },   // Type
    { width: 35 },  // Name
    { width: 20 },  // Brand
    { width: 20 },  // Category
    { width: 10 },  // Qty
    { width: 15 },  // Unit Price
    { width: 10 },  // Margin %
    { width: 15 },  // Subtotal
    { width: 15 }   // Total
  ];

  // Title
  itemsSheet.mergeCells('A1:J1');
  const itemsTitleCell = itemsSheet.getCell('A1');
  itemsTitleCell.value = 'PRODUCTS & SERVICES';
  itemsTitleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  itemsTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E86AB' }
  };
  itemsTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  itemsSheet.getRow(1).height = 30;

  // Headers
  const headers = ['#', 'Type', 'Name', 'Brand', 'Category', 'Qty', 'Unit Price (€)', 'Margin (%)', 'Subtotal (€)', 'Total (€)'];
  itemsSheet.addRow(headers);
  const headerRow = itemsSheet.getRow(2);
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 25;

  // Combine products and services
  const allItems = [
    ...products.map((p: any) => ({ ...p, itemType: 'Product' })),
    ...services.map((s: any) => ({ ...s, itemType: 'Service' }))
  ];

  // Data rows with formulas
  let currentRow = 3;
  allItems.forEach((item: any, index: number) => {
    const brandName = typeof item.brand === 'object' ? item.brand?.name : item.brand;
    const categoryName = typeof item.category === 'object' ? item.category?.name : item.category;

    itemsSheet.addRow([
      index + 1,
      item.itemType,
      item.name || 'N/A',
      brandName || '-',
      categoryName || 'N/A',
      item.quantity || 0,
      item.price || 0,
      item.margin || 0,
      // Subtotal formula: Qty * Unit Price
      { formula: `F${currentRow}*G${currentRow}` },
      // Total formula: Subtotal + (Subtotal * Margin%)
      { formula: `I${currentRow}+(I${currentRow}*H${currentRow}/100)` }
    ]);
    
    const dataRow = itemsSheet.getRow(currentRow);
    dataRow.alignment = { vertical: 'middle' };
    
    // Number formatting
    dataRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
    dataRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
    dataRow.getCell(7).numFmt = '€#,##0.00';
    dataRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };
    dataRow.getCell(8).numFmt = '0.00';
    dataRow.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' };
    dataRow.getCell(9).numFmt = '€#,##0.00';
    dataRow.getCell(10).alignment = { vertical: 'middle', horizontal: 'right' };
    dataRow.getCell(10).numFmt = '€#,##0.00';
    
    // Borders
    for (let col = 1; col <= 10; col++) {
      dataRow.getCell(col).border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    }
    
    currentRow++;
  });

  // Grand Total row
  const lastDataRow = currentRow - 1;
  itemsSheet.addRow(['', '', '', '', '', '', '', 'GRAND TOTAL:', { formula: `SUM(I3:I${lastDataRow})` }, { formula: `SUM(J3:J${lastDataRow})` }]);
  const totalRow = itemsSheet.getRow(currentRow);
  totalRow.font = { bold: true, size: 12 };
  
  // Only color cells with content (H, I, J)
  totalRow.getCell(8).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD966' }
  };
  totalRow.getCell(9).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD966' }
  };
  totalRow.getCell(10).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD966' }
  };
  
  totalRow.getCell(8).alignment = { horizontal: 'right' };
  totalRow.getCell(9).alignment = { horizontal: 'right' };
  totalRow.getCell(9).numFmt = '€#,##0.00';
  totalRow.getCell(10).alignment = { horizontal: 'right' };
  totalRow.getCell(10).numFmt = '€#,##0.00';
  
  // Add borders to total row
  for (let col = 1; col <= 10; col++) {
    totalRow.getCell(col).border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };
  }

  // ==== SKIP OLD SEPARATE TABS ====
  // Remove old services sheet code
  if (false && services.length > 0) {
    const servicesSheet = workbook.addWorksheet('SERVICES');
    
    servicesSheet.columns = [
      { width: 10 },  // #
      { width: 35 },  // Service
      { width: 20 },  // Category
      { width: 12 },  // Qty
      { width: 15 },  // Unit Price
      { width: 12 },  // Margin %
      { width: 15 },  // Total
      { width: 40 },  // Location
      { width: 40 }   // Notes
    ];

    // Title
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

    // Headers
    const headers = ['#', 'Service', 'Category', 'Qty', 'Unit Price (€)', 'Margin (%)', 'Total (€)', 'Location', 'Notes'];
    servicesSheet.addRow(headers);
    const headerRow = servicesSheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Data rows
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

    // Subtotal
    servicesSheet.addRow(['', '', '', '', '', 'SUBTOTAL:', data.totals.servicesSubtotal, '', '']);
    servicesSheet.getRow(currentRow).font = { bold: true };
    servicesSheet.getRow(currentRow).getCell(6).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).numFmt = '€#,##0.00';
    currentRow++;

    // Margin
    servicesSheet.addRow(['', '', '', '', '', 'MARGIN:', data.totals.servicesMargin, '', '']);
    servicesSheet.getRow(currentRow).font = { bold: true, color: { argb: 'FF27AE60' } };
    servicesSheet.getRow(currentRow).getCell(6).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).alignment = { horizontal: 'right' };
    servicesSheet.getRow(currentRow).getCell(7).numFmt = '€#,##0.00';
    currentRow++;

    // Total
    servicesSheet.addRow(['', '', '', '', '', 'TOTAL:', data.totals.servicesTotal, '', '']);
    const serviceTotalRow = servicesSheet.getRow(currentRow);
    serviceTotalRow.font = { bold: true, size: 12 };
    // Only color the label and value cells
    serviceTotalRow.getCell(6).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' }
    };
    serviceTotalRow.getCell(7).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' }
    };
    serviceTotalRow.getCell(6).alignment = { horizontal: 'right' };
    serviceTotalRow.getCell(7).alignment = { horizontal: 'right' };
    serviceTotalRow.getCell(7).numFmt = '€#,##0.00';

    // Apply borders
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

  // ==== TAB 4: NOTES ====
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
    notesSheet.columns = [
      { width: 80 },
    ];
  }

  return workbook;
}

