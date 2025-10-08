import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { deepseekChat } from "@/lib/ai/deepseek";

const schema = z.object({
  sourceLanguage: z.string().default('el'),
  targetLanguage: z.string(),
  sourceName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { sourceLanguage, targetLanguage, sourceName } = schema.parse(body);

    const prompt = `Translate the following category name from ${sourceLanguage} to ${targetLanguage}. Return ONLY the translated name, title case, <=4 words.\n\n${sourceName}`;
    const translated = await deepseekChat("You are a precise translator.", prompt);
    const name = (translated || '').trim().replace(/^"|"$/g, '');
    return NextResponse.json({ name });
  } catch (error) {
    return NextResponse.json({ message: 'Translation failed' }, { status: 500 });
  }
}


