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
    const prompt = `You are a professional technical copywriter specializing in B2B IT, networking, and telecommunications products. Your task is to generate accurate, compelling product descriptions based on REAL specifications.

PRODUCT INFORMATION:
Product Name: ${productInfo.name}
Brand: ${productInfo.brand}
Category: ${productInfo.category}
Manufacturer: ${productInfo.manufacturer}

${productInfo.specifications.length > 0 ? `
TECHNICAL SPECIFICATIONS:
${productInfo.specifications.map((s) => `- ${s.name}: ${s.value}`).join('\n')}
` : ''}

${productInfo.dimensions.width || productInfo.dimensions.length || productInfo.dimensions.height ? `
PHYSICAL DIMENSIONS: ${productInfo.dimensions.width || 'N/A'} x ${productInfo.dimensions.length || 'N/A'} x ${productInfo.dimensions.height || 'N/A'} mm` : ''}
${productInfo.dimensions.weight ? `WEIGHT: ${productInfo.dimensions.weight} kg` : ''}

CRITICAL REQUIREMENTS:
1. Base descriptions ONLY on the provided specifications and product information above
2. Do NOT invent or assume specifications that are not provided
3. Do NOT mention features or capabilities not explicitly listed in the specifications
4. If specifications are limited, write concise descriptions focusing on what IS known
5. Use factual, precise language - avoid marketing hyperbole or unverified claims
6. For technical products, emphasize actual specifications and measurable characteristics
7. Research the real product model to ensure accuracy if needed

DESCRIPTION REQUIREMENTS:

SHORT DESCRIPTION (2-3 sentences, ~80-120 words):
- Lead with the product's primary purpose and category
- Mention 2-3 most important technical specifications
- State the key use case or application
- Be factual and precise

FULL DESCRIPTION (3-4 paragraphs, ~250-350 words):
Paragraph 1: Overview - What is this product and its primary function
Paragraph 2: Technical capabilities - Detail the specifications provided, organized logically
Paragraph 3: Applications & benefits - Real-world use cases based on actual capabilities
Paragraph 4 (if applicable): Installation, compatibility, or deployment considerations

LANGUAGE REQUIREMENTS:

ENGLISH:
- Professional B2B tone
- Technical accuracy is paramount
- Use industry-standard terminology
- Clear, concise sentence structure

GREEK:
- Professional business Greek
- UPPERCASE for product names and brands only
- NO accents/tonoi (tonal marks) in Greek text
- Use Greek technical terminology where appropriate
- Maintain the same factual accuracy as English

Return the response as a JSON object with this EXACT structure:
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

EXAMPLE APPROACH:
Instead of: "This cutting-edge solution revolutionizes your network infrastructure with unparalleled performance..."
Write: "The [Model Name] is a [category] featuring [specific spec] and [specific spec], designed for [specific use case]..."

Return ONLY the JSON object, no additional text or explanations.`;

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

