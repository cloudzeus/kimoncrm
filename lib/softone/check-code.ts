import * as iconv from 'iconv-lite';

const SOFTONE_BASE_URL = 'https://aic.oncloud.gr/s1services/JS/webservice.mtrl';
const SOFTONE_CREDENTIALS = {
  username: process.env.SOFTONE_USERNAME || 'Service',
  password: process.env.SOFTONE_PASSWORD || 'Service',
  company: parseInt(process.env.SOFTONE_COMPANY || '1000'),
  sodtype: 51,
};

function convertAnsi1253ToUtf8(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return iconv.decode(Buffer.from(uint8Array), 'win1253');
}

/**
 * Check if a product code exists in SoftOne ERP
 */
export async function checkCodeExists(code: string): Promise<boolean> {
  try {
    const response = await fetch(`${SOFTONE_BASE_URL}/getCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...SOFTONE_CREDENTIALS,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    const data = JSON.parse(decodedText);

    if (!data.success) {
      throw new Error(data.message || 'Failed to check code in SoftOne ERP');
    }

    // Return true if code exists (not available)
    return data.exists === true;
  } catch (error) {
    console.error('Error checking code in SoftOne:', error);
    throw error;
  }
}

/**
 * Generate next available product code
 * Format: CATEGORY.MANUFACTURER.XXXXX
 * Strategy: Use database to find next available code
 */
export async function generateNextAvailableCode(
  categoryCode: string,
  manufacturerCode: string
): Promise<string> {
  const { prisma } = await import('@/lib/db/prisma');
  const codePrefix = `${categoryCode}.${manufacturerCode}.`;
  
  // Find highest number in our database for this category-manufacturer combo
  const existingProducts = await prisma.product.findMany({
    where: {
      code: {
        startsWith: codePrefix
      }
    },
    select: {
      code: true
    },
    orderBy: {
      code: 'desc'
    },
    take: 1
  });

  // Start from highest number in DB + 1 (or 1 if none found)
  let counter = 1;
  
  if (existingProducts.length > 0 && existingProducts[0].code) {
    const lastCode = existingProducts[0].code;
    const parts = lastCode.split('.');
    
    if (parts.length === 3) {
      const lastCounter = parseInt(parts[2], 10);
      if (!isNaN(lastCounter)) {
        counter = lastCounter + 1;
      }
    }
  }

  const paddedNumber = counter.toString().padStart(5, '0');
  const candidateCode = `${codePrefix}${paddedNumber}`;
  
  console.log(`✅ Generated code: ${candidateCode} (based on database)`);
  
  return candidateCode;
}
