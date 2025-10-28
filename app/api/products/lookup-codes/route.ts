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
 * POST /api/products/lookup-codes
 * Lookup or generate manufacturer code and EAN code by product name, brand, and group
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
    
    const { 
      productName, 
      brandName, 
      mtrgroupCode,
      productId,
      updateDatabase = false 
    } = body || {};

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Build AI prompt to extract manufacturer code from product name
    const prompt = `Extract manufacturer code and EAN code from this product information:

PRODUCT NAME: ${productName}
BRAND: ${brandName || 'Unknown'}
MTRGROUP (Product Group): ${mtrgroupCode || 'Unknown'}

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

    console.log(`🤖 Using OpenAI to lookup codes for: ${productName}`);
    
    const openai = getOpenAIClient();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    console.log(`📋 Using OpenAI model: ${model}`);
    
    const openaiResponse = await openai.chat.completions.create({
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

    const aiResponse = openaiResponse.choices[0]?.message?.content || '';
    console.log(`✅ OpenAI Response: ${aiResponse.substring(0, 200)}...`);
    
    let codes;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
      codes = JSON.parse(jsonStr);
      console.log(`✅ Parsed codes - EAN: ${codes.eanCode}, MFR: ${codes.manufacturerCode}`);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', aiResponse);
      codes = {
        eanCode: 'UNKNOWN',
        manufacturerCode: 'UNKNOWN',
        confidence: 'low',
        reasoning: 'Failed to parse AI response'
      };
    }

    // Determine if we have valid codes to update
    const hasValidEan = codes?.eanCode && codes.eanCode !== 'UNKNOWN';
    const hasValidMfr = codes?.manufacturerCode && codes.manufacturerCode !== 'UNKNOWN';
    
    console.log(`📊 Code validation - Valid EAN: ${hasValidEan}, Valid MFR: ${hasValidMfr}`);

    // Update database if requested and productId is provided
    if (updateDatabase && productId) {
      const updateData: any = {};
      
      if (hasValidEan) {
        updateData.code1 = codes.eanCode;
        console.log(`✅ Will update EAN code to: ${codes.eanCode}`);
      }
      
      if (hasValidMfr) {
        updateData.code2 = codes.manufacturerCode;
        console.log(`✅ Will update manufacturer code to: ${codes.manufacturerCode}`);
      }

      if (Object.keys(updateData).length > 0) {
        try {
          await prisma.product.update({
            where: { id: productId },
            data: updateData,
          });
          console.log(`✅ Successfully updated product ${productId} in database`);
        } catch (updateError) {
          console.error('❌ Failed to update database:', updateError);
        }
      } else {
        console.log(`⚠️ No valid codes to update for product ${productId}`);
      }
    }

    // Determine if database was updated
    const wasUpdated = updateDatabase && productId && 
                      (hasValidEan || hasValidMfr);

    return NextResponse.json({
      success: true,
      data: {
        eanCode: codes.eanCode,
        manufacturerCode: codes.manufacturerCode,
        confidence: codes.confidence,
        reasoning: codes.reasoning,
        updated: wasUpdated,
        aiProvider: 'openai',
      },
    });
  } catch (error) {
    console.error('Error in lookup-codes API:', error);
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
