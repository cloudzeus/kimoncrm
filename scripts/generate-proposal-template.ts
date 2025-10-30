import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, Bookmark, PageBreak, ImageRun } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a simple, editable Word template for proposals
 * 
 * Structure:
 * 1. Cover Page (project name, customer, assignee, offer number, date)
 * 2. Table of Contents with bookmarks
 * 3. Project Description
 * 4. Products & Services Table with pricing
 * 5. Product Descriptions with images
 */

async function generateProposalTemplate() {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // ==== PAGE 1: COVER PAGE ====
        new Paragraph({
          text: '{COMPANY_NAME}',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 2880, after: 400 }, // 2 inches before
        }),
        
        new Paragraph({
          text: '{COMPANY_ADDRESS}',
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: '{COMPANY_PHONE} | {COMPANY_EMAIL}',
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: '{COMPANY_TAX_ID} | {COMPANY_TAX_OFFICE}',
          alignment: AlignmentType.CENTER,
          spacing: { after: 2880 }, // 2 inches after
        }),
        
        new Paragraph({
          text: 'ΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 1440, after: 400 },
        }),
        
        new Paragraph({
          text: '{PROJECT_TITLE}',
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 1440 },
        }),
        
        new Paragraph({
          children: [new TextRun({ text: 'ΠΡΟΣ:', bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 1440, after: 200 },
        }),
        
        new Paragraph({
          text: '{CUSTOMER_NAME}',
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: '{CUSTOMER_ADDRESS}',
          alignment: AlignmentType.CENTER,
          spacing: { after: 1440 },
        }),
        
        new Paragraph({
          children: [new TextRun({ text: 'ΑΡΙΘΜΟΣ ΠΡΟΣΦΟΡΑΣ: {ERP_QUOTE_NUMBER}', bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 1440, after: 200 },
        }),
        
        new Paragraph({
          text: 'ΗΜΕΡΟΜΗΝΙΑ: {DATE}',
          alignment: AlignmentType.LEFT,
          spacing: { before: 1440, after: 200 },
        }),
        
        new Paragraph({
          text: 'ΥΠΕΥΘΥΝΟΣ: {ASSIGNEE_NAME}',
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'ASSIGNED TO: {ASSIGNED_TO_NAME}',
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [new PageBreak()],
        }),
        
        // ==== PAGE 2: TABLE OF CONTENTS ====
        new Paragraph({
          text: 'ΠΕΡΙΕΧΟΜΕΝΑ',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: '1. ΠΕΡΙΓΡΑΦΗ ΕΡΓΟΥ',
              bold: true,
            }),
            new TextRun({
              text: ' .................................. ',
            }),
            new TextRun({
              text: 'Σελίδα 3',
            }),
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: '2. ΥΠΟΔΟΜΗ',
              bold: true,
            }),
            new TextRun({
              text: ' .................................. ',
            }),
            new TextRun({
              text: 'Σελίδα 4',
            }),
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: '3. ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ',
              bold: true,
            }),
            new TextRun({
              text: ' .................................. ',
            }),
            new TextRun({
              text: 'Σελίδα 5',
            }),
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: '4. ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ',
              bold: true,
            }),
            new TextRun({
              text: ' .................................. ',
            }),
            new TextRun({
              text: 'Σελίδα 6',
            }),
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: '5. ΠΕΡΙΓΡΑΦΗ ΠΡΟΪΟΝΤΩΝ',
              bold: true,
            }),
            new TextRun({
              text: ' .................................. ',
            }),
            new TextRun({
              text: 'Σελίδα 7',
            }),
          ],
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: '6. ΟΡΟΙ ΚΑΙ ΠΡΟΫΠΟΘΕΣΕΙΣ',
              bold: true,
            }),
            new TextRun({
              text: ' .................................. ',
            }),
            new TextRun({
              text: 'Σελίδα 8',
            }),
          ],
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [new PageBreak()],
        }),
        
        // ==== PAGE 3: PROJECT DESCRIPTION ====
        new Paragraph({
          text: '1. ΠΕΡΙΓΡΑΦΗ ΕΡΓΟΥ',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
          children: [
            new Bookmark({
              id: 'project_description',
              children: [new TextRun('1. ΠΕΡΙΓΡΑΦΗ ΕΡΓΟΥ')],
            }),
          ],
        }),
        
        new Paragraph({
          text: '{PROJECT_DESCRIPTION}',
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          text: '1.1 ΣΚΟΠΟΣ ΕΡΓΟΥ',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: '{PROJECT_SCOPE}',
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [new TextRun({ text: 'ΔΙΑΡΚΕΙΑ: {PROJECT_DURATION}', bold: true })],
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [new PageBreak()],
        }),
        
        // ==== PAGE 4: INFRASTRUCTURE ====
        new Paragraph({
          text: '2. ΥΠΟΔΟΜΗ',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
          children: [
            new Bookmark({
              id: 'infrastructure',
              children: [new TextRun('2. ΥΠΟΔΟΜΗ')],
            }),
          ],
        }),
        
        new Paragraph({
          text: '{INFRASTRUCTURE_DESC}',
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [new PageBreak()],
        }),
        
        // ==== PAGE 5: TECHNICAL DESCRIPTION ====
        new Paragraph({
          text: '3. ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
          children: [
            new Bookmark({
              id: 'technical',
              children: [new TextRun('3. ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ')],
            }),
          ],
        }),
        
        new Paragraph({
          text: '{TECHNICAL_DESC}',
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [new PageBreak()],
        }),
        
        // ==== PAGE 6: PRICING TABLE ====
        new Paragraph({
          text: '4. ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
          children: [
            new Bookmark({
              id: 'pricing',
              children: [new TextRun('4. ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ')],
            }),
          ],
        }),
        
        // Pricing Table - Simple structure for user to edit
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('#')] }),
                new TableCell({ children: [new Paragraph('ΠΡΟΪΟΝ/ΥΠΗΡΕΣΙΑ')] }),
                new TableCell({ children: [new Paragraph('BRAND')] }),
                new TableCell({ children: [new Paragraph('ΠΟΣ.')] }),
                new TableCell({ children: [new Paragraph('ΤΙΜΗ (€)')] }),
                new TableCell({ children: [new Paragraph('ΣΥΝΟΛΟ (€)')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('{#}')] }),
                new TableCell({ children: [new Paragraph('{PRODUCT_NAME}')] }),
                new TableCell({ children: [new Paragraph('{BRAND}')] }),
                new TableCell({ children: [new Paragraph('{QUANTITY}')] }),
                new TableCell({ children: [new Paragraph('{PRICE}')] }),
                new TableCell({ children: [new Paragraph('{TOTAL}')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('')], columnSpan: 5 }),
                new TableCell({ children: [new Paragraph('ΓΕΝΙΚΟ ΣΥΝΟΛΟ: {GRAND_TOTAL} €')] }),
              ],
            }),
          ],
        }),
        
        new Paragraph({
          children: [new PageBreak()],
        }),
        
        // ==== PAGE 7: PRODUCT DESCRIPTIONS ====
        new Paragraph({
          text: '5. ΠΕΡΙΓΡΑΦΗ ΠΡΟΪΟΝΤΩΝ',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
          children: [
            new Bookmark({
              id: 'products',
              children: [new TextRun('5. ΠΕΡΙΓΡΑΦΗ ΠΡΟΪΟΝΤΩΝ')],
            }),
          ],
        }),
        
        new Paragraph({
          text: '{PRODUCT_INDEX}. {PRODUCT_NAME}',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: '{PRODUCT_DESCRIPTION}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          children: [new TextRun({ text: 'ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ', bold: true })],
          spacing: { before: 200, after: 200 },
        }),
        
        new Paragraph({
          text: '{PRODUCT_SPECIFICATIONS}',
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          text: '[Product Image Here - {PRODUCT_IMAGE}]',
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
        }),
        
        new Paragraph({
          children: [new PageBreak()],
        }),
        
        // ==== PAGE 8: TERMS & CONDITIONS ====
        new Paragraph({
          text: '6. ΟΡΟΙ ΚΑΙ ΠΡΟΫΠΟΘΕΣΕΙΣ',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 400 },
          children: [
            new Bookmark({
              id: 'terms',
              children: [new TextRun('6. ΟΡΟΙ ΚΑΙ ΠΡΟΫΠΟΘΕΣΕΙΣ')],
            }),
          ],
        }),
        
        new Paragraph({
          text: '1. ΙΣΧΥΣ ΠΡΟΣΦΟΡΑΣ: 30 ΗΜΕΡΕΣ ΑΠΟ ΤΗΝ ΗΜΕΡΟΜΗΝΙΑ ΕΚΔΟΣΗΣ',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: '2. ΕΓΓΥΗΣΗ: ΟΛΑ ΤΑ ΠΡΟΪΟΝΤΑ ΠΕΡΙΛΑΜΒΑΝΟΥΝ ΕΓΓΥΗΣΗ 2 ΕΤΩΝ',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: '3. ΕΓΚΑΤΑΣΤΑΣΗ: ΠΕΡΙΛΑΜΒΑΝΟΝΤΑΙ ΟΙ ΥΠΗΡΕΣΙΕΣ ΕΓΚΑΤΑΣΤΑΣΗΣ ΟΠΩΣ ΑΝΑΦΕΡΟΝΤΑΙ',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: '4. ΟΡΟΙ ΠΛΗΡΩΜΗΣ: 50% ΠΡΟΚΑΤΑΒΟΛΗ, 50% ΜΕ ΤΗΝ ΟΛΟΚΛΗΡΩΣΗ',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: '5. ΦΠΑ: ΟΙ ΤΙΜΕΣ ΕΙΝΑΙ ΧΩΡΙΣ ΦΠΑ',
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          children: [new TextRun({ text: 'ΓΙΑ ΤΗΝ ΕΤΑΙΡΕΙΑ', bold: true })],
          spacing: { before: 1440, after: 400 },
        }),
        
        new Paragraph({
          text: '_______________________________',
          spacing: { before: 800, after: 200 },
        }),
        
        new Paragraph({
          text: 'ΥΠΟΓΡΑΦΗ & ΣΦΡΑΓΙΔΑ',
          spacing: { after: 200 },
        }),
      ],
    }],
  });

  return doc;
}

// Execute the generation
async function main() {
  console.log('Generating proposal template...');
  
  const doc = await generateProposalTemplate();
  const buffer = await Packer.toBuffer(doc);
  
  const outputPath = path.join(process.cwd(), 'public', 'templates', 'proposal-template.docx');
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`✅ Template generated successfully at: ${outputPath}`);
  console.log('You can now open and edit this template in Microsoft Word.');
}

main().catch(console.error);

