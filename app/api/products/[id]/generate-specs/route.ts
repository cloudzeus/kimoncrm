import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/products/[id]/generate-specs
 * Generate technical specifications for a product using AI
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

    // Check if product already has specifications
    if (product.specifications && product.specifications.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Product already has specifications',
      }, { status: 400 });
    }

    // Prepare product information for AI
    const productInfo = {
      name: product.name,
      brand: product.brand?.name || 'Unknown',
      category: product.category?.name || 'Unknown',
      manufacturer: product.manufacturer?.name || product.brand?.name || 'Unknown',
      code1: product.code1 || '',
      code2: product.code2 || '',
      dimensions: {
        width: product.width,
        length: product.length,
        height: product.height,
        weight: product.weight,
      },
    };

    // Generate specifications using Claude
    const prompt = `You are a technical product specialist. Generate detailed technical specifications for the following product:

Product Name: ${productInfo.name}
Brand: ${productInfo.brand}
Category: ${productInfo.category}
Manufacturer: ${productInfo.manufacturer}
${productInfo.code1 ? `EAN Code: ${productInfo.code1}` : ''}
${productInfo.code2 ? `Manufacturer Code: ${productInfo.code2}` : ''}

${productInfo.dimensions.width || productInfo.dimensions.length || productInfo.dimensions.height ? `Dimensions: ${productInfo.dimensions.width || 'N/A'} x ${productInfo.dimensions.length || 'N/A'} x ${productInfo.dimensions.height || 'N/A'} mm` : ''}
${productInfo.dimensions.weight ? `Weight: ${productInfo.dimensions.weight} kg` : ''}

Generate realistic and detailed technical specifications for this product. Return the specifications as a JSON array with the following structure:

[
  {
    "specKey": "unique_key_in_english",
    "specName": "Specification Name",
    "specValue": "Value",
    "order": 1
  },
  ...
]

Include specifications like:
- Physical dimensions (if applicable)
- Technical specifications relevant to the product category
- Performance characteristics
- Connectivity/Interface options (if applicable)
- Power requirements (if applicable)
- Operating conditions
- Compliance/Certifications
- Warranty information

Make the specifications realistic and appropriate for a ${productInfo.category} product from ${productInfo.brand}.
Provide both English and Greek values where appropriate.
Return ONLY the JSON array, no additional text.`;

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
    let specifications: any[];
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        specifications = JSON.parse(jsonMatch[0]);
      } else {
        specifications = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('AI Response:', responseText);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response',
      }, { status: 500 });
    }

    // Create specifications in database
    const createdSpecs = await Promise.all(
      specifications.map(async (spec: any, index: number) => {
        return await prisma.productSpec.create({
          data: {
            productId: productId,
            specKey: spec.specKey || `spec_${index + 1}`,
            order: spec.order || index + 1,
            translations: {
              create: [
                {
                  languageCode: 'en',
                  specName: spec.specName || spec.specKey,
                  specValue: spec.specValue || '',
                },
                {
                  languageCode: 'el',
                  specName: spec.specName || spec.specKey,
                  specValue: spec.specValue || '',
                },
              ],
            },
          },
          include: {
            translations: true,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      specifications: createdSpecs,
      message: `Generated ${createdSpecs.length} specifications successfully`,
    });
  } catch (error: any) {
    console.error('Error generating specifications:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate specifications',
    }, { status: 500 });
  }
}

