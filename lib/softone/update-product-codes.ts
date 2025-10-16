import * as iconv from 'iconv-lite';

interface UpdateCodesResponse {
  success: boolean;
  errorcode: number;
  error: string;
  MTRL?: number;
  result?: any;
}

const SOFTONE_CREDENTIALS = {
  username: process.env.SOFTONE_USERNAME || 'Service',
  password: process.env.SOFTONE_PASSWORD || 'Service',
  company: parseInt(process.env.SOFTONE_COMPANY || '1000'),
};

function convertAnsi1253ToUtf8(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return iconv.decode(Buffer.from(uint8Array), 'win1253');
}

/**
 * Update product codes (EAN and Manufacturer Code) in SoftOne ERP
 */
export async function updateProductCodes(
  mtrl: string,
  code1?: string | null,
  code2?: string | null,
  additionalFields?: any
): Promise<UpdateCodesResponse> {
  try {
    const updateData: any = {
      username: SOFTONE_CREDENTIALS.username,
      password: SOFTONE_CREDENTIALS.password,
      company: SOFTONE_CREDENTIALS.company,
      MTRL: parseInt(mtrl),
    };

    // Only include codes that are provided
    if (code1) {
      updateData.CODE1 = code1; // EAN Code
    }
    if (code2) {
      updateData.CODE2 = code2; // Manufacturer Code
    }

    // Merge additional fields (like dimensions)
    if (additionalFields) {
      Object.assign(updateData, additionalFields);
    }

    console.log('🔄 Updating product codes in ERP:', {
      MTRL: mtrl,
      CODE1: code1 || 'not updated',
      CODE2: code2 || 'not updated',
      additionalFields: additionalFields || 'none',
    });

    const response = await fetch(
      'https://aic.oncloud.gr/s1services/JS/webservice.items/updateItem',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    const data: UpdateCodesResponse = JSON.parse(decodedText);

    if (!data.success || data.errorcode !== 200) {
      throw new Error(data.error || 'Failed to update product in ERP');
    }

    console.log('✅ Product codes updated in ERP successfully');
    return data;
  } catch (error) {
    console.error('Error updating product codes in ERP:', error);
    throw error;
  }
}

