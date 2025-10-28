import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { getMtrGroup } from "@/lib/softone/client";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const sodtype = body.sodtype || 51; // Default to products

    const json = await getMtrGroup(sodtype);
    
    if (!json?.result || !Array.isArray(json.result)) {
      return NextResponse.json(
        { message: "Invalid ERP response" },
        { status: 502 }
      );
    }

    const items: Array<{
      MTRGROUP?: string;
      CODE?: string;
      NAME?: string;
      SODTYPE?: number;
      ISACTIVE?: string;
    }> = json.result;

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const mtrgroup = item.MTRGROUP?.trim();
      const code = item.CODE?.trim();
      const name = item.NAME?.trim();
      const isactive = item.ISACTIVE === '1';

      if (!mtrgroup || !name) {
        skipped++;
        continue;
      }

      const existing = await prisma.mtrGroup.findUnique({
        where: { mtrgroup },
      });

      if (existing) {
        await prisma.mtrGroup.update({
          where: { id: existing.id },
          data: {
            code: code || undefined,
            name,
            isactive,
          },
        });
        updated++;
      } else {
        await prisma.mtrGroup.create({
          data: {
            mtrgroup,
            code: code || undefined,
            name,
            sodtype: sodtype,
            isactive,
          },
        });
        inserted++;
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      skipped,
      total: items.length,
    });
  } catch (error) {
    console.error("MtrGroups ERP sync error:", error);
    return NextResponse.json(
      { message: "Failed to sync mtrgroups" },
      { status: 500 }
    );
  }
}
