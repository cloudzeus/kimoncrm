import OpenAI from 'openai';

const deepseek = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProductContext {
  name: string;
  eanCode?: string | null;
  manufacturerCode?: string | null;
  brand?: string | null;
  category?: string | null;
  mtrgroupCode?: string | null;
}

interface GeneratedSpec {
  specKey: string;
  aiProvider?: string; // Track which AI provider generated this spec
  translations: {
    [languageCode: string]: {
      specName: string;
      specValue: string;
    };
  };
}

/**
 * Generate technical specifications for a product using AI
 * Acts as hardware, software, system, and network engineer
 */
export async function generateProductSpecs(
  productContext: ProductContext,
  languages: string[] = ['en', 'el']
): Promise<GeneratedSpec[]> {
  // If mtrgroupCode is provided, fetch group specs to filter AI response
  let groupSpecs: any[] = [];
  if (productContext.mtrgroupCode) {
    try {
      const { prisma } = await import('@/lib/db/prisma');
      groupSpecs = await prisma.productGroupSpec.findMany({
        where: { mtrgroupCode: productContext.mtrgroupCode },
        orderBy: { order: 'asc' }
      });
      console.log(`Found ${groupSpecs.length} group specs for mtrgroup ${productContext.mtrgroupCode}:`, groupSpecs.map(s => s.specKey));
    } catch (error) {
      console.error('Error fetching group specs:', error);
    }
  }

  const prompt = buildSpecsPrompt(productContext, languages, groupSpecs);

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Technical specs expert. Return ONLY valid JSON, no markdown.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Very low for consistent, fast responses
      max_tokens: groupSpecs.length > 0 ? 1500 : 3000, // Less tokens when using group specs
    });

    const content = response.choices[0]?.message?.content?.trim() || '{}';
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    if (content.startsWith('```')) {
      const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      jsonContent = match ? match[1] : content;
    }

    const parsed = JSON.parse(jsonContent);
    
    // Validate and transform the response
    if (!parsed.specifications || !Array.isArray(parsed.specifications)) {
      throw new Error('Invalid response format: missing specifications array');
    }

    // Add aiProvider to each spec
    const specsWithProvider = parsed.specifications.map((spec: any) => ({
      ...spec,
      aiProvider: 'deepseek'
    }));
    
    console.log(`Generated ${specsWithProvider.length} specifications using DeepSeek`);
    return specsWithProvider as GeneratedSpec[];
  } catch (error) {
    console.error('Error generating product specs with DeepSeek:', error);
    throw new Error(`Failed to generate product specifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildSpecsPrompt(context: ProductContext, languages: string[], groupSpecs: any[] = []): string {
  // Build concise product info
  const productInfo = [
    `Product: ${context.name}`,
    context.brand && `Brand: ${context.brand}`,
    context.manufacturerCode && `Model: ${context.manufacturerCode}`,
    context.eanCode && `EAN: ${context.eanCode}`,
    context.category && `Category: ${context.category}`,
    context.mtrgroupCode && `Group: ${context.mtrgroupCode}`,
  ].filter(Boolean).join(' | ');

  let prompt = `You are a technical specification expert. Extract ONLY the official technical specifications for this product.\n\nProduct: ${productInfo}\n\nIMPORTANT: Use ONLY official manufacturer specifications. Do not guess or estimate values.\n\n`;

  // If group specs exist, provide minimal guidance
  if (groupSpecs.length > 0) {
    console.log(`Building prompt with ${groupSpecs.length} group specs`);
    prompt += `Generate ONLY these specs (use exact keys) with OFFICIAL manufacturer values:\n`;
    groupSpecs.forEach(spec => {
      const desc = spec.description ? ` (${spec.description})` : '';
      prompt += `- ${spec.specKey}: ${spec.specName}${spec.isRequired ? ' (REQUIRED)' : ''}${desc}\n`;
    });
    prompt += `\nCRITICAL: Use ONLY official manufacturer specifications. If you don't know the exact official value, use "N/A" instead of guessing.\n\nReturn JSON:\n{"specifications": [{"specKey": "...", "translations": {"en": {"specName": "...", "specValue": "..."}, "el": {"specName": "...", "specValue": "..."}}}]}`;
  } else {
    console.log(`No group specs found, generating generic specs`);
    prompt += `Generate 8-12 official technical specifications (CPU, RAM, storage, ports, WiFi, power, dimensions, weight, OS, etc.)\n`;
    prompt += `CRITICAL: Use ONLY official manufacturer specifications. If you don't know the exact value, use "N/A".\n`;
    prompt += `Use snake_case for keys. Return JSON only.`;
  }

  return prompt;
}

/**
 * Regenerate technical specifications using OpenAI (for verification/recheck)
 * Uses OpenAI instead of DeepSeek for better accuracy
 */
