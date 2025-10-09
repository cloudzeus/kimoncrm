import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import iconv from 'iconv-lite';

// SoftOne API response types
interface SoftOneCurrencyData {
  SOCURRENCY: string;
  SHORTCUT: string;
  NAME: string;
  ISACTIVE: string;
  INTERCODE: string;
  LRATE?: string;
  PDECIMALS?: string;
  VDECIMALS?: string;
  LOCKID?: string;
}

interface SoftOneResponse {
  success: boolean;
  errorcode: number;
  error: string;
  "Num.Countries"?: number;
  result: SoftOneCurrencyData[];
}

// POST /api/currencies/sync - Sync currencies with SoftOne ERP
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch currencies from SoftOne
    const softoneResponse = await fetch('https://aic.oncloud.gr/s1services/JS/webservice.utilities/getAllCurrencies', {
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

    console.log(`[Currencies Sync] Received ${softoneData.result?.length || 0} currencies from SoftOne`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each currency record
    for (const currencyRecord of softoneData.result || []) {
      try {
        const socurrency = currencyRecord.SOCURRENCY;
        const shortcut = currencyRecord.SHORTCUT;
        const name = currencyRecord.NAME;
        const intercode = currencyRecord.INTERCODE;
        // Note: SYMBOL field is not provided in the API response, so we'll set it to null
        const symbol = null;

        // Check if currency already exists by socurrency
        const existingCurrency = await prisma.currency.findUnique({
          where: { socurrency }
        });

        if (existingCurrency) {
          // Update existing currency
          await prisma.currency.update({
            where: { id: existingCurrency.id },
            data: {
              shortcut,
              name,
              intercode,
              symbol,
            },
          });
          console.log(`[Currencies Sync] Updated currency: ${name} (${intercode})`);
          updated++;
        } else {
          // Create new currency
          await prisma.currency.create({
            data: {
              socurrency,
              shortcut,
              name,
              intercode,
              symbol,
            },
          });
          console.log(`[Currencies Sync] Created currency: ${name} (${intercode})`);
          created++;
        }
      } catch (error) {
        console.error(`[Currencies Sync] Error processing currency ${currencyRecord.NAME}:`, error);
        errors++;
      }
    }

    console.log(`[Currencies Sync] Sync completed: ${created} created, ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      message: "Currencies synced successfully",
      created,
      updated,
      errors,
      total: softoneData.result?.length || 0
    });

  } catch (error) {
    console.error('Currencies Sync error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to sync currencies", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
