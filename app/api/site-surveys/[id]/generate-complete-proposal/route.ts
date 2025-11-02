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
  HeadingLevel,
  ImageRun,
  Packer,
  BorderStyle,
  ShadingType,
  UnderlineType,
} from 'docx';

/**
 * Complete Proposal Document Generator
 * Matches the exact format from the provided Word document template
 * 
 * Structure:
 * 1. Cover Page (with company header, FINCODE, customer, assignees)
 * 2. Table of Contents
 * 3. ΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ (Technical Proposal - AI generated text)
 * 4. ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ (Product specs with images - bulleted format)
 * 5. ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ (Pricing tables - Required, Optional, Services)
 * 6. ΑΠΟΜΑΚΡΥΣΜΕΝΗ ΥΠΟΣΤΗΡΙΞΗ (Warranty & Support terms)
 */

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
    const { products = [], services = [] } = body;

    console.log('📄 Generating complete proposal document:', {
      siteSurveyId,
      productsCount: products.length,
      servicesCount: services.length,
    });

    // Fetch site survey with all relations
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      include: {
        customer: true,
        lead: true,
        proposals: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        assignedUser: {
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

    const latestProposal = siteSurvey.proposals?.[0];
    const customerName = siteSurvey.customer?.company?.name || siteSurvey.customer?.name || 'N/A';
    const projectName = siteSurvey.projectName || siteSurvey.siteName || 'Site Survey';
    const proposalNumber = latestProposal?.erpProposalNumber || 'TRF>PENDING';
    const assignedUserName = siteSurvey.assignedUser?.name || session.user.name || 'N/A';

    // Fetch full product details
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
        brand: true,
        category: true,
      },
    });

    const allChildren: any[] = [];

    // ========================================
    // 1. COVER PAGE
    // ========================================
    
    // Company Header Block (Blue background)
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Advanced Integrated Communication Ltd.',
            bold: true,
            size: 24,
            color: 'FFFFFF',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '4472C4',
          fill: '4472C4',
        },
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Διονυσίου Πλακοδούρη & Τιμοδέμου',
            size: 20,
            color: 'FFFFFF',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '4472C4',
          fill: '4472C4',
        },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΑΦΜ: 997088870 ΔΟΥ Ηρακλείου',
            size: 18,
            color: 'FFFFFF',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '4472C4',
          fill: '4472C4',
        },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '28ωος Οκτωβρίου 125,70, Τ.Κ. 71305',
            size: 18,
            color: 'FFFFFF',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '4472C4',
          fill: '4472C4',
        },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '210-6610380 sales@aic.gr',
            size: 18,
            color: 'FFFFFF',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '4472C4',
          fill: '4472C4',
        },
        spacing: { after: 400 },
      })
    );

    // Proposal Details
    const currentDate = new Date().toLocaleDateString('el-GR');
    
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Ημερομηνία: ${currentDate}`,
            size: 22,
          }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Αριθμός Προσφοράς: ${proposalNumber}`,
            size: 22,
            bold: true,
            color: 'FF0000',
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΟΙΚΟΝΟΜΟΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ',
            bold: true,
            size: 32,
            color: '1F4788',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: projectName.toUpperCase(),
            bold: true,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: customerName,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Assignees section
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΠΑΡΑΣΚΕΥΑΣΕ ΧΕΙΡΟΝΟΜΕ:',
            bold: true,
            size: 20,
          }),
          new TextRun({
            text: `  ${assignedUserName}`,
            size: 20,
          }),
        ],
        spacing: { before: 400, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΕΞΟΥΣΙΑ ΥΠΟΓΡΑΦΗΣ:',
            bold: true,
            size: 20,
          }),
          new TextRun({
            text: '  ΓΙΑΝΝΗΣ ΚΟΣΥΦΗΣ',
            size: 20,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    // ========================================
    // 2. TABLE OF CONTENTS
    // ========================================
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Περιεχόμενα',
            bold: true,
            size: 28,
            color: '1F4788',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 300 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'ΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ', size: 22 }),
          new TextRun({ text: ' ............................................................. 3', size: 22 }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ', size: 22 }),
          new TextRun({ text: ' .................................................... 4', size: 22 }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ', size: 22 }),
          new TextRun({ text: ' .......................................................... 11', size: 22 }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'ΑΝΑΛΥΤΙΚΗ ΠΕΡΙΓΡΑΦΗ ΠΡΟΪΟΝΤΩΝ & ΣΥΝΤΗΡΗΣΗ ΒΛΑΒΩΝ', size: 22 }),
          new TextRun({ text: ' .......... 13', size: 22 }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'ΤΡΟΠΟΣ & ΠΟΡΟΣ ΠΛΗΡΩΜΗΣ & ΕΓΓΥΗΣΗ', size: 22 }),
          new TextRun({ text: ' ............................... 15', size: 22 }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    // ========================================
    // 3. TECHNICAL PROPOSAL (AI Generated Text)
    // ========================================
    const technicalDescription = latestProposal?.technicalDesc || '';
    
    if (technicalDescription) {
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'ΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ',
              bold: true,
              size: 28,
              color: 'FFFFFF',
            }),
          ],
          shading: {
            type: ShadingType.SOLID,
            color: '1F4788',
            fill: '1F4788',
          },
          spacing: { before: 200, after: 300 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: technicalDescription,
              size: 22,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 },
        }),
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }

    // ========================================
    // 4. PRODUCT SPECIFICATIONS (Bulleted Format)
    // ========================================
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ',
            bold: true,
            size: 28,
            color: 'FFFFFF',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '1F4788',
          fill: '1F4788',
        },
        spacing: { before: 200, after: 300 },
      })
    );

    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      const fullProduct = fullProducts.find((p) => p.id === product.id);

      // Product Name (Red + Underline)
      allChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: fullProduct?.name || product.name,
              bold: true,
              size: 24,
              color: 'FF0000',
              underline: {
                type: UnderlineType.SINGLE,
              },
            }),
            new TextRun({
              text: '  Product Name',
              size: 20,
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
      if (fullProduct?.description) {
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Product description',
                bold: true,
                size: 22,
                color: 'FF0000',
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: fullProduct.description,
                size: 20,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
          })
        );
      }

      // Product Specifications (Bulleted List)
      if (fullProduct?.specifications && fullProduct.specifications.length > 0) {
        allChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Βασικά χαρακτηριστικά',
                bold: true,
                size: 22,
                color: 'FF0000',
              }),
              new TextRun({
                text: '  Product specs',
                size: 20,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        fullProduct.specifications.forEach((spec) => {
          const greekTranslation = spec.translations.find((t) => t.languageCode === 'el');
          const specName = greekTranslation?.specName || spec.specKey || 'N/A';
          const specValue = greekTranslation?.specValue || 'N/A';

          allChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${specName}: ${specValue}`,
                  size: 20,
                }),
              ],
              spacing: { after: 50 },
            })
          );
        });
      }

      allChildren.push(
        new Paragraph({
          text: '',
          spacing: { after: 300 },
        })
      );
    }

    allChildren.push(
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    // ========================================
    // 5. FINANCIAL PROPOSAL (Pricing Tables)
    // ========================================
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ',
            bold: true,
            size: 28,
            color: 'FFFFFF',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '1F4788',
          fill: '1F4788',
        },
        spacing: { before: 200, after: 300 },
      })
    );

    // Separate required and optional products
    const requiredProducts = products.filter((p: any) => !p.isOptional);
    const optionalProducts = products.filter((p: any) => p.isOptional);

    // Helper function to create pricing table
    const createPricingTable = (items: any[], sectionTitle: string, greekTitle: string) => {
      const elements: any[] = [];

      // Section header (Red)
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sectionTitle,
              bold: true,
              size: 24,
              color: 'FF0000',
            }),
            new TextRun({
              text: `                    ${greekTitle}`,
              bold: true,
              size: 24,
              color: 'FF0000',
            }),
          ],
          spacing: { before: 300, after: 200 },
        })
      );

      // Create table
      const tableRows: TableRow[] = [];

      // Header row (Dark blue background, white text)
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'α/α', bold: true, size: 20, color: 'FFFFFF' }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 8, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788', type: ShadingType.SOLID, color: '1F4788' },
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
              shading: { fill: '1F4788', type: ShadingType.SOLID, color: '1F4788' },
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
              shading: { fill: '1F4788', type: ShadingType.SOLID, color: '1F4788' },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Τιμή Μονάδος €', bold: true, size: 18, color: 'FFFFFF' }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'με Μάτζιν', bold: true, size: 18, color: 'FFFFFF' }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: { fill: '1F4788', type: ShadingType.SOLID, color: '1F4788' },
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
              shading: { fill: '1F4788', type: ShadingType.SOLID, color: '1F4788' },
            }),
          ],
        })
      );

      // Data rows
      let sectionTotal = 0;
      items.forEach((item: any, idx: number) => {
        const unitPriceWithMargin = item.unitPrice * (1 + (item.margin || 0) / 100);
        const totalPrice = unitPriceWithMargin * item.quantity;
        sectionTotal += totalPrice;

        // Get full product details for description
        const fullProduct = fullProducts.find((p) => p.id === item.id);
        const description = fullProduct?.name || item.name;

        tableRows.push(
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
                    children: [new TextRun({ text: description, size: 20 })],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: item.quantity.toString(), size: 20 })],
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

      // Total row (Yellow background)
      tableRows.push(
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
                      text: `${sectionTotal.toFixed(2)} €`,
                      bold: true,
                      size: 24,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              shading: { fill: 'FFD966', type: ShadingType.SOLID, color: 'FFD966' },
            }),
          ],
        })
      );

      elements.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      return elements;
    };

    // Add Required Products Table
    if (requiredProducts.length > 0) {
      const requiredElements = createPricingTable(
        requiredProducts,
        'Main Equipment',
        'ΒΑΣΙΚΟΣ ΕΞΟΠΛΙΣΜΟΣ'
      );
      allChildren.push(...requiredElements);
    }

    // Add Optional Products Table
    if (optionalProducts.length > 0) {
      const optionalElements = createPricingTable(
        optionalProducts,
        'Optional Equipment',
        'ΠΡΟΕΡΑΙΤΙΚΟΣ ΕΞΟΠΛΙΣΜΟΣ'
      );
      allChildren.push(...optionalElements);
    }

    // Add Services Table
    if (services.length > 0) {
      const servicesElements = createPricingTable(
        services,
        'All Services',
        'ΥΠΗΡΕΣΙΕΣ ΥΠΟΣΤΗΡΙΞΗΣ'
      );
      allChildren.push(...servicesElements);
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
    // 6. WARRANTY & SUPPORT SECTION
    // ========================================
    allChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'ΑΠΟΜΑΚΡΥΣΜΕΝΗ ΥΠΟΣΤΗΡΙΞΗ & ΣΥΝΤΗΡΗΣΗ ΒΛΑΒΩΝ',
            bold: true,
            size: 24,
            color: 'FFFFFF',
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '1F4788',
          fill: '1F4788',
        },
        spacing: { before: 200, after: 300 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Η απομακρυσμένη υποστήριξη και συντήρηση περιλαμβάνει:',
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '• Απομακρυσμένη υποστήριξη των τηλεφωνικών κέντρων',
            size: 20,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '• Εκπαίδευση φυλάκων/υπολλήλων - όσους απαιτηθούν για χρήση και τοπρησία βλαβών, Όπου θα παρέχεται ο χώρος και το χρόνος να γίνει η εκπαίδευση χωρίς κάποιος κόσμος εμπλέκεται όλλον χρήσιμη στην λειτουργία των δοσοσμέδων',
            size: 20,
          }),
        ],
        spacing: { after: 400 },
      })
    );

    // ========================================
    // CREATE DOCUMENT
    // ========================================
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: allChildren,
        },
      ],
    });

    console.log('✅ Complete proposal document created successfully');

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Save to database with versioning
    const baseFileName = `Complete-Proposal_${siteSurvey.projectName || 'SiteSurvey'}_${new Date().toISOString().split('T')[0]}`;
    
    const { nextVersion } = await manageDocumentVersions({
      entityType: 'site-survey',
      entityId: siteSurveyId,
      documentType: 'complete-proposal',
      baseFileName,
      fileExtension: 'docx',
    });

    const versionedFilename = generateVersionedFilename(baseFileName, nextVersion, 'docx');

    console.log('📤 Uploading complete proposal to BunnyCDN:', versionedFilename);

    const uploadResult = await uploadFileToBunny({
      buffer: Buffer.from(buffer),
      filename: versionedFilename,
      folder: `site-surveys/${siteSurveyId}`,
    });

    console.log('✅ Complete proposal uploaded:', uploadResult.url);

    await prisma.file.create({
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

    // Return the document
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(versionedFilename)}"`,
      },
    });
  } catch (error: any) {
    console.error('❌ Error generating complete proposal:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate complete proposal',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

