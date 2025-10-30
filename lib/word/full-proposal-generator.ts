import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, PageBreak, HeadingLevel, UnderlineType, BorderStyle, ShadingType, VerticalAlign } from 'docx';

interface ProposalData {
  // Project Information
  projectTitle: string;
  projectDescription?: string;
  projectScope?: string;
  projectDuration?: string;
  projectStartDate?: Date;
  projectEndDate?: Date;
  
  // Customer Information
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  contactName?: string;
  contactEmail?: string;
  
  // AI-Generated Content
  infrastructureDesc?: string;
  technicalDesc?: string;
  productsDesc?: string;
  servicesDesc?: string;
  scopeOfWork?: string;
  
  // ERP Information
  erpQuoteNumber?: string;
  erpSeriesNum?: number;
  
  // Equipment (for pricing table)
  products: Array<{
    name: string;
    brand?: string;
    category?: string;
    quantity: number;
    price: number;
    margin?: number;
  }>;
  services: Array<{
    name: string;
    category?: string;
    quantity: number;
    price: number;
    margin?: number;
  }>;
  
  // Company Information
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxId?: string;
  companyTaxOffice?: string;
}

/**
 * Generate full comprehensive proposal document with AI content in Greek
 */
export async function generateFullProposalDocument(data: ProposalData): Promise<Document> {
  // Helper: Create styled paragraph
  const createParagraph = (text: string, options: any = {}) => {
    return new Paragraph({
      children: [new TextRun({
        text,
        bold: options.bold || false,
        size: options.size || 24,
        color: options.color || '000000',
        font: 'Arial',
      })],
      alignment: options.alignment || AlignmentType.LEFT,
      spacing: options.spacing || { after: 200 },
      heading: options.heading || undefined,
    });
  };

  // Helper: Create heading
  const createHeading = (text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) => {
    return new Paragraph({
      text,
      heading: level,
      spacing: { before: 400, after: 200 },
    });
  };

  // Helper: Create table cell
  const createCell = (text: string, options: any = {}) => {
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text,
          bold: options.bold || false,
          size: options.size || 20,
          color: options.color || '000000',
        })],
        alignment: options.alignment || AlignmentType.LEFT,
      })],
      shading: options.shading || undefined,
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      verticalAlign: options.verticalAlign || VerticalAlign.CENTER,
    });
  };

  // Helper: Parse formatted text and create formatted paragraphs
  const parseFormattedText = (text: string): Paragraph[] => {
    const paragraphs: Paragraph[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a bullet point
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ') || trimmedLine.startsWith('* ')) {
        const bulletText = trimmedLine.substring(2).trim();
        paragraphs.push(new Paragraph({
          text: bulletText,
          bullet: { level: 0 },
          spacing: { after: 150 },
        }));
      }
      // Check if it's a numbered list
      else if (/^\d+[\.\)]/.test(trimmedLine)) {
        const numberedText = trimmedLine.replace(/^\d+[\.\)]\s*/, '');
        paragraphs.push(new Paragraph({
          text: numberedText,
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { after: 150 },
        }));
      }
      // Check if it's a heading (ALL CAPS or starts with ###)
      else if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 100 && trimmedLine.length > 5) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: trimmedLine,
            bold: true,
            size: 24,
            color: '1F4E78',
          })],
          spacing: { before: 300, after: 200 },
        }));
      }
      // Regular paragraph with inline bold detection
      else {
        // Simple bold detection: **text** or __text__
        const parts = trimmedLine.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
        const textRuns: TextRun[] = [];
        
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            textRuns.push(new TextRun({
              text: part.slice(2, -2),
              bold: true,
              size: 22,
            }));
          } else if (part.startsWith('__') && part.endsWith('__')) {
            textRuns.push(new TextRun({
              text: part.slice(2, -2),
              bold: true,
              size: 22,
            }));
          } else if (part.trim()) {
            textRuns.push(new TextRun({
              text: part,
              size: 22,
            }));
          }
        }
        
        if (textRuns.length > 0) {
          paragraphs.push(new Paragraph({
            children: textRuns,
            spacing: { after: 200 },
          }));
        }
      }
    }
    
    return paragraphs;
  };

  const children = [];

  // ===== PAGE 1: COVER PAGE =====
  children.push(
    // Company Name
    createParagraph(data.companyName, {
      bold: true,
      size: 36,
      color: '1F4E78',
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 200 },
    }),
    
    // Company Details
    createParagraph(data.companyAddress || '', {
      size: 20,
      color: '666666',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    createParagraph(`ΤΗΛ: ${data.companyPhone || ''} | EMAIL: ${data.companyEmail || ''}`, {
      size: 18,
      color: '666666',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    createParagraph(`ΑΦΜ: ${data.companyTaxId || ''} | ΔΟΥ: ${data.companyTaxOffice || ''}`, {
      size: 18,
      color: '666666',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    
    // Document Title
    createParagraph('ΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ', {
      bold: true,
      size: 32,
      color: '1F4E78',
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
    
    // Project Title
    createParagraph(data.projectTitle, {
      bold: true,
      size: 24,
      color: 'A23B72',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    
    // Customer Section
    createParagraph('ΠΡΟΣ:', {
      bold: true,
      size: 20,
      color: '333333',
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
    }),
    
    createParagraph(data.customerName, {
      bold: true,
      size: 24,
      color: '1F4E78',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    createParagraph(data.customerAddress || '', {
      size: 18,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    // ERP Quote Number (if available)
    ...(data.erpQuoteNumber ? [
      createParagraph(`ΑΡΙΘΜΟΣ ΠΡΟΣΦΟΡΑΣ: ${data.erpQuoteNumber}`, {
        bold: true,
        size: 20,
        color: 'A23B72',
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 100 },
      })
    ] : []),
    
    // Date
    createParagraph(`ΗΜΕΡΟΜΗΝΙΑ: ${new Date().toLocaleDateString('el-GR')}`, {
      size: 18,
      alignment: AlignmentType.LEFT,
      spacing: { before: 600, after: 0 },
    }),
    
    // Page Break
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===== PAGE 2: TABLE OF CONTENTS =====
  const hasProducts = data.products && data.products.length > 0;
  const hasServices = data.services && data.services.length > 0;
  
  let sectionNumber = 1;
  const sections = [];
  
  sections.push({ number: sectionNumber++, title: 'ΠΕΡΙΓΡΑΦΗ ΕΡΓΟΥ' });
  if (data.infrastructureDesc) sections.push({ number: sectionNumber++, title: 'ΥΠΟΔΟΜΗ' });
  if (data.technicalDesc) sections.push({ number: sectionNumber++, title: 'ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ' });
  if (data.productsDesc && hasProducts) sections.push({ number: sectionNumber++, title: 'ΠΡΟΪΟΝΤΑ' });
  if (data.servicesDesc && hasServices) sections.push({ number: sectionNumber++, title: 'ΥΠΗΡΕΣΙΕΣ' });
  if (data.scopeOfWork) sections.push({ number: sectionNumber++, title: 'ΕΜΒΕΛΕΙΑ ΕΡΓΑΣΙΩΝ' });
  sections.push({ number: sectionNumber++, title: 'ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ' });
  sections.push({ number: sectionNumber++, title: 'ΟΡΟΙ ΚΑΙ ΠΡΟΫΠΟΘΕΣΕΙΣ' });
  
  children.push(
    createParagraph('ΠΙΝΑΚΑΣ ΠΕΡΙΕΧΟΜΕΝΩΝ', {
      bold: true,
      size: 28,
      color: '1F4E78',
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
    }),
    
    ...sections.map(section => 
      createParagraph(`${section.number}. ${section.title}`, {
        size: 22,
        spacing: { after: 150 },
      })
    ),
    
    new Paragraph({ children: [new PageBreak()] })
  );
  
  // Reset section number for actual sections
  sectionNumber = 1;

  // ===== PAGE 3: PROJECT OVERVIEW =====
  children.push(
    createHeading(`${sectionNumber++}. ΠΕΡΙΓΡΑΦΗ ΕΡΓΟΥ`, HeadingLevel.HEADING_1),
    
    createParagraph(data.projectDescription || '', {
      size: 22,
      spacing: { after: 200 },
    }),
    
    ...(data.projectScope ? [
      createHeading('1.1 ΣΚΟΠΟΣ ΕΡΓΟΥ', HeadingLevel.HEADING_2),
      createParagraph(data.projectScope, {
        size: 22,
        spacing: { after: 200 },
      })
    ] : []),
    
    ...(data.projectDuration ? [
      createParagraph(`ΔΙΑΡΚΕΙΑ: ${data.projectDuration}`, {
        bold: true,
        size: 22,
        spacing: { after: 200 },
      })
    ] : []),
    
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===== PAGE 3: INFRASTRUCTURE DESCRIPTION =====
  if (data.infrastructureDesc) {
    children.push(
      createHeading(`${sectionNumber++}. ΥΠΟΔΟΜΗ`, HeadingLevel.HEADING_1),
      ...parseFormattedText(data.infrastructureDesc),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  // ===== PAGE 4: TECHNICAL DESCRIPTION =====
  if (data.technicalDesc) {
    children.push(
      createHeading(`${sectionNumber++}. ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ`, HeadingLevel.HEADING_1),
      ...parseFormattedText(data.technicalDesc),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  // ===== PAGE 5: PRODUCTS DESCRIPTION (only if products exist) =====
  if (data.productsDesc && hasProducts) {
    children.push(
      createHeading(`${sectionNumber++}. ΠΡΟΪΟΝΤΑ`, HeadingLevel.HEADING_1),
      ...parseFormattedText(data.productsDesc),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  // ===== PAGE 6: SERVICES DESCRIPTION (only if services exist) =====
  if (data.servicesDesc && hasServices) {
    children.push(
      createHeading(`${sectionNumber++}. ΥΠΗΡΕΣΙΕΣ`, HeadingLevel.HEADING_1),
      ...parseFormattedText(data.servicesDesc),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  // ===== PAGE 7: SCOPE OF WORK =====
  if (data.scopeOfWork) {
    children.push(
      createHeading(`${sectionNumber++}. ΕΜΒΕΛΕΙΑ ΕΡΓΑΣΙΩΝ`, HeadingLevel.HEADING_1),
      ...parseFormattedText(data.scopeOfWork),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  // ===== PAGE 8: PRICING TABLE =====
  children.push(
    createHeading(`${sectionNumber++}. ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ`, HeadingLevel.HEADING_1),
    
    // Products Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
      },
      rows: [
        // Header
        new TableRow({
          tableHeader: true,
          height: { value: 800, rule: 'atLeast' },
          children: [
            createCell('#', { 
              bold: true, 
              shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
              color: 'FFFFFF',
              size: 22,
              alignment: AlignmentType.CENTER,
              verticalAlign: VerticalAlign.CENTER
            }),
            createCell('ΠΡΟΪΟΝ', { 
              bold: true, 
              shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
              color: 'FFFFFF',
              size: 22,
              alignment: AlignmentType.LEFT
            }),
            createCell('BRAND', { 
              bold: true, 
              shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
              color: 'FFFFFF',
              size: 22,
              alignment: AlignmentType.CENTER
            }),
            createCell('ΚΑΤΗΓΟΡΙΑ', { 
              bold: true, 
              shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
              color: 'FFFFFF',
              size: 22,
              alignment: AlignmentType.CENTER
            }),
            createCell('ΠΟΣ.', { 
              bold: true, 
              shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
              color: 'FFFFFF',
              size: 22,
              alignment: AlignmentType.CENTER
            }),
            createCell('ΤΙΜΗ (€)', { 
              bold: true, 
              shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
              color: 'FFFFFF',
              size: 22,
              alignment: AlignmentType.RIGHT
            }),
            createCell('ΣΥΝΟΛΟ (€)', { 
              bold: true, 
              shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
              color: 'FFFFFF',
              size: 22,
              alignment: AlignmentType.RIGHT
            }),
          ],
        }),
        // Product Rows
        ...data.products.map((product, idx) => {
          const subtotal = product.quantity * product.price;
          const margin = product.margin || 0;
          const total = subtotal + (subtotal * margin / 100);
          const rowShading = idx % 2 === 0 ? { fill: 'F8F9FA', type: ShadingType.SOLID } : undefined;
          
          return new TableRow({
            height: { value: 600, rule: 'atLeast' },
            children: [
              createCell((idx + 1).toString(), { alignment: AlignmentType.CENTER, shading: rowShading }),
              createCell(product.name, { alignment: AlignmentType.LEFT, shading: rowShading }),
              createCell(product.brand || '-', { alignment: AlignmentType.CENTER, shading: rowShading }),
              createCell(product.category || '-', { alignment: AlignmentType.CENTER, shading: rowShading }),
              createCell(product.quantity.toString(), { alignment: AlignmentType.CENTER, shading: rowShading }),
              createCell(product.price.toFixed(2), { alignment: AlignmentType.RIGHT, shading: rowShading }),
              createCell(total.toFixed(2), { alignment: AlignmentType.RIGHT, shading: rowShading, bold: true }),
            ],
          });
        }),
        // Products Subtotal
        new TableRow({
          height: { value: 700, rule: 'atLeast' },
          children: [
            createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
            createCell('ΣΥΝΟΛΟ ΠΡΟΪΟΝΤΩΝ', { 
              bold: true, 
              alignment: AlignmentType.RIGHT,
              size: 24,
              shading: { fill: 'FFD966', type: ShadingType.SOLID }
            }),
            createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
            createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
            createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
            createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
            createCell(
              data.products.reduce((sum, p) => {
                const subtotal = p.quantity * p.price;
                const margin = p.margin || 0;
                return sum + subtotal + (subtotal * margin / 100);
              }, 0).toFixed(2) + ' €',
              { 
                bold: true, 
                shading: { fill: 'FFD966', type: ShadingType.SOLID },
                alignment: AlignmentType.RIGHT,
                size: 24
              }
            ),
          ],
        }),
      ],
    }),
    
    // Services Table (if any)
    ...(data.services.length > 0 ? [
      createParagraph('', { spacing: { before: 400, after: 200 } }),
      
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
        },
        rows: [
          // Header
          new TableRow({
            tableHeader: true,
            height: { value: 800, rule: 'atLeast' },
            children: [
              createCell('#', { 
                bold: true, 
                shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
                color: 'FFFFFF',
                size: 22,
                alignment: AlignmentType.CENTER,
                verticalAlign: VerticalAlign.CENTER
              }),
              createCell('ΥΠΗΡΕΣΙΑ', { 
                bold: true, 
                shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
                color: 'FFFFFF',
                size: 22,
                alignment: AlignmentType.LEFT
              }),
              createCell('ΚΑΤΗΓΟΡΙΑ', { 
                bold: true, 
                shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
                color: 'FFFFFF',
                size: 22,
                alignment: AlignmentType.CENTER
              }),
              createCell('ΠΟΣ.', { 
                bold: true, 
                shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
                color: 'FFFFFF',
                size: 22,
                alignment: AlignmentType.CENTER
              }),
              createCell('ΤΙΜΗ (€)', { 
                bold: true, 
                shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
                color: 'FFFFFF',
                size: 22,
                alignment: AlignmentType.RIGHT
              }),
              createCell('ΣΥΝΟΛΟ (€)', { 
                bold: true, 
                shading: { fill: '1F4E78', type: ShadingType.SOLID }, 
                color: 'FFFFFF',
                size: 22,
                alignment: AlignmentType.RIGHT
              }),
            ],
          }),
          // Service Rows
          ...data.services.map((service, idx) => {
            const subtotal = service.quantity * service.price;
            const margin = service.margin || 0;
            const total = subtotal + (subtotal * margin / 100);
            const rowShading = idx % 2 === 0 ? { fill: 'F8F9FA', type: ShadingType.SOLID } : undefined;
            
            return new TableRow({
              height: { value: 600, rule: 'atLeast' },
              children: [
                createCell((idx + 1).toString(), { alignment: AlignmentType.CENTER, shading: rowShading }),
                createCell(service.name, { alignment: AlignmentType.LEFT, shading: rowShading }),
                createCell(service.category || '-', { alignment: AlignmentType.CENTER, shading: rowShading }),
                createCell(service.quantity.toString(), { alignment: AlignmentType.CENTER, shading: rowShading }),
                createCell(service.price.toFixed(2), { alignment: AlignmentType.RIGHT, shading: rowShading }),
                createCell(total.toFixed(2), { alignment: AlignmentType.RIGHT, shading: rowShading, bold: true }),
              ],
            });
          }),
          // Services Subtotal
          new TableRow({
            height: { value: 700, rule: 'atLeast' },
            children: [
              createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
              createCell('ΣΥΝΟΛΟ ΥΠΗΡΕΣΙΩΝ', { 
                bold: true, 
                alignment: AlignmentType.RIGHT,
                size: 24,
                shading: { fill: 'FFD966', type: ShadingType.SOLID }
              }),
              createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
              createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
              createCell('', { shading: { fill: 'FFD966', type: ShadingType.SOLID } }),
              createCell(
                data.services.reduce((sum, s) => {
                  const subtotal = s.quantity * s.price;
                  const margin = s.margin || 0;
                  return sum + subtotal + (subtotal * margin / 100);
                }, 0).toFixed(2) + ' €',
                { 
                  bold: true, 
                  shading: { fill: 'FFD966', type: ShadingType.SOLID },
                  alignment: AlignmentType.RIGHT,
                  size: 24
                }
              ),
            ],
          }),
        ],
      })
    ] : []),
    
    // Grand Total
    createParagraph('', { spacing: { before: 400, after: 200 } }),
    
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.DOUBLE, size: 3, color: "A23B72" },
        bottom: { style: BorderStyle.DOUBLE, size: 3, color: "A23B72" },
        left: { style: BorderStyle.DOUBLE, size: 3, color: "A23B72" },
        right: { style: BorderStyle.DOUBLE, size: 3, color: "A23B72" },
      },
      rows: [
        new TableRow({
          height: { value: 900, rule: 'atLeast' },
          children: [
            createCell('ΓΕΝΙΚΟ ΣΥΝΟΛΟ', {
              bold: true,
              size: 28,
              color: 'FFFFFF',
              alignment: AlignmentType.RIGHT,
              shading: { fill: 'A23B72', type: ShadingType.SOLID },
              verticalAlign: VerticalAlign.CENTER,
            }),
            createCell(
              (() => {
                const productsTotal = data.products.reduce((sum, p) => {
                  const subtotal = p.quantity * p.price;
                  const margin = p.margin || 0;
                  return sum + subtotal + (subtotal * margin / 100);
                }, 0);
                
                const servicesTotal = data.services.reduce((sum, s) => {
                  const subtotal = s.quantity * s.price;
                  const margin = s.margin || 0;
                  return sum + subtotal + (subtotal * margin / 100);
                }, 0);
                
                return (productsTotal + servicesTotal).toFixed(2) + ' €';
              })(),
              {
                bold: true,
                size: 28,
                color: 'FFFFFF',
                alignment: AlignmentType.RIGHT,
                shading: { fill: 'A23B72', type: ShadingType.SOLID },
                verticalAlign: VerticalAlign.CENTER,
              }
            ),
          ],
        }),
      ],
    }),
    
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===== PAGE 9: TERMS & CONDITIONS =====
  children.push(
    createHeading(`${sectionNumber++}. ΟΡΟΙ ΚΑΙ ΠΡΟΫΠΟΘΕΣΕΙΣ`, HeadingLevel.HEADING_1),
    
    createParagraph('1. ΙΣΧΥΣ ΠΡΟΣΦΟΡΑΣ: 30 ΗΜΕΡΕΣ ΑΠΟ ΤΗΝ ΗΜΕΡΟΜΗΝΙΑ ΕΚΔΟΣΗΣ', {
      size: 20,
      spacing: { after: 150 },
    }),
    
    createParagraph('2. ΕΓΓΥΗΣΗ: ΟΛΑ ΤΑ ΠΡΟΪΟΝΤΑ ΠΕΡΙΛΑΜΒΑΝΟΥΝ ΕΓΓΥΗΣΗ 2 ΕΤΩΝ', {
      size: 20,
      spacing: { after: 150 },
    }),
    
    createParagraph('3. ΕΓΚΑΤΑΣΤΑΣΗ: ΠΕΡΙΛΑΜΒΑΝΟΝΤΑΙ ΟΙ ΥΠΗΡΕΣΙΕΣ ΕΓΚΑΤΑΣΤΑΣΗΣ ΟΠΩΣ ΑΝΑΦΕΡΟΝΤΑΙ', {
      size: 20,
      spacing: { after: 150 },
    }),
    
    createParagraph('4. ΟΡΟΙ ΠΛΗΡΩΜΗΣ: 50% ΠΡΟΚΑΤΑΒΟΛΗ, 50% ΜΕ ΤΗΝ ΟΛΟΚΛΗΡΩΣΗ', {
      size: 20,
      spacing: { after: 150 },
    }),
    
    createParagraph('5. ΦΠΑ: ΟΙ ΤΙΜΕΣ ΕΙΝΑΙ ΧΩΡΙΣ ΦΠΑ', {
      size: 20,
      spacing: { after: 150 },
    }),
    
    // Signature Section
    createParagraph('', { spacing: { before: 600, after: 200 } }),
    
    createParagraph('ΓΙΑ ΤΗΝ ΕΤΑΙΡΕΙΑ', {
      bold: true,
      size: 20,
      spacing: { before: 400, after: 400 },
    }),
    
    createParagraph('_______________________________', {
      size: 20,
      spacing: { after: 100 },
    }),
    
    createParagraph('ΥΠΟΓΡΑΦΗ & ΣΦΡΑΓΙΔΑ', {
      size: 18,
      color: '666666',
    })
  );

  return new Document({
    sections: [{
      properties: {},
      children,
    }],
  });
}

/**
 * Generate proposal document and return as Buffer
 */
export async function generateFullProposalBuffer(data: ProposalData): Promise<Buffer> {
  const doc = await generateFullProposalDocument(data);
  return await Packer.toBuffer(doc);
}

