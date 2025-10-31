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
    const prompt = `You are a technical product specialist with expertise in IT hardware, networking equipment, and telecommunications products. Your task is to research and generate ACCURATE technical specifications for a specific product model.

PRODUCT INFORMATION:
Product Name: ${productInfo.name}
Brand: ${productInfo.brand}
Category: ${productInfo.category}
Manufacturer: ${productInfo.manufacturer}
${productInfo.code1 ? `EAN Code: ${productInfo.code1}` : ''}
${productInfo.code2 ? `Manufacturer Code: ${productInfo.code2}` : ''}

${productInfo.dimensions.width || productInfo.dimensions.length || productInfo.dimensions.height ? `Physical Dimensions: ${productInfo.dimensions.width || 'N/A'} x ${productInfo.dimensions.length || 'N/A'} x ${productInfo.dimensions.height || 'N/A'} mm` : ''}
${productInfo.dimensions.weight ? `Weight: ${productInfo.dimensions.weight} kg` : ''}

CRITICAL INSTRUCTIONS:
1. Research the ACTUAL product model using the name, brand, manufacturer, and codes provided
2. Generate specifications based on REAL manufacturer datasheets and official documentation
3. Do NOT invent or guess specifications - if you cannot find accurate data, use "N/A" or "To be confirmed"
4. Prioritize accuracy over completeness - it's better to have fewer accurate specs than many invented ones
5. Use official manufacturer terminology and values
6. Include units of measurement for all quantitative specifications
7. Be specific and precise - avoid vague terms like "high performance" or "advanced"

SPECIFICATION CATEGORIES TO INCLUDE (based on product category ${productInfo.category}):

For NETWORKING EQUIPMENT (Switches, Routers, Access Points):
- Model number and SKU
- Number of ports and port types (RJ45, SFP, SFP+, etc.)
- Port speeds (10/100/1000 Mbps, 10 Gbps, etc.)
- Switching/routing capacity (Gbps)
- PoE support and power budget (if applicable)
- Management capabilities (Layer 2/3, CLI, Web UI)
- Wireless standards (if applicable: 802.11ac, 802.11ax, frequencies)
- Mounting options (rack-mountable, wall-mount)
- Operating temperature range
- Power consumption and input voltage
- MTBF (Mean Time Between Failures)
- Certifications (CE, FCC, RoHS, etc.)

For SERVERS & STORAGE:
- Processor specifications (model, cores, frequency)
- RAM capacity and type (DDR4/DDR5, speed)
- Storage capacity and type (HDD/SSD, RAID support)
- Number and type of drive bays
- Expansion slots and capabilities
- Network interfaces
- Remote management capabilities (iLO, iDRAC, etc.)
- Form factor and rack units
- Redundant power supplies
- Operating system compatibility

For TELECOMMUNICATIONS EQUIPMENT:
- Protocol support (SIP, H.323, etc.)
- Codec support
- Number of lines/extensions
- Call capacity
- Interface types
- Display specifications (if applicable)
- Audio specifications
- Network connectivity
- PoE class (if applicable)

For CABLING & INFRASTRUCTURE:
- Cable category (Cat5e, Cat6, Cat6A, Cat7)
- Conductor type and gauge (AWG)
- Shielding type (UTP, STP, FTP)
- Bandwidth and frequency rating
- Length specifications
- Jacket material and rating (plenum, riser)
- Compliance standards (TIA/EIA, ISO/IEC)

RETURN FORMAT:
Return a JSON array with 8-15 specifications (depending on product complexity):

[
  {
    "specKey": "model_number",
    "specName": "Model Number",
    "specValue": "Actual model number",
    "order": 1
  },
  {
    "specKey": "port_count",
    "specName": "Number of Ports",
    "specValue": "24x GbE RJ45",
    "order": 2
  },
  ...
]

SPECIFICATION KEY NAMING RULES:
- Use snake_case format (lowercase with underscores)
- Be descriptive but concise
- Use standard industry terminology
- Examples: "port_count", "switching_capacity", "poe_budget", "processor_model", "ram_capacity"

SPECIFICATION VALUE RULES:
- Include units of measurement (W, Gbps, MHz, °C, kg, mm, etc.)
- Use manufacturer's exact terminology
- For ranges, use format: "0°C to 45°C" or "10/100/1000 Mbps"
- For lists, use comma separation: "802.11a/b/g/n/ac/ax"
- If unknown or unavailable, use: "N/A" or "Contact manufacturer"

EXAMPLE OF GOOD vs BAD SPECIFICATIONS:

❌ BAD:
{
  "specKey": "speed",
  "specName": "Speed",
  "specValue": "Very fast",
  "order": 1
}

✅ GOOD:
{
  "specKey": "switching_capacity",
  "specName": "Switching Capacity",
  "specValue": "128 Gbps",
  "order": 1
}

Return ONLY the JSON array, no additional text, comments, or explanations.`;

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

