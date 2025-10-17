import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun, ExternalHyperlink, PageBreak } from 'docx';

interface CompanyDetails {
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  vatNumber?: string;
  registrationNumber?: string;
}

interface SiteSurveyData {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  arrangedDate?: string;
  address?: string;
  city?: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  contact?: {
    name: string;
    email?: string;
    phone?: string;
  };
  assignTo?: {
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
  files?: Array<{
    name: string;
    url: string;
    filetype: string;
    description?: string;
  }>;
  buildings?: any[];
  voipSurvey?: any;
  cablingSurvey?: any;
}

export async function generateSiteSurveyWordDocument(
  surveyData: SiteSurveyData,
  companyDetails: CompanyDetails,
  equipment?: any[]
): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cover Page
          createCoverPage(surveyData, companyDetails),
          new PageBreak(),
          
          // Table of Contents
          createTableOfContents(),
          new PageBreak(),
          
          // Executive Summary
          createExecutiveSummary(surveyData),
          new PageBreak(),
          
          // Project Information
          createProjectInformation(surveyData),
          new PageBreak(),
          
          // Site Survey Details
          createSiteSurveyDetails(surveyData),
          new PageBreak(),
          
          // Infrastructure Analysis
          createInfrastructureAnalysis(surveyData),
          new PageBreak(),
          
          // Equipment & BOM
          createEquipmentAndBOM(equipment),
          new PageBreak(),
          
          // Attachments
          createAttachments(surveyData.files || []),
          new PageBreak(),
          
