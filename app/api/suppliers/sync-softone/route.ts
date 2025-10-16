import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SupplierActiveStatus } from "@prisma/client";
import * as iconv from "iconv-lite";

/**
 * Sync suppliers from SoftOne ERP
 * POST /api/suppliers/sync-softone
 * Query params: ?delta=true (for incremental sync based on update timestamp)
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isDelta = searchParams.get("delta") === "true";

    // Get the last sync timestamp for delta sync
    let lastSyncDate: Date | null = null;
    if (isDelta) {
      const lastSupplier = await prisma.supplier.findFirst({
        where: { erp: true },
        orderBy: { update: "desc" },
      });
      lastSyncDate = lastSupplier?.update || null;
    }

    // Fetch suppliers from SoftOne ERP (sodtype: 12 for suppliers)
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
          sodtype: 12, // Suppliers use sodtype 12
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch suppliers from SoftOne ERP" },
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

    // Process suppliers
    for (const supplier of data.result) {
      try {
        // Parse update date
        const updateDate = supplier.UPDDATE
          ? new Date(supplier.UPDDATE)
          : new Date();

        // Skip if delta sync and supplier hasn't been updated
        if (isDelta && lastSyncDate && updateDate <= lastSyncDate) {
          skipped++;
          continue;
        }

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
    console.error("Error syncing suppliers from SoftOne:", error);
    return NextResponse.json(
      {
        error: "Failed to sync suppliers",
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
      prisma.supplier.count(),
      prisma.supplier.count({ where: { erp: true } }),
      prisma.supplier.findFirst({
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

