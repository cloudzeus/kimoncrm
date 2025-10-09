import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { deepseekChat } from "@/lib/ai/deepseek";

const translateBrandSchema = z.object({
  brandId: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  sourceName: z.string(),
  sourceDescription: z.string().optional(),
});

// POST /api/brands/translate
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { brandId, sourceLanguage, targetLanguage, sourceName, sourceDescription } = translateBrandSchema.parse(body);

    const systemPrompt = `You are a professional translator specializing in business software and product branding. Translate the given brand information accurately while maintaining the appropriate tone and terminology for a business context.

Guidelines:
- Keep brand names recognizable but properly localized
- Maintain professional and marketing-appropriate tone
- Use appropriate business terminology
- Keep descriptions concise and engaging
- If the source is empty or null, return empty string
- Return only the translated text, nothing else`;

    const translations = await Promise.all([
      // Translate name
      deepseekChat(
        systemPrompt,
        `Translate this brand name from ${sourceLanguage} to ${targetLanguage}:\n\n"${sourceName}"`
      ),
      // Translate description if provided
      sourceDescription ? deepseekChat(
        systemPrompt,
        `Translate this brand description from ${sourceLanguage} to ${targetLanguage}:\n\n"${sourceDescription}"`
      ) : Promise.resolve("")
    ]);

    const [translatedName, translatedDescription] = translations;

    return NextResponse.json({
      name: translatedName.trim(),
      description: translatedDescription.trim(),
    });

  } catch (error) {
    console.error('Brand translation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to translate brand" },
      { status: 500 }
    );
  }
}
