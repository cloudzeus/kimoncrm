import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import iconv from 'iconv-lite';

// SoftOne API response types
interface SoftOneDistrictData {
  COUNTRY: string;
  DISTRICT: string;
  CODE: string;
  NAME: string;
}

interface SoftOneResponse {
  success: boolean;
  errorcode: number;
  error: string;
  Total?: number;
  result: SoftOneDistrictData[];
}

// POST /api/districts - Sync districts from SoftOne to our database
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch districts from SoftOne ERP
    const softoneResponse = await fetch('https://aic.oncloud.gr/s1services/JS/webservice.utilities/getAllDistricts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'Service',
        password: 'Service',
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

    console.log(`[Districts Sync] Fetched ${softoneData.result?.length || 0} districts from SoftOne`);

    // Upsert districts to database
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const district of softoneData.result) {
      // Check if country exists
      const countryExists = await prisma.country.findUnique({
        where: { softoneCode: district.COUNTRY }
      });

      if (!countryExists) {
        console.warn(`[Districts Sync] Skipping district ${district.CODE} - Country ${district.COUNTRY} not found`);
        skippedCount++;
        continue;
      }

      const existingDistrict = await prisma.district.findUnique({
        where: { code: district.CODE }
      });

      await prisma.district.upsert({
        where: { code: district.CODE },
        update: {
          name: district.NAME,
          countrySoftone: district.COUNTRY,
          updatedAt: new Date()
        },
        create: {
          code: district.CODE,
          countrySoftone: district.COUNTRY,
          name: district.NAME
        }
      });

      if (existingDistrict) {
        updatedCount++;
      } else {
        createdCount++;
      }
    }

    console.log(`[Districts Sync] Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${softoneData.result.length} districts`,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: softoneData.result.length
    });

  } catch (error) {
    console.error('Districts sync error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to sync districts", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

