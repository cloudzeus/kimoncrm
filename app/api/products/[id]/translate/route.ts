/**
 * API Route: Product Auto-Translation
 * POST /api/products/[id]/translate
 * 
 * Automatically translates product information to all active languages using DeepSeek AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { updateProductCodes } from '@/lib/softone/update-product-codes';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow ADMIN, MANAGER, and EMPLOYEE roles
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Try to parse body, default to empty object if no body
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // No body or invalid JSON, use defaults
    }
    
    const { action = 'generate', translations: translationsToSave, codes } = body;

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            name: true,
          },
        },
        manufacturer: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Handle "save" action - save user-edited translations and codes
    if (action === 'save') {
      try {
        // Save translations
        if (translationsToSave && Array.isArray(translationsToSave)) {
          for (const translation of translationsToSave) {
            await prisma.productTranslation.upsert({
              where: {
                productId_languageCode: {
                  productId: product.id,
                  languageCode: translation.languageCode,
                },
              },
              create: {
                productId: product.id,
                languageCode: translation.languageCode,
                name: translation.name,
                shortDescription: translation.shortDescription,
                description: translation.description,
              },
              update: {
                name: translation.name,
                shortDescription: translation.shortDescription,
                description: translation.description,
              },
            });
          }
        }

        // Save codes if provided
        let erpSyncResult = null;
        if (codes) {
          const updateData: any = {};
          if (codes.eanCode && codes.eanCode !== product.code1) {
            updateData.code1 = codes.eanCode;
          }
          if (codes.manufacturerCode && codes.manufacturerCode !== product.code2) {
            updateData.code2 = codes.manufacturerCode;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.product.update({
              where: { id: product.id },
              data: updateData,
            });

            // Sync to ERP if product has MTRL and is active
            if (product.mtrl && product.isActive) {
              try {
                await updateProductCodes(
                  product.mtrl,
                  codes.eanCode,
                  codes.manufacturerCode
                );
                erpSyncResult = 'success';
              } catch (error) {
                erpSyncResult = 'failed';
                console.error('Error syncing to ERP:', error);
              }
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Translations and codes saved successfully',
          erpSynced: erpSyncResult === 'success',
          erpSyncStatus: erpSyncResult,
        });
      } catch (error) {
        console.error('Error saving translations:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to save translations' },
          { status: 500 }
        );
      }
    }

    // Get all active languages
    const languages = await prisma.supportedLanguage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    if (languages.length === 0) {
      return NextResponse.json(
        { error: 'No active languages found' },
        { status: 400 }
      );
    }

    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    const results: Array<{
      languageCode: string;
      languageName: string;
      success: boolean;
      error?: string;
    }> = [];

    // Build context about the product
    const productContext = {
      name: product.name,
      eanCode: product.code1,  // CODE1 is EAN
      manufacturerCode: product.code2,  // CODE2 is Manufacturer Code
      erpCode: product.code,
      brand: product.brand?.name,
      category: product.category?.name,
      manufacturer: product.manufacturer?.name,
    };

    // Check if we need to fetch missing codes
    const needsCodes = !product.code1 || !product.code2;
    let fetchedEanCode: string | null = null;
    let fetchedMfrCode: string | null = null;
    let codesUpdated = false;

    // Translate to each language
    for (const language of languages) {
      try {
        // Call DeepSeek for translation (including Greek for proper descriptions)
        const prompt = buildTranslationPrompt(productContext, language.name, language.code, needsCodes && language.code === 'en');
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'You are a professional product translator specializing in e-commerce and technical products. Always respond with valid JSON only, no markdown formatting.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
          throw new Error('Empty response from DeepSeek');
        }

        // Parse the JSON response
        let translationData;
        try {
          // Remove markdown code blocks if present
          const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          translationData = JSON.parse(cleanContent);
        } catch (parseError) {
          console.error('Failed to parse DeepSeek response:', content);
          throw new Error('Invalid JSON response from AI');
        }

        // Validate translation data
        if (!translationData.name || !translationData.shortDescription || !translationData.description) {
          throw new Error('Incomplete translation data');
        }

        // Extract codes from AI response if this is the first language and codes are needed
        if (needsCodes && language.code === 'en' && !codesUpdated) {
          console.log('🔍 Checking for codes in AI response:', {
            eanCode: translationData.eanCode,
            manufacturerCode: translationData.manufacturerCode,
            currentCode1: product.code1,
            currentCode2: product.code2,
          });

          // Validate that codes are different
          if (translationData.eanCode && translationData.manufacturerCode) {
            if (translationData.eanCode === translationData.manufacturerCode) {
              console.warn('⚠️ AI returned same code for EAN and Manufacturer - rejecting codes');
            } else {
              if (translationData.eanCode && !product.code1) {
                fetchedEanCode = translationData.eanCode.trim();
                console.log('✅ Found EAN code:', fetchedEanCode);
              }
              if (translationData.manufacturerCode && !product.code2) {
                fetchedMfrCode = translationData.manufacturerCode.trim();
                console.log('✅ Found Manufacturer code:', fetchedMfrCode);
              }
            }
          } else {
            // Only one code provided
            if (translationData.eanCode && !product.code1) {
              fetchedEanCode = translationData.eanCode.trim();
              console.log('✅ Found EAN code:', fetchedEanCode);
            }
            if (translationData.manufacturerCode && !product.code2) {
              fetchedMfrCode = translationData.manufacturerCode.trim();
              console.log('✅ Found Manufacturer code:', fetchedMfrCode);
            }
          }
        }

        // Save translation to database
        await prisma.productTranslation.upsert({
          where: {
            productId_languageCode: {
              productId: product.id,
              languageCode: language.code,
            },
          },
          create: {
            productId: product.id,
            languageCode: language.code,
            name: translationData.name,
            shortDescription: translationData.shortDescription,
            description: translationData.description,
          },
          update: {
            name: translationData.name,
            shortDescription: translationData.shortDescription,
            description: translationData.description,
          },
        });

        results.push({
          languageCode: language.code,
          languageName: language.name,
          success: true,
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error translating to ${language.name}:`, error);
        results.push({
          languageCode: language.code,
          languageName: language.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update product with fetched codes if found
    let erpSyncResult = null;
    if (fetchedEanCode || fetchedMfrCode) {
      const updateData: any = {};
      if (fetchedEanCode && !product.code1) {
        updateData.code1 = fetchedEanCode;
        console.log(`📝 Updating product ${product.name} with EAN: ${fetchedEanCode}`);
      }
      if (fetchedMfrCode && !product.code2) {
        updateData.code2 = fetchedMfrCode;
        console.log(`📝 Updating product ${product.name} with Mfr Code: ${fetchedMfrCode}`);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: updateData,
        });
        codesUpdated = true;
        console.log('✅ Product codes updated successfully in database');

        // Sync to ERP if product has MTRL and is active
        if (product.mtrl && product.isActive) {
          try {
            console.log('🔄 Syncing codes to SoftOne ERP...');
            await updateProductCodes(
              product.mtrl,
              fetchedEanCode,
              fetchedMfrCode
            );
            erpSyncResult = 'success';
            console.log('✅ Codes synced to ERP successfully');
          } catch (erpError) {
            erpSyncResult = 'failed';
            console.error('❌ Error syncing to ERP:', erpError);
          }
        } else if (!product.mtrl) {
          console.log('ℹ️ Product has no MTRL, skipping ERP sync');
        } else if (!product.isActive) {
          console.log('ℹ️ Product is inactive, skipping ERP sync');
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Translation completed: ${successCount} successful, ${failureCount} failed`,
      results,
      codesUpdated,
      updatedCodes: codesUpdated ? {
        eanCode: fetchedEanCode,
        manufacturerCode: fetchedMfrCode,
      } : null,
      erpSynced: erpSyncResult === 'success',
      erpSyncStatus: erpSyncResult,
    });
  } catch (error) {
    console.error('Error in auto-translation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Build translation prompt for DeepSeek
 */
