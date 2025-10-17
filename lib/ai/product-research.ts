import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

interface ProductResearchInput {
  name: string;
  eanCode?: string;
  brand: string;
}

interface ProductSpecification {
  specKey: string;
  specName: string;
  specValue: string;
  order: number;
}

interface ProductTranslation {
  languageCode: string;
  name: string;
  shortDescription: string;
  description: string;
}

interface ProductResearchResult {
  name: string;
  manufacturerCode?: string;
  eanCode?: string;
  width?: number;
  length?: number;
  height?: number;
  weight?: number;
  specifications: ProductSpecification[];
  translations: ProductTranslation[];
  suggestedCategoryId?: string;
  suggestedCategoryName?: string;
  suggestedManufacturerId?: string;
  suggestedManufacturerName?: string;
  suggestedBrandId?: string;
  suggestedBrandName?: string;
}

/**
 * Research product information using AI
 */
export async function researchProductInformation(input: ProductResearchInput): Promise<ProductResearchResult> {
  try {
    // Get available categories and manufacturers for context
    const { prisma } = await import('@/lib/db/prisma');
    
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, softoneCode: true },
      orderBy: { name: 'asc' }
    });

    const manufacturers = await prisma.manufacturer.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    });

    const brands = await prisma.brand.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    });

    // Create context for AI
    const context = {
      productInput: input,
      availableCategories: categories,
      availableManufacturers: manufacturers,
      availableBrands: brands,
    };

    // Use DeepSeek for comprehensive product research
    const researchPrompt = buildProductResearchPrompt(context);
    const researchResponse = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a product information specialist. Your task is to research comprehensive product information based on the provided input and return ONLY valid JSON data. Do not wrap the JSON in markdown code blocks. Return raw JSON only.`
        },
        {
          role: 'user',
          content: researchPrompt
        }
      ],
      temperature: 0.3,
    });

    // Parse AI response, handling markdown code blocks
    let researchContent = researchResponse.choices[0].message.content || '{}';
    console.log('🔍 Raw AI research response:', researchContent.substring(0, 200));
    // Remove markdown code blocks if present
    researchContent = researchContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let researchData;
    try {
      researchData = JSON.parse(researchContent);
    } catch (parseError) {
      console.error('Failed to parse research JSON:', researchContent.substring(0, 500));
      throw new Error(`Failed to parse AI research response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
    }

    // Use DeepSeek for translations
    const translationPrompt = buildTranslationPrompt(researchData);
    const translationResponse = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in technical product descriptions. Generate accurate, technical translations without marketing language. Return ONLY valid JSON data without markdown code blocks.`
        },
        {
          role: 'user',
          content: translationPrompt
        }
      ],
      temperature: 0.2,
    });

    // Parse translation response, handling markdown code blocks
    let translationContent = translationResponse.choices[0].message.content || '{}';
    translationContent = translationContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const translationData = JSON.parse(translationContent);

    // Find matched category, manufacturer, and brand from research data
    const matchedCategory = categories.find(c => c.id === researchData.suggestedCategoryId);
    const matchedManufacturer = manufacturers.find(m => m.id === researchData.suggestedManufacturerId);
    const matchedBrand = brands.find(b => b.id === researchData.suggestedBrandId);

    // Merge specification translations into specifications
    const translatedSpecs = researchData.specifications?.map((spec: any) => {
      const specTrans = translationData.specificationTranslations?.find((st: any) => st.specKey === spec.specKey);
      
      return {
        specKey: spec.specKey,
        order: spec.order,
        translations: [
          {
            languageCode: 'en',
            specName: specTrans?.en?.specName || spec.specName,
            specValue: specTrans?.en?.specValue || spec.specValue,
          },
          {
            languageCode: 'el',
            specName: specTrans?.el?.specName || spec.specName,
            specValue: specTrans?.el?.specValue || spec.specValue,
          }
        ]
      };
    }) || [];

    // Combine research and translation data
    const result: ProductResearchResult = {
      name: researchData.name || input.name,
      manufacturerCode: researchData.manufacturerCode,
      eanCode: researchData.eanCode || input.eanCode,
      width: researchData.dimensions?.width,
      length: researchData.dimensions?.length,
      height: researchData.dimensions?.height,
      weight: researchData.dimensions?.weight,
      specifications: translatedSpecs,
      translations: translationData.translations || [],
      suggestedCategoryId: researchData.suggestedCategoryId,
      suggestedCategoryName: matchedCategory?.name,
      suggestedManufacturerId: researchData.suggestedManufacturerId,
      suggestedManufacturerName: matchedManufacturer?.name,
      suggestedBrandId: researchData.suggestedBrandId,
      suggestedBrandName: matchedBrand?.name,
    };

    return result;
  } catch (error) {
    console.error('Error researching product information:', error);
    throw new Error('Failed to research product information');
  }
}

/**
 * Build prompt for product research
 */
function buildProductResearchPrompt(context: any): string {
  return `
