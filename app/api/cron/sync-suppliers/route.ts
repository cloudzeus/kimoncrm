import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SupplierActiveStatus } from "@prisma/client";
import * as iconv from "iconv-lite";

/**
 * Cron job endpoint for automatic supplier sync from SoftOne ERP
 * This endpoint performs delta sync (only suppliers updated/created in the last 10 minutes)
 * Should be called every 10 minutes
 * 
 * GET/POST /api/cron/sync-suppliers
 */
async function syncSuppliers() {
  try {
    // Fetch only updated/newly created suppliers from SoftOne ERP using dedicated endpoint
    const response = await fetch(
      "https://aic.oncloud.gr/s1services/JS/webservice.customers/getRecentSuppliers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: process.env.SOFTONE_USERNAME || "Service",
          password: process.env.SOFTONE_PASSWORD || "Service",
          company: parseInt(process.env.SOFTONE_COMPANY || "1000"),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`SoftOne API returned status ${response.status}`);
    }

    // Get response as ArrayBuffer and convert from ANSI 1253 to UTF-8
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const decodedText = iconv.decode(buffer, "win1253");
    const data = JSON.parse(decodedText);

    if (!data.success) {
      throw new Error("Invalid response from SoftOne ERP");
    }

    // Check if there are no updated/new suppliers
    if (data.total === 0 || !data.result || data.result.length === 0) {
      console.log("✅ No new or updated suppliers to sync");
      return {
        success: true,
        total: 0,
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        message: "No new or updated suppliers to sync",
        window_start: data.window_start || null,
        at: data.at || new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    }

    let created = 0;
    let updated = 0;
    const errors: any[] = [];

    // Process all suppliers from the result array (already filtered by ERP)
    for (const supplier of data.result) {
      try {
        // Parse update date
        const updateDate = supplier.UPDDATE
          ? new Date(supplier.UPDDATE)
          : new Date();

        // Check if supplier exists (by TRDR or AFM)
        const existingSupplier = await prisma.supplier.findFirst({
          where: {
            OR: [
              { trdr: supplier.TRDR ? parseInt(supplier.TRDR) : undefined },
              { afm: supplier.AFM || undefined },
            ],
          },
        });

        const supplierData = {
          trdr: supplier.TRDR ? parseInt(supplier.TRDR) : null,
          code: supplier.CODE || null,
          afm: supplier.AFM || null,
          name: supplier.NAME || "",
          sotitle: supplier.NAME || "",
          jobtypetrd: supplier.JOBTYPETRD || null,
          address: supplier.ADDRESS || null,
          city: supplier.CITY || null,
          zip: supplier.ZIP || null,
          district: supplier.DISTRICT || null,
          country: supplier.COUNTRY || null,
          isactive: supplier.ISPROSP === "1" || supplier.ISPROSP === 1 
            ? SupplierActiveStatus.ACTIVE 
            : SupplierActiveStatus.INACTIVE,
          erp: true,
          phone01: supplier.PHONE01 || null,
          phone02: null,
          email: null,
          emailacc: null,
          irsdata: supplier.IRSDATA || supplier.IRSDATA_1 || null,
          socurrency: supplier.SOCURRENCY ? parseInt(supplier.SOCURRENCY) : null,
          update: updateDate,
        };

        if (existingSupplier) {
          // Update existing supplier
          await prisma.supplier.update({
            where: { id: existingSupplier.id },
            data: supplierData,
          });
          updated++;
        } else {
          // Create new supplier
          await prisma.supplier.create({
            data: supplierData,
          });
          created++;
        }
      } catch (error) {
        console.error("Error processing supplier:", supplier, error);
        errors.push({
          supplier: supplier.CODE || supplier.AFM,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      total: data.total,
      processed: data.result.length,
      created,
      updated,
      skipped: 0,
      errors: errors.length > 0 ? errors : undefined,
      window_start: data.window_start || null,
      at: data.at || new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in supplier sync cron job:", error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await syncSuppliers();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Supplier sync cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

