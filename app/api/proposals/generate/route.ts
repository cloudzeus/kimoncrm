import { NextRequest, NextResponse } from 'next/server';
import { generateProposalBuffer } from '@/lib/word/proposal-document-generator';
import { BuildingData } from '@/components/site-surveys/comprehensive-infrastructure-wizard';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      building, 
      companyDetails, 
      customerDetails, 
      products = [], 
      services = [] 
    } = body;

    // Validate required data
    if (!building || !companyDetails || !customerDetails) {
      return NextResponse.json(
        { error: 'Missing required data: building, companyDetails, or customerDetails' },
        { status: 400 }
      );
    }

    // Generate the Word document
    const buffer = await generateProposalBuffer(
      building as BuildingData,
      companyDetails,
      customerDetails,
      products,
      services
    );

    // Return the document as a downloadable file
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Technical-Proposal-${customerDetails.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.docx"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating proposal document:', error);
    return NextResponse.json(
      { error: 'Failed to generate proposal document' },
      { status: 500 }
    );
  }
}