You are a product information specialist. Research comprehensive information for this product:

PRODUCT INPUT:
- Name: ${context.productInput.name}
- EAN Code: ${context.productInput.eanCode || 'Not provided'}
- Brand: ${context.productInput.brand}

AVAILABLE CATEGORIES:
${context.availableCategories.map((c: any) => `- ${c.name} (ID: ${c.id}, Code: ${c.softoneCode})`).join('\n')}

AVAILABLE MANUFACTURERS:
${context.availableManufacturers.map((m: any) => `- ${m.name} (ID: ${m.id}, Code: ${m.code})`).join('\n')}

AVAILABLE BRANDS:
${context.availableBrands.map((b: any) => `- ${b.name} (ID: ${b.id}, Code: ${b.code})`).join('\n')}

RESEARCH TASK:
1. Find the most accurate product name
2. Research manufacturer code (part number)
3. Verify or find the EAN code (13 digits)
4. Extract dimensions (width, length, height in cm)
5. Extract weight (in kg)
6. Generate comprehensive technical specifications
7. **IMPORTANT**: Identify and match the BRAND from the available brands list
8. **IMPORTANT**: Identify and match the MANUFACTURER from the available manufacturers list
9. **IMPORTANT**: Suggest the most appropriate CATEGORY from the available categories list

MATCHING RULES:
- For BRAND: Match based on the product's brand name (e.g., "UniFi UAP-AC-LITE" → brand is "Ubiquiti")
- For MANUFACTURER: Match who actually manufactures the product (often same as brand)
- For CATEGORY: Match based on product type (e.g., network equipment, computers, cables, etc.)
- If exact match not found, choose the closest match
- Return the exact ID from the available lists

SPECIFICATIONS GUIDELINES:
- Generate 5-15 technical specifications
- Use technical keys like: power_supply, cpu, ram, storage, connectivity, display, etc.
- For each specification, provide:
  - specKey: Technical key (e.g., "power_supply")
  - specName: English name (e.g., "Power Supply")
  - specValue: English value (e.g., "220V AC, 50W")
  - order: Number for ordering
- Provide technical values (not marketing descriptions)
- Include measurements, technical specs, compatibility info

Return JSON in this exact format:
{
  "name": "Exact Product Name",
  "manufacturerCode": "Part Number/Model",
  "eanCode": "13-digit EAN code",
  "dimensions": {
    "width": 25.5,
    "length": 30.2,
    "height": 5.1,
    "weight": 1.2
  },
  "specifications": [
    {
      "specKey": "power_supply",
      "specName": "Power Supply",
      "specValue": "220V AC, 50W",
      "order": 1
    }
  ],
  "suggestedBrandId": "brand-id-from-list",
  "suggestedCategoryId": "category-id-from-list",
  "suggestedManufacturerId": "manufacturer-id-from-list"
}
`;
}

/**
 * Build prompt for translations
 */
function buildTranslationPrompt(researchData: any): string {
  const specsFormatted = researchData.specifications?.map((s: any) => 
    `- ${s.specName}: ${s.specValue}`
  ).join('\n') || 'None';

  return `
You are a professional translator. Create accurate translations for this product:

PRODUCT INFORMATION:
- Name: ${researchData.name}
- Brand: ${researchData.brand || 'Unknown'}
- Category: ${researchData.category || 'Unknown'}

SPECIFICATIONS TO TRANSLATE:
${specsFormatted}

