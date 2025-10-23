import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, services, siteSurveyName } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Missing or invalid products data' },
        { status: 400 }
      );
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CRM System';
    workbook.created = new Date();

    // Group products by brand
    const productsByBrand = products.reduce((acc: any, product: any) => {
      const brand = product.brand || 'Generic';
      if (!acc[brand]) {
        acc[brand] = [];
      }
      acc[brand].push(product);
      return acc;
    }, {});

    // Create a separate sheet for each brand
    Object.entries(productsByBrand).forEach(([brand, brandProducts]: [string, any]) => {
      const sheet = workbook.addWorksheet(brand);

      // Set column widths
      sheet.columns = [
        { width: 10 },  // #
        { width: 40 },  // Product Name
        { width: 25 },  // Category
        { width: 12 },  // Quantity
        { width: 15 },  // Unit Price
        { width: 12 },  // Margin %
        { width: 15 },  // Total Price
        { width: 50 }   // Locations
      ];

      // Title
      sheet.mergeCells('A1:H1');
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
      const headers = ['#', 'Product', 'Category', 'Qty', 'Unit Price (€)', 'Margin (%)', 'Total (€)', 'Locations'];
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
        sheet.addRow([
          index + 1,
          product.name || 'N/A',
          product.category || 'N/A',
          product.quantity || 0,
          product.unitPrice || 0,
          product.margin || 0,
          product.totalPrice || 0,
          (product.locations || []).join(', ')
        ]);
        
        const dataRow = sheet.getRow(currentRow);
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

      // Subtotal row
      const subtotal = brandProducts.reduce((sum: number, p: any) => sum + (p.totalPrice || 0), 0);
      sheet.addRow(['', '', '', '', '', 'SUBTOTAL:', subtotal, '']);
      const subtotalRow = sheet.getRow(currentRow);
      subtotalRow.font = { bold: true };
      subtotalRow.getCell(6).alignment = { horizontal: 'right' };
      subtotalRow.getCell(7).alignment = { horizontal: 'right' };
      subtotalRow.getCell(7).numFmt = '€#,##0.00';
      subtotalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F4F8' }
      };

      // Apply borders
      for (let row = 2; row <= currentRow; row++) {
        for (let col = 1; col <= 8; col++) {
          const cell = sheet.getRow(row).getCell(col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
        }
      }
    });

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
        { width: 50 }   // Locations
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
      const headers = ['#', 'Service', 'Category', 'Qty', 'Unit Price (€)', 'Margin (%)', 'Total (€)', 'Locations'];
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
        servicesSheet.addRow([
          index + 1,
          service.name || 'N/A',
          service.category || 'N/A',
          service.quantity || 0,
          service.unitPrice || 0,
          service.margin || 0,
          service.totalPrice || 0,
          (service.locations || []).join(', ')
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

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return file
    const filename = `BOM-${siteSurveyName || 'Site-Survey'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating BOM Excel:', error);
    return NextResponse.json(
      { error: 'Failed to generate BOM Excel', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
