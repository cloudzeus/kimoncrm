/**
 * SoftOne Manufacturers Integration
 * Handles fetching and syncing manufacturers from SoftOne ERP
 */

import * as iconv from 'iconv-lite';

interface SoftOneManufacturer {
  COMPANY: string;
  MTRMANFCTR: string;
  CODE: string;
  NAME: string;
  ISACTIVE: string;
}

interface SoftOneManufacturersResponse {
  success: boolean;
  code: number;
  message: string;
  at: string;
  company: number;
  total: number;
  result: SoftOneManufacturer[];
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
 * Fetch all manufacturers from SoftOne ERP
 */
export async function fetchAllManufacturers(): Promise<SoftOneManufacturersResponse> {
  try {
    const response = await fetch(`${SOFTONE_BASE_URL}/getManufactures`, {
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
    const data: SoftOneManufacturersResponse = JSON.parse(decodedText);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch manufacturers');
    }

    return data;
  } catch (error) {
    console.error('Error fetching manufacturers from SoftOne:', error);
    throw error;
  }
}

/**
 * Map SoftOne manufacturer to Prisma Manufacturer model
 */
export function mapSoftOneManufacturerToModel(softoneManufacturer: SoftOneManufacturer) {
  return {
    mtrmanfctr: softoneManufacturer.MTRMANFCTR,
    code: softoneManufacturer.CODE,
    name: softoneManufacturer.NAME,
    isActive: softoneManufacturer.ISACTIVE === '1',
    softoneCode: softoneManufacturer.MTRMANFCTR, // Map to legacy field for backward compatibility
  };
}

