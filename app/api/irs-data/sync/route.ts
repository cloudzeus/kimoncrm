import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import iconv from 'iconv-lite';

// SoftOne API response types
interface SoftOneIrsData {
  IRSDATA: string;
  CODE: string;
  ISACTIVE: string;
  NAME: string;
  ADDRESS?: string;
  DISTRICT?: string;
  ZIP?: string;
  UPDDATE?: string;
  UPDUSER?: string;
  INSDATE?: string;
  INSUSER?: string;
}

interface SoftOneResponse {
  success: boolean;
  errorcode: number;
  error: string;
  "Num.Rows"?: number;
  result: SoftOneIrsData[];
}

// POST /api/irs-data/sync - Sync IRS data with SoftOne ERP
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch IRS data from SoftOne
    const softoneResponse = await fetch('https://aic.oncloud.gr/s1services/JS/webservice.utilities/getIrsData', {
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

    console.log(`[IRS Data Sync] Received ${softoneData.result?.length || 0} IRS records from SoftOne`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each IRS data record
    for (const irsRecord of softoneData.result || []) {
      try {
        const code = irsRecord.CODE;
        const name = irsRecord.NAME;
        const address = irsRecord.ADDRESS || null;
        const district = irsRecord.DISTRICT || null;
        const zip = irsRecord.ZIP || null;

        // Check if IRS data already exists by code
        const existingIrsData = await prisma.irsData.findUnique({
          where: { code }
        });

        if (existingIrsData) {
          // Update existing IRS data
          await prisma.irsData.update({
            where: { id: existingIrsData.id },
            data: {
              name,
              address,
              district,
              zip,
            },
          });
          console.log(`[IRS Data Sync] Updated IRS data: ${name} (${code})`);
          updated++;
        } else {
          // Create new IRS data
          await prisma.irsData.create({
            data: {
              code,
              name,
              address,
              district,
              zip,
            },
          });
          console.log(`[IRS Data Sync] Created IRS data: ${name} (${code})`);
          created++;
        }
      } catch (error) {
        console.error(`[IRS Data Sync] Error processing IRS record ${irsRecord.NAME}:`, error);
        errors++;
      }
    }

    console.log(`[IRS Data Sync] Sync completed: ${created} created, ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      message: "IRS data synced successfully",
      created,
      updated,
      errors,
      total: softoneData.result?.length || 0
    });

  } catch (error) {
    console.error('IRS Data Sync error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to sync IRS data", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
