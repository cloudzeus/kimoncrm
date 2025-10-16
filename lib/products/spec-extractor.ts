/**
 * Extract and convert dimensions and weight from product specifications
 */

interface ExtractedDimensions {
  width?: number | null;
  length?: number | null;
  height?: number | null;
  weight?: number | null;
}

interface ConversionResult {
  dimensions: ExtractedDimensions;
  hasChanges: boolean;
  extractedSpecs: string[];
}

/**
 * Convert various units to centimeters
 */
function convertToCm(value: number, unit: string): number {
  const unitLower = unit.toLowerCase().trim();
  
  switch (unitLower) {
    case 'mm':
    case 'millimeter':
    case 'millimeters':
      return value / 10;
    case 'm':
    case 'meter':
    case 'meters':
      return value * 100;
    case 'inch':
    case 'inches':
    case 'in':
      return value * 2.54;
    case 'ft':
    case 'foot':
    case 'feet':
      return value * 30.48;
    case 'cm':
    case 'centimeter':
    case 'centimeters':
    default:
      return value;
  }
}

/**
 * Convert various units to kilograms
 */
function convertToKg(value: number, unit: string): number {
  const unitLower = unit.toLowerCase().trim();
  
  switch (unitLower) {
    case 'g':
    case 'gram':
    case 'grams':
      return value / 1000;
    case 'lb':
    case 'lbs':
    case 'pound':
    case 'pounds':
      return value * 0.453592;
    case 'oz':
    case 'ounce':
    case 'ounces':
      return value * 0.0283495;
    case 'kg':
    case 'kilogram':
    case 'kilograms':
    case 'kilo':
    case 'kilos':
    default:
      return value;
  }
}

/**
 * Extract numeric value and unit from specification text
 */
function extractValueAndUnit(text: string): { value: number; unit: string } | null {
  // Remove extra whitespace and normalize
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Patterns to match various formats:
  // "220 x 110 x 50 mm"
  // "Width: 25cm"
  // "Length 30 inches"
  // "Weight: 2.5 kg"
  // "Dimensions: 100x50x25 cm"
  
  const patterns = [
    // Pattern for dimensions like "220 x 110 x 50 mm"
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/,
    // Pattern for single values like "Width: 25cm" or "25 cm"
    /(?:width|length|height|weight|w|h|l|wt)[\s:]*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/i,
    // Pattern for dimensions like "100x50x25 cm"
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/,
    // Simple pattern for "25cm" or "2.5kg"
    /(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      if (match.length === 5) {
        // Three dimensions pattern (W x L x H unit)
        const width = parseFloat(match[1]);
        const length = parseFloat(match[2]);
        const height = parseFloat(match[3]);
        const unit = match[4];
        
        return {
          width: convertToCm(width, unit),
          length: convertToCm(length, unit),
          height: convertToCm(height, unit),
          unit
        };
      } else if (match.length === 3) {
        // Single value pattern
        const value = parseFloat(match[1]);
        const unit = match[2];
        
        return { value, unit };
      }
    }
  }
  
  return null;
}

/**
 * Extract dimensions and weight from product specifications
 */
