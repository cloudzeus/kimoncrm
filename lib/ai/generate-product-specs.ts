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

  let prompt = `You are a technical specification expert specializing in IT, networking, and telecommunications products. Your task is to research and extract ACCURATE official technical specifications.

PRODUCT: ${productInfo}

${context.brand ? `\nBRAND CONTEXT: ${context.brand} - Research this brand's official documentation and use their exact terminology and specifications.\n` : ''}

${context.category ? `\nCATEGORY CONTEXT: ${context.category} - Focus on specifications relevant to this product category. Use category-specific technical terminology and metrics.\n` : ''}

${context.mtrgroupCode ? `\nPRODUCT GROUP: ${context.mtrgroupCode} - This product belongs to a specific group with standardized specifications. Follow the group's specification structure and requirements.\n` : ''}

CRITICAL REQUIREMENTS:
1. Research the EXACT product model using ALL identifiers provided (name, brand, model, EAN, category)
2. Use ONLY official manufacturer datasheets and documentation from ${context.brand || 'the manufacturer'}
3. Do NOT invent, guess, or estimate any specifications
4. If you cannot find accurate official data, use "N/A" or "Contact manufacturer"
5. Include proper units of measurement (W, Gbps, MHz, kg, mm, °C, etc.)
6. Use the manufacturer's exact terminology and values
7. Be specific and precise - avoid vague terms
8. Leverage brand, category, and group context to ensure accuracy

