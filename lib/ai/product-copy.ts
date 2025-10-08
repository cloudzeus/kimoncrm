import { deepseekChat } from "./deepseek";

export interface ProductSpecs {
  name: string;
  brand?: string;
  category?: string;
  specs: any;
}

export async function genProductDescriptions(input: ProductSpecs): Promise<{ el: string; en: string }> {
  const base = `Use the following product specs to write concise, accurate descriptions. Avoid hallucinations.`;
  const sysEL = `${base} Language: Greek. Tone: professional, helpful.`;
  const sysEN = `${base} Language: English. Tone: professional, helpful.`;
  
  const content = JSON.stringify({ 
    name: input.name, 
    brand: input.brand, 
    category: input.category, 
    specs: input.specs 
  });
  
  const [el, en] = await Promise.all([
    deepseekChat(sysEL, content),
    deepseekChat(sysEN, content),
  ]);
  
  return { el, en };
}

export async function genProductTitle(input: ProductSpecs): Promise<{ el: string; en: string }> {
  const base = `Generate a professional product title based on the specifications. Keep it concise and SEO-friendly.`;
  const sysEL = `${base} Language: Greek.`;
  const sysEN = `${base} Language: English.`;
  
  const content = JSON.stringify({ 
    name: input.name, 
    brand: input.brand, 
    category: input.category, 
    specs: input.specs 
  });
  
  const [el, en] = await Promise.all([
    deepseekChat(sysEL, content),
    deepseekChat(sysEN, content),
  ]);
  
  return { el, en };
}

export async function genProductKeywords(input: ProductSpecs): Promise<string[]> {
  const base = `Generate relevant SEO keywords for this product. Return as a comma-separated list.`;
  const content = JSON.stringify({ 
    name: input.name, 
    brand: input.brand, 
    category: input.category, 
    specs: input.specs 
  });
  
  const keywords = await deepseekChat(base, content);
  return keywords.split(',').map(k => k.trim()).filter(Boolean);
}
