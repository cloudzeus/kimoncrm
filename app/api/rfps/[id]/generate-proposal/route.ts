import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateProposalContent } from '@/lib/ai/proposal-generator';
import { auth } from '@/auth';

/**
 * POST /api/rfps/[id]/generate-proposal
 * Generate a new proposal from an RFP with AI-generated content
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

    const { id: rfpId } = await params;
    const body = await req.json();
    const {
      projectTitle,
      projectDescription,
      projectScope,
      projectDuration,
      projectStartDate,
      projectEndDate,
    } = body;

    // Fetch RFP with all related data
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: {
        customer: true,
        contact: true,
        lead: {
          include: {
            siteSurvey: true,
          },
        },
      },
    });

    if (!rfp) {
      return Response.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Extract equipment/products from RFP requirements (stored as JSON)
    const requirements = (rfp.requirements as any) || {};
    const equipment = requirements.equipment || [];
    
    // Fetch site survey data if available
    let buildingsData = null;
    let siteConnectionsData = null;
    
    if (rfp.lead?.siteSurvey) {
      const siteSurvey = rfp.lead.siteSurvey;
      buildingsData = siteSurvey.infrastructureData;
      siteConnectionsData = siteSurvey.siteConnections;
    }

    // Separate products and services from equipment
    const products = equipment
      .filter((item: any) => item.type === 'product' || item.itemType === 'product' || item.productId)
      .map((item: any) => ({
        name: item.name || 'Προϊόν',
        brand: typeof item.brand === 'object' ? item.brand?.name : item.brand,
        category: typeof item.category === 'object' ? item.category?.name : item.category,
        quantity: item.quantity || 1,
        specifications: item.specifications || null,
      }));

    const services = equipment
      .filter((item: any) => item.type === 'service' || item.itemType === 'service' || item.serviceId)
      .map((item: any) => ({
        name: item.name || 'Υπηρεσία',
        category: item.category || 'Εγκατάσταση',
        quantity: item.quantity || 1,
        description: item.description || null,
      }));

    // Generate AI content
    const aiContent = await generateProposalContent({
      customerName: rfp.customer.name,
      customerAddress: rfp.customer.address || undefined,
      contactName: rfp.contact?.name || undefined,
      contactEmail: rfp.contact?.email || undefined,
      projectTitle,
      projectDescription,
      projectScope,
      buildingsData,
      siteConnectionsData,
      products,
      services,
    });

    // Check if a proposal already exists for this site survey (one proposal per site survey)
    // Prioritize siteSurveyId to ensure we maintain single proposal per site survey
    const siteSurveyId = rfp.lead?.siteSurvey?.id;
    const existingProposal = await prisma.proposal.findFirst({
      where: siteSurveyId ? {
        siteSurveyId: siteSurveyId,
      } : {
        rfpId: rfpId,
      },
      orderBy: { createdAt: 'desc' },
    });

    let proposal;
    
    if (existingProposal) {
      // Save old Word document URL as revision before updating
      if (existingProposal.wordDocumentUrl) {
        // Store old version in notes or create a revision record
        const oldNotes = existingProposal.notes || '';
        const revisionNote = `\n\n--- Revision ${new Date().toISOString()} ---\nOld Document: ${existingProposal.wordDocumentUrl}`;
        
        await prisma.proposal.update({
          where: { id: existingProposal.id },
          data: {
            notes: oldNotes + revisionNote,
          },
        });
      }

      // Update existing proposal instead of creating a new one
      proposal = await prisma.proposal.update({
        where: { id: existingProposal.id },
        data: {
          rfpId, // Ensure rfpId is updated if it changed
          projectTitle,
          projectDescription,
          projectScope,
          projectDuration,
          projectStartDate: projectStartDate ? new Date(projectStartDate) : undefined,
          projectEndDate: projectEndDate ? new Date(projectEndDate) : undefined,
          infrastructureDesc: aiContent.infrastructureDesc,
          technicalDesc: aiContent.technicalDesc,
          productsDesc: aiContent.productsDesc,
          servicesDesc: aiContent.servicesDesc,
          scopeOfWork: aiContent.scopeOfWork,
          stage: 'CONTENT_GENERATION',
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new proposal record only if none exists
      proposal = await prisma.proposal.create({
        data: {
          rfpId,
          leadId: rfp.leadId || undefined,
          siteSurveyId: rfp.lead?.siteSurvey?.id || undefined,
          customerId: rfp.customerId,
          contactId: rfp.contactId || undefined,
          projectTitle,
          projectDescription,
          projectScope,
          projectDuration,
          projectStartDate: projectStartDate ? new Date(projectStartDate) : undefined,
          projectEndDate: projectEndDate ? new Date(projectEndDate) : undefined,
          infrastructureDesc: aiContent.infrastructureDesc,
          technicalDesc: aiContent.technicalDesc,
          productsDesc: aiContent.productsDesc,
          servicesDesc: aiContent.servicesDesc,
          scopeOfWork: aiContent.scopeOfWork,
          status: 'DRAFT',
          stage: 'CONTENT_GENERATION',
          generatedBy: session.user.id,
        },
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
          siteSurvey: true,
        },
      });
    }

    return Response.json({
      success: true,
      proposal,
      message: 'Proposal created successfully with AI-generated content',
    });
  } catch (error: any) {
    console.error('Error generating proposal:', error);
    return Response.json(
      { error: error.message || 'Failed to generate proposal' },
      { status: 500 }
    );
  }
}

