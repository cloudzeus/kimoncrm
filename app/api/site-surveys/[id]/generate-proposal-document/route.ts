import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { uploadFileToBunny } from '@/lib/bunny/upload';
import { manageDocumentVersions, generateVersionedFilename } from '@/lib/utils/document-versioning';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
  Packer,
} from 'docx';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: siteSurveyId } = await params;
    const body = await request.json();
    const { products = [], services = [], technicalDescription = '' } = body;

    console.log('📄 Generating comprehensive proposal document:', {
      siteSurveyId,
      productsCount: products.length,
      servicesCount: services.length,
      hasTechDescription: !!technicalDescription,
    });

    // Fetch site survey details with proposals
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      include: {
        customer: true,
        lead: true,
        proposals: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get the latest proposal
        },
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: 'Site survey not found' },
        { status: 404 }
      );
    }

    // Get the latest proposal if it exists
    const latestProposal = siteSurvey.proposals?.[0];

    // Fetch full product details including images and specs
    const productIds = products.map((p: any) => p.id);
    const fullProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: true,
        specifications: {
          include: {
            translations: true,
          },
          orderBy: { order: 'asc' },
        },
        translations: true,
        brand: true,
        category: true,
      },
    });

    console.log('📦 Full products fetched:', {
      requested: productIds.length,
      found: fullProducts.length,
    });

    const allChildren: any[] = [];

    // ========================================
    // 1. COVER PAGE
    // ========================================
    const customerName = siteSurvey.customer?.name || 'N/A';
    const projectName = siteSurvey.title || 'Site Survey';

    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΤΕΧΝΙΚΗ & ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΣΦΟΡΑ',
            bold: true,
            size: 36,
            color: '1F4788',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: projectName,
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Πελάτης: ${customerName}`,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Ημερομηνία: ${new Date().toLocaleDateString('el-GR')}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    // ========================================
    // 2. TECHNICAL DESCRIPTION
    // ========================================
    // Use technical description from latest proposal if available, otherwise use the passed parameter
    const finalTechnicalDescription = latestProposal?.technicalDesc || technicalDescription;
    
    if (finalTechnicalDescription) {
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ',
              bold: true,
              size: 28,
              color: '1F4788',
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: finalTechnicalDescription,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }

    // ========================================
    // 2b. INFRASTRUCTURE DESCRIPTION (if available from proposal)
    // ========================================
    if (latestProposal?.infrastructureDesc) {
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'ΠΕΡΙΓΡΑΦΗ ΥΠΟΔΟΜΗΣ',
              bold: true,
              size: 28,
              color: '1F4788',
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: latestProposal.infrastructureDesc,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }

    // ========================================
    // 3. PRICING TABLES
    // ========================================
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΣΦΟΡΑ',
            bold: true,
            size: 28,
            color: '1F4788',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    // Separate required and optional products
    const requiredProducts = products.filter((p: any) => !p.isOptional);
    const optionalProducts = products.filter((p: any) => p.isOptional);

    console.log('📊 Product breakdown:', {
      total: products.length,
      required: requiredProducts.length,
      optional: optionalProducts.length,
    });

    // Group required products by category
    const requiredProductsByCategory = requiredProducts.reduce((acc: any, product: any) => {
      const category = product.category || 'ΛΟΙΠΑ';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    // Group optional products by category
    const optionalProductsByCategory = optionalProducts.reduce((acc: any, product: any) => {
      const category = product.category || 'ΛΟΙΠΑ';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    let itemCounter = 1;

    // Helper function to generate product tables
    const generateProductTables = (productsByCategory: any, sectionTitle?: string) => {
      const tables: any[] = [];
      
      // Add section title if provided
      if (sectionTitle) {
        tables.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sectionTitle,
                bold: true,
                size: 26,
                color: '1F4788',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          })
        );
      }

      // Add each category as a separate table
      for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
        if (!Array.isArray(categoryProducts) || categoryProducts.length === 0) continue;

        // Category Title
        tables.push(
          new Paragraph({
            children: [
              new TextRun({
                text: category.toUpperCase(),
                bold: true,
                size: 24,
                color: '1F4788',
              }),
            ],
            spacing: { before: 300, after: 100 },
          })
        );

        // Category Table
        const categoryRows: TableRow[] = [];

        // Header Row
        categoryRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'α/α', bold: true, size: 20 }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 8, type: WidthType.PERCENTAGE },
                shading: { fill: '1F4788', color: 'FFFFFF' },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Περιγραφή', bold: true, size: 20, color: 'FFFFFF' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 52, type: WidthType.PERCENTAGE },
                shading: { fill: '1F4788' },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Τεμ', bold: true, size: 20, color: 'FFFFFF' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 10, type: WidthType.PERCENTAGE },
                shading: { fill: '1F4788' },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Τιμή Μονάδος € με Margin', bold: true, size: 20, color: 'FFFFFF' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { fill: '1F4788' },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Τελ. Σύνολο', bold: true, size: 20, color: 'FFFFFF' }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { fill: '1F4788' },
              }),
            ],
          })
        );

        // Data Rows
        let categorySubtotal = 0;
        categoryProducts.forEach((product: any) => {
          const unitPriceWithMargin = product.unitPrice * (1 + (product.margin || 0) / 100);
          const totalPrice = unitPriceWithMargin * product.quantity;
          categorySubtotal += totalPrice;

          categoryRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: itemCounter.toString(), size: 20 })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: product.name || 'N/A', size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: product.quantity.toString(), size: 20 })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: `${unitPriceWithMargin.toFixed(2)} €`, size: 20 })],
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: `${totalPrice.toFixed(2)} €`, size: 20 })],
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                }),
              ],
            })
          );
          itemCounter++;
        });

        // Subtotal Row
        categoryRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '' })],
                columnSpan: 4,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${categorySubtotal.toFixed(2)} €`,
                        bold: true,
                        size: 22,
                      }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                shading: { fill: 'FFD966' },
              }),
            ],
          })
        );

        tables.push(
          new Table({
            rows: categoryRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
      }

      return tables;
    };

    // Generate required products tables
    if (requiredProducts.length > 0) {
      const requiredTables = generateProductTables(requiredProductsByCategory, 'ΒΑΣΙΚΟΣ ΕΞΟΠΛΙΣΜΟΣ');
      allChildren.push(...requiredTables);
    }

    // Generate optional products tables
    if (optionalProducts.length > 0) {
      const optionalTables = generateProductTables(optionalProductsByCategory, 'ΠΡΟΕΡΑΙΤΙΚΟΣ ΕΞΟΠΛΙΣΜΟΣ (OPTIONAL)');
      allChildren.push(...optionalTables);
    }

    // OLD CODE REMOVED - NOW USING HELPER FUNCTION ABOVE
    /* for (const [category, categoryProducts] of Object.entries(productsByCategory) as [string, any[]]) {
      // Category Title
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: category.toUpperCase(),
              bold: true,
              size: 24,
              color: '1F4788',
            }),
          ],
          spacing: { before: 300, after: 100 },
        })
      );

      // Category Table
      const categoryRows: TableRow[] = [];

      // Header Row
      categoryRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'α/α', bold: true, size: 20 }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 8, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788', color: 'FFFFFF' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Περιγραφή', bold: true, size: 20, color: 'FFFFFF' }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 52, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Τεμ', bold: true, size: 20, color: 'FFFFFF' }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Τιμή Μονάδος € με Margin', bold: true, size: 20, color: 'FFFFFF' }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Τελ. Σύνολο', bold: true, size: 20, color: 'FFFFFF' }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
          ],
        })
      );

      // Data Rows
      let categorySubtotal = 0;
      categoryProducts.forEach((product: any) => {
        const unitPriceWithMargin = product.unitPrice * (1 + (product.margin || 0) / 100);
        const totalPrice = unitPriceWithMargin * product.quantity;
        categorySubtotal += totalPrice;

        categoryRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: itemCounter.toString(), size: 20 })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: product.name || 'N/A', size: 20 })],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: product.quantity.toString(), size: 20 })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `${unitPriceWithMargin.toFixed(2)} €`, size: 20 })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `${totalPrice.toFixed(2)} €`, size: 20 })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          })
        );
        itemCounter++;
      });

      // Subtotal Row
      categoryRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: '' })],
              columnSpan: 4,
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${categorySubtotal.toFixed(2)} €`,
                      bold: true,
                      size: 22,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              shading: { fill: 'FFD966' },
            }),
          ],
        })
      );

      allChildren.push(
        new Table({
          rows: categoryRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    } */

    // Services Table (if any)
    if (services.length > 0) {
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'ΥΠΗΡΕΣΙΕΣ ΥΠΟΣΤΗΡΙΞΗΣ',
              bold: true,
              size: 24,
              color: '1F4788',
            }),
          ],
          spacing: { before: 300, after: 100 },
        })
      );

      const serviceRows: TableRow[] = [];

      // Header Row
      serviceRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'α/α', bold: true, size: 20, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 8, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Περιγραφή', bold: true, size: 20, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 52, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Τεμ', bold: true, size: 20, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Τιμή Μονάδος € με Margin', bold: true, size: 20, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Τελ. Σύνολο', bold: true, size: 20, color: 'FFFFFF' })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788' },
            }),
          ],
        })
      );

      // Data Rows
      let servicesSubtotal = 0;
      services.forEach((service: any, idx: number) => {
        const unitPriceWithMargin = service.unitPrice * (1 + (service.margin || 0) / 100);
        const totalPrice = unitPriceWithMargin * service.quantity;
        servicesSubtotal += totalPrice;

        serviceRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: (idx + 1).toString(), size: 20 })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: service.name || 'N/A', size: 20 })],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: service.quantity.toString(), size: 20 })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `${unitPriceWithMargin.toFixed(2)} €`, size: 20 })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `${totalPrice.toFixed(2)} €`, size: 20 })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          })
        );
      });

      // Subtotal Row
      serviceRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: '' })],
              columnSpan: 4,
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${servicesSubtotal.toFixed(2)} €`,
                      bold: true,
                      size: 22,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              shading: { fill: 'FFD966' },
            }),
          ],
        })
      );

      allChildren.push(
        new Table({
          rows: serviceRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    // Grand Total
    const grandTotal = [...products, ...services].reduce((sum: number, item: any) => {
      const unitPriceWithMargin = item.unitPrice * (1 + (item.margin || 0) / 100);
      return sum + unitPriceWithMargin * item.quantity;
    }, 0);

    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `ΓΕΝΙΚΟ ΣΥΝΟΛΟ: ${grandTotal.toFixed(2)} € (πλέον ΦΠΑ 24%)`,
            bold: true,
            size: 26,
            color: '1F4788',
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 300, after: 400 },
      }),
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    // ========================================
    // 4. PRODUCT DETAILS SECTION
    // ========================================
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΑΝΑΛΥΤΙΚΗ ΠΕΡΙΓΡΑΦΗ ΠΡΟΪΟΝΤΩΝ',
            bold: true,
            size: 28,
            color: '1F4788',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 300 },
      })
    );

    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      const fullProduct = fullProducts.find((p) => p.id === product.id);

      console.log(`📝 Adding product detail ${index + 1}/${products.length}:`, {
        productId: product.id,
        productName: product.name,
        foundInDb: !!fullProduct,
        hasImages: fullProduct?.images?.length || 0,
        hasSpecs: fullProduct?.specifications?.length || 0,
      });

      // Product Name
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${product.name}`,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 150 },
        })
      );

      // Product Image
      if (fullProduct?.images && fullProduct.images.length > 0) {
        try {
          const imageUrl = fullProduct.images[0].url;
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            const imageType = imageUrl.toLowerCase().endsWith('.png') ? 'png' : 'jpg';

            allChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: Buffer.from(imageBuffer),
                    type: imageType,
                    transformation: {
                      width: 300,
                      height: 300,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              })
            );
          }
        } catch (error) {
          console.error(`❌ Failed to load image for product ${product.id}:`, error);
        }
      }

      // Product Description
      const greekTranslation = fullProduct?.translations?.find((t: any) => t.languageCode === 'el');
      if (greekTranslation?.description) {
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: greekTranslation.description,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }

      // Product Specifications
      if (fullProduct?.specifications && fullProduct.specifications.length > 0) {
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        const specsRows: TableRow[] = [];

        // Header
        specsRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'ΧΑΡΑΚΤΗΡΙΣΤΙΚΟ', bold: true, size: 20, color: 'FFFFFF' })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '4A90A4' },
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'ΤΙΜΗ', bold: true, size: 20, color: 'FFFFFF' })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                shading: { fill: '4A90A4' },
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          })
        );

        // Specs data
        fullProduct.specifications.forEach((spec) => {
          const greekTranslation = spec.translations.find((t) => t.languageCode === 'el');
          const specName = greekTranslation?.specName || spec.specKey || 'N/A';
          const specValue = greekTranslation?.specValue || 'N/A';

          specsRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: specName, size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: specValue, size: 20 })],
                    }),
                  ],
                }),
              ],
            })
          );
        });

        allChildren.push(
          new Table({
            rows: specsRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
      }

      // Add spacing between products
      allChildren.push(
        new Paragraph({
          text: '',
          spacing: { after: 400 },
        })
      );
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: allChildren,
        },
      ],
    });

    console.log('✅ Document created successfully with all sections');

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Save to database with versioning
    const baseFileName = `Proposal_${siteSurvey.title || 'SiteSurvey'}_${new Date().toISOString().split('T')[0]}`;
    
    // Manage versions (max 10)
    const { nextVersion } = await manageDocumentVersions({
      entityType: 'site-survey',
      entityId: siteSurveyId,
      documentType: 'proposal-document',
      baseFileName,
      fileExtension: 'docx',
    });

    // Generate versioned filename
    const versionedFilename = generateVersionedFilename(baseFileName, nextVersion, 'docx');

    console.log('📤 Uploading Proposal Document to BunnyCDN:', versionedFilename);

    // Upload to BunnyCDN
    const uploadResult = await uploadFileToBunny(
      Buffer.from(buffer),
      `site-surveys/${siteSurveyId}/${versionedFilename}`,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    console.log('✅ Proposal Document uploaded:', uploadResult.url);

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        filename: versionedFilename,
        url: uploadResult.url,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.byteLength,
        entityType: 'site-survey',
        entityId: siteSurveyId,
        uploadedById: session.user.id,
      },
    });

    console.log('✅ Proposal Document file record created:', fileRecord.id);

    // Return the document as a downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(versionedFilename)}"`,
      },
    });
  } catch (error: any) {
    console.error('❌ Error generating proposal document:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate proposal document',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

