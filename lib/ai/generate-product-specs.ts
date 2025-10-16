import OpenAI from 'openai';

const deepseek = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

interface ProductContext {
  name: string;
  eanCode?: string | null;
  manufacturerCode?: string | null;
  brand?: string | null;
  category?: string | null;
}

interface GeneratedSpec {
  specKey: string;
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
  const prompt = buildSpecsPrompt(productContext, languages);

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a technical expert acting as a hardware engineer, software engineer, system engineer, and network engineer. 
Your task is to analyze product information and generate accurate, detailed technical specifications.
You MUST return ONLY valid JSON, no additional text or formatting.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 4000,
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

    return parsed.specifications as GeneratedSpec[];
  } catch (error) {
    console.error('Error generating product specs with DeepSeek:', error);
    throw new Error(`Failed to generate product specifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildSpecsPrompt(context: ProductContext, languages: string[]): string {
  const parts: string[] = [];

  parts.push('**Product Information:**');
  parts.push(`- Name: ${context.name}`);
  if (context.eanCode) parts.push(`- EAN Code: ${context.eanCode}`);
  if (context.manufacturerCode) parts.push(`- Manufacturer Code: ${context.manufacturerCode}`);
  if (context.brand) parts.push(`- Brand: ${context.brand}`);
  if (context.category) parts.push(`- Category: ${context.category}`);

  parts.push('\n**Task:**');
  parts.push('As a technical expert (hardware, software, system, and network engineer), analyze this product and generate detailed technical specifications.');
  parts.push('Research and provide accurate specifications based on the product information provided.');

  parts.push('\n**Guidelines:**');
  parts.push('- Generate 5-15 relevant technical specifications');
  parts.push('- Focus on hardware specs (CPU, RAM, storage, ports, power), software specs (OS, protocols), network specs (WiFi, Ethernet, speeds), and system specs (dimensions, weight, certifications)');
  parts.push('- Use technical terminology appropriate for IT/networking/hardware professionals');
  parts.push('- Be specific with values (e.g., "802.11ac Wave 2" not just "WiFi")');
  parts.push('- Include units where applicable (GHz, GB, W, V, etc.)');
  parts.push('- Use snake_case for specKey (e.g., "cpu_frequency", "ram_capacity")');

  parts.push('\n**Translation Requirements:**');
  languages.forEach(lang => {
    if (lang === 'el') {
      parts.push('- Greek (el): Use UPPERCASE without tones/accents for specName, normal text for specValue');
      parts.push('  Example: {"specName": "ΕΠΕΞΕΡΓΑΣΤΗΣ", "specValue": "Dual-Core 1.2GHz"}');
    } else if (lang === 'en') {
      parts.push('- English (en): Use Title Case for specName, technical format for specValue');
      parts.push('  Example: {"specName": "Processor", "specValue": "Dual-Core 1.2GHz"}');
    }
  });

  parts.push('\n**Response Format (ONLY JSON, no markdown):**');
  parts.push('{');
  parts.push('  "specifications": [');
  parts.push('    {');
  parts.push('      "specKey": "cpu_model",');
  parts.push('      "translations": {');
  languages.forEach((lang, index) => {
    const isLast = index === languages.length - 1;
    parts.push(`        "${lang}": {`);
    parts.push(`          "specName": "${lang === 'el' ? 'ΕΠΕΞΕΡΓΑΣΤΗΣ' : 'Processor'}",`);
    parts.push(`          "specValue": "Dual-Core ARM Cortex-A53 1.2GHz"`);
    parts.push(`        }${isLast ? '' : ','}`);
  });
  parts.push('      }');
  parts.push('    }');
  parts.push('  ]');
  parts.push('}');

  parts.push('\nGenerate specifications NOW. Return ONLY the JSON object.');

  return parts.join('\n');
}

