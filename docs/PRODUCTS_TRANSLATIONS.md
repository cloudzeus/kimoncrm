# Product Translations System

## Overview

The Product Translations system provides AI-powered automatic translation of product information into multiple languages using DeepSeek AI. It generates professional product names, short descriptions, and detailed descriptions for each active language.

## Features

### 1. **ProductTranslation Model**

```prisma
model ProductTranslation {
  id               String   @id @default(cuid())
  productId        String
  languageCode     String  // "el", "en", etc.
  name             String?  // Translated product name
  shortDescription String?  @db.Text // Short description (150-200 chars)
  description      String?  @db.LongText // Full description
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  product          Product           @relation(fields: [productId], references: [id], onDelete: Cascade)
  language         SupportedLanguage @relation(fields: [languageCode], references: [code])

  @@unique([productId, languageCode])
}
```

### 2. **Auto-Translation with DeepSeek AI**

The system uses DeepSeek AI to automatically generate translations based on:
- Product name (Greek original)
- EAN code (code2) if available
- Manufacturer code (code1) if available
- Brand information if available
- Manufacturer information if available

### 3. **Translation Context**

For each language, the AI generates:
- **Name**: Concise, professional product name
- **Short Description**: Marketing-focused description (150-200 characters)
- **Description**: Detailed product information (300-500 characters) including features, specifications, and benefits

## Usage

### From the Products Table

1. Click the **three dots** (⋮) next to a product
2. Select **TRANSLATIONS** from the dropdown menu
3. A dialog will open showing all translations

### Translation Dialog Features

#### View Translations
- **Tabbed Interface**: Switch between languages using tabs
- **Language Flags**: Visual identification of each language
- **Status Badges**: Shows which translations are complete or missing
- **Real-time Updates**: See when translations were last updated

#### Auto-Translate
- Click **Auto-Translate** button
- System processes all active languages
- Shows progress and results
- Handles errors gracefully (continues even if one language fails)

#### Refresh
- Reload translations from database
- See latest changes

## API Endpoints

### POST /api/products/[id]/translate
Auto-translate product to all active languages

**Authentication**: Required (ADMIN, MANAGER, EMPLOYEE)

**Response**:
```json
{
  "success": true,
  "message": "Translation completed: 3 successful, 0 failed",
  "results": [
    {
      "languageCode": "el",
      "languageName": "Greek",
      "success": true
    },
    {
      "languageCode": "en",
      "languageName": "English",
      "success": true
    }
  ]
}
```

