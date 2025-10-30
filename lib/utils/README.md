# Greeklish Utility

A comprehensive utility for converting Greek characters to Greeklish (Latin transliteration) for safe filenames and text processing.

## Overview

This utility solves the common problem of handling Greek characters in filenames, which can cause encoding issues, download problems, and cross-platform compatibility challenges. It provides a robust, bidirectional mapping of Greek characters to their Latin equivalents.

## Features

- ✅ **Complete Character Coverage**: All Greek alphabet characters (uppercase and lowercase)
- ✅ **Diacritics Handling**: Converts characters with accents (Ά, έ, ή, etc.)
- ✅ **Dialytika Support**: Handles diaeresis marks (Ϊ, ϋ, etc.)
- ✅ **Digraph Conversion**: Smart handling of common Greek digraphs:
  - ΜΠ → B, ΝΤ → D, ΓΚ → G
  - ΑΥ → AU, ΕΥ → EU, ΟΥ → OU
  - ΓΓ → NG, ΤΣ → TS, ΤΖ → TZ
- ✅ **Safe Filename Generation**: Removes/replaces unsafe characters for cross-platform compatibility
- ✅ **Extension Preservation**: Optionally keeps file extensions intact
- ✅ **Length Limiting**: Enforces maximum filename length (default: 255 characters)

## Installation

The utility is already integrated into the project. Import from:

```typescript
import { toGreeklish, sanitizeFilename, createSafeFilename } from '@/lib/utils/greeklish';
// or
import { toGreeklish, sanitizeFilename, createSafeFilename } from '@/lib/utils';
```

## API Reference

### `toGreeklish(text: string): string`

Converts Greek text to Greeklish (Latin transliteration).

**Parameters:**
- `text` (string): Text containing Greek characters

**Returns:**
- Transliterated text with only Latin characters

**Example:**
```typescript
toGreeklish('ΞΕΝΟΔΟΧΕΙΑ ΚΑΙ ΕΠΙΧΕΙΡΗΣΕΙΣ')
// Returns: 'XENODOCHEIA KAI EPICHEIRISEIS'

toGreeklish('Καλημέρα κόσμε!')
// Returns: 'Kalimera kosme!'
```

---

### `sanitizeFilename(filename: string, options?): string`

Sanitizes a filename by converting Greek to Greeklish and removing unsafe characters.

**Parameters:**
- `filename` (string): Original filename (may contain Greek characters)
- `options` (object, optional):
  - `preserveExtension` (boolean, default: `true`): Keep file extension intact
  - `maxLength` (number, default: `255`): Maximum filename length
  - `replacement` (string, default: `'_'`): Character to replace unsafe characters with

**Returns:**
- Safe filename with only Latin alphanumerics, hyphens, underscores, and dots

**Example:**
```typescript
sanitizeFilename('ΞΕΝΟΔΟΧΕΙΑ & ΕΠΙΧΕΙΡΗΣΕΙΣ - RFP.xlsx')
// Returns: 'XENODOCHEIA_EPICHEIRISEIS_-_RFP.xlsx'

sanitizeFilename('Πελάτης: ΑΒΓΔ ΑΕ.docx', { replacement: '-' })
// Returns: 'Pelatis-ABGD-AE.docx'
```

---

### `createSafeFilename(entityName: string, documentType: string, version?: number | string, extension?: string): string`

Creates a standardized safe filename from components.

**Parameters:**
- `entityName` (string): Customer or lead name (may contain Greek)
- `documentType` (string): Type of document (e.g., 'BOM', 'RFP', 'Infrastructure')
- `version` (number | string, optional): Version number
- `extension` (string, default: `'.xlsx'`): File extension

**Returns:**
- Safe filename in format: `{entityName} - {documentType} - v{version}{extension}`

**Example:**
```typescript
createSafeFilename('ΞΕΝΟΔΟΧΕΙΑ ΜΑΝΤΖΑΒΕΛΑΚΗΣ ΑΕ', 'RFP Pricing', 7)
// Returns: 'XENODOCHEIA_MANTZABELAKIS_AE - RFP_Pricing - v7.xlsx'

createSafeFilename('Κατάστημα Αθήνας', 'BOM', 3, '.pdf')
// Returns: 'Katastima_Athinas - BOM - v3.pdf'
```

## Character Mapping

### Basic Greek Alphabet

| Greek | Latin | Greek | Latin | Greek | Latin | Greek | Latin |
|-------|-------|-------|-------|-------|-------|-------|-------|
| Α / α | A / a | Ζ / ζ | Z / z | Ν / ν | N / n | Υ / υ | Y / y |
| Β / β | B / b | Η / η | I / i | Ξ / ξ | X / x | Φ / φ | F / f |
| Γ / γ | G / g | Θ / θ | TH / th | Ο / ο | O / o | Χ / χ | CH / ch |
| Δ / δ | D / d | Ι / ι | I / i | Π / π | P / p | Ψ / ψ | PS / ps |
| Ε / ε | E / e | Κ / κ | K / k | Ρ / ρ | R / r | Ω / ω | O / o |

### Special Characters

| Greek | Latin | Description |
|-------|-------|-------------|
| Ά, ά | A, a | Alpha with accent |
| Έ, έ | E, e | Epsilon with accent |
| Ή, ή | I, i | Eta with accent |
| Ί, ί | I, i | Iota with accent |
| Ό, ό | O, o | Omicron with accent |
| Ύ, ύ | Y, y | Upsilon with accent |
| Ώ, ώ | O, o | Omega with accent |
| Ϊ, ϊ | I, i | Iota with dialytika |
| Ϋ, ϋ | Y, y | Upsilon with dialytika |

