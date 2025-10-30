import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import axios from 'axios';
import * as iconv from 'iconv-lite';

/**
 * POST /api/proposals/[id]/send-to-erp
 * Send proposal to SoftOne ERP and get official quote number
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
          },
        },
        customer: true,
      },
    });

    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Get equipment from RFP
    const requirements = (proposal.rfp.requirements as any) || {};
    const equipment = requirements.equipment || [];

    if (equipment.length === 0) {
      return Response.json(
        { error: 'No products or services found in proposal' },
        { status: 400 }
      );
    }

    // Get customer TRDR (SoftOne customer ID)
    const customerTrdr = proposal.customer.trdr;
    if (!customerTrdr) {
      return Response.json(
        { error: 'Customer does not have a SoftOne TRDR code' },
        { status: 400 }
      );
    }

    // Prepare SoftOne request
    // Build MTRLINES from equipment
    const mtrLines = equipment.map((item: any) => {
      // Get product/service SoftOne ID (MTRL field)
      const mtrlCode = item.erpCode || item.code || item.softoneId;
      
      if (!mtrlCode) {
        console.warn(`Item ${item.name} has no SoftOne code, skipping`);
        return null;
      }

      return {
        MTRL: mtrlCode, // SoftOne product/service code
        QTY1: item.quantity || 1,
        PRICE: item.price || 0,
      };
    }).filter(Boolean); // Remove null items

    if (mtrLines.length === 0) {
      return Response.json(
        { error: 'No valid products/services with SoftOne codes found' },
        { status: 400 }
      );
    }

    // Prepare SoftOne API request
    const softoneRequest = {
      username: process.env.SOFTONE_USERNAME || 'Service',
      password: process.env.SOFTONE_PASSWORD || 'Service',
      SERIES: process.env.SOFTONE_QUOTE_SERIES || '7001', // Quote series
      TRDR: customerTrdr.toString(),
      COMMENTS: proposal.notes || `Πρόταση: ${proposal.projectTitle}`,
      MTRLINES: mtrLines,
    };

    console.log('Sending to SoftOne ERP:', {
      url: process.env.SOFTONE_QUOTE_ENDPOINT || 'https://aic.oncloud.gr/s1services/JS/webservice.utilities/getOrderDoc',
      customer: customerTrdr,
      linesCount: mtrLines.length,
    });

    // Call SoftOne API
    const softoneResponse = await axios.post(
      process.env.SOFTONE_QUOTE_ENDPOINT || 'https://aic.oncloud.gr/s1services/JS/webservice.utilities/getOrderDoc',
      softoneRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
        responseType: 'arraybuffer', // Get response as ArrayBuffer for encoding conversion
      }
    );

    // Convert ANSI 1253 to UTF-8 using ArrayBuffer approach
    const arrayBuffer = softoneResponse.data;
    const decoded = iconv.decode(Buffer.from(arrayBuffer), 'win1253');
    const erpData = JSON.parse(decoded);

    // Check SoftOne response
    if (!erpData.success || erpData.errorcode !== 200) {
      console.error('SoftOne error:', erpData);
      return Response.json(
        {
          error: 'SoftOne ERP error',
          details: erpData.error || 'Unknown error from ERP system',
        },
        { status: 500 }
      );
    }

    // Extract ERP data - store ALL fields from response
    const {
      SALDOCNUM,
      FINDOC,
      SERIES,
      SERIESNUM,
      FINCODE,
      TURNOVR,
      VATAMNT,
      COMMENTS,
      ...otherErpFields // Capture any additional fields from ERP
    } = erpData;

    // Store complete ERP response as JSON
    const fullErpResponse = {
      success: erpData.success,
      errorcode: erpData.errorcode,
      error: erpData.error,
      SALDOCNUM,
      FINDOC,
      SERIES,
      SERIESNUM,
      FINCODE,
      TURNOVR,
      VATAMNT,
      COMMENTS,
      ...otherErpFields,
      sentAt: new Date().toISOString(),
      sentBy: session.user.id,
    };

    // Update proposal with ERP data
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        erpQuoteNumber: FINCODE, // e.g., "ΠΡΦ0000393"
        erpSeries: SERIES,
        erpSeriesNum: SERIESNUM,
        erpFindoc: FINDOC,
        erpSaldocnum: SALDOCNUM,
        erpTurnover: TURNOVR ? parseFloat(TURNOVR.toString()) : null,
        erpVatAmount: VATAMNT ? parseFloat(VATAMNT.toString()) : null,
        status: 'APPROVED',
        stage: 'ERP_INTEGRATION',
        submittedDate: new Date(),
        notes: proposal.notes 
          ? `${proposal.notes}\n\n--- ERP Response ---\n${JSON.stringify(fullErpResponse, null, 2)}`
          : `--- ERP Response ---\n${JSON.stringify(fullErpResponse, null, 2)}`,
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
      },
    });

    return Response.json({
      success: true,
      proposal: updatedProposal,
      erp: fullErpResponse,
      erpQuoteNumber: FINCODE,
      message: `Πρόταση δημιουργήθηκε στο ERP με αριθμό προσφοράς: ${FINCODE}`,
    });
  } catch (error: any) {
    console.error('Error sending proposal to ERP:', error);
    
    // Check if it's an axios error with response
    if (error.response) {
      return Response.json(
        {
          error: 'ERP system error',
          details: error.response.data || error.message,
          status: error.response.status,
        },
        { status: 500 }
      );
    }

    return Response.json(
      { error: error.message || 'Failed to send proposal to ERP' },
      { status: 500 }
    );
  }
}

