import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CustomerActiveStatus } from "@prisma/client";
import * as iconv from "iconv-lite";

/**
 * Cron job endpoint for automatic customer sync from SoftOne ERP
 * This endpoint performs delta sync (only customers updated/created in the last 10 minutes)
 * Should be called every 10 minutes
 * 
 * GET/POST /api/cron/sync-customers
 */
async function syncCustomers() {
  try {
    // Fetch only updated/newly created customers from SoftOne ERP (delta endpoint)
    const response = await fetch(
      "https://aic.oncloud.gr/s1services/JS/webservice.customers/getCustomers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: process.env.SOFTONE_USERNAME || "Service",
          password: process.env.SOFTONE_PASSWORD || "Service",
          company: parseInt(process.env.SOFTONE_COMPANY || "1000"),
          sodtype: 13,
          // The ERP now returns only updated/newly created customers in the time window
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

    // Check if there are no updated/new customers
    if (data.total === 0 || !data.result || data.result.length === 0) {
      console.log("✅ No new or updated customers to sync");
      return {
        success: true,
        total: 0,
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        message: "No new or updated customers to sync",
        window_start: data.window_start || null,
        at: data.at || new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    }

    let created = 0;
    let updated = 0;
    const errors: any[] = [];

    // Process all customers from the result array (already filtered by ERP)
    for (const customer of data.result) {
      try {
        // Parse update date
        const updateDate = customer.UPDDATE
          ? new Date(customer.UPDDATE)
          : new Date();

        // Check if customer exists (by TRDR or AFM)
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            OR: [
              { trdr: customer.TRDR ? parseInt(customer.TRDR) : undefined },
              { afm: customer.AFM || undefined },
            ],
          },
        });

        const customerData = {
          trdr: customer.TRDR ? parseInt(customer.TRDR) : null,
          code: customer.CODE || null,
          afm: customer.AFM || null,
          name: customer.NAME || "",
          sotitle: customer.NAME || "",
          jobtypetrd: customer.JOBTYPETRD || null,
          address: customer.ADDRESS || null,
          city: customer.CITY || null,
          zip: customer.ZIP || null,
          district: customer.DISTRICT || null,
          country: customer.COUNTRY || null,
          isactive: customer.ISPROSP === "1" || customer.ISPROSP === 1 
            ? CustomerActiveStatus.ACTIVE 
            : CustomerActiveStatus.INACTIVE,
          erp: true,
          phone01: customer.PHONE01 || null,
          phone02: null,
          email: null,
          emailacc: null,
          irsdata: customer.IRSDATA || customer.IRSDATA_1 || null,
          socurrency: customer.SOCURRENCY ? parseInt(customer.SOCURRENCY) : null,
          update: updateDate,
        };

        if (existingCustomer) {
          // Update existing customer
          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: customerData,
          });
          updated++;
        } else {
          // Create new customer
          await prisma.customer.create({
            data: customerData,
          });
          created++;
        }
      } catch (error) {
        console.error("Error processing customer:", customer, error);
        errors.push({
          customer: customer.CODE || customer.AFM,
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
    console.error("Error in customer sync cron job:", error);
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

    const result = await syncCustomers();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Customer sync cron job failed:", error);
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