### GET /api/products/[id]/translate
Get existing translations for a product

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "productId": "...",
      "languageCode": "en",
      "name": "UBIQUITI UNIFI UAP",
      "shortDescription": "Professional wireless access point by Ubiquiti",
      "description": "The UniFi UAP delivers reliable wireless connectivity...",
      "language": {
        "code": "en",
        "name": "English",
        "nativeName": "English",
        "flag": "🇺🇸"
      }
    }
  ]
}
```

## Translation Process

### 1. **All Languages (AI-Generated)**
For all languages including Greek, the system uses DeepSeek AI to generate professional content:
1. **Build Context**: Gather all product information
2. **Generate Prompt**: Create specific instructions for DeepSeek
3. **Call API**: Send request to DeepSeek with context
4. **Parse Response**: Extract JSON with translations
5. **Save to Database**: Upsert translation record

### 3. **Error Handling**
- Continues processing even if one language fails
- Logs errors for debugging
- Returns detailed results showing success/failure per language
- Small delay between requests to avoid rate limiting (500ms)

## DeepSeek Configuration

Required environment variable in `.env`:
```env
DEEPSEEK_API_KEY=your-api-key-here
```

The system uses:
- **Model**: `deepseek-chat`
- **Temperature**: 0.3 (more deterministic, professional)
- **Max Tokens**: 1000 (sufficient for product descriptions)

## UI Components

### ProductTranslationsDialog
Location: `/components/products/product-translations-dialog.tsx`

**Features**:
- Responsive tabbed interface
- Status badges (Translated/Missing)
- Auto-translate button with loading state
- Refresh functionality
- Empty state with call-to-action
- Metadata display (last updated timestamp)

**Props**:
```typescript
interface ProductTranslationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}
```

## Example Translation Output

### Input (Product)
```
Name: UBIQUITI UNIFI UAP (UAP)
EAN Code: 3001
Manufacturer Code: UAP-001
Brand: Ubiquiti
```

### Output (Greek)
```json
{
  "name": "UBIQUITI UNIFI UAP ACCESS POINT",
  "shortDescription": "Επαγγελματικο ασυρματο σημειο προσβασης για επιχειρησεις και σπιτι. EAN: 3001",
  "description": "Το UniFi UAP ειναι ενα υψηλης αποδοσης 802.11n ασυρματο σημειο προσβασης με εξαιρετικη εμβελεια και αξιοπιστια. Χαρακτηριστικα: PoE, seamless roaming, κεντρικη διαχειριση μεσω UniFi Controller. Ιδανικο για επιχειρησεις, ξενοδοχεια και μεγαλα σπιτια. EAN: 3001 | Κωδ. Κατασκευαστη: UAP-001"
}
```

### Output (English)
```json
{
  "name": "UBIQUITI UNIFI UAP ACCESS POINT",
  "shortDescription": "Professional dual-band wireless access point designed for enterprise and home networks by Ubiquiti. EAN: 3001",
  "description": "The UniFi UAP is a high-performance 802.11n wireless access point offering exceptional range and reliability. Features include PoE support, seamless roaming, and centralized management through the UniFi Controller. Ideal for businesses, hotels, and large homes requiring professional-grade wireless coverage. EAN: 3001 | Mfr Code: UAP-001"
}
```

## Best Practices

### When to Use Auto-Translation
- ✅ After creating a new product
- ✅ When product information changes significantly
- ✅ When adding new languages to the system
- ✅ For bulk translation of existing products

### Translation Quality
The AI generates:
- **Professional tone**: Suitable for e-commerce
- **SEO-friendly**: Includes key product attributes
- **Complete information**: Brand, EAN code, Manufacturer code, and features
- **Consistent format**: Same structure across languages
- **Greek specific**: 
  - Product name in UPPERCASE WITHOUT tones/accents (e.g., "ΠΡΟΙΟΝ" not "Προϊόν")
  - Descriptions in normal text WITHOUT tones/accents (e.g., "Επαγγελματικο προιον" not "Επαγγελματικό προϊόν")
- **Code inclusion**: EAN code in shortDescription, both EAN and Manufacturer code in description

## Troubleshooting

### "DeepSeek API key not configured"
**Solution**: Add `DEEPSEEK_API_KEY` to your `.env` file

### "No active languages found"
**Solution**: Ensure you have active languages in the `SupportedLanguage` table

### Translation fails for specific language
**Check**:
- API rate limits
- Network connectivity
- DeepSeek API status
- Error logs in console

### Empty or invalid JSON response
**Cause**: Sometimes AI returns markdown-formatted JSON

**Handled by**: System automatically strips markdown code blocks:
```typescript
const cleanContent = content
  .replace(/```json\n?/g, '')
  .replace(/```\n?/g, '')
  .trim();
```

## Integration with Products System

### Dropdown Menu Action
Located in `/components/products/products-manager.tsx`:

```tsx
<DropdownMenuItem onClick={() => {
  setTranslatingProduct(product);
  setTranslationsDialogOpen(true);
}}>
  <Languages className="h-4 w-4 mr-2" />
  TRANSLATIONS
</DropdownMenuItem>
```

### Database Cascade
When a product is deleted, all its translations are automatically deleted due to:
```prisma
@relation(fields: [productId], references: [id], onDelete: Cascade)
```

## Future Enhancements

Potential improvements:
1. Bulk translation (translate multiple products at once)
2. Manual editing of translations
3. Translation history/versioning
4. Import/export translations via Excel
5. Custom translation templates per category
6. Translation quality scoring
7. A/B testing different translations
8. Integration with professional translation services

## Performance Considerations

- **Rate Limiting**: 500ms delay between API calls
- **Batch Processing**: Processes all languages sequentially
- **Caching**: Translations stored in database, not regenerated
- **Error Recovery**: Continues even if some languages fail
- **Async Updates**: UI remains responsive during translation

---

**Last Updated**: October 12, 2025
**Version**: 1.0.0
**AI Provider**: DeepSeek (deepseek-chat)

