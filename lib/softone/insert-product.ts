// @ts-nocheck
import * as iconv from 'iconv-lite';
import { generateNextAvailableCode } from './check-code';
import { mapToSoftOne, type DatabaseProduct, type RelatedCodes } from './product-mapping';

const SOFTONE_BASE_URL = 'https://aic.oncloud.gr/s1services/JS';
const SOFTONE_CREDENTIALS = {
  username: process.env.SOFTONE_USERNAME || 'Service',
  password: process.env.SOFTONE_PASSWORD || 'Service',
  company: parseInt(process.env.SOFTONE_COMPANY || '1000'),
};

function convertAnsi1253ToUtf8(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return iconv.decode(Buffer.from(uint8Array), 'win1253');
}

interface InsertProductData {
  name: string;
  code1: string; // EAN
  code2: string; // Manufacturer Code
  brandId: string;
  categoryId: string;
  manufacturerId: string;
  unitId: string;
  width?: number;
  length?: number;
  height?: number;
  weight?: number;
  isActive: boolean;
  skipDuplicateCheck?: boolean; // Skip duplicate check for existing products
}

interface InsertProductResponse {
  success: boolean;
  mtrl?: string;
  generatedCode?: string;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Check if product already exists by EAN or Manufacturer Code
 * Can exclude a specific product ID (for updating existing products)
 */
async function checkProductDuplicate(
  eanCode: string,
  manufacturerCode: string,
  prisma: any,
  excludeProductId?: string
): Promise<{ isDuplicate: boolean; existingProduct?: any }> {
  const conditions = [];
  
  if (eanCode) {
    conditions.push({ code1: eanCode });
  }
  
  if (manufacturerCode) {
    conditions.push({ code2: manufacturerCode });
  }

  if (conditions.length === 0) {
    return { isDuplicate: false };
  }

  const whereClause: any = {
    OR: conditions
  };

  // Exclude the current product if provided
  if (excludeProductId) {
    whereClause.NOT = { id: excludeProductId };
  }

  const existingProduct = await prisma.product.findFirst({
    where: whereClause,
    select: {
      id: true,
      name: true,
      code: true,
      code1: true,
      code2: true,
      mtrl: true,
    }
  });

  return {
    isDuplicate: !!existingProduct,
    existingProduct
  };
}

/**
 * Insert a new product into SoftOne ERP
 */
export async function insertProductToSoftOne(
  productData: InsertProductData
): Promise<InsertProductResponse> {
  try {
    // Get brand, category, manufacturer, and unit codes from database
    const { prisma } = await import('@/lib/db/prisma');
    
    // Check for duplicates only if not skipped (skip for existing products being added to ERP)
    if (!productData.skipDuplicateCheck) {
      const duplicateCheck = await checkProductDuplicate(
        productData.code1,
        productData.code2,
        prisma
      );

      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          isDuplicate: true,
          error: `Product already exists: ${duplicateCheck.existingProduct?.name} (EAN: ${duplicateCheck.existingProduct?.code1}, Mfr Code: ${duplicateCheck.existingProduct?.code2})`
        };
      }
    }
    
    // Fetch related codes from database
    const [brand, category, manufacturer, unit] = await Promise.all([
      prisma.brand.findUnique({ 
        where: { id: productData.brandId }, 
        select: { softoneCode: true } 
      }),
      prisma.category.findUnique({ 
        where: { id: productData.categoryId }, 
        select: { softoneCode: true } 
      }),
      prisma.manufacturer.findUnique({ 
        where: { id: productData.manufacturerId || '' }, 
        select: { code: true } 
      }),
      prisma.unit.findUnique({ 
        where: { id: productData.unitId || '' }, 
        select: { softoneCode: true } 
      }),
    ]);

    if (!brand || !category) {
      return {
        success: false,
        error: 'Missing required brand or category data',
      };
    }

