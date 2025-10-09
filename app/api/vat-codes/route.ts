import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import iconv from "iconv-lite";

interface SoftOneVatData {
  VAT: string;
  NAME: string;
  PERCNT: string;
}

interface SoftOneResponse {
  success: boolean;
  errorcode: number;
  error: string;
  "Num.VATs"?: number;
  result: SoftOneVatData[];
}

// GET /api/vat-codes - Get VAT rates directly from SoftOne
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch VAT data from SoftOne
    const softoneResponse = await fetch('https://aic.oncloud.gr/s1services/JS/webservice.utilities/getVat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: process.env.SOFTONE_USERNAME || '',
        password: process.env.SOFTONE_PASSWORD || '',
      }),
    });

    if (!softoneResponse.ok) {
      throw new Error(`SoftOne API error: ${softoneResponse.status}`);
    }

    // Get the response as ArrayBuffer (for ANSI 1253 encoding)
    const arrayBuffer = await softoneResponse.arrayBuffer();
    
    // Convert from ANSI 1253 (Windows-1253) to UTF-8 using iconv-lite
    const utf8String = iconv.decode(Buffer.from(arrayBuffer), 'win1253');
    
    // Parse the JSON response
    const softoneData: SoftOneResponse = JSON.parse(utf8String);

    if (!softoneData.success) {
      return NextResponse.json(
        { message: `SoftOne error: ${softoneData.error}` },
        { status: 400 }
      );
    }

    // Transform the data to match our interface
    const vatRates = softoneData.result?.map(vat => ({
      id: vat.VAT, // Use VAT code as ID
      name: vat.NAME,
      rate: parseFloat(vat.PERCNT) || 0,
      softoneCode: vat.VAT,
      isActive: true, // All VAT rates from SoftOne are active
      createdAt: new Date(),
      updatedAt: new Date(),
    })) || [];

    return NextResponse.json({ vatRates });
  } catch (error) {
    console.error('VAT Codes GET error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to fetch VAT rates", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
