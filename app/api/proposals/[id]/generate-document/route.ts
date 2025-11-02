import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { generateFullProposalBuffer } from '@/lib/word/full-proposal-generator';
import { bunnyPut } from '@/lib/bunny/upload';
import { createSafeFilename } from '@/lib/utils/greeklish';

/**
 * POST /api/proposals/[id]/generate-document
 * Generate Word document for proposal and upload to BunnyCDN
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: proposalId } = await params;
    
    // Fetch proposal with all related data
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        rfp: {
          include: {
            customer: true,
            contact: true,
          },
        },
        customer: true,
        contact: true,
        lead: true,
      },
    });

    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Get equipment from RFP
    const requirements = (proposal.rfp?.requirements as any) || {};
    const equipment = requirements.equipment || [];

    // Separate products and services
    const products = equipment
      .filter((item: any) => item.type === 'product' || item.itemType === 'product' || item.productId)
      .map((item: any) => ({
        name: item.name || 'Προϊόν',
        brand: typeof item.brand === 'object' ? item.brand?.name : item.brand,
        category: typeof item.category === 'object' ? item.category?.name : item.category,
        quantity: item.quantity || 1,
        price: item.price || 0,
        margin: item.margin || 0,
      }));

    const services = equipment
      .filter((item: any) => item.type === 'service' || item.itemType === 'service' || item.serviceId)
      .map((item: any) => ({
        name: item.name || 'Υπηρεσία',
        category: item.category || 'Εγκατάσταση',
        quantity: item.quantity || 1,
        price: item.price || 0,
        margin: item.margin || 0,
      }));

    // Fetch company details
    const companyDetails = await prisma.defaultCompanyData.findFirst();
    
    if (!companyDetails) {
      return Response.json(
        { error: 'Company details not configured' },
        { status: 500 }
      );
    }

    // Prepare data for Word generation
    const proposalData = {
      projectTitle: proposal.projectTitle,
      projectDescription: proposal.projectDescription || undefined,
      projectScope: proposal.projectScope || undefined,
      projectDuration: proposal.projectDuration || undefined,
      projectStartDate: proposal.projectStartDate || undefined,
      projectEndDate: proposal.projectEndDate || undefined,
      customerName: proposal.customer.name,
      customerAddress: proposal.customer.address || undefined,
      customerPhone: proposal.customer.phone01 || undefined,
      customerEmail: proposal.customer.email || undefined,
      contactName: proposal.contact?.name || undefined,
      contactEmail: proposal.contact?.email || undefined,
      infrastructureDesc: proposal.infrastructureDesc || undefined,
      technicalDesc: proposal.technicalDesc || undefined,
      productsDesc: proposal.productsDesc || undefined,
      servicesDesc: proposal.servicesDesc || undefined,
      scopeOfWork: proposal.scopeOfWork || undefined,
      erpQuoteNumber: proposal.erpQuoteNumber || undefined,
      erpSeriesNum: proposal.erpSeriesNum ? parseInt(proposal.erpSeriesNum, 10) : undefined,
      products,
      services,
      companyName: companyDetails.companyName,
      companyAddress: companyDetails.address || undefined,
      companyPhone: companyDetails.phone1 || companyDetails.phone2 || undefined,
      companyEmail: companyDetails.email || undefined,
      companyTaxId: undefined, // Not stored in DefaultCompanyData
      companyTaxOffice: undefined, // Not stored in DefaultCompanyData
    };

    console.log('Generating proposal document for:', proposal.projectTitle);

    // Generate Word document
    const buffer = await generateFullProposalBuffer(proposalData);

    // Create safe filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const leadNumber = proposal.lead?.leadNumber || proposal.customer.name;
    const filename = createSafeFilename(
      leadNumber,
      `Proposal ${proposal.projectTitle}`,
      1,
      '.docx'
    );

    // Upload to BunnyCDN - ALWAYS save to customer files
    const customerId = proposal.customerId;
    const bunnyPath = `customers/${customerId}/proposals/${timestamp}_${filename}`;

    const { url: bunnyUrl } = await bunnyPut(bunnyPath, buffer);

    // Update proposal with document URL
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        wordDocumentUrl: bunnyUrl,
        stage: 'DOCUMENT_GENERATION',
      },
    });

    // Create a file record linked to CUSTOMER (not lead) for easy access from customer detail page
    await prisma.file.create({
      data: {
        name: filename,
        filetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        url: bunnyUrl,
        entityId: customerId,
        type: 'CUSTOMER',
        description: `Proposal document: ${proposal.projectTitle}`,
      },
    });

    return Response.json({
      success: true,
      proposal: updatedProposal,
      file: {
        url: bunnyUrl,
        filename,
      },
      message: 'Proposal document generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating proposal document:', error);
    return Response.json(
      { error: error.message || 'Failed to generate proposal document' },
      { status: 500 }
    );
  }
}