export function extractDimensionsFromSpecs(specifications: Array<{
  specKey: string;
  translations: Array<{
    languageCode: string;
    specName: string;
    specValue: string;
  }>;
}>): ConversionResult {
  const dimensions: ExtractedDimensions = {};
  const extractedSpecs: string[] = [];
  let hasChanges = false;

  // Keywords to look for in spec names and values
  const dimensionKeywords = ['width', 'length', 'height', 'depth', 'thickness', 'dimension', 'size'];
  const weightKeywords = ['weight', 'wt', 'mass', 'pound', 'kg', 'gram'];
  
  for (const spec of specifications) {
    for (const translation of spec.translations) {
      const specName = translation.specName.toLowerCase();
      const specValue = translation.specValue;
      
      // Check if this spec contains dimension or weight information
      const isDimensionSpec = dimensionKeywords.some(keyword => 
        specName.includes(keyword) || specValue.toLowerCase().includes(keyword)
      );
      
      const isWeightSpec = weightKeywords.some(keyword => 
        specName.includes(keyword) || specValue.toLowerCase().includes(keyword)
      );
      
      if (isDimensionSpec || isWeightSpec) {
        extractedSpecs.push(`${translation.specName}: ${translation.specValue}`);
        
        const extracted = extractValueAndUnit(specValue);
        
        if (extracted && typeof extracted === 'object') {
          if ('width' in extracted || 'length' in extracted || 'height' in extracted) {
            // Three dimensions extracted
            if (extracted.width !== undefined && !dimensions.width) {
              dimensions.width = extracted.width;
              hasChanges = true;
            }
            if (extracted.length !== undefined && !dimensions.length) {
              dimensions.length = extracted.length;
              hasChanges = true;
            }
            if (extracted.height !== undefined && !dimensions.height) {
              dimensions.height = extracted.height;
              hasChanges = true;
            }
          } else if (extracted.value !== undefined && extracted.unit) {
            // Single value extracted
            if (isWeightSpec && !dimensions.weight) {
              dimensions.weight = convertToKg(extracted.value, extracted.unit);
              hasChanges = true;
            } else if (isDimensionSpec) {
              // Try to determine which dimension this is based on spec name
              if (specName.includes('width') || specName.includes('w ') && !dimensions.width) {
                dimensions.width = convertToCm(extracted.value, extracted.unit);
                hasChanges = true;
              } else if (specName.includes('length') || specName.includes('l ') && !dimensions.length) {
                dimensions.length = convertToCm(extracted.value, extracted.unit);
                hasChanges = true;
              } else if (specName.includes('height') || specName.includes('h ') && !dimensions.height) {
                dimensions.height = convertToCm(extracted.value, extracted.unit);
                hasChanges = true;
              }
            }
          }
        }
      }
    }
  }

  return {
    dimensions,
    hasChanges,
    extractedSpecs
  };
}

/**
 * Update product dimensions and weight in database
 */
export async function updateProductDimensions(
  productId: string,
  dimensions: ExtractedDimensions
): Promise<{ success: boolean; updated: string[] }> {
  const { prisma } = await import('@/lib/db/prisma');
  
  const updateData: any = {};
  const updated: string[] = [];
  
  if (dimensions.width !== undefined && dimensions.width !== null) {
    updateData.width = dimensions.width;
    updated.push('width');
  }
  
  if (dimensions.length !== undefined && dimensions.length !== null) {
    updateData.length = dimensions.length;
    updated.push('length');
  }
  
  if (dimensions.height !== undefined && dimensions.height !== null) {
    updateData.height = dimensions.height;
    updated.push('height');
  }
  
  if (dimensions.weight !== undefined && dimensions.weight !== null) {
    updateData.weight = dimensions.weight;
    updated.push('weight');
  }
  
  if (Object.keys(updateData).length === 0) {
    return { success: false, updated: [] };
  }
  
  try {
    await prisma.product.update({
      where: { id: productId },
      data: updateData
    });
    
    return { success: true, updated };
  } catch (error) {
    console.error('Error updating product dimensions:', error);
    return { success: false, updated: [] };
  }
}

/**
 * Sync updated dimensions to SoftOne ERP
 */
export async function syncDimensionsToERP(
  mtrl: string,
  dimensions: ExtractedDimensions
): Promise<{ success: boolean; message: string }> {
  if (!mtrl) {
    return { success: false, message: 'No MTRL provided' };
  }
  
  try {
    const { updateProductCodes } = await import('@/lib/softone/update-product-codes');
    
    // Prepare update data for SoftOne
    const updateData: any = {
      username: process.env.SOFTONE_USERNAME || 'Service',
      password: process.env.SOFTONE_PASSWORD || 'Service',
      company: parseInt(process.env.SOFTONE_COMPANY || '1000'),
      MTRL: mtrl,
    };
    
    // Map our dimensions to SoftOne fields
    if (dimensions.width !== undefined && dimensions.width !== null) {
      updateData.DIM1 = dimensions.width; // Width
    }
    if (dimensions.length !== undefined && dimensions.length !== null) {
      updateData.DIM2 = dimensions.length; // Length  
    }
    if (dimensions.height !== undefined && dimensions.height !== null) {
      updateData.DIM3 = dimensions.height; // Height
    }
    if (dimensions.weight !== undefined && dimensions.weight !== null) {
      updateData.WEIGHT = dimensions.weight; // Weight
    }
    
    // Call the existing update function with additional fields
    const result = await updateProductCodes(mtrl, null, null, updateData);
    
    return { 
      success: true, 
      message: `Dimensions synced to ERP: ${Object.keys(updateData).filter(k => k !== 'username' && k !== 'password' && k !== 'company' && k !== 'MTRL').join(', ')}`
    };
  } catch (error) {
    console.error('Error syncing dimensions to ERP:', error);
    return { 
      success: false, 
      message: `Failed to sync dimensions to ERP: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
