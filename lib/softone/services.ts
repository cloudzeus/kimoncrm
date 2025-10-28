/**
 * SoftOne Services Integration
 * Handles fetching and syncing services from SoftOne ERP
 */

import * as iconv from 'iconv-lite';

interface SoftOneService {
  COMPANY: string;
  SODTYPE: string;
  LOCKID: string;
  MTRL: string;
  CODE: string;
  NAME: string;
  MTRCATEGORY?: string;
  ISACTIVE: string;
  [key: string]: any;
}

interface SoftOneServicesResponse {
  success: boolean;
  responsecode: number;
  error: string;
  'Last Update'?: string;
  'Total Products'?: number;
  result: SoftOneService[];
}

interface SoftOneUpdateResponse {
  success: boolean;
  responsecode: number;
  error: string;
  message?: string;
}

const SOFTONE_BASE_URL = 'https://aic.oncloud.gr/s1services/JS/webservice.products';
const SOFTONE_CREDENTIALS = {
  username: 'Service',
  password: 'Service',
  company: 1000,
  sodtype: 51,
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
 * Fetch all services from SoftOne ERP
 */
export async function fetchAllServices(): Promise<SoftOneServicesResponse> {
  try {
    console.log('🔄 Fetching services from SoftOne ERP...');
    console.log('📤 Request:', {
      url: `${SOFTONE_BASE_URL}/mtrlServices`,
      credentials: {
        username: SOFTONE_CREDENTIALS.username,
        company: SOFTONE_CREDENTIALS.company,
        sodtype: SOFTONE_CREDENTIALS.sodtype,
      }
    });

    const response = await fetch(`${SOFTONE_BASE_URL}/mtrlServices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: SOFTONE_CREDENTIALS.username,
        password: SOFTONE_CREDENTIALS.password,
        company: SOFTONE_CREDENTIALS.company,
        sodtype: SOFTONE_CREDENTIALS.sodtype,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert from ANSI 1253 to UTF-8
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    
    console.log('📥 Raw Response (first 500 chars):', decodedText.substring(0, 500));
    
    // Parse JSON
    const data: SoftOneServicesResponse = JSON.parse(decodedText);
    
    console.log('📊 Parsed Response:', {
      success: data.success,
      responsecode: data.responsecode,
      error: data.error,
      totalServices: data['Total Products'] || data.result?.length || 0,
    });
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch services');
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching services from SoftOne:', error);
    throw error;
  }
}

/**
 * Map SoftOne service to Prisma Service model
 */
export function mapSoftOneServiceToModel(softoneService: SoftOneService) {
  return {
    mtrl: softoneService.MTRL,
    code: softoneService.CODE,
    mtrcategory: softoneService.MTRCATEGORY || null,
    name: softoneService.NAME,
    isActive: softoneService.ISACTIVE === '1',
  };
}

/**
 * Update a service in SoftOne ERP
 */
export async function updateServiceInErp(
  mtrl: string,
  updates: Record<string, any>
): Promise<SoftOneUpdateResponse> {
  try {
    console.log(`🔄 Syncing service MTRL ${mtrl} to ERP with updates:`, updates);
    
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
      throw new Error(data.error || 'Failed to update service');
    }

    console.log(`✅ ERP Update Successful for MTRL ${mtrl}`);
    return data;
  } catch (error) {
    console.error(`❌ Error updating service MTRL ${mtrl} in SoftOne:`, error);
    throw error;
  }
}

