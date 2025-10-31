import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/products/[id]/generate-description
 * Generate marketing description for a product using AI
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    // Fetch product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true,
        manufacturer: true,
        specifications: {
          include: {
            translations: true,
          },
        },
        translations: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product already has description
    const hasDescription = product.translations.some(
      (t) => t.description && t.description.length > 0
    );

    if (hasDescription) {
      return NextResponse.json({
        success: false,
        error: 'Product already has descriptions',
      }, { status: 400 });
    }

    // Prepare product information for AI
    const productInfo = {
      name: product.name,
      brand: product.brand?.name || 'Unknown',
      category: product.category?.name || 'Unknown',
      manufacturer: product.manufacturer?.name || product.brand?.name || 'Unknown',
      specifications: product.specifications.map((spec) => ({
        key: spec.specKey,
        name: spec.translations.find((t) => t.languageCode === 'en')?.specName || spec.specKey,
        value: spec.translations.find((t) => t.languageCode === 'en')?.specValue || '',
      })),
      dimensions: {
        width: product.width,
        length: product.length,
        height: product.height,
        weight: product.weight,
      },
    };

    // Generate descriptions using Claude
    const prompt = `You are a professional product copywriter. Generate compelling marketing descriptions for the following product:

Product Name: ${productInfo.name}
Brand: ${productInfo.brand}
Category: ${productInfo.category}
Manufacturer: ${productInfo.manufacturer}

${productInfo.specifications.length > 0 ? `
Technical Specifications:
${productInfo.specifications.map((s) => `- ${s.name}: ${s.value}`).join('\n')}
` : ''}

${productInfo.dimensions.width || productInfo.dimensions.length || productInfo.dimensions.height ? `
Dimensions: ${productInfo.dimensions.width || 'N/A'} x ${productInfo.dimensions.length || 'N/A'} x ${productInfo.dimensions.height || 'N/A'} mm` : ''}
${productInfo.dimensions.weight ? `Weight: ${productInfo.dimensions.weight} kg` : ''}

Generate two descriptions:
1. A short description (2-3 sentences, ~100 words) - marketing focused, highlighting key benefits
2. A full description (3-4 paragraphs, ~300 words) - detailed, professional, technical but accessible

Return the response as a JSON object with the following structure:
{
  "english": {
    "shortDescription": "...",
    "description": "..."
  },
  "greek": {
    "shortDescription": "...",
    "description": "..."
  }
}

Guidelines:
- Write in a professional, B2B tone
- Highlight key features and benefits
- Include technical details naturally
- Make it suitable for a technical proposal document
- Greek text should be professional business Greek (no accents/tonoi)
- Focus on quality, reliability, and technical excellence

Return ONLY the JSON object, no additional text.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse the AI response
    let descriptions: any;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        descriptions = JSON.parse(jsonMatch[0]);
      } else {
        descriptions = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('AI Response:', responseText);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response',
      }, { status: 500 });
    }

    // Update or create translations
    const englishTranslation = product.translations.find((t) => t.languageCode === 'en');
    const greekTranslation = product.translations.find((t) => t.languageCode === 'el');

    if (englishTranslation) {
      await prisma.productTranslation.update({
        where: { id: englishTranslation.id },
        data: {
          shortDescription: descriptions.english.shortDescription,
          description: descriptions.english.description,
        },
      });
    } else {
      await prisma.productTranslation.create({
        data: {
          productId: productId,
          languageCode: 'en',
          name: product.name,
          shortDescription: descriptions.english.shortDescription,
          description: descriptions.english.description,
        },
      });
    }

    if (greekTranslation) {
      await prisma.productTranslation.update({
        where: { id: greekTranslation.id },
        data: {
          shortDescription: descriptions.greek.shortDescription,
          description: descriptions.greek.description,
        },
      });
    } else {
      await prisma.productTranslation.create({
        data: {
          productId: productId,
          languageCode: 'el',
          name: product.name,
          shortDescription: descriptions.greek.shortDescription,
          description: descriptions.greek.description,
        },
      });
    }

    return NextResponse.json({
      success: true,
      descriptions: {
        english: descriptions.english,
        greek: descriptions.greek,
      },
      message: 'Descriptions generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating description:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate description',
    }, { status: 500 });
  }
}

