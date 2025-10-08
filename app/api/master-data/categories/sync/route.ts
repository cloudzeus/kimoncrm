import { NextRequest, NextResponse } from "next/server";
import iconv from "iconv-lite";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { getMtrCategory } from "@/lib/softone/client";
import { deepseekChat } from "@/lib/ai/deepseek";

export async function POST(_request: NextRequest) {
  try {
    await requireAuth();

    const json = await getMtrCategory();
    if (!json?.result || !Array.isArray(json.result)) {
      return NextResponse.json({ message: "Invalid ERP response" }, { status: 502 });
    }

    const items: Array<{ MTRCATEGORY?: string; CODE?: string; NAME?: string }> = json.result;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const erpId = item.MTRCATEGORY?.trim();
      const code = item.CODE?.trim();
      const nameEl = item.NAME?.trim();
      if (!nameEl) { skipped++; continue; }

      // Ensure an English translation using DeepSeek
      let nameEn = nameEl;
      try {
        const prompt = `Translate the following Greek category name to concise English. Return ONLY the translated name, title case, <=4 words.\n\n${nameEl}`;
        const translated = await deepseekChat("You are a precise translator.", prompt);
        if (translated) nameEn = translated.trim().replace(/^"|"$/g, '');
      } catch (_e) {}

      const existing = await prisma.category.findFirst({
        where: {
          OR: [
            ...(code ? [{ softoneCode: code }] : []),
            { name: nameEl },
          ],
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.category.update({
          where: { id: existing.id },
          data: {
            name: nameEl,
            softoneCode: code || undefined,
            translations: {
              upsert: {
                where: { categoryId_languageCode: { categoryId: existing.id, languageCode: 'en' } },
                update: { name: nameEn },
                create: { languageCode: 'en', name: nameEn },
              },
            },
          },
        });
        updated++;
      } else {
        await prisma.category.create({
          data: {
            name: nameEl,
            softoneCode: code || undefined,
            translations: {
              create: [
                { languageCode: 'en', name: nameEn },
              ],
            },
          },
        });
        inserted++;
      }
    }

    return NextResponse.json({ success: true, inserted, updated, skipped, total: items.length });
  } catch (error) {
    console.error("Categories ERP sync error:", error);
    return NextResponse.json({ message: "Failed to sync categories" }, { status: 500 });
  }
}


