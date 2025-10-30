import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import ExcelJS from "exceljs";
import { bunnyPut } from "@/lib/bunny/upload";
import { createSafeFilename } from "@/lib/utils/greeklish";

/**
 * POST - Generate BOM (Bill of Materials) File and Upload to BunnyCDN
 * Creates an Excel file with all equipment/products/services, uploads to BunnyCDN,
 * links it to the lead, and maintains versioning (max 10 versions)
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
    const { equipment } = body;

    if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
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

    const customerName = siteSurvey.customer?.name || "Customer";

    // Separate products and services
    const products = equipment.filter((item: any) => item.type === 'product');
    const services = equipment.filter((item: any) => item.type === 'service');

    // Generate BOM Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KimonCRM';
    workbook.created = new Date();

    // Create Summary Sheet first
    const summarySheet = workbook.addWorksheet('SUMMARY');
    
    // Summary Title
    summarySheet.mergeCells('A1:F1');
    const summaryTitleCell = summarySheet.getCell('A1');
    summaryTitleCell.value = `BOM SUMMARY - ${customerName}`;
    summaryTitleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    summaryTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' }
    };
    summaryTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.getRow(1).height = 35;

    // Summary Info
    summarySheet.getCell('A3').value = entityType === 'LEAD' ? 'Lead Number:' : 'Reference:';
    summarySheet.getCell('B3').value = referenceNumber;
    summarySheet.getCell('A4').value = 'Customer:';
    summarySheet.getCell('B4').value = customerName;
    summarySheet.getCell('A5').value = 'Generated:';
    summarySheet.getCell('B5').value = new Date().toLocaleString();
    
    summarySheet.getCell('A3').font = { bold: true };
    summarySheet.getCell('A4').font = { bold: true };
    summarySheet.getCell('A5').font = { bold: true };

    summarySheet.columns = [
      { width: 20 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 20 }
    ];

    // Group products by brand
    const productsByBrand = products.reduce((acc: any, product: any) => {
      const brand = (product.brand || 'Generic').trim().toUpperCase();
      if (!acc[brand]) {
        acc[brand] = [];
      }
      acc[brand].push(product);
      return acc;
    }, {});

    // Sort brands alphabetically
    const sortedBrands = Object.keys(productsByBrand).sort();

    // Create a separate sheet for each brand
    sortedBrands.forEach((brand: string) => {
      const brandProducts = productsByBrand[brand];
      
      // Sanitize sheet name (Excel sheet names can't exceed 31 chars and can't contain: \ / ? * [ ])
      const sanitizedBrandName = brand.replace(/[\\/?*[\]]/g, '').substring(0, 31);
      const sheet = workbook.addWorksheet(sanitizedBrandName);

      // Set column widths
      sheet.columns = [
        { width: 10 },  // #
        { width: 40 },  // Product Name
        { width: 15 },  // Product Code
        { width: 20 },  // Category
        { width: 18 },  // Manufacturer Code
        { width: 18 },  // EAN Code
        { width: 10 }   // Quantity
      ];

      // Title
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `BOM - ${brand}`;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E86AB' }
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 30;

      // Headers
      const headers = ['#', 'Product Name', 'Code', 'Category', 'Manufacturer Code', 'EAN Code', 'Quantity'];
      sheet.addRow(headers);
      const headerRow = sheet.getRow(2);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A90A4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // Data rows
      let currentRow = 3;
      brandProducts.forEach((product: any, index: number) => {
        // Extract name from category object if needed
        const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;

        sheet.addRow([
          index + 1,
          product.name || 'N/A',
          product.code || product.erpCode || '-',
          categoryName || 'N/A',
          product.manufacturerCode || '-',
          product.eanCode || '-',
          product.quantity || 0
        ]);
        
        const dataRow = sheet.getRow(currentRow);
        dataRow.alignment = { vertical: 'middle' };
        dataRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
        
        // Borders
        for (let col = 1; col <= 7; col++) {
          dataRow.getCell(col).border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
        }
        
        currentRow++;
      });

      // Total quantity row
      const totalQuantity = brandProducts.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
      sheet.addRow(['', '', '', '', '', 'TOTAL QTY:', totalQuantity]);
      const totalRow = sheet.getRow(currentRow);
      totalRow.font = { bold: true };
      totalRow.getCell(6).alignment = { horizontal: 'right' };
      totalRow.getCell(7).alignment = { horizontal: 'right' };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F4F8' }
      };
      
      // Borders for total row
      for (let col = 1; col <= 7; col++) {
        totalRow.getCell(col).border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      }
    });

    // Complete Summary Sheet with totals by brand
    let summaryRow = 7;
    summarySheet.getCell('A7').value = 'PRODUCTS BY BRAND';
    summarySheet.getCell('A7').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('A7').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E86AB' }
    };
    summarySheet.mergeCells('A7:F7');
    summarySheet.getRow(7).height = 25;
    summaryRow++;

    // Headers
    summarySheet.getCell('A8').value = 'Brand';
    summarySheet.getCell('B8').value = 'Products Count';
    summarySheet.getCell('C8').value = 'Total Quantity';
    summarySheet.getCell('D8').value = 'Total Value (€)';
    summarySheet.getRow(8).font = { bold: true };
    summarySheet.getRow(8).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F4F8' }
    };
    summaryRow++;

    // Add brand summaries
    let totalProducts = 0;
    let totalQuantity = 0;
    let totalValue = 0;

    sortedBrands.forEach((brand: string) => {
      const brandProducts = productsByBrand[brand];
      const brandQuantity = brandProducts.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
      const brandValue = brandProducts.reduce((sum: number, p: any) => sum + (p.totalPrice || 0), 0);
      
      summarySheet.getCell(`A${summaryRow}`).value = brand;
      summarySheet.getCell(`B${summaryRow}`).value = brandProducts.length;
      summarySheet.getCell(`C${summaryRow}`).value = brandQuantity;
      summarySheet.getCell(`D${summaryRow}`).value = brandValue;
      summarySheet.getCell(`D${summaryRow}`).numFmt = '€#,##0.00';
      
      totalProducts += brandProducts.length;
      totalQuantity += brandQuantity;
      totalValue += brandValue;
      
      summaryRow++;
    });

    // Total row for products
    summarySheet.getCell(`A${summaryRow}`).value = 'TOTAL PRODUCTS';
    summarySheet.getCell(`B${summaryRow}`).value = totalProducts;
    summarySheet.getCell(`C${summaryRow}`).value = totalQuantity;
    summarySheet.getCell(`D${summaryRow}`).value = totalValue;
    summarySheet.getCell(`D${summaryRow}`).numFmt = '€#,##0.00';
    summarySheet.getRow(summaryRow).font = { bold: true };
    summarySheet.getRow(summaryRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' }
    };
    summaryRow += 2;

    // Services summary
    if (services.length > 0) {
      const servicesQuantity = services.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
      const servicesValue = services.reduce((sum: number, s: any) => sum + (s.totalPrice || 0), 0);
      
      summarySheet.getCell(`A${summaryRow}`).value = 'SERVICES';
      summarySheet.getCell(`A${summaryRow}`).font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      summarySheet.getCell(`A${summaryRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF16A085' }
      };
      summarySheet.mergeCells(`A${summaryRow}:F${summaryRow}`);
      summarySheet.getRow(summaryRow).height = 25;
      summaryRow++;

      summarySheet.getCell(`A${summaryRow}`).value = 'Services Count';
      summarySheet.getCell(`B${summaryRow}`).value = services.length;
      summaryRow++;
      
      summarySheet.getCell(`A${summaryRow}`).value = 'Total Quantity';
      summarySheet.getCell(`B${summaryRow}`).value = servicesQuantity;
      summaryRow++;
      
      summarySheet.getCell(`A${summaryRow}`).value = 'Total Value';
      summarySheet.getCell(`B${summaryRow}`).value = servicesValue;
      summarySheet.getCell(`B${summaryRow}`).numFmt = '€#,##0.00';
      summaryRow += 2;
    }

    // Grand Total
    const grandTotal = totalValue + (services.reduce((sum: number, s: any) => sum + (s.totalPrice || 0), 0));
    summarySheet.getCell(`A${summaryRow}`).value = 'GRAND TOTAL';
    summarySheet.getCell(`B${summaryRow}`).value = grandTotal;
    summarySheet.getCell(`B${summaryRow}`).numFmt = '€#,##0.00';
    summarySheet.getRow(summaryRow).font = { size: 16, bold: true };
    summarySheet.getRow(summaryRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B6B' }
    };
    summarySheet.getRow(summaryRow).height = 30;

    // Add Services sheet if there are services
    if (services && services.length > 0) {
      const servicesSheet = workbook.addWorksheet('Services');
      
      servicesSheet.columns = [
        { width: 10 },  // #
        { width: 40 },  // Service Name
        { width: 25 },  // Category
        { width: 12 },  // Quantity
        { width: 15 },  // Unit Price
        { width: 12 },  // Margin %
        { width: 15 },  // Total Price
        { width: 50 }   // Location
      ];

      // Title
      servicesSheet.mergeCells('A1:H1');
      const titleCell = servicesSheet.getCell('A1');
      titleCell.value = 'Services BOM';
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF16A085' }
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      servicesSheet.getRow(1).height = 30;

      // Headers
      const headers = ['#', 'Service', 'Category', 'Qty', 'Unit Price (€)', 'Margin (%)', 'Total (€)', 'Location'];
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
          0, // Margin - to be filled
          service.totalPrice || 0,
          location
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
      const subtotal = services.reduce((sum: number, s: any) => sum + (s.totalPrice || 0), 0);
      servicesSheet.addRow(['', '', '', '', '', 'SUBTOTAL:', subtotal, '']);
      const subtotalRow = servicesSheet.getRow(currentRow);
      subtotalRow.font = { bold: true };
      subtotalRow.getCell(6).alignment = { horizontal: 'right' };
      subtotalRow.getCell(7).alignment = { horizontal: 'right' };
      subtotalRow.getCell(7).numFmt = '€#,##0.00';
      subtotalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F8F5' }
      };

      // Apply borders
      for (let row = 2; row <= currentRow; row++) {
        for (let col = 1; col <= 8; col++) {
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

    // Convert workbook to buffer
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    // Determine version number
    const baseFileName = `${referenceNumber} - BOM`;
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
    const filename = createSafeFilename(referenceNumber, 'BOM', versionNumber, '.xlsx');

    // Upload to BunnyCDN
    const timestamp = Date.now();
    const entityFolder = entityType === 'LEAD' ? 'leads' : 'customers';
    const bunnyPath = `${entityFolder}/${entityId}/bom/${timestamp}_${filename}`;
    
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
        description: `Bill of Materials (BOM) - ${products.length} products, ${services.length} services (v${versionNumber})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully generated BOM file',
      file: {
        filename,
        fileId: fileRecord.id,
        url: uploadResult.url,
        version: versionNumber,
        productsCount: products.length,
        servicesCount: services.length,
      },
    });

  } catch (error) {
    console.error("Error in generate-bom-file:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate BOM file",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

