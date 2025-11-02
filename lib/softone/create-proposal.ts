import iconv from 'iconv-lite';

const SOFTONE_BASE_URL = process.env.SOFTONE_BASE_URL || 'https://aic.oncloud.gr/s1services';

const SOFTONE_CREDENTIALS = {
  username: process.env.SOFTONE_USERNAME || 'Service',
  password: process.env.SOFTONE_PASSWORD || 'Service',
  company: process.env.SOFTONE_COMPANY || 'AIC',
};

/**
 * Convert ANSI 1253 (Greek) ArrayBuffer to UTF-8 string
 */
function convertAnsi1253ToUtf8(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return iconv.decode(Buffer.from(uint8Array), 'win1253');
}

export interface ProposalLine {
  productId: string;
  mtrl: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  margin: number;
  totalPrice: number;
  vat?: number;
  sodtype?: string; // "51" for services, "52" for products
}

export interface CreateProposalData {
  series: string; // e.g., "7001"
  trdr: string; // Customer TRDR code from ERP
  comments?: string;
  lines: ProposalLine[];
}

export interface CreateProposalResponse {
  success: boolean;
  proposalNumber?: string;
  erpResponse?: any; // Full ERP response object
  error?: string;
  errorcode?: number;
}

/**
 * Create a new proposal/offer in SoftOne ERP
 */
export async function createProposalInSoftOne(
  data: CreateProposalData
): Promise<CreateProposalResponse> {
  try {
    console.log('📋 Creating proposal in SoftOne ERP...');
    console.log('📦 Proposal data:', {
      series: data.series,
      trdr: data.trdr,
      linesCount: data.lines.length,
      comments: data.comments?.substring(0, 50) || 'none'
    });

    // Prepare MTRLINES array
    const mtrLines = data.lines
      .filter(line => line.mtrl) // Only include products/services that have MTRL (exist in ERP)
      .map(line => ({
        MTRL: line.mtrl,
        QTY1: line.quantity,
        PRICE: line.unitPrice,
        VAT: line.vat || 1410, // Default VAT code (24% in Greece)
        SODTYPE: line.sodtype || (line.sodtype === '51' ? '51' : '52') // "51" = service, "52" = product
      }));

    console.log('📝 Prepared MTRLINES:', mtrLines);

    if (mtrLines.length === 0) {
      console.error('❌ No valid products/services with MTRL codes found');
      return {
        success: false,
        error: 'No products or services with ERP codes found. Please add products to ERP first.',
      };
    }

    // Prepare the ERP request
    const requestBody = {
      username: SOFTONE_CREDENTIALS.username,
      password: SOFTONE_CREDENTIALS.password,
      SERIES: data.series,
      TRDR: data.trdr,
      COMMENTS: data.comments || 'Proposal generated from CRM',
      MTRLINES: mtrLines,
    };

    console.log('📤 ERP Request:', JSON.stringify(requestBody, null, 2));

    // Make the API call to create the proposal using getOrderDoc endpoint
    const endpoint = `${SOFTONE_BASE_URL}/JS/webservice.utilities/getOrderDoc`;
    console.log('🌐 ERP Endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 ERP Response Status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response as ArrayBuffer and decode from ANSI 1253 to UTF-8
    const arrayBuffer = await response.arrayBuffer();
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    console.log('📄 Raw ERP Response (decoded):', decodedText.substring(0, 500));

    // Parse JSON response
    const responseData = JSON.parse(decodedText);
    console.log('📥 SoftOne ERP Response (parsed):', JSON.stringify(responseData, null, 2));

    if (!responseData.success) {
      console.error('❌ SoftOne ERP Error:', responseData);
      return {
        success: false,
        error: responseData.error || responseData.message || 'Failed to create proposal in SoftOne ERP',
        errorcode: responseData.errorcode || 500,
      };
    }

    // Extract proposal data from response
    // Response structure: { success: true, errorcode: 200, FINCODE: "ΠΡΦ0000403", FINDOC: 68591, ... }
    const proposalNumber = responseData.FINCODE || responseData.SERIESNUM || null; // FINCODE is the formatted number
    const findoc = responseData.FINDOC || responseData.SALDOCNUM || null;
    const series = responseData.SERIES || null;
    const seriesNum = responseData.SERIESNUM || null;
    const turnover = responseData.TURNOVR || 0;
    const vatAmount = responseData.VATAMNT || 0;

    console.log('✅ Proposal created in SoftOne ERP successfully');
    console.log(`📋 Proposal Code: ${proposalNumber}`);
    console.log(`📋 FINDOC: ${findoc}`);
    console.log(`📋 Series: ${series} / ${seriesNum}`);
    console.log(`💰 Turnover: €${turnover} | VAT: €${vatAmount}`);

    if (!proposalNumber) {
      console.warn('⚠️ Warning: No proposal number returned from ERP. Response:', responseData);
    }

    return {
      success: true,
      proposalNumber: proposalNumber?.toString() || null,
      erpResponse: responseData, // Return full ERP response
    };
  } catch (error) {
    console.error('❌ Error creating proposal in SoftOne ERP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Validate that all products/services have ERP codes before creating proposal
 */
export function validateProposalLines(lines: ProposalLine[]): { valid: boolean; missingCodes: string[] } {
  const missingCodes: string[] = [];

  lines.forEach(line => {
    if (!line.mtrl) {
      missingCodes.push(line.name || line.productId);
    }
  });

  return {
    valid: missingCodes.length === 0,
    missingCodes,
  };
}

