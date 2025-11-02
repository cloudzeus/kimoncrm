import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { createProposalInSoftOne, validateProposalLines, type ProposalLine } from '@/lib/softone/create-proposal';

/**
 * POST - Generate Proposal and send to SoftOne ERP
 * Creates a proposal document in SoftOne ERP with all products and services
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
    const { equipment, series, comments } = body;

    console.log('📋 Proposal Generation API - Received data:', {
      siteSurveyId,
      equipmentCount: equipment?.length || 0,
      series: series || '7001',
      hasComments: !!comments
    });

    if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
      console.error('❌ Proposal API: No equipment data provided');
      return NextResponse.json(
        { error: 'No equipment data provided' },
        { status: 400 }
      );
    }

    // Get site survey with customer info
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            trdr: true,
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

    if (!siteSurvey.customerId || !siteSurvey.customer) {
      return NextResponse.json(
        { error: 'Site survey is not linked to a customer' },
        { status: 400 }
      );
    }

    if (!siteSurvey.customer.trdr) {
      return NextResponse.json(
        { error: 'Customer does not have TRDR code from ERP. Please sync customer with ERP first.' },
        { status: 400 }
      );
    }

    // Prepare proposal lines
    const proposalLines: ProposalLine[] = equipment.map((item: any) => ({
      productId: item.id,
      mtrl: item.erpCode || item.mtrl || null,
      name: item.name,
      quantity: item.quantity || 1,
      unitPrice: item.price || 0,
      margin: item.margin || 0,
      totalPrice: item.totalPrice || 0,
      vat: 1410, // Default VAT code (24% in Greece)
      sodtype: item.type === 'service' ? '51' : '52', // "51" = service, "52" = product
    }));

    console.log('📦 Prepared proposal lines:', {
      totalLines: proposalLines.length,
      linesWithMTRL: proposalLines.filter(l => l.mtrl).length,
      linesWithoutMTRL: proposalLines.filter(l => !l.mtrl).length
    });

    // Validate that all items have ERP codes
    const validation = validateProposalLines(proposalLines);
    if (!validation.valid) {
      console.error('❌ Validation failed. Items without ERP codes:', validation.missingCodes);
      return NextResponse.json(
        {
          error: 'Some products/services do not have ERP codes',
          missingCodes: validation.missingCodes,
          message: `The following items need to be added to ERP first: ${validation.missingCodes.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Create proposal in SoftOne ERP
    const result = await createProposalInSoftOne({
      series: series || '7001',
      trdr: siteSurvey.customer.trdr.toString(),
      comments: comments || `Proposal for ${siteSurvey.title} - Generated from CRM`,
      lines: proposalLines,
    });

    if (!result.success) {
      console.error('❌ Failed to create proposal in ERP:', result.error);
      return NextResponse.json(
        {
          error: 'Failed to create proposal in SoftOne ERP',
          details: result.error,
          errorcode: result.errorcode
        },
        { status: 500 }
      );
    }

    console.log('✅ Proposal created successfully:', result.proposalNumber);

    // Save proposal record to database
    const erpResponse = result.erpResponse || {};
    
    // Create or update Proposal record
    let proposal = await prisma.proposal.findFirst({
      where: {
        siteSurveyId: siteSurveyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const proposalData = {
      projectTitle: siteSurvey.title,
      customerId: siteSurvey.customerId,
      contactId: siteSurvey.contactId,
      siteSurveyId: siteSurveyId,
      status: 'SENT' as any,
      erpSyncStatus: 'SYNCED',
      erpProposalNumber: result.proposalNumber || null,
      erpQuoteNumber: result.proposalNumber || null, // Alias for compatibility
      erpFindoc: erpResponse.FINDOC?.toString() || erpResponse.SALDOCNUM?.toString() || null,
      erpSeries: erpResponse.SERIES?.toString() || null,
      erpSeriesNum: erpResponse.SERIESNUM?.toString() || null,
      erpSaldocnum: erpResponse.SALDOCNUM || erpResponse.FINDOC || null,
      erpTurnover: erpResponse.TURNOVR || 0,
      erpVatAmount: erpResponse.VATAMNT || 0,
      erpResponse: erpResponse as any, // Store full ERP response as JSON
      equipment: equipment.map((item: any) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        brand: item.brand,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        margin: item.margin,
        totalPrice: item.totalPrice,
        erpCode: item.erpCode,
      })) as any,
      totals: {
        turnover: erpResponse.TURNOVR || 0,
        vatAmount: erpResponse.VATAMNT || 0,
        grandTotal: (erpResponse.TURNOVR || 0) + (erpResponse.VATAMNT || 0),
      } as any,
    };

    if (proposal) {
      // Update existing proposal
      proposal = await prisma.proposal.update({
        where: { id: proposal.id },
        data: proposalData,
      });
      console.log(`✅ Updated existing proposal ${proposal.id}`);
    } else {
      // Create new proposal (rfpId is optional now)
      proposal = await prisma.proposal.create({
        data: {
          ...proposalData,
          generatedBy: session.user.id,
        },
      });
      console.log(`✅ Created new proposal ${proposal.id}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Proposal created successfully in SoftOne ERP',
      proposalId: proposal.id,
      proposalNumber: result.proposalNumber,
      erpData: {
        fincode: erpResponse.FINCODE,
        findoc: erpResponse.FINDOC || erpResponse.SALDOCNUM,
        series: erpResponse.SERIES,
        seriesNum: erpResponse.SERIESNUM,
        turnover: erpResponse.TURNOVR,
        vatAmount: erpResponse.VATAMNT,
        total: (erpResponse.TURNOVR || 0) + (erpResponse.VATAMNT || 0),
      },
      customer: {
        name: siteSurvey.customer.name,
        trdr: siteSurvey.customer.trdr,
      },
      itemsCount: proposalLines.length,
    });

  } catch (error) {
    console.error('❌ Error in generate-proposal:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to generate proposal',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

