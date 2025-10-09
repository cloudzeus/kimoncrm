import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { deepseekChat } from "@/lib/ai/deepseek";

const translateDistrictsSchema = z.object({
  targetLanguage: z.string(),
  districtIds: z.array(z.string()).optional(), // If not provided, translate all
});

// POST /api/districts/translate - Bulk translate districts using DeepSeek AI
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
    const { targetLanguage, districtIds } = translateDistrictsSchema.parse(body);

    // Fetch districts to translate
    const districts = await prisma.district.findMany({
      where: districtIds ? {
        id: { in: districtIds }
      } : undefined,
      include: {
        translations: {
          where: {
            languageCode: targetLanguage
          }
        }
      }
    });

    if (districts.length === 0) {
      return NextResponse.json(
        { message: "No districts found to translate" },
        { status: 404 }
      );
    }

    // Filter districts that need translation
    const districtsToTranslate = districts.filter((d: any) => d.translations.length === 0);

    if (districtsToTranslate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All districts already have translations",
        translated: 0,
        total: districts.length
      });
    }

    console.log(`[Districts Translation] Translating ${districtsToTranslate.length} districts to ${targetLanguage}`);

    // Prepare batch translation using DeepSeek
    const systemPrompt = `You are a professional translator specializing in geographic locations and district/region names. 
Translate district/region names accurately from Greek to the target language.

Guidelines:
- Use the official district/region name in the target language
- Keep proper nouns recognizable
- Maintain formal geographic naming conventions
- Return ONLY the translated district name, nothing else
- If input is empty, return empty string`;

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Translate in batches of 10 for better performance
    const batchSize = 10;
    for (let i = 0; i < districtsToTranslate.length; i += batchSize) {
      const batch = districtsToTranslate.slice(i, i + batchSize);
      
      const translationPromises = batch.map(async (district: any) => {
        try {
          // Translate district name from Greek to target language
          const translatedName = await deepseekChat(
            systemPrompt,
            `Translate this Greek district/region name to ${targetLanguage}:\n\n"${district.name}"`
          );

          // Save translation to database
          await prisma.districtTranslation.create({
            data: {
              districtId: district.id,
              languageCode: targetLanguage,
              name: translatedName.trim()
            }
          });

          successCount++;
          return { success: true, district: district.name };
        } catch (error) {
          failureCount++;
          const errorMsg = `Failed to translate ${district.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
          return { success: false, district: district.name };
        }
      });

      await Promise.all(translationPromises);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < districtsToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[Districts Translation] Completed: ${successCount} success, ${failureCount} failures`);

    return NextResponse.json({
      success: true,
      message: `Successfully translated ${successCount} districts`,
      translated: successCount,
      failed: failureCount,
      total: districtsToTranslate.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Districts translation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to translate districts", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