          // Appendices
          createAppendices(surveyData),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function createCoverPage(surveyData: SiteSurveyData, companyDetails: CompanyDetails) {
  return [
    // Company Logo and Header
    new Paragraph({
      children: [
        new TextRun({
          text: companyDetails.name,
          bold: true,
          size: 32,
          color: "2E86AB",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    
    // Company Details
    new Paragraph({
      children: [
        new TextRun({
          text: companyDetails.address || "",
          size: 12,
          color: "666666",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `${companyDetails.city || ""} | ${companyDetails.phone || ""} | ${companyDetails.email || ""}`,
          size: 12,
          color: "666666",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: companyDetails.website || "",
          size: 12,
          color: "2E86AB",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    
    // Main Title
    new Paragraph({
      children: [
        new TextRun({
          text: "SITE SURVEY REPORT",
          bold: true,
          size: 28,
          color: "1A1A1A",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    
    // Survey Title
    new Paragraph({
      children: [
        new TextRun({
          text: surveyData.title,
          bold: true,
          size: 24,
          color: "2E86AB",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    // Survey Type Badge
    new Paragraph({
      children: [
        new TextRun({
          text: surveyData.type,
          bold: true,
          size: 18,
          color: "FFFFFF",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      shading: {
        type: ShadingType.SOLID,
        color: "2E86AB",
      },
    }),
    
    // Project Details Table
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "PROJECT DETAILS",
                      bold: true,
                      size: 16,
                      color: "2E86AB",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "CUSTOMER INFORMATION",
                      bold: true,
                      size: 16,
                      color: "2E86AB",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Survey ID:", bold: true }),
                    new TextRun({ text: ` SS-${surveyData.id}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Status:", bold: true }),
                    new TextRun({ text: ` ${surveyData.status}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Type:", bold: true }),
                    new TextRun({ text: ` ${surveyData.type}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Arranged Date:", bold: true }),
                    new TextRun({ text: ` ${surveyData.arrangedDate ? new Date(surveyData.arrangedDate).toLocaleDateString() : 'Not set'}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Location:", bold: true }),
                    new TextRun({ text: ` ${surveyData.address || 'Not specified'}` }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Customer:", bold: true }),
                    new TextRun({ text: ` ${surveyData.customer.name}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Email:", bold: true }),
                    new TextRun({ text: ` ${surveyData.customer.email || 'Not provided'}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Phone:", bold: true }),
                    new TextRun({ text: ` ${surveyData.customer.phone || 'Not provided'}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Address:", bold: true }),
                    new TextRun({ text: ` ${surveyData.customer.address || 'Not provided'}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Contact:", bold: true }),
                    new TextRun({ text: ` ${surveyData.contact?.name || 'Not assigned'}` }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
    }),
    
    // Footer
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          size: 10,
          color: "999999",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 800 },
    }),
  ];
}

function createTableOfContents() {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "TABLE OF CONTENTS",
          bold: true,
          size: 20,
          color: "2E86AB",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "1. Executive Summary",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "2. Project Information",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "3. Site Survey Details",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "4. Infrastructure Analysis",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "5. Equipment & Bill of Materials",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "6. Attachments",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "7. Appendices",
          bold: true,
        }),
      ],
      spacing: { after: 400 },
    }),
  ];
}

function createExecutiveSummary(surveyData: SiteSurveyData) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "EXECUTIVE SUMMARY",
          bold: true,
          size: 18,
          color: "2E86AB",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `This comprehensive site survey report presents the findings and recommendations for the ${surveyData.type} project at ${surveyData.customer.name}. The survey was conducted to assess the current infrastructure and provide detailed specifications for the proposed solution.`,
        }),
      ],
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "Key Findings:",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "• Current infrastructure assessment completed",
        }),
      ],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "• Technical requirements identified and documented",
        }),
      ],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "• Equipment specifications and Bill of Materials prepared",
        }),
      ],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "• Implementation timeline and recommendations provided",
        }),
      ],
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "This report serves as the foundation for project implementation and should be reviewed by all stakeholders before proceeding with the next phase of the project.",
        }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

function createProjectInformation(surveyData: SiteSurveyData) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "PROJECT INFORMATION",
          bold: true,
          size: 18,
          color: "2E86AB",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Project Title", bold: true }),
                  ],
                }),
              ],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: surveyData.title }),
                  ],
                }),
              ],
              width: { size: 70, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Survey Type", bold: true }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: surveyData.type }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Status", bold: true }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: surveyData.status }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Customer", bold: true }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: surveyData.customer.name }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Location", bold: true }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${surveyData.address || 'Not specified'}, ${surveyData.city || ''}` }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Arranged Date", bold: true }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: surveyData.arrangedDate ? new Date(surveyData.arrangedDate).toLocaleDateString() : 'Not set' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Assigned To", bold: true }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F8F9FA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: surveyData.assignTo?.name || 'Not assigned' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
    }),
  ];
}

function createSiteSurveyDetails(surveyData: SiteSurveyData) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "SITE SURVEY DETAILS",
          bold: true,
          size: 18,
          color: "2E86AB",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: surveyData.description || "No detailed description provided for this survey.",
        }),
      ],
      spacing: { after: 300 },
    }),
  ];
}

function createInfrastructureAnalysis(surveyData: SiteSurveyData) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "INFRASTRUCTURE ANALYSIS",
          bold: true,
          size: 18,
          color: "2E86AB",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: surveyData.buildings && surveyData.buildings.length > 0 
            ? `The site survey identified ${surveyData.buildings.length} building(s) requiring infrastructure assessment. Detailed infrastructure analysis is available in the appendices.`
            : "No infrastructure data available for this survey type.",
        }),
      ],
      spacing: { after: 300 },
    }),
  ];
}

function createEquipmentAndBOM(equipment?: any[]) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "EQUIPMENT & BILL OF MATERIALS",
          bold: true,
          size: 18,
          color: "2E86AB",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: equipment && equipment.length > 0 
            ? `A comprehensive Bill of Materials has been prepared with ${equipment.length} items identified for this project. Detailed specifications and pricing are available in the Excel attachment.`
            : "No equipment has been specified for this project yet.",
        }),
      ],
      spacing: { after: 300 },
    }),
  ];
}

function createAttachments(files: any[]) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "ATTACHMENTS",
          bold: true,
          size: 18,
          color: "2E86AB",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: files.length > 0 
            ? `The following ${files.length} file(s) are attached to this report:`
            : "No files are attached to this report.",
        }),
      ],
      spacing: { after: 300 },
    }),
    
    ...files.map(file => 
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${file.name} (${file.filetype.toUpperCase()})`,
          }),
        ],
        spacing: { after: 100 },
      })
    ),
  ];
}

function createAppendices(surveyData: SiteSurveyData) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "APPENDICES",
          bold: true,
          size: 18,
          color: "2E86AB",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "A. Technical Specifications",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    },
    
    new Paragraph({
      children: [
        new TextRun({
          text: "B. Network Diagrams",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    },
    
    new Paragraph({
      children: [
        new TextRun({
          text: "C. Equipment Photos",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    },
    
    new Paragraph({
      children: [
        new TextRun({
          text: "D. Site Floor Plans",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];
}
