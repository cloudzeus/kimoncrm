// @ts-nocheck
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ImageRun, BorderStyle } from 'docx';
import { BuildingData } from '@/components/site-surveys/comprehensive-infrastructure-wizard';

interface CompanyDetails {
  name: string;
  description: string;
  address: string;
  taxId: string;
  taxOffice: string;
  phone: string;
  email: string;
  logo?: string;
}

interface CustomerDetails {
  name: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  specifications: string[];
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  brand: string;
  category: string;
}

interface ServiceData {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export async function generateProposalDocument(
  building: BuildingData,
  companyDetails: CompanyDetails,
  customerDetails: CustomerDetails,
  products: ProductData[],
  services: ServiceData[]
) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: []
    }]
  });

  // Helper function to create styled paragraph
  const createStyledParagraph = (text: string, options: any = {}) => {
    return new Paragraph({
      children: [new TextRun({
        text,
        bold: options.bold || false,
        size: options.size || 24,
        color: options.color || '000000',
        font: options.font || 'Arial'
      })],
      alignment: options.alignment || AlignmentType.LEFT,
      spacing: options.spacing || { after: 200 }
    });
  };

  // Helper function to create table cell
  const createTableCell = (text: string, options: any = {}) => {
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text,
          bold: options.bold || false,
          size: options.size || 20,
          color: options.color || '000000'
        })],
        alignment: options.alignment || AlignmentType.LEFT
      })],
      margins: {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100
      },
      shading: options.shading || undefined
    });
  };

  // Helper function to collect proposed products and services
  const collectProposedItems = () => {
    const proposedProducts: ProductData[] = [];
    const proposedServices: ServiceData[] = [];

    // Process central rack
    if (building.centralRack) {
      // Cable terminations
      building.centralRack.cableTerminations?.forEach(term => {
        if (term.isFutureProposal && term.productId) {
          proposedProducts.push({
            id: term.productId,
            name: `${term.cableType} Cable Termination`,
            description: `High-quality ${term.cableType} cable termination for network infrastructure`,
            specifications: [
              `Cable Type: ${term.cableType}`,
              `Quantity: ${term.quantity || 1}`,
              term.totalFibers ? `Total Fibers: ${term.totalFibers}` : '',
              term.terminatedFibers ? `Terminated Fibers: ${term.terminatedFibers}` : '',
              term.fromLocation ? `From: ${term.fromLocation}` : '',
              term.toLocation ? `To: ${term.toLocation}` : ''
            ].filter(spec => spec !== ''),
            quantity: term.quantity || 1,
            unitPrice: 0, // Will be filled from products array
            totalPrice: 0,
            brand: term.cableType.split('_')[0] || 'Generic',
            category: 'Cable Termination'
          });
        }
        
        // Services
        term.services?.forEach(svc => {
          proposedServices.push({
            id: svc.serviceId,
            name: `Cable Termination Service`,
            description: `Professional installation and termination service for ${term.cableType} cables`,
            quantity: svc.quantity,
            unitPrice: 0,
            totalPrice: 0
          });
        });
      });

      // Switches
      building.centralRack.switches?.forEach(sw => {
        if (sw.isFutureProposal) {
          proposedProducts.push({
            id: sw.productId || `switch-${sw.id}`,
            name: `${sw.brand || 'Network'} Switch`,
            description: `Professional network switch for enterprise infrastructure`,
            specifications: [
              `Brand: ${sw.brand || 'Generic'}`,
              `Model: ${sw.model || 'N/A'}`,
              `Ports: ${sw.ports || 'Multiple'}`,
              `PoE Enabled: ${sw.poeEnabled ? 'Yes' : 'No'}`,
              `Management: ${sw.managementType || 'Web-based'}`
            ],
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            brand: sw.brand || 'Generic',
            category: 'Network Switch'
          });
        }
      });

      // Routers
      building.centralRack.routers?.forEach(router => {
        if (router.isFutureProposal) {
          proposedProducts.push({
            id: router.productId || `router-${router.id}`,
            name: `${router.brand || 'Network'} Router`,
            description: `Enterprise-grade router for network routing and security`,
            specifications: [
              `Brand: ${router.brand || 'Generic'}`,
              `Model: ${router.model || 'N/A'}`,
              `Interfaces: ${router.interfaces?.length || 0}`,
              `Security Features: ${router.securityFeatures || 'Standard'}`
            ],
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            brand: router.brand || 'Generic',
            category: 'Network Router'
          });
        }
      });

      // Servers
      building.centralRack.servers?.forEach(server => {
        if (server.isFutureProposal) {
          proposedProducts.push({
            id: server.productId || `server-${server.id}`,
            name: `${server.brand || 'Server'} Server`,
            description: `Enterprise server for data processing and storage`,
            specifications: [
              `Brand: ${server.brand || 'Generic'}`,
              `Model: ${server.model || 'N/A'}`,
              `CPU: ${server.cpu || 'Multi-core'}`,
              `RAM: ${server.ram || 'Expandable'}`,
              `Storage: ${server.storage || 'Configurable'}`
            ],
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            brand: server.brand || 'Generic',
            category: 'Server'
          });
        }
      });
    }

    // Process floors
    building.floors.forEach(floor => {
      floor.racks?.forEach(rack => {
        // Floor rack components
        rack.cableTerminations?.forEach(term => {
          if (term.isFutureProposal && term.productId) {
            proposedProducts.push({
              id: term.productId,
              name: `${term.cableType} Cable Termination`,
              description: `High-quality ${term.cableType} cable termination for floor infrastructure`,
              specifications: [
                `Cable Type: ${term.cableType}`,
                `Quantity: ${term.quantity || 1}`,
                `Location: ${floor.name} - ${rack.name}`,
                term.totalFibers ? `Total Fibers: ${term.totalFibers}` : '',
                term.terminatedFibers ? `Terminated Fibers: ${term.terminatedFibers}` : ''
              ].filter(spec => spec !== ''),
              quantity: term.quantity || 1,
              unitPrice: 0,
              totalPrice: 0,
              brand: term.cableType.split('_')[0] || 'Generic',
              category: 'Cable Termination'
            });
          }
        });

        rack.switches?.forEach(sw => {
          if (sw.isFutureProposal) {
            proposedProducts.push({
              id: sw.productId || `switch-${sw.id}`,
              name: `${sw.brand || 'Network'} Switch`,
              description: `Floor-level network switch for local connectivity`,
              specifications: [
                `Brand: ${sw.brand || 'Generic'}`,
                `Model: ${sw.model || 'N/A'}`,
                `Location: ${floor.name} - ${rack.name}`,
                `Ports: ${sw.ports || 'Multiple'}`,
                `PoE Enabled: ${sw.poeEnabled ? 'Yes' : 'No'}`
              ],
              quantity: 1,
              unitPrice: 0,
              totalPrice: 0,
              brand: sw.brand || 'Generic',
              category: 'Network Switch'
            });
          }
        });
      });

      // Process rooms
      floor.rooms.forEach(room => {
        room.devices?.forEach(device => {
          if (device.isFutureProposal) {
            proposedProducts.push({
              id: device.productId || `device-${device.id}`,
              name: `${device.type} Device`,
              description: `Professional ${device.type.toLowerCase()} device for ${room.name}`,
              specifications: [
                `Type: ${device.type}`,
                `Brand: ${device.brand || 'Generic'}`,
                `Model: ${device.model || 'N/A'}`,
                `Location: ${floor.name} - ${room.name}`,
                `Quantity: ${device.quantity || 1}`
              ],
              quantity: device.quantity || 1,
              unitPrice: 0,
              totalPrice: 0,
              brand: device.brand || 'Generic',
              category: device.type
            });
          }
        });

        room.outlets?.forEach(outlet => {
          if (outlet.isFutureProposal) {
            proposedProducts.push({
              id: outlet.productId || `outlet-${outlet.id}`,
              name: `Network Outlet`,
              description: `Professional network outlet for ${room.name}`,
              specifications: [
                `Type: Network Outlet`,
                `Brand: ${outlet.brand || 'Generic'}`,
                `Model: ${outlet.model || 'N/A'}`,
                `Location: ${floor.name} - ${room.name}`,
                `Quantity: ${outlet.quantity || 1}`
              ],
              quantity: outlet.quantity || 1,
              unitPrice: 0,
              totalPrice: 0,
              brand: outlet.brand || 'Generic',
              category: 'Network Outlet'
            });
          }
        });
      });
    });

    return { proposedProducts, proposedServices };
  };

  const { proposedProducts, proposedServices } = collectProposedItems();

  // Merge with provided products and services data
  const finalProducts = products.length > 0 ? products : proposedProducts;
  const finalServices = services.length > 0 ? services : proposedServices;

  // PAGE 1: COVER PAGE
  const coverPageChildren = [
    // Company Header with Gradient Background Effect
    createStyledParagraph('', { spacing: { before: 0, after: 0 } }),
    
    // Company Name
    createStyledParagraph(companyDetails.name, {
      bold: true,
      size: 32,
      color: '2E86AB',
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 }
    }),

    // Company Description
    createStyledParagraph(companyDetails.description, {
      size: 20,
      color: '666666',
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),

    // Company Details Box
    createStyledParagraph('', { spacing: { before: 300, after: 0 } }),
    
    // Address
    createStyledParagraph(`Address: ${companyDetails.address}`, {
      size: 18,
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 }
    }),

    // Tax Information
    createStyledParagraph(`Tax ID: ${companyDetails.taxId}`, {
      size: 18,
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 }
    }),

    createStyledParagraph(`Tax Office: ${companyDetails.taxOffice}`, {
      size: 18,
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 }
    }),

    // Contact Information
    createStyledParagraph(`Phone: ${companyDetails.phone}`, {
      size: 18,
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 }
    }),

    createStyledParagraph(`Email: ${companyDetails.email}`, {
      size: 18,
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 }
    }),

    // Document Title
    createStyledParagraph('TECHNICAL PROPOSAL', {
      bold: true,
      size: 28,
      color: '2E86AB',
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 }
    }),

    // Project Description
    createStyledParagraph('INFRASTRUCTURE UPGRADE PROPOSAL', {
      bold: true,
      size: 22,
      color: 'A23B72',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    // Customer Information
    createStyledParagraph('PROPOSAL FOR:', {
      bold: true,
      size: 20,
      color: '333333',
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 }
    }),

    createStyledParagraph(customerDetails.name, {
      bold: true,
      size: 24,
      color: '2E86AB',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    // Date
    createStyledParagraph(`Date: ${new Date().toLocaleDateString('en-GB')}`, {
      size: 18,
      alignment: AlignmentType.LEFT,
      spacing: { before: 400, after: 0 }
    }),

    // Proposal Number
    createStyledParagraph(`Proposal Number: ${Date.now().toString().slice(-6)}`, {
      size: 18,
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    })
  ];

  // PAGE 2+: PRODUCT SPECIFICATIONS
  const productPages = [];
  
  finalProducts.forEach((product, index) => {
    const productPageChildren = [
      // Product Title
      createStyledParagraph(`${index + 1}. ${product.name}`, {
        bold: true,
        size: 24,
        color: '2E86AB',
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 200 }
      }),

      // Product Description
      createStyledParagraph(product.description, {
        size: 18,
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 }
      }),

      // Specifications Header
      createStyledParagraph('Technical Specifications:', {
        bold: true,
        size: 20,
        color: 'A23B72',
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 100 }
      }),

      // Specifications List
      ...product.specifications.map(spec => 
        createStyledParagraph(`• ${spec}`, {
          size: 16,
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 }
        })
      ),

      // Product Details Table
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        },
        rows: [
          new TableRow({
            children: [
              createTableCell('Brand', { bold: true, shading: { fill: 'F0F0F0' } }),
              createTableCell('Category', { bold: true, shading: { fill: 'F0F0F0' } }),
              createTableCell('Quantity', { bold: true, shading: { fill: 'F0F0F0' } })
            ]
          }),
          new TableRow({
            children: [
              createTableCell(product.brand),
              createTableCell(product.category),
              createTableCell(product.quantity.toString())
            ]
          })
        ]
      })
    ];

    productPages.push(productPageChildren);
  });

  // FINAL PAGE: PRICING TABLE
  const pricingPageChildren = [
    // Pricing Header
    createStyledParagraph('FINANCIAL PROPOSAL', {
      bold: true,
      size: 28,
      color: 'FFFFFF',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 }
    }),

    // Products Pricing Table
    createStyledParagraph('PRODUCTS PRICING', {
      bold: true,
      size: 22,
      color: 'A23B72',
      alignment: AlignmentType.LEFT,
      spacing: { before: 300, after: 100 }
    }),

    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows: [
        // Header Row
        new TableRow({
          children: [
            createTableCell('Item', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' }),
            createTableCell('Product Description', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' }),
            createTableCell('Quantity', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' }),
            createTableCell('Unit Price (€)', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' }),
            createTableCell('Total Price (€)', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' })
          ]
        }),
        // Product Rows
        ...finalProducts.map((product, index) => 
          new TableRow({
            children: [
              createTableCell((index + 1).toString()),
              createTableCell(`${product.name} - ${product.description}`),
              createTableCell(product.quantity.toString()),
              createTableCell(product.unitPrice.toFixed(2)),
              createTableCell(product.totalPrice.toFixed(2))
            ]
          })
        ),
        // Products Subtotal
        new TableRow({
          children: [
            createTableCell('', { bold: true }),
            createTableCell('PRODUCTS SUBTOTAL', { bold: true, alignment: AlignmentType.RIGHT }),
            createTableCell(''),
            createTableCell(''),
            createTableCell(finalProducts.reduce((sum, p) => sum + p.totalPrice, 0).toFixed(2), { bold: true })
          ]
        })
      ]
    }),

    // Services Pricing Table
    createStyledParagraph('SERVICES PRICING', {
      bold: true,
      size: 22,
      color: 'A23B72',
      alignment: AlignmentType.LEFT,
      spacing: { before: 300, after: 100 }
    }),

    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows: [
        // Header Row
        new TableRow({
          children: [
            createTableCell('Item', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' }),
            createTableCell('Service Description', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' }),
            createTableCell('Quantity', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' }),
            createTableCell('Unit Price (€)', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' }),
            createTableCell('Total Price (€)', { bold: true, shading: { fill: '2E86AB' }, color: 'FFFFFF' })
          ]
        }),
        // Service Rows
        ...finalServices.map((service, index) => 
          new TableRow({
            children: [
              createTableCell((index + 1).toString()),
              createTableCell(`${service.name} - ${service.description}`),
              createTableCell(service.quantity.toString()),
              createTableCell(service.unitPrice.toFixed(2)),
              createTableCell(service.totalPrice.toFixed(2))
            ]
          })
        ),
        // Services Subtotal
        new TableRow({
          children: [
            createTableCell('', { bold: true }),
            createTableCell('SERVICES SUBTOTAL', { bold: true, alignment: AlignmentType.RIGHT }),
            createTableCell(''),
            createTableCell(''),
            createTableCell(finalServices.reduce((sum, s) => sum + s.totalPrice, 0).toFixed(2), { bold: true })
          ]
        }),
        // Grand Total
        new TableRow({
          children: [
            createTableCell('', { bold: true }),
            createTableCell('GRAND TOTAL', { bold: true, alignment: AlignmentType.RIGHT, shading: { fill: 'A23B72' }, color: 'FFFFFF' }),
            createTableCell(''),
            createTableCell(''),
            createTableCell((finalProducts.reduce((sum, p) => sum + p.totalPrice, 0) + finalServices.reduce((sum, s) => sum + s.totalPrice, 0)).toFixed(2), { bold: true, shading: { fill: 'A23B72' }, color: 'FFFFFF' })
          ]
        })
      ]
    }),

    // Terms and Conditions
    createStyledParagraph('TERMS AND CONDITIONS', {
      bold: true,
      size: 22,
      color: 'A23B72',
      alignment: AlignmentType.LEFT,
      spacing: { before: 400, after: 100 }
    }),

    createStyledParagraph('1. Proposal validity: 30 days from date of issue', {
      size: 16,
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 }
    }),

    createStyledParagraph('2. All products include 2-year warranty from purchase date', {
      size: 16,
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 }
    }),

    createStyledParagraph('3. Installation and configuration services included as specified', {
      size: 16,
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 }
    }),

    createStyledParagraph('4. Payment terms: 50% advance, 50% upon completion', {
      size: 16,
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 }
    })
  ];

  // Combine all pages
  const allChildren = [
    ...coverPageChildren,
    ...productPages.flat(),
    ...pricingPageChildren
  ];

  // Create the final document
  const finalDoc = new Document({
    sections: [{
      properties: {},
      children: allChildren
    }]
  });

  return finalDoc;
}

export async function generateProposalBuffer(
  building: BuildingData,
  companyDetails: CompanyDetails,
  customerDetails: CustomerDetails,
  products: ProductData[] = [],
  services: ServiceData[] = []
): Promise<Buffer> {
  const doc = await generateProposalDocument(building, companyDetails, customerDetails, products, services);
  return await Packer.toBuffer(doc);
}
