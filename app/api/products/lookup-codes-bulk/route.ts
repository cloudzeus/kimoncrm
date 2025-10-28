import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { OpenAI } from 'openai';

// OpenAI client for code lookups
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });
};

/**
 * POST /api/products/lookup-codes-bulk
 * Bulk lookup or generate manufacturer codes and EAN codes for multiple products
 * Optionally update the database with the found codes
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { productIds, updateDatabase = false } = body || {};

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Fetch products from database
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        code1: true, // EAN code
        code2: true, // Manufacturer code
        mtrgroup: true,
        brand: {
          select: {
            name: true,
          },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No products found',
      });
    }

    // Process each product with delays to avoid rate limiting
    const results = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Skip if already has both codes
      if (product.code1 && product.code2) {
        results.push({
          productId: product.id,
          productName: product.name,
          status: 'skipped',
          reason: 'Already has both codes',
          eanCode: product.code1,
          manufacturerCode: product.code2,
        });
        continue;
      }

      try {
        // Build AI prompt to extract manufacturer code from product name
        const prompt = `Extract manufacturer code and EAN code from this product information:

PRODUCT NAME: ${product.name}
BRAND: ${product.brand?.name || 'Unknown'}
MTRGROUP (Product Group): ${product.mtrgroup || 'Unknown'}

Based on the information above:

TASK 1 - Extract Manufacturer Code:
Look at the PRODUCT NAME above and extract the model number, part number, or SKU.

Examples:
- Product Name: "Yeastar X100 PBX System" → Extract: "X100"
- Product Name: "Cisco Catalyst 9300-24P Switch" → Extract: "9300-24P"
- Product Name: "TP-Link Archer AX50 Router" → Extract: "AX50"

TASK 2 - Provide EAN Code (Europe/EMEA):
If you know the 13-digit EAN code for this product in Europe/EMEA region, provide it. EAN codes are used for retail products in European and Middle Eastern/African markets. Return "UNKNOWN" if you don't know the specific EAN code.

Return JSON:
{
  "eanCode": "1234567890123" or "UNKNOWN",
  "manufacturerCode": "extracted code from product name",
  "confidence": "high" | "medium" | "low",
  "reasoning": "How you extracted the manufacturer code"
}`;

        const openai = getOpenAIClient();
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        
        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a product code lookup specialist. Return ONLY valid JSON, no markdown.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 500,
        });

        const aiResponse = response.choices[0]?.message?.content || '';
        let codes;
        
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
          codes = JSON.parse(jsonStr);
          console.log(`✅ Product ${product.name}: EAN=${codes.eanCode}, MFR=${codes.manufacturerCode}`);
        } catch (parseError) {
          console.error('Failed to parse AI response for product:', product.id);
          codes = {
            eanCode: 'UNKNOWN',
            manufacturerCode: 'UNKNOWN',
            confidence: 'low',
            reasoning: 'Failed to parse AI response'
          };
        }

        // Update database if requested
        let updated = false;
        if (updateDatabase && codes) {
          try {
            const updateData: any = {};
            
            if (codes.eanCode !== 'UNKNOWN' && !product.code1) {
              updateData.code1 = codes.eanCode;
              console.log(`  📝 Will update EAN to: ${codes.eanCode}`);
            } else {
              console.log(`  ⏭️  Skipping EAN (existing: ${product.code1 || 'none'}, new: ${codes.eanCode})`);
            }
            
            if (codes.manufacturerCode !== 'UNKNOWN' && !product.code2) {
              updateData.code2 = codes.manufacturerCode;
              console.log(`  📝 Will update MFR to: ${codes.manufacturerCode}`);
            } else {
              console.log(`  ⏭️  Skipping MFR (existing: ${product.code2 || 'none'}, new: ${codes.manufacturerCode})`);
            }

            if (Object.keys(updateData).length > 0) {
              await prisma.product.update({
                where: { id: product.id },
                data: updateData,
              });
              updated = true;
              console.log(`  ✅ Updated product ${product.id}`);
            } else {
              console.log(`  ⚠️  No updates needed for product ${product.id}`);
            }
          } catch (updateError) {
            console.error('Failed to update product:', product.id, updateError);
          }
        }

        results.push({
          productId: product.id,
          productName: product.name,
          status: updated ? 'updated' : 'found',
          eanCode: codes.eanCode,
          manufacturerCode: codes.manufacturerCode,
          confidence: codes.confidence,
          updated,
        });

        // Add delay between requests to avoid rate limiting (except for last item)
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Error processing product:', product.id, error);
        errors.push({
          productId: product.id,
          productName: product.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const updatedCount = results.filter(r => r.status === 'updated' || r.updated).length;
    const foundCount = results.filter(r => r.status === 'found' || r.status === 'skipped').length;
    const errorCount = errors.length;

    return NextResponse.json({
      success: true,
      summary: {
        total: products.length,
        updated: updatedCount,
        found: foundCount,
        errors: errorCount,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in lookup-codes-bulk API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to look up product codes',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
