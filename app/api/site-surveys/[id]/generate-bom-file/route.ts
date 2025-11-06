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
    
    // Fetch buildings from database instead of requiring them in the request
    const infrastructureRes = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      select: { infrastructureData: true }
    });
    
    const infrastructureData = infrastructureRes?.infrastructureData as any;
    const buildings = infrastructureData?.buildings || [];
    
    if (!buildings || buildings.length === 0) {
      return NextResponse.json(
        { error: "No buildings data found. Please complete Step 1 first." },
        { status: 400 }
      );
    }
    
    // Collect products and services from buildings
    const equipment: any[] = [];
    
    buildings.forEach((building: any) => {
      if (building.centralRack) {
        // Collect from VOIP PBX
        building.centralRack.voipPbx?.forEach((pbx: any) => {
          const pbxProducts = pbx.products || (pbx.productId ? [{ productId: pbx.productId, quantity: 1 }] : []);
          pbxProducts.forEach((p: any) => {
            equipment.push({
              productId: p.productId,
              quantity: p.quantity,
              type: 'product'
            });
          });
        });
        
        // Collect from ATA
        building.centralRack.ata?.forEach((ata: any) => {
          const ataProducts = ata.products || [];
          ataProducts.forEach((p: any) => {
            equipment.push({
              productId: p.productId,
              quantity: p.quantity,
              type: 'product'
            });
          });
        });
        
        // Collect from other central rack equipment
        building.centralRack.switches?.forEach((sw: any) => {
          const swProducts = sw.products || (sw.productId ? [{ productId: sw.productId, quantity: 1 }] : []);
          swProducts.forEach((p: any) => {
            equipment.push({
              productId: p.productId,
              quantity: p.quantity,
              type: 'product'
            });
          });
        });
      }
      
      // Collect from floor racks
      building.floors?.forEach((floor: any) => {
        floor.racks?.forEach((rack: any) => {
          rack.switches?.forEach((sw: any) => {
            const swProducts = sw.products || (sw.productId ? [{ productId: sw.productId, quantity: 1 }] : []);
            swProducts.forEach((p: any) => {
              equipment.push({
                productId: p.productId,
                quantity: p.quantity,
                type: 'product'
              });
            });
          });
        });
        
        // Collect from rooms
        floor.rooms?.forEach((room: any) => {
          room.devices?.forEach((device: any) => {
            const deviceProducts = device.products || (device.productId ? [{ productId: device.productId, quantity: device.quantity || 1 }] : []);
            deviceProducts.forEach((p: any) => {
              equipment.push({
                productId: p.productId,
                quantity: p.quantity,
                type: 'product'
              });
            });
          });
        });
      });
    });
    
    if (!equipment || equipment.length === 0) {
      return NextResponse.json(
        { error: "No products found in buildings. Please add products in Step 2." },
        { status: 400 }
      );
    }
    
    // Fetch product details from database
    const productIds = equipment.map(e => e.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        code: true,
        code1: true,
        brand: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        mtrl: true,
      }
    });
    
    // Enrich equipment with product details
    const enrichedEquipment = equipment.map(item => {
      const product = productDetails.find(p => p.id === item.productId);
      const brandValue = product?.brand?.name || 'Generic';
      const categoryValue = product?.category?.name || 'N/A';
      return {
        ...item,
        name: product?.name || 'Unknown Product',
        code: product?.code || product?.code1 || '',
        brand: brandValue,
        category: categoryValue,
        manufacturerCode: product?.mtrl || '',
        eanCode: product?.code1 || '',
      };
    });
    
    const finalProducts = enrichedEquipment.filter((item: any) => item.type === 'product');
    const finalServices = enrichedEquipment.filter((item: any) => item.type === 'service');

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

    // products and services already declared above from enrichedEquipment
    
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
    const productsByBrand = finalProducts.reduce((acc: any, product: any) => {
      const brand = String(product.brand || 'Generic').trim().toUpperCase();
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

    sortedBrands.forEach((brand: string) => {
      const brandProducts = productsByBrand[brand];
      const brandQuantity = brandProducts.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
      
      summarySheet.getCell(`A${summaryRow}`).value = brand;
      summarySheet.getCell(`B${summaryRow}`).value = brandProducts.length;
      summarySheet.getCell(`C${summaryRow}`).value = brandQuantity;
      
      totalProducts += brandProducts.length;
      totalQuantity += brandQuantity;
      
      summaryRow++;
    });

    // Total row for products
    summarySheet.getCell(`A${summaryRow}`).value = 'TOTAL PRODUCTS';
    summarySheet.getCell(`B${summaryRow}`).value = totalProducts;
    summarySheet.getCell(`C${summaryRow}`).value = totalQuantity;
    summarySheet.getRow(summaryRow).font = { bold: true };
    summarySheet.getRow(summaryRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD966' }
    };
    summaryRow += 2;

    // Services summary (quantities only)
    if (finalServices.length > 0) {
      const servicesQuantity = finalServices.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
      
      summarySheet.getCell(`A${summaryRow}`).value = 'SERVICES';
      summarySheet.getCell(`A${summaryRow}`).font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      summarySheet.getCell(`A${summaryRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF16A085' }
      };
      summarySheet.mergeCells(`A${summaryRow}:C${summaryRow}`);
      summarySheet.getRow(summaryRow).height = 25;
      summaryRow++;

      summarySheet.getCell(`A${summaryRow}`).value = 'Services Count';
      summarySheet.getCell(`B${summaryRow}`).value = finalServices.length;
      summaryRow++;
      
      summarySheet.getCell(`A${summaryRow}`).value = 'Total Quantity';
      summarySheet.getCell(`B${summaryRow}`).value = servicesQuantity;
      summaryRow++;
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
        description: `Bill of Materials (BOM) - ${finalProducts.length} products, ${finalServices.length} services (v${versionNumber})`,
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
        productsCount: finalProducts.length,
        servicesCount: finalServices.length,
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

