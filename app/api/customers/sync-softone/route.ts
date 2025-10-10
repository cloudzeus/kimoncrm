import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CustomerActiveStatus } from "@prisma/client";
import * as iconv from "iconv-lite";

/**
 * Sync customers from SoftOne ERP
 * POST /api/customers/sync-softone
 * Query params: ?delta=true (for incremental sync based on update timestamp)
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isDelta = searchParams.get("delta") === "true";

    // Get the last sync timestamp for delta sync
    let lastSyncDate: Date | null = null;
    if (isDelta) {
      const lastCustomer = await prisma.customer.findFirst({
        where: { erp: true },
        orderBy: { update: "desc" },
      });
      lastSyncDate = lastCustomer?.update || null;
    }

    // Fetch customers from SoftOne ERP
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
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch customers from SoftOne ERP" },
        { status: response.status }
      );
    }

    // Get response as ArrayBuffer and convert from ANSI 1253 to UTF-8
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const decodedText = iconv.decode(buffer, "win1253");
    const data = JSON.parse(decodedText);

    if (!data.success || !data.result || !Array.isArray(data.result)) {
      return NextResponse.json(
        { error: "Invalid response from SoftOne ERP" },
        { status: 500 }
      );
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];

    // Process customers
    for (const customer of data.result) {
      try {
        // Parse update date
        const updateDate = customer.UPDDATE
          ? new Date(customer.UPDDATE)
          : new Date();

        // Skip if delta sync and customer hasn't been updated
        if (isDelta && lastSyncDate && updateDate <= lastSyncDate) {
          skipped++;
          continue;
        }

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

    return NextResponse.json({
      success: true,
      syncType: isDelta ? "delta" : "full",
      total: data.total,
      processed: data.result.length,
      created,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error syncing customers from SoftOne:", error);
    return NextResponse.json(
      {
        error: "Failed to sync customers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET sync status
 */
export async function GET(req: NextRequest) {
  try {
    const [total, erpSynced, lastSync] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { erp: true } }),
      prisma.customer.findFirst({
        where: { erp: true },
        orderBy: { update: "desc" },
        select: { update: true },
      }),
    ]);

    return NextResponse.json({
      total,
      erpSynced,
      notSynced: total - erpSynced,
      lastSync: lastSync?.update || null,
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}