### Digraphs (Multi-character conversions)

| Greek | Latin | Example |
|-------|-------|---------|
| ΜΠ, μπ | B, b | ΜΠΑΛΑ → BALA |
| ΝΤ, ντ | D, d | ΝΤΟΜΆΤΑ → DOMATA |
| ΓΚ, γκ | G, g | ΓΚΟΛ → GOL |
| ΓΓ, γγ | NG, ng | ΑΓΓΕΛΟΣ → ANGELOS |
| ΑΥ, αυ | AU, au | ΑΥΤΟΚΙΝΗΤΟ → AUTOKINITO |
| ΕΥ, ευ | EU, eu | ΕΥΡΩΠΗ → EVROPI |
| ΟΥ, ου | OU, ou | ΟΥΡΑΝΟΣ → OURANOS |
| ΤΣ, τσ | TS, ts | ΤΣΑΝΤΑ → TSADA |
| ΤΖ, τζ | TZ, tz | ΤΖΑΚΙ → TZAKI |

## Usage in Project

The Greeklish utility is already integrated into all file generation endpoints:

### Infrastructure Files
```typescript
// app/api/site-surveys/[id]/generate-infrastructure-file/route.ts
const safeBuildingName = sanitizeFilename(buildingName, { preserveExtension: false });
const safeReference = sanitizeFilename(referenceNumber, { preserveExtension: false });
const filename = `${safeReference} - Infrastructure - ${safeBuildingName} - v${versionNumber}.xlsx`;
```

### BOM Files
```typescript
// app/api/site-surveys/[id]/generate-bom-file/route.ts
const filename = createSafeFilename(referenceNumber, 'BOM', versionNumber, '.xlsx');
```

### RFP Files
```typescript
// app/api/site-surveys/[id]/generate-rfp/route.ts
const filename = createSafeFilename(referenceNumber, 'RFP Pricing', versionNumber, '.xlsx');
```

## Testing

Visit the test page to see the utility in action:

```
http://localhost:3000/test/greeklish
```

Or use the `FilenamePreview` component in your own pages:

```typescript
import { FilenamePreview } from '@/components/shared/filename-preview';

<FilenamePreview 
  originalFilename="ΞΕΝΟΔΟΧΕΙΑ & ΕΠΙΧΕΙΡΗΣΕΙΣ - RFP.xlsx"
  onFilenameChange={(safe) => console.log('Safe filename:', safe)}
/>
```

## Technical Details

### Algorithm

1. **Digraph Processing**: Longer character sequences (2+ chars) are replaced first to avoid partial matches
2. **Individual Characters**: Single characters are then transliterated
3. **Unsafe Character Removal**: Non-alphanumeric characters (except `-`, `_`, `.`) are replaced
4. **Whitespace Normalization**: Multiple spaces/underscores are collapsed to single instances
5. **Trimming**: Leading/trailing special characters are removed
6. **Length Enforcement**: Filename is truncated if exceeding max length (preserving extension)

### Circular Reference Handling

The utility works seamlessly with the existing `cleanData` function used in the wizard to handle circular references in complex objects before serialization.

### Browser Compatibility

Works across all modern browsers and Node.js environments. No external dependencies beyond core JavaScript.

## Common Use Cases

### 1. Customer/Lead Filenames
```typescript
const customerName = "ΞΕΝΟΔΟΧΕΙΑ ΚΑΙ ΕΠΙΧΕΙΡΗΣΕΙΣ ΑΝΤΩΝΗΣ ΜΑΝΤΖΑΒΕΛΑΚΗΣ ΑΕ";
const filename = createSafeFilename(customerName, 'RFP', 1);
// XENODOCHEIA_KAI_EPICHEIRISEIS_ANTONIS_MANTZABELAKIS_AE - RFP - v1.xlsx
```

### 2. Building Infrastructure
```typescript
const buildingName = "Κατάστημα Θεσσαλονίκης - Όροφος 2";
const safe = sanitizeFilename(buildingName);
// Katastima_Thessalonikis_-_Orofos_2
```

### 3. Product Analysis
```typescript
const productName = "Διακόπτης Δικτύου Cisco";
const filename = `${toGreeklish(productName)}_analysis.docx`;
// Diakoptis_Dyktiou_Cisco_analysis.docx
```

## Benefits

1. **Cross-Platform Compatibility**: Generated filenames work on Windows, macOS, Linux, and cloud storage
2. **No Encoding Issues**: Avoids UTF-8/ByteString conversion errors in HTTP responses
3. **User-Friendly**: Greek users can still read the transliterated filenames
4. **Consistent**: Deterministic conversion ensures the same input always produces the same output
5. **Safe Downloads**: Files download correctly without browser CORS or encoding issues
6. **Database-Safe**: Filenames can be stored and queried without encoding concerns

## Future Enhancements

Potential improvements for future iterations:

- [ ] Support for other character sets (Cyrillic, Arabic, Chinese)
- [ ] Configurable transliteration schemes (strict vs. phonetic)
- [ ] Reverse transliteration (Greeklish → Greek)
- [ ] Smart abbreviation handling
- [ ] Custom character mapping overrides
- [ ] Case preservation options

## License

MIT - Part of the KimonCRM project

