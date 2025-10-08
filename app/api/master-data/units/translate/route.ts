import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { deepseekChat } from "@/lib/ai/deepseek";

const schema = z.object({
  unitId: z.string(),
  sourceLanguage: z.string().default("el"),
  targetLanguage: z.string().default("en"),
  sourceName: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { unitId, sourceLanguage, targetLanguage, sourceName } = schema.parse(body);

    const systemPrompt = "You are a precise translator for product measurement units. Return only the translated unit name, concise, title case, <=3 words.";
    const translation = await deepseekChat(systemPrompt, `Translate from ${sourceLanguage} to ${targetLanguage}: "${sourceName}"`);
    const name = (translation || "").trim().replace(/^"|"$/g, "");

    await prisma.unitTranslation.upsert({
      where: { unitId_languageCode: { unitId, languageCode: targetLanguage } },
      update: { name },
      create: { unitId, languageCode: targetLanguage, name },
    });

    return NextResponse.json({ name });
  } catch (error) {
    console.error("Unit translate error:", error);
    return NextResponse.json({ message: "Failed to translate" }, { status: 500 });
  }
}





