// @ts-nocheck
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
  try {
    // Validate required data
    if (!surveyData || !surveyData.title) {
      throw new Error('Invalid survey data: missing required fields');
    }

    if (!companyDetails || !companyDetails.name) {
      throw new Error('Invalid company details: missing required fields');
    }

    // Ensure equipment is an array
    const safeEquipment = Array.isArray(equipment) ? equipment : [];

    console.log('Generating Word document with:', {
      surveyTitle: surveyData.title,
      equipmentCount: safeEquipment.length,
      companyName: companyDetails.name
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Cover Page
            ...createCoverPage(surveyData, companyDetails),
            new PageBreak(),
            
            // Table of Contents
            ...createTableOfContents(),
            new PageBreak(),
            
            // Executive Summary
            ...createExecutiveSummary(surveyData),
            new PageBreak(),
            
            // Project Information
            ...createProjectInformation(surveyData),
            new PageBreak(),
            
            // Site Survey Details
            ...createSiteSurveyDetails(surveyData),
            new PageBreak(),
            
            // Current Infrastructure Assessment
            ...createInfrastructureAnalysis(surveyData),
            new PageBreak(),
            
            // Future Requirements
            ...createFutureRequirements(surveyData, safeEquipment),
            new PageBreak(),
            
            // Bill of Materials
            ...createBillOfMaterials(safeEquipment),
            new PageBreak(),
            
            // Product Datasheets
            ...createProductDatasheets(safeEquipment),
            new PageBreak(),
            
            // Attachments
            ...createAttachments(surveyData.files || []),
            new PageBreak(),
            
            // Appendices
            ...createAppendices(surveyData),
          ],
        },
      ],
    });

    console.log('Document created successfully, generating buffer...');
    const buffer = await Packer.toBuffer(doc);
    console.log('Word document generated successfully, size:', buffer.length);
    
    return buffer;
  } catch (error) {
    console.error('Error in generateSiteSurveyWordDocument:', error);
    throw new Error(`Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function createCoverPage(surveyData: SiteSurveyData, companyDetails: CompanyDetails) {
  return [
    // Company Header with Logo Placeholder
    new Paragraph({
      children: [
        new TextRun({
          text: companyDetails.name.toUpperCase(),
          bold: true,
          size: 40,
          color: "1A5490",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 200 },
    }),
    
    // Company Tagline/Subtitle
    new Paragraph({
      children: [
        new TextRun({
          text: "PROFESSIONAL IT INFRASTRUCTURE CONSULTANCY",
          size: 14,
          color: "4B5563",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    
    // Decorative Line
    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: "1A5490",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    
    // Main Document Title
    new Paragraph({
      children: [
        new TextRun({
          text: "COMPREHENSIVE",
          size: 20,
          color: "6B7280",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "SITE SURVEY REPORT",
          bold: true,
          size: 36,
          color: "1A1A1A",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    
    // Survey Title
    new Paragraph({
      children: [
        new TextRun({
          text: surveyData.title,
          bold: true,
          size: 28,
          color: "1A5490",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    
    // Survey Type Badge
    new Paragraph({
      children: [
        new TextRun({
          text: `  ${surveyData.type}  `,
          bold: true,
          size: 16,
          color: "FFFFFF",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 600 },
      shading: {
        type: ShadingType.SOLID,
        color: "1A5490",
      },
    }),
    
    // Customer Information Box
    new Table({
      width: {
        size: 80,
        type: WidthType.PERCENTAGE,
      },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "PREPARED FOR",
                      bold: true,
                      size: 14,
                      color: "FFFFFF",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "1A5490" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: surveyData.customer.name,
                      bold: true,
                      size: 18,
                      color: "1A1A1A",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: surveyData.customer.address || '',
                      size: 12,
                      color: "6B7280",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 50 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: surveyData.customer.city || '',
                      size: 12,
                      color: "6B7280",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: surveyData.customer.email || '',
                      size: 11,
                      color: "1A5490",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 50 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: surveyData.customer.phone || '',
                      size: 11,
                      color: "6B7280",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F9FAFB" },
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "1A5490" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "1A5490" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "1A5490" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "1A5490" },
      },
    }),
    
    // Survey Details Grid
    new Paragraph({
      children: [
        new TextRun({
          text: "",
        }),
      ],
      spacing: { before: 600, after: 200 },
    }),
    
    new Table({
      width: {
        size: 80,
        type: WidthType.PERCENTAGE,
      },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Survey ID:", bold: true, size: 12 }),
                  ],
                }),
              ],
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `SS-${surveyData.id}`, size: 12 }),
                  ],
                }),
              ],
              width: { size: 60, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Survey Type:", bold: true, size: 12 }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: surveyData.type, size: 12 }),
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
                    new TextRun({ text: "Status:", bold: true, size: 12 }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: surveyData.status, size: 12, bold: true, color: "059669" }),
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
                    new TextRun({ text: "Survey Date:", bold: true, size: 12 }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: surveyData.arrangedDate
                        ? new Date(surveyData.arrangedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'To be scheduled',
                      size: 12,
                    }),
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
                    new TextRun({ text: "Location:", bold: true, size: 12 }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${surveyData.address || 'Not specified'}, ${surveyData.city || ''}`,
                      size: 12,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
      },
    }),
    
    // Footer Section
    new Paragraph({
      children: [
        new TextRun({
          text: "",
        }),
      ],
      spacing: { before: 1000 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          color: "D1D5DB",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: companyDetails.address || '',
          size: 10,
          color: "6B7280",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `${companyDetails.phone || ''} • ${companyDetails.email || ''} • ${companyDetails.website || ''}`,
          size: 10,
          color: "6B7280",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Document generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
          size: 9,
          color: "9CA3AF",
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
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
          color: "1A5490",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "1. Executive Summary",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " .......................................................... 3",
          size: 12,
          color: "D1D5DB",
        }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "2. Project Information",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " ......................................................... 4",
          size: 12,
          color: "D1D5DB",
        }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "3. Site Survey Details",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " .......................................................... 5",
          size: 12,
          color: "D1D5DB",
        }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "4. Current Infrastructure Assessment",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " .................................... 6",
          size: 12,
          color: "D1D5DB",
        }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "5. Future Requirements",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " ........................................................ 7",
          size: 12,
          color: "D1D5DB",
        }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "6. Bill of Materials",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " ............................................................... 8",
          size: 12,
          color: "D1D5DB",
        }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "7. Product Datasheets",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " ........................................................... 9",
          size: 12,
          color: "D1D5DB",
        }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "8. Attachments",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " .................................................................. 10",
          size: 12,
          color: "D1D5DB",
        }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "9. Appendices",
          bold: true,
          size: 12,
        }),
        new TextRun({
          text: " .................................................................... 11",
          size: 12,
          color: "D1D5DB",
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
  const elements = [
    new Paragraph({
      children: [
        new TextRun({
          text: "CURRENT INFRASTRUCTURE ASSESSMENT",
          bold: true,
          size: 20,
          color: "1A5490",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "Infrastructure Overview",
          bold: true,
          size: 16,
          color: "1F2937",
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }),
  ];

  if (!surveyData.buildings || surveyData.buildings.length === 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No infrastructure data has been documented for this survey.",
            italics: true,
            color: "6B7280",
          }),
        ],
        spacing: { after: 300 },
      })
    );
    return elements;
  }

  // Infrastructure Summary
  let totalFloors = 0;
  let totalRacks = 0;
  let totalRooms = 0;
  let totalDevices = 0;

  surveyData.buildings.forEach((building: any) => {
    if (building.centralRack) totalRacks++;
    building.floors?.forEach((floor: any) => {
      totalFloors++;
      totalRooms += floor.rooms?.length || 0;
      totalRacks += floor.floorRacks?.length || 0;
      
      // Count devices
      floor.rooms?.forEach((room: any) => {
        totalDevices += room.devices?.length || 0;
      });
      floor.floorRacks?.forEach((rack: any) => {
        totalDevices += rack.devices?.length || 0;
      });
    });
    if (building.centralRack?.devices) {
      totalDevices += building.centralRack.devices.length;
    }
  });

  // Summary Table
  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Buildings", bold: true })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "EFF6FF" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: surveyData.buildings.length.toString() })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Total Floors", bold: true })] })],
              shading: { type: ShadingType.SOLID, color: "EFF6FF" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: totalFloors.toString() })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Total Racks", bold: true })] })],
              shading: { type: ShadingType.SOLID, color: "EFF6FF" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: totalRacks.toString() })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Total Rooms", bold: true })] })],
              shading: { type: ShadingType.SOLID, color: "EFF6FF" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: totalRooms.toString() })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Network Devices", bold: true })] })],
              shading: { type: ShadingType.SOLID, color: "EFF6FF" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: totalDevices.toString() })] })],
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DBEAFE" },
      },
    })
  );

  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "",
        }),
      ],
      spacing: { before: 400, after: 200 },
    })
  );

  // Building Details
  surveyData.buildings.forEach((building: any, idx: number) => {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${idx + 1}. ${building.name}`,
            bold: true,
            size: 14,
            color: "1F2937",
          }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 200 },
      })
    );

    if (building.address || building.code) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${building.code ? `Code: ${building.code} | ` : ''}${building.address || 'No address specified'}`,
              size: 11,
              color: "6B7280",
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Central Rack
    if (building.centralRack) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `   • Central Rack: ${building.centralRack.name}`,
              size: 11,
            }),
            ...(building.centralRack.devices?.length
              ? [
                  new TextRun({
                    text: ` (${building.centralRack.devices.length} device${building.centralRack.devices.length > 1 ? 's' : ''})`,
                    size: 11,
                    color: "059669",
                    bold: true,
                  }),
                ]
              : []),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Floors
    building.floors?.forEach((floor: any, fIdx: number) => {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `   • ${floor.name}`,
              size: 11,
              bold: true,
            }),
            new TextRun({
              text: ` - ${floor.rooms?.length || 0} room${(floor.rooms?.length || 0) !== 1 ? 's' : ''}, ${floor.floorRacks?.length || 0} rack${(floor.floorRacks?.length || 0) !== 1 ? 's' : ''}`,
              size: 11,
              color: "6B7280",
            }),
          ],
          spacing: { after: 100 },
        })
      );
    });

    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "",
          }),
        ],
        spacing: { after: 200 },
      })
    );
  });

  return elements;
}