function buildTranslationPrompt(context: any, targetLanguage: string, languageCode: string, needsCodes: boolean): string {
  const parts = [];
  
  const isGreek = languageCode === 'el';
  
  if (isGreek) {
    parts.push(`Generate professional Greek product descriptions for e-commerce:`);
  } else {
    parts.push(`Translate the following product information to ${targetLanguage}:`);
  }
  
  parts.push(`\nProduct Name: ${context.name}`);
  
  if (context.brand) {
    parts.push(`Brand: ${context.brand}`);
  }
  
  if (context.category) {
    parts.push(`Category: ${context.category}`);
  }
  
  if (context.manufacturer) {
    parts.push(`Manufacturer: ${context.manufacturer}`);
  }
  
  if (context.eanCode) {
    parts.push(`EAN Code: ${context.eanCode}`);
  }
  
  if (context.manufacturerCode) {
    parts.push(`Manufacturer Code: ${context.manufacturerCode}`);
  }

  if (context.erpCode) {
    parts.push(`ERP Code: ${context.erpCode}`);
  }

  if (needsCodes) {
    parts.push(`\n⚠️ CRITICAL: This product is missing EAN and/or Manufacturer codes.`);
    parts.push(`You MUST research this exact product model using the name, brand, category, and manufacturer provided.`);
    parts.push(`\nCODE REQUIREMENTS:`);
    parts.push(`- EAN Code: Must be a valid 13-digit barcode (e.g., "0695248033599", "4016534112345")`);
    parts.push(`- Manufacturer Code: Must be the manufacturer's part number (e.g., "6905", "AC6508", "RB2011UiAS-RM")`);
    parts.push(`- These TWO codes MUST be DIFFERENT from each other`);
    parts.push(`- Do NOT use the same code for both fields`);
    parts.push(`- If you cannot find a valid EAN, leave it as empty string ""`);
    parts.push(`- Research the actual product to find accurate codes`);
  }

  parts.push(`\nIMPORTANT REQUIREMENTS:`);
  
  if (isGreek) {
    parts.push(`- ONLY the "name" field should be UPPERCASE Greek WITHOUT tones/accents (e.g., "MITEL 6905" not "Μιτελ 6905")`);
    parts.push(`- The "shortDescription" must be NORMAL TEXT (not uppercase) WITHOUT tones/accents`);
    parts.push(`  Example: "Το Mitel 6905 ειναι..." NOT "ΤΟ MITEL 6905 ΕΙΝΑΙ..."`);
    parts.push(`- The "description" must be NORMAL TEXT (not uppercase) WITHOUT tones/accents`);
    parts.push(`  Example: "Διαθετει οθονη LCD..." NOT "ΔΙΑΘΕΤΕΙ ΟΘΟΝΗ LCD..."`);
    parts.push(`- Write TECHNICAL descriptions, NOT marketing copy`);
    parts.push(`- Focus on specifications, features, and technical details`);
    parts.push(`- Avoid marketing phrases like "Αποκτηστε", "Ιδανικο για", etc.`);
    parts.push(`- Remove ALL Greek accent marks (tonos): ά→α, έ→ε, ή→η, ί→ι, ό→ο, ύ→υ, ώ→ω`);
  } else {
    parts.push(`- Write TECHNICAL descriptions, NOT marketing copy`);
    parts.push(`- Focus on specifications, features, and technical details`);
    parts.push(`- Avoid marketing phrases like "Get the", "Ideal for", "Perfect for", etc.`);
  }
  
  parts.push(`- The shortDescription should be a concise technical summary`);
  parts.push(`- The shortDescription MUST include the EAN code if available (format: "EAN: ${context.eanCode || '[code]'}")`);
  parts.push(`- The description MUST include both the EAN code and Manufacturer code if available`);
  parts.push(`- Format codes clearly at the end of description: "EAN: [code] | Κωδ. Κατασκευαστη: [code]" for Greek or "EAN: [code] | Mfr Code: [code]" for English`);
  parts.push(`- Focus on technical specifications: ports, speeds, power, standards, protocols, etc.`);
  parts.push(`- Be factual and concise - no promotional language`);

  parts.push(`\nProvide a JSON response with the following structure (respond with JSON only, no markdown):`);
  parts.push(`{`);
  parts.push(`  "name": "${isGreek ? 'Professional Greek product name (UPPERCASE, NO TONES)' : 'Translated product name (concise, professional)'}",`);
  parts.push(`  "shortDescription": "${isGreek ? 'Technical summary (100-150 chars, normal text, NO TONES, NO marketing, include EAN)' : 'Technical summary (100-150 characters, NO marketing, include EAN code)'}",`);
  parts.push(`  "description": "${isGreek ? 'Technical description (250-400 chars, normal text, NO TONES, specifications only, include all codes)' : 'Technical description (250-400 characters, specifications only, include EAN and Manufacturer codes)'}"${needsCodes ? ',' : ''}`);
  
  if (needsCodes) {
    parts.push(`  "eanCode": "${context.eanCode || 'Research and provide the correct EAN barcode (13 digits)'}",`);
    parts.push(`  "manufacturerCode": "${context.manufacturerCode || 'Research and provide the manufacturer part number/code'}"`);
  }
  
  parts.push(`}`);

  return parts.join('\n');
}

/**
 * GET /api/products/[id]/translate
 * Get existing translations for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const translations = await prisma.productTranslation.findMany({
      where: {
        productId: id,
      },
      include: {
        language: {
          select: {
            code: true,
            name: true,
            nativeName: true,
            flag: true,
          },
        },
      },
      orderBy: {
        languageCode: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: translations,
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