    // Parse and pad category softoneCode to 3 digits (e.g., "7" -> "007")
    const categoryCodePadded = category.softoneCode.padStart(3, '0');
    const categoryCodeNum = parseInt(categoryCodePadded, 10);
    if (isNaN(categoryCodeNum)) {
      return {
        success: false,
        error: `Invalid category code: ${category.softoneCode}`,
      };
    }

    // Parse brand softoneCode as number
    const brandCodeNum = brand.softoneCode ? parseInt(brand.softoneCode, 10) : 0;
    if (brandCodeNum === 0) {
      return {
        success: false,
        error: `Brand must have a valid softoneCode`,
      };
    }

    // Parse unit code as number (default 101)
    const unitCodeNum = unit?.softoneCode ? parseInt(unit.softoneCode, 10) : 101;

    // Generate next available product code: CATEGORY.MANUFACTURER.XXXXX
    const generatedCode = await generateNextAvailableCode(
      categoryCodePadded, // Use padded category code (007)
      manufacturer?.code || brand.softoneCode || categoryCodePadded
    );

    console.log('🔢 Generated available product code:', generatedCode);
    console.log(`🏷️ Brand softoneCode: ${brand.softoneCode} → MTRMARK: ${brandCodeNum}`);
    console.log(`📁 Category softoneCode: ${category.softoneCode} → ${categoryCodePadded} → MTRCATEGORY: ${categoryCodeNum}`);
    console.log(`🏭 Manufacturer code: ${manufacturer?.code || 'Using brand/category'}`);
    console.log(`📦 Unit softoneCode: ${unit?.softoneCode || '101'} → MTRUNIT1: ${unitCodeNum}`);

    // Prepare related codes for mapping
    const relatedCodes: RelatedCodes = {
      brandId: brandCodeNum, // Use brand softoneCode as number (MTRMARK)
      categoryCode: categoryCodeNum, // Category softoneCode as number (MTRCATEGORY)
      manufacturerCode: manufacturer?.code || brand.softoneCode || '',
      unitCode: unitCodeNum, // Unit softoneCode as number (101)
    };

    // Prepare database product format
    const dbProduct: DatabaseProduct = {
      name: productData.name,
      code: generatedCode,
      code1: productData.code1,
      code2: productData.code2,
      brandId: productData.brandId,
      categoryId: productData.categoryId,
      manufacturerId: productData.manufacturerId || null,
      unitId: productData.unitId || null,
      width: productData.width,
      length: productData.length,
      height: productData.height,
      weight: productData.weight,
      isActive: productData.isActive,
    };

    // Map to SoftOne format
    const insertData = mapToSoftOne(dbProduct, relatedCodes, SOFTONE_CREDENTIALS);

    const endpoint = `${SOFTONE_BASE_URL}/webservice.items/createNewItem`;
    console.log('🌐 ERP Endpoint:', endpoint);
    console.log('📦 ERP POST Object:', JSON.stringify(insertData, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(insertData),
    });

    console.log('📡 ERP Response Status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    console.log('📄 Raw ERP Response (decoded):', decodedText.substring(0, 500));
    
    const data = JSON.parse(decodedText);
    console.log('📥 SoftOne ERP Response (parsed):', JSON.stringify(data, null, 2));

    if (!data.success) {
      console.error('❌ SoftOne ERP Error:', data);
      throw new Error(data.error || data.message || 'Failed to insert product to SoftOne ERP');
    }

    // Extract MTRL from response (check multiple possible locations)
    const mtrl = data.MTRL || data.result?.MTRL || data.mtrl || null;
    
    console.log('✅ Product inserted to SoftOne ERP successfully');
    console.log(`📋 MTRL: ${mtrl}`);
    console.log(`🔢 Generated Code: ${generatedCode}`);
    
    if (!mtrl) {
      console.warn('⚠️ Warning: No MTRL returned from ERP. Response:', data);
    }
    
    return {
      success: true,
      mtrl: mtrl?.toString() || null,
      generatedCode: generatedCode,
    };
  } catch (error) {
    console.error('Error inserting product to SoftOne ERP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
