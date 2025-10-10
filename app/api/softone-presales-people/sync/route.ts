import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import iconv from 'iconv-lite';

// SoftOne API response types
interface SoftOnePresalesPersonData {
  UFTBL01: string;
  CODE: string;
  NAME: string;
}

interface SoftOneResponse {
  success: boolean;
  errorcode: number;
  error: string;
  "Total"?: number;
  result: SoftOnePresalesPersonData[];
}

// POST /api/softone-presales-people/sync - Sync presales people with SoftOne ERP
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch presales people from SoftOne
    const softoneResponse = await fetch('https://aic.oncloud.gr/s1services/JS/webservice.utilities/getAllPresalesPeople', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: process.env.SOFTONE_USERNAME || '',
        password: process.env.SOFTONE_PASSWORD || '',
        company: 1000
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

    console.log(`[SoftOne Presales People Sync] Received ${softoneData.result?.length || 0} presales people from SoftOne`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each presales person record
    for (const personRecord of softoneData.result || []) {
      try {
        const uftbl01 = personRecord.UFTBL01;
        const code = personRecord.CODE;
        const name = personRecord.NAME;

        // Check if presales person already exists by UFTBL01
        const existingPerson = await prisma.softOnePresalesPeople.findUnique({
          where: { uftbl01 }
        });

        if (existingPerson) {
          // Update existing presales person
          await prisma.softOnePresalesPeople.update({
            where: { id: existingPerson.id },
            data: {
              code,
              name,
            },
          });
          console.log(`[SoftOne Presales People Sync] Updated presales person: ${name} (${code})`);
          updated++;
        } else {
          // Create new presales person
          await prisma.softOnePresalesPeople.create({
            data: {
              uftbl01,
              code,
              name,
            },
          });
          console.log(`[SoftOne Presales People Sync] Created presales person: ${name} (${code})`);
          created++;
        }
      } catch (error) {
        console.error(`[SoftOne Presales People Sync] Error processing presales person ${personRecord.NAME}:`, error);
        errors++;
      }
    }

    console.log(`[SoftOne Presales People Sync] Sync completed: ${created} created, ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      message: "SoftOne presales people synced successfully",
      created,
      updated,
      errors,
      total: softoneData.result?.length || 0
    });

  } catch (error) {
    console.error('SoftOne Presales People Sync error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to sync presales people", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