`;

  // If group specs exist, provide minimal guidance
  if (groupSpecs.length > 0) {
    console.log(`Building prompt with ${groupSpecs.length} group specs`);
    prompt += `Generate specifications using these EXACT keys with OFFICIAL manufacturer values from ${context.brand || 'manufacturer'}:\n\n`;
    groupSpecs.forEach(spec => {
      const desc = spec.description ? ` - ${spec.description}` : '';
      const required = spec.isRequired ? ' [REQUIRED]' : ' [OPTIONAL]';
      prompt += `- ${spec.specKey}: ${spec.specName}${required}${desc}\n`;
    });
    prompt += `\nResearch ${context.brand || 'the'} ${context.name} to find exact official values for the above specifications.\n\n`;
    prompt += `VALUE REQUIREMENTS:\n`;
    prompt += `- Include units (e.g., "24 ports", "128 Gbps", "100-240V AC", "0°C to 45°C")\n`;
    prompt += `- Use exact manufacturer specs - DO NOT guess\n`;
    prompt += `- For unknowns, use "N/A"\n`;
    prompt += `- For ranges, use format: "10/100/1000 Mbps"\n`;
    prompt += `- Keep technical precision\n\n`;
    prompt += `GREEK TRANSLATION RULES:\n`;
    prompt += `- Spec names: Translate to professional Greek WITHOUT accents/tonoi\n`;
    prompt += `- Spec values: Keep technical values in English/numbers (e.g., "128 Gbps" stays "128 Gbps")\n`;
    prompt += `- Brand names stay in original language\n\n`;
    prompt += `Return JSON:\n{"specifications": [{"specKey": "exact_key", "translations": {"en": {"specName": "Name", "specValue": "Value with units"}, "el": {"specName": "Ονομα", "specValue": "Value with units"}}}]}`;
  } else {
    console.log(`No group specs found, generating generic specs`);
    prompt += `Generate 8-15 official technical specifications for this ${context.category || 'product'}${context.brand ? ` from ${context.brand}` : ''}.\n\n`;
    
    // Category-specific guidance
    if (context.category) {
      const categoryLower = context.category.toLowerCase();
      if (categoryLower.includes('switch') || categoryLower.includes('network') || categoryLower.includes('hub')) {
        prompt += `NETWORK EQUIPMENT SPECIFICATIONS:\n- Port count and types (RJ45, SFP, SFP+, QSFP+)\n- Port speeds (10/100/1000 Mbps, 1/10/25/40/100 Gbps)\n- Switching capacity and forwarding rate (Gbps, Mpps)\n- PoE support (802.3af/at/bt) and power budget (W)\n- Management capabilities (Layer 2/3, VLAN, QoS)\n- MAC address table size\n- Packet buffer memory\n- Mounting options\n`;
      } else if (categoryLower.includes('server') || categoryLower.includes('storage')) {
        prompt += `SERVER/STORAGE SPECIFICATIONS:\n- Processor model, cores, and frequency\n- RAM capacity, type (DDR4/DDR5), and max supported\n- Storage capacity, type (HDD/SSD), and RAID levels\n- Number and type of drive bays\n- Expansion slots (PCIe)\n- Network interfaces (1GbE/10GbE)\n- Form factor and rack units (1U/2U/4U)\n- Redundant power supplies\n- Remote management (iLO, iDRAC, IPMI)\n`;
      } else if (categoryLower.includes('router') || categoryLower.includes('firewall') || categoryLower.includes('gateway')) {
        prompt += `ROUTER/FIREWALL SPECIFICATIONS:\n- Throughput capacity (Gbps)\n- Firewall/VPN throughput\n- Number of WAN/LAN ports\n- Routing protocols supported\n- Maximum NAT sessions\n- VPN tunnels supported\n- Security features\n- Failover/redundancy\n`;
      } else if (categoryLower.includes('cable') || categoryLower.includes('patch') || categoryLower.includes('cord')) {
        prompt += `CABLING SPECIFICATIONS:\n- Cable category (Cat5e, Cat6, Cat6A, Cat7, Cat8)\n- Conductor type and gauge (solid/stranded, AWG)\n- Shielding type (UTP, STP, FTP, S/FTP)\n- Bandwidth and maximum frequency (MHz)\n- Maximum length and attenuation\n- Jacket material and rating (plenum, riser, LSZH)\n- Compliance standards (TIA/EIA-568, ISO/IEC 11801)\n`;
      } else if (categoryLower.includes('access point') || categoryLower.includes('wifi') || categoryLower.includes('wireless')) {
        prompt += `WIRELESS EQUIPMENT SPECIFICATIONS:\n- Wireless standards (802.11a/b/g/n/ac/ax/be)\n- Frequency bands (2.4GHz, 5GHz, 6GHz)\n- Maximum data rate (Mbps/Gbps)\n- Number of spatial streams (MIMO)\n- Transmit power (dBm)\n- Antenna configuration and gain\n- PoE support\n- Concurrent clients supported\n`;
      }
    } else {
      prompt += `GENERAL SPECIFICATIONS:\n- Model/SKU number\n- Physical dimensions (W×D×H) and weight\n- Performance specifications\n- Connectivity/interface options\n- Power requirements and consumption\n- Environmental operating conditions\n- Certifications (CE, FCC, UL, RoHS)\n`;
    }
    
    prompt += `\nUse snake_case for keys (e.g., "port_count", "switching_capacity").\n`;
    prompt += `Include units in all values.\n`;
    prompt += `Greek translations: spec names without accents, values stay technical/English.\n`;
    prompt += `Return JSON only: {"specifications": [{"specKey": "...", "translations": {"en": {...}, "el": {...}}}]}`;
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
    productContext.mtrgroupCode && `Product Group: ${productContext.mtrgroupCode}`,
  ].filter(Boolean).join(' | ');

  let prompt = `You are a technical specification expert specializing in IT, networking, and telecommunications products. Research and extract ACCURATE official technical specifications.

PRODUCT IDENTIFICATION:
${productInfo}

${productContext.brand ? `\nBRAND CONTEXT: ${productContext.brand} - Use this brand's official terminology and specifications. Research this specific brand's documentation for accurate specs.\n` : ''}

${productContext.category ? `\nCATEGORY CONTEXT: ${productContext.category} - Generate specifications relevant to this product category. Focus on category-specific technical details (e.g., for switches: port count, switching capacity; for servers: CPU, RAM, storage; for cables: category, shielding, bandwidth).\n` : ''}

${productContext.mtrgroupCode ? `\nPRODUCT GROUP: ${productContext.mtrgroupCode} - This product belongs to a specific group with standardized specifications. Follow the group's specification structure.\n` : ''}

CRITICAL REQUIREMENTS:
1. Research the EXACT product model using ALL identifiers provided above
2. Use ONLY official manufacturer datasheets and documentation from ${productContext.brand || 'the manufacturer'}
3. Do NOT invent, guess, or estimate specifications
4. If you cannot find accurate official data, use "N/A" or "Contact manufacturer"
5. Include proper units of measurement (W, Gbps, MHz, kg, mm, °C, etc.)
6. Use the manufacturer's exact terminology and values
7. Leverage brand, category, and group information to ensure specifications are contextually appropriate

