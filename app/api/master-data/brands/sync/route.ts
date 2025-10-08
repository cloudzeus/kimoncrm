import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import iconv from "iconv-lite";

// POST /api/master-data/brands/sync
export async function POST(_request: NextRequest) {
  try {
    await requireAuth();

    const endpoint = process.env.SOFTONE_MARKS_URL || "https://aic.oncloud.gr/s1services/JS/webservice.mtrmark/getMtrMark";
    const username = process.env.SOFTONE_USERNAME || "Service";
    const password = process.env.SOFTONE_PASSWORD || "Service";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      // Force no-cache to always get fresh data
      cache: "no-store",
    });

    // Read as ArrayBuffer and decode Windows-1253 (ANSI 1253) → UTF-8
    const arrayBuffer = await res.arrayBuffer();
    const decoded = iconv.decode(Buffer.from(arrayBuffer), "win1253");

    let json: any;
    try {
      json = JSON.parse(decoded);
    } catch (e) {
      return NextResponse.json(
        { message: "Failed to parse ERP response", raw: decoded?.slice(0, 500) },
        { status: 502 }
      );
    }

    if (!json?.success || !Array.isArray(json.result)) {
      return NextResponse.json(
        { message: json?.error || "Invalid ERP response", errorcode: json?.errorcode },
        { status: 502 }
      );
    }

    const items: Array<{ MTRMARK?: string; CODE?: string; NAME?: string }> = json.result;

    let inserted = 0;
    let skipped = 0;

    for (const item of items) {
      const erpId = item.MTRMARK?.trim();
      const code = item.CODE?.trim();
      const name = item.NAME?.trim();

      if (!name) { skipped++; continue; }

      // Skip if already exists by any of the unique identifiers we maintain
      const existing = await prisma.brand.findFirst({
        where: {
          OR: [
            ...(code ? [{ code }] : []),
            ...(code ? [{ softoneCode: code }] : []),
            ...(erpId ? [{ erpId }] : []),
            { name },
          ],
        },
        select: { id: true },
      });

      if (existing) { skipped++; continue; }

      try {
        await prisma.brand.create({
          data: {
            name,
            code: code || undefined,
            softoneCode: code || undefined,
            erpId: erpId || undefined,
          },
        });
        inserted++;
      } catch (_e) {
        // On any conflict, skip safely
        skipped++;
      }
    }

    return NextResponse.json({ success: true, inserted, skipped, total: items.length });
  } catch (error) {
    console.error("Brands ERP sync error:", error);
    return NextResponse.json({ message: "Failed to sync brands" }, { status: 500 });
  }
}