function createFutureRequirements(surveyData: SiteSurveyData, equipment?: any[]) {
  const elements = [
    new Paragraph({
      children: [
        new TextRun({
          text: "FUTURE REQUIREMENTS",
          bold: true,
          size: 20,
          color: "1A5490",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "Recommended Infrastructure Upgrades",
          bold: true,
          size: 16,
          color: "1F2937",
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "Based on the site survey assessment, the following equipment and services have been identified as necessary for successful project implementation:",
          size: 11,
        }),
      ],
      spacing: { after: 300 },
    }),
  ];

  if (!equipment || equipment.length === 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No specific equipment or services have been defined for this project yet.",
            italics: true,
            color: "6B7280",
          }),
        ],
        spacing: { after: 300 },
      })
    );
    return elements;
  }

  // Separate products and services
  const products = equipment.filter((item: any) => item.type === 'product' || item.itemType === 'product');
  const services = equipment.filter((item: any) => item.type === 'service' || item.itemType === 'service');

  // Products Section
  if (products.length > 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Hardware & Equipment",
            bold: true,
            size: 14,
            color: "1F2937",
          }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 200 },
      })
    );

    products.forEach((product: any, idx: number) => {
      const location = product.infrastructureElement
        ? getLocationString(product.infrastructureElement, surveyData.buildings)
        : 'Not assigned';
      
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${idx + 1}. ${product.name}`,
              bold: true,
              size: 11,
            }),
          ],
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `   Quantity: ${product.quantity} | Location: ${location}`,
              size: 10,
              color: "6B7280",
            }),
          ],
          spacing: { after: 50 },
        })
      );

      if (product.notes) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `   Notes: ${product.notes}`,
                size: 10,
                color: "6B7280",
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    });
  }

  // Services Section
  if (services.length > 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Professional Services",
            bold: true,
            size: 14,
            color: "1F2937",
          }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 200 },
      })
    );

    services.forEach((service: any, idx: number) => {
      const location = service.infrastructureElement
        ? getLocationString(service.infrastructureElement, surveyData.buildings)
        : 'Not assigned';
      
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${idx + 1}. ${service.name}`,
              bold: true,
              size: 11,
            }),
          ],
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `   Quantity: ${service.quantity} ${service.unit || 'units'} | Location: ${location}`,
              size: 10,
              color: "6B7280",
            }),
          ],
          spacing: { after: 50 },
        })
      );

      if (service.notes) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `   Notes: ${service.notes}`,
                size: 10,
                color: "6B7280",
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    });
  }

  return elements;
}

