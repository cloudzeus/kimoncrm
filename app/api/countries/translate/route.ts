import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { deepseekChat } from "@/lib/ai/deepseek";

const translateCountriesSchema = z.object({
  targetLanguage: z.string(),
  countryIds: z.array(z.string()).optional(), // If not provided, translate all
});

// POST /api/countries/translate - Bulk translate countries using DeepSeek AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetLanguage, countryIds } = translateCountriesSchema.parse(body);

    // Fetch countries to translate
    const countries = await prisma.country.findMany({
      where: countryIds ? {
        id: { in: countryIds }
      } : undefined,
      include: {
        translations: {
          where: {
            languageCode: targetLanguage
          }
        }
      }
    });

    if (countries.length === 0) {
      return NextResponse.json(
        { message: "No countries found to translate" },
        { status: 404 }
      );
    }

    // Filter countries that need translation
    const countriesToTranslate = countries.filter((c: any) => c.translations.length === 0);

    if (countriesToTranslate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All countries already have translations",
        translated: 0,
        total: countries.length
      });
    }

    console.log(`[Countries Translation] Translating ${countriesToTranslate.length} countries to ${targetLanguage}`);

    // Prepare batch translation using DeepSeek
    const systemPrompt = `You are a professional translator specializing in geographic locations and country names. 
Translate country names accurately from Greek to the target language.

Guidelines:
- Use the official country name in the target language
- Keep proper nouns recognizable
- Maintain formal geographic naming conventions
- Return ONLY the translated country name, nothing else
- If input is empty, return empty string`;

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Translate in batches of 10 for better performance
    const batchSize = 10;
    for (let i = 0; i < countriesToTranslate.length; i += batchSize) {
      const batch = countriesToTranslate.slice(i, i + batchSize);
      
      const translationPromises = batch.map(async (country: any) => {
        try {
          // Translate country name from Greek to target language
          const translatedName = await deepseekChat(
            systemPrompt,
            `Translate this country name from Greek to ${targetLanguage}:\n\n"${country.name}"`
          );

          // Save translation to database
          await prisma.countryTranslation.create({
            data: {
              countryId: country.id,
              languageCode: targetLanguage,
              name: translatedName.trim()
            }
          });

          successCount++;
          return { success: true, country: country.name };
        } catch (error) {
          failureCount++;
          const errorMsg = `Failed to translate ${country.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
          return { success: false, country: country.name };
        }
      });

      await Promise.all(translationPromises);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < countriesToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[Countries Translation] Completed: ${successCount} success, ${failureCount} failures`);

    return NextResponse.json({
      success: true,
      message: `Successfully translated ${successCount} countries`,
      translated: successCount,
      failed: failureCount,
      total: countriesToTranslate.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Countries translation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to translate countries", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