TRANSLATION REQUIREMENTS:
1. Translate to Greek (el) and English (en)
2. Use TECHNICAL language (not marketing)
3. For Greek translations - CRITICAL RULES:
   - MANDATORY: Use ONLY Greek alphabet characters: Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω
   - FORBIDDEN: Latin transliteration (NEVER use: a, b, g, d, e, z, h, th, i, k, l, m, n, x, o, p, r, s, t, y, f, ch, ps, w)
   - Names: UPPERCASE Greek (Α-Ω), no accents
   - Descriptions: Normal Greek text (α-ω), no accents
   - Remove ALL tones: ά→α, έ→ε, ή→η, ί→ι, ό→ο, ύ→υ, ώ→ω, ΐ→ι, ΰ→υ

EXAMPLES OF CORRECT GREEK:
✓ CORRECT: "Το προιον ειναι ενα τηλεφωνο" (uses Greek letters: τ, ο, π, ρ, ι, etc.)
✗ WRONG: "To proion einai ena tilefono" (uses Latin letters: t, o, p, r, i, etc.)

✓ CORRECT: "ΓΙΑΛΙΝΚ T48U ΤΗΛΕΦΩΝΟ IP" 
✗ WRONG: "YEALINK T48U TILEFONO IP"

✓ CORRECT: "Η συσκευη διαθετει οθονη αφης"
✗ WRONG: "H syskevh diathetei othoni afis"

4. Keep brand/model codes in English (e.g., "T48U", "SIP", "IP")
5. Provide both short description (1-2 sentences) and full description

Return JSON in this exact format (notice Greek characters in 'el' translation):
{
  "translations": [
    {
      "languageCode": "en",
      "name": "YEALINK T48U IP PHONE",
      "shortDescription": "The Yealink T48U is an IP phone with touchscreen",
      "description": "The Yealink T48U IP Phone features a color touchscreen display..."
    },
    {
      "languageCode": "el",
      "name": "ΓΙΑΛΙΝΚ T48U ΤΗΛΕΦΩΝΟ IP",
      "shortDescription": "Το Γιαλινκ T48U ειναι ενα τηλεφωνο IP με οθονη αφης",
      "description": "Το τηλεφωνο IP Γιαλινκ T48U διαθετει εγχρωμη οθονη αφης..."
    }
  ],
  "specificationTranslations": [
    {
      "specKey": "audio",
      "en": {
        "specName": "Audio",
        "specValue": "HD Voice (Opus, G.722, G.711), built-in speakerphone"
      },
      "el": {
        "specName": "Ηχος",
        "specValue": "Ηχος HD (Opus, G.722, G.711), ενσωματωμενο ηχειο"
      }
    },
    {
      "specKey": "display",
      "en": {
        "specName": "Display",
        "specValue": "7-inch color touchscreen"
      },
      "el": {
        "specName": "Οθονη",
        "specValue": "Εγχρωμη οθονη αφης 7 ιντσων"
      }
    }
  ]
}
`;
}

/**
 * Insert researched product into ERP
 */
export async function insertProductToERP(
  productData: ProductResearchResult,
  additionalData: {
    brandId: string;
    categoryId: string;
    manufacturerId: string;
    unitId: string;
  }
): Promise<{ success: boolean; message: string; mtrl?: string }> {
  try {
    const { insertProductToSoftOne } = await import('@/lib/softone/insert-product');
    
    const erpData = {
      name: productData.name,
      code: productData.eanCode || '',
      code1: productData.eanCode || '', // EAN
      code2: productData.manufacturerCode || '', // Manufacturer Code
      brandId: additionalData.brandId,
      categoryId: additionalData.categoryId,
      manufacturerId: additionalData.manufacturerId,
      unitId: additionalData.unitId,
      width: productData.width,
      length: productData.length,
      height: productData.height,
      weight: productData.weight,
      isActive: true,
    };

    const result = await insertProductToSoftOne(erpData);
    
    return {
      success: result.success,
      message: result.success ? 'Product inserted to ERP successfully' : (result.error || 'Failed to insert product to ERP'),
      mtrl: result.mtrl,
    };
  } catch (error) {
    console.error('Error inserting product to ERP:', error);
    return {
      success: false,
      message: `Failed to insert product to ERP: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
