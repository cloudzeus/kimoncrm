import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import iconv from 'iconv-lite';

// SoftOne API response types
interface SoftOnePaymentTypeData {
  COMPANY: string;
  SODTYPE: string;
  PAYMENT: string;
  CODE: string;
  NAME: string;
  ISACTIVE: string;
  INSPAYMD?: string;
  INSCLCMD?: string;
  VATPAYMENT?: string;
  ISDOSE?: string;
  PAYFROMDATE?: string;
  INTERESTDEB?: string;
  INTERESTCRE?: string;
  SODATA?: string;
  MYDATACODE?: string;
}

interface SoftOneResponse {
  success: boolean;
  errorcode: number;
  error: string;
  "PAYMENTTYPESs"?: number;
  result: SoftOnePaymentTypeData[];
}

// POST /api/payment-types/sync - Sync payment types with SoftOne ERP
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch payment types from SoftOne
    const softoneResponse = await fetch('https://aic.oncloud.gr/s1services/JS/webservice.utilities/getAllPayments', {
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

    console.log(`[Payment Types Sync] Received ${softoneData.result?.length || 0} payment types from SoftOne`);

    let created = 0;
    let updated = 0;
    let errors = 0;
    let filtered = 0;

    // Process each payment type record
    for (const paymentRecord of softoneData.result || []) {
      try {
        // Only process payment types with SODTYPE 12 (supplier) or 13 (customer)
        if (paymentRecord.SODTYPE !== "12" && paymentRecord.SODTYPE !== "13") {
          filtered++;
          continue;
        }

        const payment = paymentRecord.PAYMENT;
        const code = paymentRecord.CODE;
        const name = paymentRecord.NAME;
        const sodtype = paymentRecord.SODTYPE;

        // Check if payment type already exists by payment code
        const existingPaymentType = await prisma.paymentType.findUnique({
          where: { payment }
        });

        if (existingPaymentType) {
          // Update existing payment type
          await prisma.paymentType.update({
            where: { id: existingPaymentType.id },
            data: {
              code,
              name,
              sodtype,
            },
          });
          console.log(`[Payment Types Sync] Updated payment type: ${name} (${sodtype})`);
          updated++;
        } else {
          // Create new payment type
          await prisma.paymentType.create({
            data: {
              payment,
              code,
              name,
              sodtype,
            },
          });
          console.log(`[Payment Types Sync] Created payment type: ${name} (${sodtype})`);
          created++;
        }
      } catch (error) {
        console.error(`[Payment Types Sync] Error processing payment type ${paymentRecord.NAME}:`, error);
        errors++;
      }
    }

    console.log(`[Payment Types Sync] Sync completed: ${created} created, ${updated} updated, ${errors} errors, ${filtered} filtered out`);

    return NextResponse.json({
      message: "Payment types synced successfully",
      created,
      updated,
      errors,
      filtered,
      total: softoneData.result?.length || 0
    });

  } catch (error) {
    console.error('Payment Types Sync error:', error);
    
    // Handle specific SoftOne authentication errors
    if (error instanceof Error && error.message.includes('Wrong Username/Password')) {
      return NextResponse.json(
        { message: "Authentication failed with SoftOne. Please check credentials." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to sync payment types", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

