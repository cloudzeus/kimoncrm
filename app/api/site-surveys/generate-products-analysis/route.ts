import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, siteSurveyName } = body;

    console.log('📊 Product Analysis API received:', {
      productsCount: products?.length || 0,
      siteSurveyName,
      hasProducts: !!products,
      isProductsArray: Array.isArray(products),
      sampleProduct: products?.[0]
    });

    if (!products || !Array.isArray(products) || products.length === 0) {
      console.error('❌ Product Analysis API: Invalid or empty products array');
      return NextResponse.json(
        { error: 'Missing or invalid products data. Please ensure you have products assigned in Step 2.' },
        { status: 400 }
      );
    }

    // Fetch full product details including specifications and images
    const productIds = products.map(p => p.id);
    console.log('🔍 Fetching full product details for IDs:', productIds);
    
    const fullProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        specifications: {
          include: {
            translations: true
          }
        },
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        translations: true
      }
    });

    console.log('✅ Fetched full products from database:', {
      count: fullProducts.length,
      productsWithImages: fullProducts.filter(p => p.images && p.images.length > 0).length,
      productsWithSpecs: fullProducts.filter(p => p.specifications && p.specifications.length > 0).length,
      sampleProduct: fullProducts[0] ? {
        id: fullProducts[0].id,
        name: fullProducts[0].name,
        imagesCount: fullProducts[0].images?.length || 0,
        specsCount: fullProducts[0].specifications?.length || 0,
        translationsCount: fullProducts[0].translations?.length || 0
      } : null
    });

    // Create all children first
    const allChildren: any[] = [
      // Title
      new Paragraph({
        children: [
          new TextRun({
            text: `ΑΝΑΛΥΣΗ ΠΡΟΪΟΝΤΩΝ - ${siteSurveyName || 'Site Survey'}`,
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      
      // Date
      new Paragraph({
        children: [
          new TextRun({
            text: `Ημερομηνία: ${new Date().toLocaleDateString('el-GR')}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
    ];

    // Add each product
    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      const fullProduct = fullProducts.find(p => p.id === product.id);
      
      // Product Header
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${product.name}`,
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      
      // Product Image (if available)
      if (fullProduct?.images && fullProduct.images.length > 0) {
        try {
          const imageUrl = fullProduct.images[0].url;
          
          // Download image and convert to buffer
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            
            // Determine image type from URL
            const imageType = imageUrl.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
            
            allChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: Buffer.from(imageBuffer),
                    transformation: {
                      width: 300,
                      height: 300,
                    },
                    type: imageType,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              })
            );
          }
        } catch (error) {
          console.error('Error embedding image:', error);
          // Skip image if error
        }
      }
      
      // Description in Greek
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "ΠΕΡΙΓΡΑΦΗ:",
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
      
      // Get Greek description from translations
      let greekDescription = 'Δεν υπάρχει διαθέσιμη περιγραφή';
      if (fullProduct?.translations && Array.isArray(fullProduct.translations)) {
        const greekTranslation = fullProduct.translations.find((t: any) => t.languageCode === 'el');
        if (greekTranslation?.description) {
          greekDescription = greekTranslation.description;
        }
      }
      
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: greekDescription,
              size: 18,
            }),
          ],
          spacing: { after: 200 },
        })
      );
      
      // Specifications Table
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ:",
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
      
      // Create specifications table from database
      if (fullProduct?.specifications && fullProduct.specifications.length > 0) {
        const tableRows = [
          // Header row
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "ΠΡΟΔΙΑΓΡΑΦΗ", bold: true, size: 18 })],
                  alignment: AlignmentType.CENTER,
                })],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "ΤΙΜΗ", bold: true, size: 18 })],
                  alignment: AlignmentType.CENTER,
                })],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
        ];
        
        // Add specification rows (use Greek translations)
        fullProduct.specifications.forEach((spec: any) => {
          const greekTranslation = spec.translations?.find((t: any) => t.languageCode === 'el');
          const specName = greekTranslation?.specName || spec.specKey || '';
          const specValue = greekTranslation?.specValue || '';
          
          if (specName && specValue) {
            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: specName, size: 16 })],
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: specValue, size: 16 })],
                    })],
                  }),
                ],
              })
            );
          }
        });
        
        allChildren.push(
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: tableRows,
          })
        );
      } else {
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Δεν υπάρχουν διαθέσιμα χαρακτηριστικά",
                size: 16,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      
      // Quantity
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `ΠΟΣΟΤΗΤΑ: ${product.quantity || 1}`,
              bold: true,
              size: 18,
            }),
          ],
          spacing: { before: 200, after: 400 },
        })
      );
      
      // Separator line
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "─".repeat(50),
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        })
      );
    }

    // Create the final document
    const doc = new Document({
      sections: [{
        properties: {},
        children: allChildren
      }]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Return file
    const filename = `Products-Analysis-${siteSurveyName || 'Site-Survey'}-${new Date().toISOString().split('T')[0]}.docx`;
    
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating Products Analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate Products Analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