function getLocationString(element: any, buildings?: any[]): string {
  if (!buildings || !element) return 'Not assigned';
  
  const parts: string[] = [];
  
  if (element.buildingIndex !== undefined && buildings[element.buildingIndex]) {
    const building = buildings[element.buildingIndex];
    parts.push(building.name);
    
    if (element.type === 'centralRack') {
      parts.push('Central Rack');
    } else if (element.floorIndex !== undefined && building.floors?.[element.floorIndex]) {
      const floor = building.floors[element.floorIndex];
      parts.push(floor.name);
      
      if (element.type === 'floorRack' && element.rackIndex !== undefined) {
        parts.push(`Floor Rack ${element.rackIndex + 1}`);
      } else if (element.type === 'room' && element.roomIndex !== undefined && floor.rooms?.[element.roomIndex]) {
        parts.push(floor.rooms[element.roomIndex].name);
      }
    }
  }
  
  return parts.length > 0 ? parts.join(' → ') : 'Not assigned';
}

function createBillOfMaterials(equipment?: any[]) {
  const elements = [
    new Paragraph({
      children: [
        new TextRun({
          text: "BILL OF MATERIALS",
          bold: true,
          size: 20,
          color: "1A5490",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
  ];

  if (!equipment || equipment.length === 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No equipment or services have been added to this project.",
            italics: true,
            color: "6B7280",
          }),
        ],
        spacing: { after: 300 },
      })
    );
    return elements;
  }

  // Separate products and services
  const products = equipment.filter((item: any) => item.type === 'product' || item.itemType === 'product');
  const services = equipment.filter((item: any) => item.type === 'service' || item.itemType === 'service');

  // Products BOM Table
  if (products.length > 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Products",
            bold: true,
            size: 16,
            color: "1F2937",
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      })
    );

    // Create products table
    const productRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, size: 11 })] })],
            width: { size: 5, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "DBEAFE" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Product Name", bold: true, size: 11 })] })],
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "DBEAFE" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Brand", bold: true, size: 11 })] })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "DBEAFE" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true, size: 11 })] })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "DBEAFE" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Qty", bold: true, size: 11 })], alignment: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "DBEAFE" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Unit Price", bold: true, size: 11 })], alignment: AlignmentType.RIGHT })],
            width: { size: 12, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "DBEAFE" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, size: 11 })], alignment: AlignmentType.RIGHT })],
            width: { size: 13, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "DBEAFE" },
          }),
        ],
      }),
    ];

    let productsTotal = 0;

    products.forEach((product: any, idx: number) => {
      const total = (product.price || 0) * (product.quantity || 0);
      productsTotal += total;

      productRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString(), size: 10 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: product.name || '', size: 10 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: product.brand || '-', size: 10 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: product.category || '-', size: 10 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: (product.quantity || 0).toString(), size: 10 })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `€${(product.price || 0).toFixed(2)}`, size: 10 })], alignment: AlignmentType.RIGHT })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `€${total.toFixed(2)}`, size: 10, bold: true })], alignment: AlignmentType.RIGHT })],
            }),
          ],
        })
      );
    });

    // Products Subtotal Row
    productRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "", size: 10 })] })],
            columnSpan: 6,
            shading: { type: ShadingType.SOLID, color: "EFF6FF" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Subtotal:", bold: true, size: 11 })] })],
            shading: { type: ShadingType.SOLID, color: "EFF6FF" },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "", size: 10 })] })],
            columnSpan: 6,
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `€${productsTotal.toFixed(2)}`, bold: true, size: 12, color: "1A5490" })], alignment: AlignmentType.RIGHT })],
          }),
        ],
      })
    );

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: productRows,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
        },
      })
    );
  }

  // Services BOM Table
  if (services.length > 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Services",
            bold: true,
            size: 16,
            color: "1F2937",
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    // Create services table
    const serviceRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, size: 11 })] })],
            width: { size: 5, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "D1FAE5" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Service Name", bold: true, size: 11 })] })],
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "D1FAE5" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true, size: 11 })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "D1FAE5" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Qty", bold: true, size: 11 })], alignment: AlignmentType.CENTER })],
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "D1FAE5" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Unit Price", bold: true, size: 11 })], alignment: AlignmentType.RIGHT })],
            width: { size: 12, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "D1FAE5" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, size: 11 })], alignment: AlignmentType.RIGHT })],
            width: { size: 13, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "D1FAE5" },
          }),
        ],
      }),
    ];

    let servicesTotal = 0;

    services.forEach((service: any, idx: number) => {
      const total = (service.price || 0) * (service.quantity || 0);
      servicesTotal += total;

      serviceRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString(), size: 10 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: service.name || '', size: 10 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: service.category || '-', size: 10 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${service.quantity || 0} ${service.unit || ''}`, size: 10 })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `€${(service.price || 0).toFixed(2)}`, size: 10 })], alignment: AlignmentType.RIGHT })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `€${total.toFixed(2)}`, size: 10, bold: true })], alignment: AlignmentType.RIGHT })],
            }),
          ],
        })
      );
    });

    // Services Subtotal Row
    serviceRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "", size: 10 })] })],
            columnSpan: 5,
            shading: { type: ShadingType.SOLID, color: "ECFDF5" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Subtotal:", bold: true, size: 11 })] })],
            shading: { type: ShadingType.SOLID, color: "ECFDF5" },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "", size: 10 })] })],
            columnSpan: 5,
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `€${servicesTotal.toFixed(2)}`, bold: true, size: 12, color: "059669" })], alignment: AlignmentType.RIGHT })],
          }),
        ],
      })
    );

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: serviceRows,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "A7F3D0" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "A7F3D0" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "A7F3D0" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "A7F3D0" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D1FAE5" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D1FAE5" },
        },
      })
    );
  }

  // Grand Total
  const grandTotal = equipment.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "",
        }),
      ],
      spacing: { before: 400, after: 200 },
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
                    new TextRun({
                      text: "GRAND TOTAL",
                      bold: true,
                      size: 16,
                      color: "FFFFFF",
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
              width: { size: 70, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "1A5490" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `€${grandTotal.toFixed(2)}`,
                      bold: true,
                      size: 18,
                      color: "FFFFFF",
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "1A5490" },
            }),
          ],
        }),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "1A5490" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "1A5490" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "1A5490" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "1A5490" },
      },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Note: All prices are exclusive of VAT and applicable taxes.",
          size: 9,
          color: "6B7280",
          italics: true,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 100 },
    })
  );

  return elements;
}

function createProductDatasheets(equipment?: any[]) {
  const elements = [
    new Paragraph({
      children: [
        new TextRun({
          text: "PRODUCT DATASHEETS",
          bold: true,
          size: 20,
          color: "1A5490",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "Detailed specifications and technical information for all products included in this project.",
          size: 11,
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  if (!equipment || equipment.length === 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No products have been added to this project.",
            italics: true,
            color: "6B7280",
          }),
        ],
        spacing: { after: 300 },
      })
    );
    return elements;
  }

  // Filter only products
  const products = equipment.filter((item: any) => item.type === 'product' || item.itemType === 'product');

  if (products.length === 0) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No products have been specified. Only services are included in this project.",
            italics: true,
            color: "6B7280",
          }),
        ],
        spacing: { after: 300 },
      })
    );
    return elements;
  }

  // Create datasheet for each product
  products.forEach((product: any, idx: number) => {
    // Product Header
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${idx + 1}. ${product.name}`,
            bold: true,
            size: 14,
            color: "1F2937",
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: idx > 0 ? 600 : 200, after: 200 },
        border: {
          bottom: {
            color: "BFDBFE",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
      })
    );

    // Product Information Table
    const productInfoRows = [];

    if (product.brand) {
      productInfoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Brand:", bold: true, size: 11 })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "F9FAFB" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: product.brand, size: 11 })] })],
              width: { size: 70, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    }

    if (product.category) {
      productInfoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Category:", bold: true, size: 11 })] })],
              shading: { type: ShadingType.SOLID, color: "F9FAFB" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: product.category, size: 11 })] })],
            }),
          ],
        })
      );
    }

    if (product.model) {
      productInfoRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Model:", bold: true, size: 11 })] })],
              shading: { type: ShadingType.SOLID, color: "F9FAFB" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: product.model, size: 11 })] })],
            }),
          ],
        })
      );
    }

    productInfoRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Quantity:", bold: true, size: 11 })] })],
            shading: { type: ShadingType.SOLID, color: "F9FAFB" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${product.quantity} ${product.unit || 'units'}`, size: 11, bold: true, color: "1A5490" })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Unit Price:", bold: true, size: 11 })] })],
            shading: { type: ShadingType.SOLID, color: "F9FAFB" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `€${(product.price || 0).toFixed(2)}`, size: 11 })] })],
          }),
        ],
      })
    );

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: productInfoRows,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "F3F4F6" },
        },
      })
    );

    // Product Images Section
    if (product.images && product.images.length > 0) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Product Images",
              bold: true,
              size: 12,
              color: "374151",
            }),
          ],
          spacing: { before: 300, after: 150 },
        })
      );

      // Note: Images would be embedded here if we fetch them as buffers
      product.images.forEach((image: any, imgIdx: number) => {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Image ${imgIdx + 1}: ${image.alt || 'Product image'}`,
                size: 10,
                color: "6B7280",
              }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `URL: ${image.url}`,
                size: 9,
                color: "9CA3AF",
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      });
    }

    // Description Section
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Description",
            bold: true,
            size: 12,
            color: "374151",
          }),
        ],
        spacing: { before: 300, after: 150 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: product.description || "Detailed product description and technical specifications will be provided upon request. Please contact our sales team for complete product documentation and datasheets.",
            size: 10,
            color: "4B5563",
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Technical Specifications Section
    if (product.specifications && product.specifications.length > 0) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Technical Specifications",
              bold: true,
              size: 12,
              color: "374151",
            }),
          ],
          spacing: { before: 200, after: 150 },
        })
      );

      // Create specifications table
      const specRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Specification", bold: true, size: 11 })] })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "EFF6FF" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true, size: 11 })] })],
              width: { size: 60, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: "EFF6FF" },
            }),
          ],
        }),
      ];

      product.specifications.forEach((spec: any) => {
        specRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: spec.name, size: 10, bold: true })] })],
                shading: { type: ShadingType.SOLID, color: "F9FAFB" },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: spec.value || '-', size: 10 })] })],
              }),
            ],
          })
        );
      });

      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: specRows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "BFDBFE" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
        })
      );
    } else {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Technical Specifications",
              bold: true,
              size: 12,
              color: "374151",
            }),
          ],
          spacing: { before: 200, after: 150 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "• Full technical specifications available in product datasheet",
              size: 10,
              color: "6B7280",
            }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "• Compliance certifications and regulatory information included",
              size: 10,
              color: "6B7280",
            }),
          ],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "• Installation and configuration guides available",
              size: 10,
              color: "6B7280",
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Notes if any
    if (product.notes) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Additional Notes",
              bold: true,
              size: 12,
              color: "374151",
            }),
          ],
          spacing: { before: 200, after: 150 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: product.notes,
              size: 10,
              color: "6B7280",
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });

  return elements;
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
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "B. Network Diagrams",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: "C. Equipment Photos",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    
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