export async function regenerateProductSpecsWithOpenAI(
  productContext: ProductContext,
  existingSpecs: any[] = [],
  languages: string[] = ['en', 'el']
): Promise<GeneratedSpec[]> {
  let groupSpecs: any[] = [];
  if (productContext.mtrgroupCode) {
    try {
      const { prisma } = await import('@/lib/db/prisma');
      groupSpecs = await prisma.productGroupSpec.findMany({
        where: { mtrgroupCode: productContext.mtrgroupCode },
        orderBy: { order: 'asc' }
      });
      console.log(`Found ${groupSpecs.length} group specs for mtrgroup ${productContext.mtrgroupCode}:`, groupSpecs.map(s => s.specKey));
    } catch (error) {
      console.error('Error fetching group specs:', error);
    }
  }

  const productInfo = [
    `Product: ${productContext.name}`,
    productContext.brand && `Brand: ${productContext.brand}`,
    productContext.manufacturerCode && `Model/Part Number: ${productContext.manufacturerCode}`,
    productContext.eanCode && `EAN: ${productContext.eanCode}`,
    productContext.category && `Category: ${productContext.category}`,
    productContext.mtrgroupCode && `Group: ${productContext.mtrgroupCode}`,
  ].filter(Boolean).join(' | ');

  let prompt = `You are a technical specification expert. Extract ONLY the official technical specifications for this product.\n\nProduct Information:\n${productInfo}\n\nCRITICAL: Use ONLY official manufacturer specifications. Do not guess or estimate values. If you don't know the exact value, use "N/A".\n\n`;

  if (existingSpecs.length > 0) {
    prompt += `Current specifications:\n`;
    existingSpecs.forEach((spec: any) => {
      const translations = spec.translations || [];
      const enTrans = translations.find((t: any) => t.languageCode === 'en') || {};
      prompt += `- ${spec.specKey}: ${enTrans.specName || spec.specKey} = ${enTrans.specValue || 'N/A'}\n`;
    });
    prompt += `\nPlease review and update these specifications with OFFICIAL manufacturer values only. Keep the same keys but use accurate official specs. If official value is unknown, use "N/A".\n\n`;
  }

  if (groupSpecs.length > 0) {
    prompt += `Required specifications (use these exact keys with OFFICIAL manufacturer values):\n`;
    groupSpecs.forEach(spec => {
      const desc = spec.description ? ` (${spec.description})` : '';
      prompt += `- ${spec.specKey}: ${spec.specName}${spec.isRequired ? ' (REQUIRED)' : ''}${desc}\n`;
    });
  } else {
    prompt += `Generate 8-12 official technical specifications including:\n`;
    prompt += `- CPU/Processor specifications\n`;
    prompt += `- Memory (RAM) details\n`;
    prompt += `- Storage capacity and type\n`;
    prompt += `- Connectivity ports\n`;
    prompt += `- Wireless capabilities (WiFi, Bluetooth)\n`;
    prompt += `- Power requirements\n`;
    prompt += `- Physical dimensions\n`;
    prompt += `- Weight\n`;
    prompt += `- Operating system\n`;
    prompt += `- Any other relevant technical specs\n`;
  }

  prompt += `\nReturn ONLY valid JSON in this format:\n{"specifications": [{"specKey": "key_name", "translations": {"en": {"specName": "Spec Name", "specValue": "Value"}, "el": {"specName": "Όνομα Spec", "specValue": "Τιμή"}}}]}\n`;
  prompt += `Use Greek alphabet (α-ω) for Greek (el) translations.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a technical specification expert. Return ONLY valid JSON, no markdown, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content?.trim() || '{}';
    
    let jsonContent = content;
    if (content.startsWith('```')) {
      const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      jsonContent = match ? match[1] : content;
    }

    const parsed = JSON.parse(jsonContent);
    
    if (!parsed.specifications || !Array.isArray(parsed.specifications)) {
      throw new Error('Invalid response format: missing specifications array');
    }

    // Add aiProvider to each spec
    const specsWithProvider = parsed.specifications.map((spec: any) => ({
      ...spec,
      aiProvider: 'openai'
    }));
    
    console.log(`OpenAI regenerated ${specsWithProvider.length} specifications`);
    return specsWithProvider as GeneratedSpec[];
  } catch (error) {
    console.error('Error regenerating product specs with OpenAI, falling back to DeepSeek:', error);
    
    // Fallback to DeepSeek if OpenAI fails (e.g., quota exceeded)
    try {
      console.log('Using DeepSeek as fallback for spec regeneration...');
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a technical specification expert. Return ONLY valid JSON, no markdown, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content?.trim() || '{}';
      
      let jsonContent = content;
      if (content.startsWith('```')) {
        const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        jsonContent = match ? match[1] : content;
      }

      const parsed = JSON.parse(jsonContent);
      
      if (!parsed.specifications || !Array.isArray(parsed.specifications)) {
        throw new Error('Invalid response format: missing specifications array');
      }

      // Add aiProvider to each spec
      const fallbackSpecsWithProvider = parsed.specifications.map((spec: any) => ({
        ...spec,
        aiProvider: 'deepseek'
      }));
      
      console.log(`DeepSeek (fallback) regenerated ${fallbackSpecsWithProvider.length} specifications`);
      return fallbackSpecsWithProvider as GeneratedSpec[];
    } catch (fallbackError) {
      console.error('Error with DeepSeek fallback:', fallbackError);
      throw new Error(`Failed to regenerate product specifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

