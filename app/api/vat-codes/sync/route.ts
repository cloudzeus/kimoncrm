import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
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

// POST /api/vat-codes/sync - Test connection to SoftOne (no data storage)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch VAT data from SoftOne to test connection
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

    console.log(`[VAT Sync] Successfully connected to SoftOne - ${softoneData.result?.length || 0} VAT rates available`);

    return NextResponse.json({
      message: "Successfully connected to SoftOne",
      connected: true,
      total: softoneData.result?.length || 0,
      vatCodes: softoneData.result?.map(v => ({
        code: v.VAT,
        name: v.NAME,
        rate: parseFloat(v.PERCNT) || 0
      })) || []
    });

  } catch (error) {
    console.error('VAT Sync error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to connect to SoftOne", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
