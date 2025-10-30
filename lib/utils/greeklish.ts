/**
 * Greek to Greeklish (Latin) Transliteration Utility
 * Converts Greek characters to their Latin equivalents for safe filenames
 */

const greekToLatinMap: { [key: string]: string } = {
  // Uppercase Greek letters
  'Α': 'A',
  'Β': 'B',
  'Γ': 'G',
  'Δ': 'D',
  'Ε': 'E',
  'Ζ': 'Z',
  'Η': 'I',
  'Θ': 'TH',
  'Ι': 'I',
  'Κ': 'K',
  'Λ': 'L',
  'Μ': 'M',
  'Ν': 'N',
  'Ξ': 'X',
  'Ο': 'O',
  'Π': 'P',
  'Ρ': 'R',
  'Σ': 'S',
  'Τ': 'T',
  'Υ': 'Y',
  'Φ': 'F',
  'Χ': 'CH',
  'Ψ': 'PS',
  'Ω': 'O',
  
  // Lowercase Greek letters
  'α': 'a',
  'β': 'b',
  'γ': 'g',
  'δ': 'd',
  'ε': 'e',
  'ζ': 'z',
  'η': 'i',
  'θ': 'th',
  'ι': 'i',
  'κ': 'k',
  'λ': 'l',
  'μ': 'm',
  'ν': 'n',
  'ξ': 'x',
  'ο': 'o',
  'π': 'p',
  'ρ': 'r',
  'ς': 's', // Final sigma
  'σ': 's',
  'τ': 't',
  'υ': 'y',
  'φ': 'f',
  'χ': 'ch',
  'ψ': 'ps',
  'ω': 'o',
  
  // Greek letters with diacritics (accents)
  'Ά': 'A',
  'Έ': 'E',
  'Ή': 'I',
  'Ί': 'I',
  'Ό': 'O',
  'Ύ': 'Y',
  'Ώ': 'O',
  'ά': 'a',
  'έ': 'e',
  'ή': 'i',
  'ί': 'i',
  'ό': 'o',
  'ύ': 'y',
  'ώ': 'o',
  
  // Greek letters with dialytika (diaeresis)
  'Ϊ': 'I',
  'Ϋ': 'Y',
  'ϊ': 'i',
  'ϋ': 'y',
  'ΐ': 'i',
  'ΰ': 'y',
  
  // Common digraphs
  'ΑΥ': 'AU',
  'ΕΥ': 'EU',
  'ΟΥ': 'OU',
  'αυ': 'au',
  'ευ': 'eu',
  'ου': 'ou',
  'ΑΎ': 'AU',
  'ΕΎ': 'EU',
  'ΟΎ': 'OU',
  'αύ': 'au',
  'εύ': 'eu',
  'ού': 'ou',
  
  // Double consonants
  'ΜΠ': 'B',
  'μπ': 'b',
  'ΝΤ': 'D',
  'ντ': 'd',
  'ΓΚ': 'G',
  'γκ': 'g',
  'ΓΓ': 'NG',
  'γγ': 'ng',
  'ΤΣ': 'TS',
  'τσ': 'ts',
  'ΤΖ': 'TZ',
  'τζ': 'tz',
};

/**
 * Convert Greek text to Greeklish (Latin transliteration)
 * @param text - Text containing Greek characters
 * @returns Transliterated text with only Latin characters
 */
export function toGreeklish(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // First pass: Replace digraphs and double consonants (longer sequences first)
  const digraphs = Object.keys(greekToLatinMap)
    .filter(key => key.length > 1)
    .sort((a, b) => b.length - a.length); // Sort by length descending
  
  for (const greek of digraphs) {
    const latin = greekToLatinMap[greek];
    result = result.split(greek).join(latin);
  }
  
  // Second pass: Replace individual characters
  result = result.split('').map(char => {
    return greekToLatinMap[char] || char;
  }).join('');
  
  return result;
}

/**
 * Sanitize filename by converting Greek to Greeklish and removing unsafe characters
 * @param filename - Original filename (may contain Greek characters)
 * @param options - Options for sanitization
 * @returns Safe filename with only Latin alphanumerics, hyphens, underscores, and dots
 */
export function sanitizeFilename(
  filename: string,
  options?: {
    preserveExtension?: boolean;
    maxLength?: number;
    replacement?: string;
  }
): string {
  const {
    preserveExtension = true,
    maxLength = 255,
    replacement = '_',
  } = options || {};
  
  if (!filename) return 'unnamed';
  
  // Split filename and extension
  let name = filename;
  let extension = '';
  
  if (preserveExtension) {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex > 0) {
      name = filename.substring(0, lastDotIndex);
      extension = filename.substring(lastDotIndex);
    }
  }
  
  // Convert Greek to Greeklish
  name = toGreeklish(name);
  
  // Remove or replace unsafe characters
  // Keep only: letters, numbers, hyphens, underscores, spaces
  name = name.replace(/[^a-zA-Z0-9\s\-_]/g, replacement);
  
  // Replace multiple spaces/underscores with single ones
  name = name.replace(/[\s_]+/g, replacement);
  
  // Remove leading/trailing hyphens, underscores, or spaces
  name = name.replace(/^[\s\-_]+|[\s\-_]+$/g, '');
  
  // Ensure it's not empty
  if (!name) {
    name = 'unnamed';
  }
  
  // Combine name and extension
  let sanitized = name + extension;
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    const extensionLength = extension.length;
    const allowedNameLength = maxLength - extensionLength;
    sanitized = name.substring(0, allowedNameLength) + extension;
  }
  
  return sanitized;
}

/**
 * Create a safe filename from a customer/lead name and document type
 * @param entityName - Customer or lead name (may contain Greek)
 * @param documentType - Type of document (e.g., 'BOM', 'RFP', 'Infrastructure')
 * @param version - Optional version number
 * @returns Safe filename
 */
export function createSafeFilename(
  entityName: string,
  documentType: string,
  version?: number | string,
  extension: string = '.xlsx'
): string {
  const greeklishName = toGreeklish(entityName);
  const sanitizedName = sanitizeFilename(greeklishName, { preserveExtension: false });
  const sanitizedType = sanitizeFilename(documentType, { preserveExtension: false });
  
  const parts = [sanitizedName, sanitizedType];
  
  if (version !== undefined) {
    parts.push(`v${version}`);
  }
  
  return parts.join(' - ') + extension;
}

/**
 * Example usage:
 * 
 * toGreeklish('ΞΕΝΟΔΟΧΕΙΑ ΚΑΙ ΕΠΙΧΕΙΡΗΣΕΙΣ') 
 * // Returns: 'XENODOCHEIA KAI EPICHEIRISEIS'
 * 
 * sanitizeFilename('ΞΕΝΟΔΟΧΕΙΑ & ΕΠΙΧΕΙΡΗΣΕΙΣ - RFP.xlsx')
 * // Returns: 'XENODOCHEIA_EPICHEIRISEIS_-_RFP.xlsx'
 * 
 * createSafeFilename('ΞΕΝΟΔΟΧΕΙΑ ΜΑΝΤΖΑΒΕΛΑΚΗΣ ΑΕ', 'RFP Pricing', 7)
 * // Returns: 'XENODOCHEIA_MANTZABELAKIS_AE - RFP_Pricing - v7.xlsx'
 */

