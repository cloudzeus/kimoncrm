/**
 * SoftOne Products Integration
 * Handles fetching and syncing products from SoftOne ERP
 */

import * as iconv from 'iconv-lite';

interface SoftOneProduct {
  COMPANY: string;
  SODTYPE: string;
  LOCKID: string;
  MTRL: string;
  CODE: string;
  CODE1?: string;
  CODE2?: string;
  NAME: string;
  ISACTIVE: string;
  MTRMARK?: string;
  MTRMANFCTR?: string;
  MTRCATEGORY?: string;
  MTRGROUP?: string;
  DIM1?: string;
  DIM2?: string;
  DIM3?: string;
  WEIGHT?: string;
  GWEIGHT?: string;
  PRICEW?: string;
  PRICER?: string;
  VAT?: string;
  INSDATE?: string;
  UPDDATE?: string;
  [key: string]: any;
}

interface SoftOneProductsResponse {
  success: boolean;
  code: number;
  message: string;
  at: string;
  total: number;
  company: number;
  sodtype: number;
  window_start?: string;
  window_end?: string;
  result: SoftOneProduct[];
}

interface SoftOneUpdateResponse {
  success: boolean;
  errorcode: number;
  error: string;
  MTRL?: number;
  result?: any;
}

const SOFTONE_BASE_URL = 'https://aic.oncloud.gr/s1services/JS/webservice.items';
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
 * Fetch all products from SoftOne ERP
 */
export async function fetchAllProducts(): Promise<SoftOneProductsResponse> {
  try {
    const response = await fetch(`${SOFTONE_BASE_URL}/getProductsAll`, {
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
    const data: SoftOneProductsResponse = JSON.parse(decodedText);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch products');
    }

    return data;
  } catch (error) {
    console.error('Error fetching all products from SoftOne:', error);
    throw error;
  }
}

/**
 * Fetch updated products from SoftOne ERP (last 15 minutes)
 */
export async function fetchUpdatedProducts(): Promise<SoftOneProductsResponse> {
  try {
    const response = await fetch(`${SOFTONE_BASE_URL}/getProductsUpdated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: SOFTONE_CREDENTIALS.username,
        password: SOFTONE_CREDENTIALS.password,
        company: SOFTONE_CREDENTIALS.company,
        sodtype: 51,
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
    const data: SoftOneProductsResponse = JSON.parse(decodedText);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch updated products');
    }

    return data;
  } catch (error) {
    console.error('Error fetching updated products from SoftOne:', error);
    throw error;
  }
}

/**
 * Update a product in SoftOne ERP
 */
export async function updateProductInErp(
  mtrl: number,
  updates: Record<string, any>
): Promise<SoftOneUpdateResponse> {
  try {
    console.log(`🔄 Syncing product MTRL ${mtrl} to ERP with updates:`, updates);
    
    const requestBody = {
      username: SOFTONE_CREDENTIALS.username,
      password: SOFTONE_CREDENTIALS.password,
      company: SOFTONE_CREDENTIALS.company,
      MTRL: mtrl,
      ...updates,
    };
    
    console.log('📤 ERP Update Request:', {
      url: `${SOFTONE_BASE_URL}/updateItem`,
      body: requestBody
    });
    
    const response = await fetch(`${SOFTONE_BASE_URL}/updateItem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📡 ERP Response Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert from ANSI 1253 to UTF-8
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    
    console.log('📥 ERP Raw Response:', decodedText);
    
    // Parse JSON
    const data: SoftOneUpdateResponse = JSON.parse(decodedText);
    
    console.log('📊 ERP Parsed Response:', data);
    
    if (!data.success) {
      console.error(`❌ ERP Update Failed: ${data.error || 'Unknown error'}`);
      throw new Error(data.error || 'Failed to update product');
    }

    console.log(`✅ ERP Update Successful for MTRL ${mtrl}`);
    return data;
  } catch (error) {
    console.error(`❌ Error updating product MTRL ${mtrl} in SoftOne:`, error);
    throw error;
  }
}

/**
 * Create a new product in SoftOne ERP
 */
export async function createProductInErp(
  code: string,
  name: string,
  additionalFields?: Record<string, any>
): Promise<SoftOneUpdateResponse> {
  try {
    const response = await fetch(`${SOFTONE_BASE_URL}/createNewItem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: SOFTONE_CREDENTIALS.username,
        password: SOFTONE_CREDENTIALS.password,
        company: SOFTONE_CREDENTIALS.company,
        code,
        name,
        ...additionalFields,
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
    const data: SoftOneUpdateResponse = JSON.parse(decodedText);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create product');
    }

    return data;
  } catch (error) {
    console.error('Error creating product in SoftOne:', error);
    throw error;
  }
}

/**
 * Map SoftOne product to Prisma Product model
 * Mapping: DIM1 → width, DIM2 → length, DIM3 → height, GWEIGHT → weight
 */
export function mapSoftOneProductToModel(softoneProduct: SoftOneProduct) {
  return {
    mtrl: softoneProduct.MTRL,
    code: softoneProduct.CODE,
    code1: softoneProduct.CODE1 || null,
    code2: softoneProduct.CODE2 || null,
    name: softoneProduct.NAME,
    mtrmark: softoneProduct.MTRMARK || null,
    mtrmanfctr: softoneProduct.MTRMANFCTR || null,
    mtrcategory: softoneProduct.MTRCATEGORY || null,
    mtrgroup: softoneProduct.MTRGROUP || null,
    isActive: softoneProduct.ISACTIVE === '1',
    width: softoneProduct.DIM1 ? parseFloat(softoneProduct.DIM1) : null,
    length: softoneProduct.DIM2 ? parseFloat(softoneProduct.DIM2) : null,
    height: softoneProduct.DIM3 ? parseFloat(softoneProduct.DIM3) : null,
    weight: softoneProduct.GWEIGHT ? parseFloat(softoneProduct.GWEIGHT) : null,
  };
}