`;

  if (existingSpecs.length > 0) {
    prompt += `EXISTING SPECIFICATIONS TO REVIEW/UPDATE:\n`;
    existingSpecs.forEach((spec: any) => {
      const translations = spec.translations || [];
      const enTrans = translations.find((t: any) => t.languageCode === 'en') || {};
      prompt += `- ${spec.specKey}: ${enTrans.specName || spec.specKey} = ${enTrans.specValue || 'N/A'}\n`;
    });
    prompt += `\nReview and update these with OFFICIAL manufacturer values only. Keep keys but correct values. Use "N/A" for unknowns.\n\n`;
  }

  if (groupSpecs.length > 0) {
    prompt += `REQUIRED SPECIFICATIONS (use exact keys with OFFICIAL values from ${productContext.brand || 'manufacturer'}):\n`;
    groupSpecs.forEach(spec => {
      const desc = spec.description ? ` - ${spec.description}` : '';
      const required = spec.isRequired ? ' [REQUIRED]' : ' [OPTIONAL]';
      prompt += `- ${spec.specKey}: ${spec.specName}${required}${desc}\n`;
    });
    prompt += `\nFor these group specs, research ${productContext.brand || 'the'} ${productContext.name} to find exact official values.\n\n`;
  } else {
    prompt += `Generate 8-15 official technical specifications for this ${productContext.category || 'product'}${productContext.brand ? ` from ${productContext.brand}` : ''}.\n\n`;
    
    // Category-specific guidance
    if (productContext.category) {
      const categoryLower = productContext.category.toLowerCase();
      if (categoryLower.includes('switch') || categoryLower.includes('network')) {
        prompt += `NETWORK EQUIPMENT SPECS:\n- Port count and types (RJ45, SFP, SFP+)\n- Switching/forwarding capacity (Gbps/Mpps)\n- PoE support and power budget\n- Management layer (L2/L3)\n- Throughput and latency\n`;
      } else if (categoryLower.includes('server') || categoryLower.includes('storage')) {
        prompt += `SERVER/STORAGE SPECS:\n- Processor model and cores\n- RAM capacity and type\n- Storage capacity and RAID\n- Drive bays and expansion\n- Network interfaces\n- Form factor (rack units)\n`;
      } else if (categoryLower.includes('router') || categoryLower.includes('firewall')) {
        prompt += `ROUTER/FIREWALL SPECS:\n- Throughput capacity\n- VPN performance\n- Number of WAN/LAN ports\n- Routing protocols\n- NAT sessions\n- Security features\n`;
      } else if (categoryLower.includes('cable') || categoryLower.includes('patch')) {
        prompt += `CABLING SPECS:\n- Cable category (Cat5e/6/6A/7)\n- Conductor gauge (AWG)\n- Shielding type (UTP/STP/FTP)\n- Bandwidth and frequency\n- Length\n- Compliance standards\n`;
      }
    } else {
      prompt += `GENERAL SPECS:\n- Model/SKU number\n- Physical dimensions and weight\n- Performance specifications\n- Connectivity/interfaces\n- Power requirements\n- Environmental ratings\n- Certifications\n`;
    }
  }

  prompt += `\nVALUE FORMAT RULES:\n`;
  prompt += `- Include units (e.g., "24 ports", "128 Gbps", "100-240V AC")\n`;
  prompt += `- Use ranges: "0°C to 45°C" or "10/100/1000 Mbps"\n`;
  prompt += `- Keep technical values precise\n\n`;
  
  prompt += `GREEK TRANSLATION:\n`;
  prompt += `- Spec names: Professional Greek without accents/tonoi\n`;
  prompt += `- Spec values: Keep technical values/numbers in English (e.g., "128 Gbps" stays "128 Gbps")\n`;
  prompt += `- Brand names stay in original language\n\n`;
  
  prompt += `Return ONLY valid JSON:\n{"specifications": [{"specKey": "snake_case_key", "translations": {"en": {"specName": "Name", "specValue": "Value with units"}, "el": {"specName": "Ονομα", "specValue": "Value with units"}}}]}`;

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

