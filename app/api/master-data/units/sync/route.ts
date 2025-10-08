import { NextRequest, NextResponse } from "next/server";
import iconv from "iconv-lite";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { getMtrUnit } from "@/lib/softone/client";
import { deepseekChat } from "@/lib/ai/deepseek";

// POST /api/master-data/units/sync
export async function POST(_request: NextRequest) {
  try {
    await requireAuth();

    const json = await getMtrUnit();
    if (!json?.result || !Array.isArray(json.result)) {
      return NextResponse.json({ message: json?.error || "Invalid ERP response", errorcode: json?.errorcode }, { status: 502 });
    }

    type Item = { MTRUNIT?: string; SHORTCUT?: string; NAME?: string; QDECIMALS?: string };
    const items: Array<Item> = json.result;

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const mtrunit = (item.MTRUNIT || item.SHORTCUT || '').toString().trim();
      const shortcut = (item.SHORTCUT || '').toString().trim();
      const nameEl = (item.NAME || '').toString().trim();
      const qdecimals = Number.parseInt((item.QDECIMALS || '').toString().trim() || '0', 10);
      if (!nameEl) { skipped++; continue; }

      // Translate Greek name to English using DeepSeek once (concise)
      let nameEn = nameEl;
      try {
        const prompt = `Translate the following Greek unit name to concise English. Return ONLY the translated name, title case, <=3 words.\n\n${nameEl}`;
        const translated = await deepseekChat("You are a precise translator.", prompt);
        if (translated) nameEn = translated.trim().replace(/^"|"$/g, '');
      } catch (_e) {}

      // Match existing by softoneCode (mtrunit) or code/shortcut
      const existing = await prisma.unit.findFirst({
        where: {
          OR: [
            ...(mtrunit ? [{ softoneCode: mtrunit }] : []),
            ...(shortcut ? [{ shortcut }] : []),
            { name: nameEl },
          ],
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.unit.update({
          where: { id: existing.id },
          data: {
            name: nameEl,
            shortcut: shortcut || undefined,
            qdecimals: Number.isFinite(qdecimals) ? qdecimals : undefined,
            softoneCode: mtrunit || undefined,
            translations: {
              upsert: {
                where: { unitId_languageCode: { unitId: existing.id, languageCode: 'en' } },
                update: { name: nameEn },
                create: { languageCode: 'en', name: nameEn },
              },
            },
          },
        });
        updated++;
      } else {
        await prisma.unit.create({
          data: {
            name: nameEl,
            shortcut: shortcut || undefined,
            qdecimals: Number.isFinite(qdecimals) ? qdecimals : undefined,
            softoneCode: mtrunit || undefined,
            translations: { create: [ { languageCode: 'en', name: nameEn } ] },
          },
        });
        inserted++;
      }
    }

    return NextResponse.json({ success: true, inserted, updated, skipped, total: items.length });
  } catch (error) {
    console.error("Units ERP sync error:", error);
    return NextResponse.json({ message: "Failed to sync units" }, { status: 500 });
  }
}


