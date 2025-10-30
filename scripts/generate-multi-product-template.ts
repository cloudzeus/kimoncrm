/**
 * Script to generate a multi-product analysis Word template
 * This creates a template that supports multiple products using docxtemplater loops
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, PageBreak } from 'docx';
import fs from 'fs';
import path from 'path';

async function generateMultiProductTemplate() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Document Header
          new Paragraph({
            children: [
              new TextRun({
                text: '═══════════════════════════════════════════════════',
                color: '1A5490',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          
          // Document Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΑΝΑΛΥΣΗ ΠΡΟΪΟΝΤΩΝ',
                bold: true,
                size: 36,
                color: '1A5490',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'Συνολικά Προϊόντα: {totalProducts}',
                size: 24,
                color: '6B7280',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '═══════════════════════════════════════════════════',
                color: '1A5490',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          // START OF PRODUCTS LOOP
          new Paragraph({
            children: [
              new TextRun({
                text: '{#products}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          // Product Name
          new Paragraph({
            children: [
              new TextRun({
                text: '{productName}',
                bold: true,
                size: 28,
                color: '2E86AB',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          
          // Main Image (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasMainImage}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{%mainImage}',
                italics: true,
                color: '6B7280',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/hasMainImage}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 100 },
          }),
          
          // Description Section
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΠΕΡΙΓΡΑΦΗ',
                bold: true,
                size: 20,
                color: '374151',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
            border: {
              bottom: {
                color: 'BFDBFE',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{description}',
                size: 22,
              }),
            ],
            spacing: { after: 300 },
          }),
          
          // Brand (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasBrand}ΜΑΡΚΑ: {brandName}{/hasBrand}',
                bold: true,
                size: 22,
                color: '4B5563',
              }),
            ],
            spacing: { after: 100 },
          }),
          
          // Category (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasCategory}ΚΑΤΗΓΟΡΙΑ: {categoryName}{/hasCategory}',
                bold: true,
                size: 22,
                color: '4B5563',
              }),
            ],
            spacing: { after: 100 },
          }),
          
          // Dimensions (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasDimensions}ΔΙΑΣΤΑΣΕΙΣ: {dimensions}{/hasDimensions}',
                size: 22,
                color: '4B5563',
              }),
            ],
            spacing: { after: 100 },
          }),
          
          // Weight (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasWeight}ΒΑΡΟΣ: {weight}{/hasWeight}',
                size: 22,
                color: '4B5563',
              }),
            ],
            spacing: { after: 200 },
          }),
          
          // Specifications Section (Conditional with Loop)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasSpecifications}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ',
                bold: true,
                size: 20,
                color: '374151',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
            border: {
              bottom: {
                color: 'BFDBFE',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          }),
          
          // Specifications Loop
          new Paragraph({
            children: [
              new TextRun({
                text: '{#specifications}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '• {name}: ',
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: '{value}',
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/specifications}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/hasSpecifications}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 200 },
          }),
          
          // Additional Images Section (Conditional with Loop)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasAdditionalImages}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΕΠΙΠΛΕΟΝ ΕΙΚΟΝΕΣ',
                bold: true,
                size: 20,
                color: '374151',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
            border: {
              bottom: {
                color: 'BFDBFE',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{#additionalImages}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{%this}',
                italics: true,
                color: '6B7280',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/additionalImages}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/hasAdditionalImages}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 400 },
          }),
          
          // Product separator line
          new Paragraph({
            children: [
              new TextRun({
                text: '───────────────────────────────────────────────────',
                color: 'D1D5DB',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
            pageBreakBefore: true,
          }),
          
          // END OF PRODUCTS LOOP
          new Paragraph({
            children: [
              new TextRun({
                text: '{/products}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          // Document Footer
          new Paragraph({
            children: [
              new TextRun({
                text: '═══════════════════════════════════════════════════',
                color: 'D1D5DB',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'Ημερομηνία Δημιουργίας: {generatedDate}',
                size: 18,
                color: '6B7280',
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '═══════════════════════════════════════════════════',
                color: 'D1D5DB',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          }),
        ],
      },
    ],
  });
  
  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  
  // Save to public/templates directory - create new filename for multi-product template
  const outputPath = path.join(process.cwd(), 'public', 'templates', 'multi-product-analysis-template.docx');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`✅ Multi-product template generated successfully at: ${outputPath}`);
  console.log('📝 This template supports looping through multiple products');
  console.log('💡 The template uses docxtemplater syntax for conditional sections and loops');
}

// Run the script
generateMultiProductTemplate()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

