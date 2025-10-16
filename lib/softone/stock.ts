import * as iconv from 'iconv-lite';

interface StockItem {
  MTRL: string;
  CODE: string;
  BALANCE: string;
}

interface StockResponse {
  success: boolean;
  code: number;
  message: string;
  at: string;
  company: number;
  total: number;
  result: StockItem[];
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
 * Fetch AIC warehouse availability
 */
export async function fetchAicAvailability(): Promise<StockResponse> {
  try {
    const response = await fetch(
      'https://aic.oncloud.gr/s1services/JS/webservice.utilities/getAicAvailability',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: SOFTONE_CREDENTIALS.username,
          password: SOFTONE_CREDENTIALS.password,
          company: SOFTONE_CREDENTIALS.company,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    const data: StockResponse = JSON.parse(decodedText);

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch AIC availability');
    }

    return data;
  } catch (error) {
    console.error('Error fetching AIC availability:', error);
    throw error;
  }
}

/**
 * Fetch NETCORE warehouse availability
 */
export async function fetchNetcoreAvailability(): Promise<StockResponse> {
  try {
    const response = await fetch(
      'https://aic.oncloud.gr/s1services/JS/webservice.utilities/getNetcoreAvailability',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: SOFTONE_CREDENTIALS.username,
          password: SOFTONE_CREDENTIALS.password,
          company: SOFTONE_CREDENTIALS.company,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    const data: StockResponse = JSON.parse(decodedText);

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch NETCORE availability');
    }

    return data;
  } catch (error) {
    console.error('Error fetching NETCORE availability:', error);
    throw error;
  }
}

