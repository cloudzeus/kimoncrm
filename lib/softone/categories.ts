/**
 * SoftOne Categories Integration
 * Handles fetching and syncing categories from SoftOne ERP
 */

import * as iconv from 'iconv-lite';

interface SoftOneCategory {
  COMPANY: string;
  MTRCATEGORY: string;
  CODE: string;
  NAME: string;
  ISACTIVE: string;
}

interface SoftOneCategoriesResponse {
  success: boolean;
  code: number;
  message: string;
  at: string;
  company: number;
  total: number;
  result: SoftOneCategory[];
}

const SOFTONE_BASE_URL = 'https://aic.oncloud.gr/s1services/JS/webservice.utilities';
const SOFTONE_CREDENTIALS = {
  username: process.env.SOFTONE_USERNAME || 'Service',
  password: process.env.SOFTONE_PASSWORD || 'Service',
  company: parseInt(process.env.SOFTONE_COMPANY || '1000'),
};

/**
 * Convert ANSI 1253 encoded data to UTF-8
 * @param buffer ArrayBuffer from fetch response
 * @returns Decoded string in UTF-8
 */
function convertAnsi1253ToUtf8(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return iconv.decode(Buffer.from(uint8Array), 'win1253');
}

/**
 * Fetch all categories from SoftOne ERP
 */
export async function fetchAllCategories(): Promise<SoftOneCategoriesResponse> {
  try {
    const response = await fetch(`${SOFTONE_BASE_URL}/getCategories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: SOFTONE_CREDENTIALS.username,
        password: SOFTONE_CREDENTIALS.password,
        company: SOFTONE_CREDENTIALS.company,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert from ANSI 1253 to UTF-8
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    
    // Parse JSON
    const data: SoftOneCategoriesResponse = JSON.parse(decodedText);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch categories');
    }

    return data;
  } catch (error) {
    console.error('Error fetching categories from SoftOne:', error);
    throw error;
  }
}

/**
 * Map SoftOne category to Prisma Category model
 */
export function mapSoftOneCategoryToModel(softoneCategory: SoftOneCategory) {
  return {
    name: softoneCategory.NAME,
    softoneCode: softoneCategory.CODE, // Map CODE to softoneCode (this will be used as mtrcategory in products)
  };
}
