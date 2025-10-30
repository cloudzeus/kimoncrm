/**
 * Script to generate a basic product analysis Word template
 * This creates a properly formatted .docx template file with docxtemplater placeholders
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';
import fs from 'fs';
import path from 'path';

async function generateProductAnalysisTemplate() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header with decorative line
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
          
          // Main Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΑΝΑΛΥΣΗ ΠΡΟΪΟΝΤΟΣ',
                bold: true,
                size: 32,
                color: '1A5490',
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
          
          // Product Name (Template Placeholder)
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
            spacing: { after: 400 },
          }),
          
          // Main Image Placeholder
          new Paragraph({
            children: [
              new TextRun({
                text: '[ΕΙΚΟΝΑ: {%mainImage}]',
                italics: true,
                color: '6B7280',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
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
            spacing: { after: 400 },
          }),
          
          // Brand Section (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasBrand}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΜΑΡΚΑ',
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
                text: '{brandName}',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/hasBrand}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          // Category Section (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasCategory}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΚΑΤΗΓΟΡΙΑ',
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
                text: '{categoryName}',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/hasCategory}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          // Dimensions Section (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasDimensions}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΔΙΑΣΤΑΣΕΙΣ',
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
                text: '{dimensions}',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/hasDimensions}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          // Weight Section (Conditional)
          new Paragraph({
            children: [
              new TextRun({
                text: '{#hasWeight}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'ΒΑΡΟΣ',
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
                text: '{weight}',
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '{/hasWeight}',
                size: 1,
                color: 'FFFFFF',
              }),
            ],
            spacing: { after: 0 },
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
            spacing: { after: 400 },
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
                text: '[ΕΙΚΟΝΑ: {%this}]',
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
          
          // Footer
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
  
  // Save to public/templates directory
  const outputPath = path.join(process.cwd(), 'public', 'templates', 'product-analysis-template.docx');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`✅ Template generated successfully at: ${outputPath}`);
  console.log('📝 You can now customize this template by opening it in Microsoft Word');
  console.log('💡 Replace the placeholder text with actual docxtemplater syntax if needed');
}

// Run the script
generateProductAnalysisTemplate()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

