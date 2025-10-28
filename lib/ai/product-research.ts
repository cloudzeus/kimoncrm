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
          content: `Product info specialist. Return ONLY valid JSON, no markdown.`
        },
        {
          role: 'user',
          content: researchPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
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
          content: `Professional translator. Return ONLY valid JSON, no markdown. Use Greek alphabet for 'el' translations.`
        },
        {
          role: 'user',
          content: translationPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
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
  // Limit categories/manufacturers/brands to top 20 for faster processing
  const topCategories = context.availableCategories.slice(0, 20);
  const topManufacturers = context.availableManufacturers.slice(0, 20);
  const topBrands = context.availableBrands.slice(0, 20);

  return `Research product info. Return JSON only.

PRODUCT: ${context.productInput.name} | EAN: ${context.productInput.eanCode || 'N/A'} | Brand: ${context.productInput.brand}

CATEGORIES (pick best match):
${topCategories.map((c: any) => `${c.name} (ID:${c.id})`).join(', ')}

MANUFACTURERS (pick best match):
${topManufacturers.map((m: any) => `${m.name} (ID:${m.id})`).join(', ')}

BRANDS (pick best match):
${topBrands.map((b: any) => `${b.name} (ID:${b.id})`).join(', ')}

TASKS:
1. Product name
2. Manufacturer code (part/model number)
3. EAN (13 digits)
4. Dimensions (cm): width, length, height
5. Weight (kg)
6. 5-10 tech specs (key technical specifications only)
7. Match brand, manufacturer, category IDs from lists above

Return JSON:
{
  "name": "Product Name",
  "manufacturerCode": "Model/Part#",
  "eanCode": "13-digit",
  "dimensions": {"width": 0, "length": 0, "height": 0, "weight": 0},
  "specifications": [{"specKey": "key", "specName": "Name", "specValue": "Value", "order": 1}],
  "suggestedBrandId": "id", "suggestedCategoryId": "id", "suggestedManufacturerId": "id"
}`;
}

/**
 * Build prompt for translations
 */
function buildTranslationPrompt(researchData: any): string {
  const specsFormatted = researchData.specifications?.map((s: any) => 
    `${s.specName}: ${s.specValue}`
  ).join(' | ') || 'None';

  return `Translate product to EN and EL. Use Greek alphabet for EL. Keep model codes in English.

Product: ${researchData.name}
Specs: ${specsFormatted}

Return JSON:
{
  "translations": [
    {"languageCode": "en", "name": "...", "shortDescription": "...", "description": "..."},
    {"languageCode": "el", "name": "...", "shortDescription": "...", "description": "..."}
  ],
  "specificationTranslations": [
    {"specKey": "key", "en": {"specName": "...", "specValue": "..."}, "el": {"specName": "...", "specValue": "..."}}
  ]
}`;
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
