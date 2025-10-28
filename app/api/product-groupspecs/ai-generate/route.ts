import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { deepseekChat } from '@/lib/ai/deepseek';

/**
 * POST /api/product-groupspecs/ai-generate
 * Use AI to analyze products in a group and generate suggested specifications
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Manager access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { mtrgroupCode, mtrgroupCodes } = body;

    // Support both single and multiple groups
    const groupsToAnalyze = mtrgroupCodes || (mtrgroupCode ? [mtrgroupCode] : []);

    if (!groupsToAnalyze || groupsToAnalyze.length === 0) {
      return NextResponse.json(
        { error: 'MtrgroupCode or mtrgroupCodes is required' },
        { status: 400 }
      );
    }

    // Get sample products from these groups (just for product names)
    const products = await prisma.product.findMany({
      where: {
        mtrgroup: { in: groupsToAnalyze },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      take: 20, // Sample up to 20 products
    });

    console.log(`Found ${products.length} products in group for context`);

    if (products.length === 0) {
      return NextResponse.json(
        { 
          error: 'No products found in the selected groups to analyze',
          suggestion: 'Make sure you have products with specifications in these groups',
          groupsAnalyzed: groupsToAnalyze
        },
        { status: 400 }
      );
    }

    // Get existing group specs to check if they already exist
    const existingGroupSpecs = await prisma.productGroupSpec.findMany({
      where: {
        mtrgroupCode: { in: groupsToAnalyze }
      },
      orderBy: { order: 'asc' }
    });

    // If group specs already exist, return them
    if (existingGroupSpecs.length > 0) {
      console.log(`Found ${existingGroupSpecs.length} existing group specs`);
      const suggestions = existingGroupSpecs.map(spec => ({
        specKey: spec.specKey,
        specName: spec.specName,
        mtrgroupCode: spec.mtrgroupCode,
        isRequired: spec.isRequired,
        order: spec.order,
        description: spec.description,
      }));

      return NextResponse.json({
        success: true,
        suggestions,
        analyzedProducts: products.length,
        totalSpecsFound: existingGroupSpecs.length,
        groupsAnalyzed: groupsToAnalyze,
        primaryGroupCode: groupsToAnalyze[0],
        message: 'Showing existing group specifications',
      });
    }

    // Ask AI to generate specs based on the product group
    console.log('Generating AI suggestions based on product group...');
      
      const primaryGroupCode = groupsToAnalyze[0];
      
      // Get group information
      const mtrgroup = await prisma.mtrGroup.findFirst({
        where: { mtrgroup: primaryGroupCode }
      });

      // Get sample product names to help AI understand the group
      const sampleProductNames = products.slice(0, 10).map(p => p.name).join(', ');

      const aiPrompt = `I need you to suggest technical specifications for a product group called "${mtrgroup?.name || primaryGroupCode}".

Sample products in this group:
${sampleProductNames}

Based on the product group and sample products above, suggest 8-12 relevant technical specifications that would be important for categorizing and filtering products in this group.

Return the specifications as a JSON array with this structure:
[
  {
    "specKey": "wifi_standard",
    "specName": "Wi-Fi Standard",
    "isRequired": true,
    "description": "Wireless standard used (e.g., 802.11ac, 802.11ax)"
  },
  {
    "specKey": "max_throughput",
    "specName": "Max Throughput",
    "isRequired": true,
    "description": "Maximum data transfer rate in Mbps"
  }
]

Focus on specifications that would be useful for:
1. Comparing products
2. Filtering products
3. Technical specifications that matter to buyers

Return ONLY the JSON array, no additional text.`;

      const aiResponse = await deepseekChat(
        "You are a product specification expert. Generate relevant technical specifications for product groups.",
        aiPrompt
      );

      console.log('AI Response:', aiResponse);

      // Parse AI JSON response
      let suggestions: any[] = [];
      try {
        const aiData = JSON.parse(aiResponse);
        if (Array.isArray(aiData)) {
          suggestions = aiData.map((spec: any, index: number) => ({
            specKey: spec.specKey || `spec_${index}`,
            specName: spec.specName || spec.specKey,
            mtrgroupCode: primaryGroupCode,
            isRequired: spec.isRequired || false,
            order: index,
            description: spec.description || null,
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return NextResponse.json(
          { 
            error: 'Failed to parse AI suggestions',
            aiResponse: aiResponse.substring(0, 200)
          },
          { status: 400 }
        );
      }

      if (suggestions.length === 0) {
        return NextResponse.json(
          { 
            error: 'No specifications found in products to analyze and AI could not generate suggestions',
            suggestion: 'Please add specifications to products first or try again.',
            groupsAnalyzed: groupsToAnalyze,
            productCount: products.length
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        suggestions,
        analyzedProducts: products.length,
        totalSpecsFound: 0,
        groupsAnalyzed: groupsToAnalyze,
        primaryGroupCode,
        message: 'AI-generated suggestions based on product group',
      });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions' },
      { status: 500 }
    );
  }
}
