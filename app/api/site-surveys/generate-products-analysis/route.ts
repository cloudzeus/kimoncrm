import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ImageRun } from 'docx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, siteSurveyName } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Missing or invalid products data' },
        { status: 400 }
      );
    }

    // Create all children first
    const allChildren: any[] = [
      // Title
      new Paragraph({
        children: [
          new TextRun({
            text: `Products Analysis - ${siteSurveyName || 'Site Survey'}`,
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
            text: `Generated on: ${new Date().toLocaleDateString('el-GR')}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
    ];

    // Add each product
    products.forEach((product: any, index: number) => {
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
      
      // Product Codes
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `ERP Code: ${product.erpCode || 'N/A'} | Manufacturer Code: ${product.manufacturerCode || 'N/A'} | EAN Code: ${product.eanCode || 'N/A'}`,
              size: 18,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        })
      );
      
      // Product Image (if available)
      if (product.images && product.images.length > 0) {
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Product Image:",
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
        
        // Add image placeholder with URL
        const imageUrl = product.images[0]?.url || product.images[0];
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Image URL: ${imageUrl}`,
                size: 16,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      
      // Description in Greek
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Description (Greek):",
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
      // Get Greek description from translations
      let greekDescription = 'No description available';
      if (product.translations && Array.isArray(product.translations)) {
        const greekTranslation = product.translations.find((t: any) => t.languageCode === 'el');
        if (greekTranslation?.description) {
          greekDescription = greekTranslation.description;
        }
      } else if (product.translations?.el?.description) {
        greekDescription = product.translations.el.description;
      } else if (product.description) {
        greekDescription = product.description;
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
              text: "Specifications:",
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
      
      // Create specifications table
      if (product.specifications && typeof product.specifications === 'object' && Object.keys(product.specifications).length > 0) {
        allChildren.push(
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Specification", bold: true, size: 18 })],
                      alignment: AlignmentType.CENTER,
                    })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Value", bold: true, size: 18 })],
                      alignment: AlignmentType.CENTER,
                    })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              // Data rows
              ...Object.entries(product.specifications).map(([key, value]) =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: key, size: 16 })],
                      })],
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: String(value), size: 16 })],
                      })],
                    }),
                  ],
                })
              ),
            ],
          })
        );
      } else {
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "No specifications available",
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
              text: `Quantity: ${product.quantity || 1}`,
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
    });

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
