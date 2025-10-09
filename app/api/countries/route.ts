import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import iconv from 'iconv-lite';

// SoftOne API response types
interface SoftOneCountryData {
  COUNTRY: string;
  SHORTCUT: string;
  NAME: string;
  SOCURRENCY: string;
  COUNTRYTYPE: string;
  INTERCODE: string;
  CNTIRS: string;
  ISACTIVE: string;
}

interface SoftOneResponse {
  success: boolean;
  errorcode: number;
  error: string;
  "Num.Countries"?: number;
  result: SoftOneCountryData[];
}

// GET /api/countries - Fetch countries directly from SoftOne ERP
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch countries from SoftOne ERP
    const softoneResponse = await fetch('https://aic.oncloud.gr/s1services/JS/webservice.utilities/getAllCountries', {
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

    console.log(`[Countries] Successfully fetched ${softoneData.result?.length || 0} countries from SoftOne`);

    // Map SoftOne data to our Country model format
    const countries = softoneData.result?.map(country => ({
      id: country.COUNTRY, // Use SoftOne COUNTRY as temporary ID
      softoneCode: country.COUNTRY,
      name: country.NAME,
      iso2: country.INTERCODE,
      shortcut: country.SHORTCUT,
      currency: country.SOCURRENCY,
      countryType: country.COUNTRYTYPE,
      isActive: country.ISACTIVE === "1"
    })) || [];

    return NextResponse.json({
      success: true,
      countries,
      total: countries.length
    });

  } catch (error) {
    console.error('Countries fetch error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to fetch countries", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/countries - Sync countries from SoftOne to our database
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch countries from SoftOne ERP
    const softoneResponse = await fetch('https://aic.oncloud.gr/s1services/JS/webservice.utilities/getAllCountries', {
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

    console.log(`[Countries Sync] Fetched ${softoneData.result?.length || 0} countries from SoftOne`);

    // Upsert countries to database
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const country of softoneData.result) {
      const existingCountry = await prisma.country.findUnique({
        where: { softoneCode: country.COUNTRY }
      });

      await prisma.country.upsert({
        where: { softoneCode: country.COUNTRY },
        update: {
          name: country.NAME,
          iso2: country.INTERCODE,
          shortcut: country.SHORTCUT,
          currency: country.SOCURRENCY,
          countryType: country.COUNTRYTYPE,
          cntIrs: country.CNTIRS || null,
          isActive: country.ISACTIVE === "1",
          updatedAt: new Date()
        },
        create: {
          softoneCode: country.COUNTRY,
          name: country.NAME,
          iso2: country.INTERCODE,
          shortcut: country.SHORTCUT,
          currency: country.SOCURRENCY,
          countryType: country.COUNTRYTYPE,
          cntIrs: country.CNTIRS || null,
          isActive: country.ISACTIVE === "1"
        }
      });

      if (existingCountry) {
        updatedCount++;
      } else {
        createdCount++;
      }
    }

    console.log(`[Countries Sync] Created: ${createdCount}, Updated: ${updatedCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${softoneData.result.length} countries`,
      created: createdCount,
      updated: updatedCount,
      total: softoneData.result.length
    });

  } catch (error) {
    console.error('Countries sync error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to sync countries", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
