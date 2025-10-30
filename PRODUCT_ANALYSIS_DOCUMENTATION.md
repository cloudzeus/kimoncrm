# Product Analysis Document Generation System

## Overview
This system generates professional Word documents for product analysis using `docxtemplater` library. The documents are formatted in Greek with product specifications, images, and descriptions.

## Features
- ✅ Dynamic Word document generation from template
- ✅ Greek language support (all labels in uppercase Greek without accents)
- ✅ Product images embedded in the document
- ✅ Specifications dynamically populated from database
- ✅ Professional styling and formatting
- ✅ Customizable Word template
- ✅ One-click document generation from product detail page

## Technology Stack
- **docxtemplater**: Template-based Word document generation
- **pizzip**: ZIP file handling for .docx files
- **docxtemplater-image-module-free**: Image embedding in Word documents
- **axios**: Image downloading from URLs
- **Next.js API Routes**: Server-side document generation

## File Structure

### Core Files
```
/lib/word/
  └── product-analysis-generator.ts     # Main document generation logic

/app/api/products/[id]/
  └── generate-analysis/
      └── route.ts                       # API endpoint for document generation

/public/templates/
  └── product-analysis-template.docx    # Word template with placeholders
  └── README.md                          # Template creation guide

/scripts/
  └── generate-product-template.ts      # Script to generate initial template

/components/products/
  └── product-detail-client.tsx         # UI component with "Generate Analysis" button
```

## How It Works

### 1. Template System
The system uses a Word template (`product-analysis-template.docx`) with special placeholders:

#### Basic Placeholders:
- `{productName}` - Product name in Greek
- `{description}` - Product description in Greek
- `{generatedDate}` - Document generation date

#### Conditional Sections:
```
{#hasBrand}
ΜΑΡΚΑ
{brandName}
{/hasBrand}
```

#### Loops (Specifications):
```
{#hasSpecifications}
ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ
{#specifications}
• {name}: {value}
{/specifications}
{/hasSpecifications}
```

#### Images:
- `{%mainImage}` - Main product image (400x300px)
- `{#additionalImages}{%this}{/additionalImages}` - Additional images (200x150px each)

### 2. Data Flow
1. User clicks "Generate Analysis" button on product detail page
2. Frontend sends POST request to `/api/products/{id}/generate-analysis`
3. API fetches product data from database (including Greek translations)
4. System downloads product images from URLs
5. Data is prepared and formatted for the template
6. `docxtemplater` renders the template with data
7. Generated document is returned as downloadable file

### 3. Document Generation Process

```typescript
// 1. Fetch product data
const product = await prisma.product.findUnique({
  where: { id: productId },
  include: {
    translations: true,  // Greek translations
    images: true,        // Product images
    specifications: {
      include: {
        translations: true  // Greek specifications
      }
    }
  }
});

// 2. Download images
const images = await downloadImages(product.images);

// 3. Prepare data for template
const templateData = {
  productName: greekTranslation.name,
  description: greekTranslation.description,
  specifications: greekSpecs,
  mainImage: imageBuffer,
  // ... more fields
};

// 4. Render template
const doc = new Docxtemplater(template);
doc.render(templateData);

// 5. Generate buffer
const buffer = doc.getZip().generate({ type: 'nodebuffer' });
```

## Greek Labels Reference
All labels in the document are in uppercase Greek without accents (tonal marks):

| English | Greek (Uppercase, No Accents) |
|---------|-------------------------------|
| Product Analysis | ΑΝΑΛΥΣΗ ΠΡΟΪΟΝΤΟΣ |
| Description | ΠΕΡΙΓΡΑΦΗ |
| Brand | ΜΑΡΚΑ |
| Category | ΚΑΤΗΓΟΡΙΑ |
| Dimensions | ΔΙΑΣΤΑΣΕΙΣ |
| Weight | ΒΑΡΟΣ |
| Specifications | ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ |
| Additional Images | ΕΠΙΠΛΕΟΝ ΕΙΚΟΝΕΣ |
| Creation Date | ΗΜΕΡΟΜΗΝΙΑ ΔΗΜΙΟΥΡΓΙΑΣ |

## Template Customization

### Creating a Custom Template

1. **Open the existing template:**
   ```
   open public/templates/product-analysis-template.docx
   ```

2. **Edit in Microsoft Word:**
   - Modify styling, fonts, colors
   - Adjust layout and spacing
   - Add company logo or branding
   - Rearrange sections

3. **Keep placeholders intact:**
   - Do NOT remove or rename placeholders
   - Maintain the exact placeholder syntax: `{placeholderName}`
   - Keep conditional blocks: `{#condition}...{/condition}`
   - Keep loops: `{#items}...{/items}`

4. **Save the template:**
   - Save as `.docx` format
   - Keep the filename: `product-analysis-template.docx`

### Regenerating the Base Template
If you need to regenerate the base template from code:

```bash
npm run tsx scripts/generate-product-template.ts
# or
./node_modules/.bin/tsx scripts/generate-product-template.ts
```

## API Endpoint

### POST `/api/products/[id]/generate-analysis`

**Description:** Generate and download product analysis Word document

**Authentication:** Required (session-based)

**Parameters:**
- `id` (path parameter): Product ID

**Response:**
- Success: Word document file (`.docx`)
- Error: JSON with error message

**Example Usage:**
```typescript
const response = await fetch(`/api/products/${productId}/generate-analysis`, {
  method: 'POST',
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'product-analysis.docx';
  a.click();
}
```

## UI Integration

### Product Detail Page
The "Generate Analysis" button is located in the product detail header, next to other action buttons:

```tsx
<Button
  onClick={handleGenerateAnalysis}
  disabled={generatingAnalysis}
  size="sm"
  variant="default"
>
  {generatingAnalysis ? (
    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <FileDown className="h-4 w-4 mr-2" />
  )}
  {generatingAnalysis ? 'GENERATING...' : 'GENERATE ANALYSIS'}
</Button>
```

**Features:**
- Loading state with spinner
- Disabled during generation
- Toast notifications for success/failure
- Automatic file download

## Data Requirements

### Minimum Required Data
- Product name (default or Greek translation)
- Product ID

### Recommended Data for Complete Document
- Greek translation (name and description)
- Product images (at least one)
- Greek specifications
- Brand information
- Category information
- Dimensions (width, height, length)
- Weight
- Unit of measurement

### Data Fallbacks
If data is missing, the system provides graceful fallbacks:
- No Greek translation → Uses default product name
- No description → Uses placeholder text
- No images → Skips image sections
- No specifications → Skips specifications section
- No brand/category → Hides those sections

## Image Handling

### Image Download
- Images are downloaded from their URLs using `axios`
- Timeout: 10 seconds per image
- Error handling: Failed downloads are skipped
- Supported formats: JPEG, PNG, GIF, WebP

### Image Sizing
- **Main Image:** 400x300 pixels
- **Additional Images:** 200x150 pixels each
- Images are embedded as buffers in the document

### Image Selection
1. **Main Image:**
   - First: Image marked as `isDefault: true`
   - Fallback: First image in the array
   
2. **Additional Images:**
   - Up to 3 images (excluding main image)
   - Ordered by their `order` field

## Error Handling

### Common Errors and Solutions

#### 1. Template Not Found
**Error:** `Template file not found: .../product-analysis-template.docx`

**Solution:**
```bash
# Regenerate the template
./node_modules/.bin/tsx scripts/generate-product-template.ts
```

#### 2. Image Download Failure
**Error:** `Failed to download image from {url}`

**Solution:**
- Check image URL is accessible
- Verify network connectivity
- Check BunnyCDN or image host status
- Images will be skipped if download fails (non-fatal)

#### 3. Invalid Template Syntax
**Error:** `Failed to generate product analysis document: ...`

**Solution:**
- Open the template in Word
- Verify all placeholders have correct syntax
- Check for unmatched conditional blocks
- Ensure all loops are properly closed

#### 4. Missing Greek Translations
**Warning:** Document uses fallback English names

**Solution:**
- Add Greek translations to the product
- Use the product translation feature in the UI
- Or use AI translation API

## Performance Considerations

### Document Generation Time
- **Simple product (no images):** ~200-500ms
- **With main image:** ~1-2 seconds
- **With 3+ images:** ~2-4 seconds

### Optimization Tips
1. **Image Size:** Smaller images download faster
2. **CDN Performance:** Use a fast CDN for images
3. **Template Complexity:** Simpler templates render faster
4. **Database Queries:** Include all needed relations in single query

## Testing

### Manual Testing
1. Navigate to any product detail page
2. Click "Generate Analysis" button
3. Wait for document download
4. Open the downloaded Word document
5. Verify:
   - Product name is in Greek
   - Description is complete
   - Images are embedded correctly
   - Specifications are listed
   - Formatting is professional

### Test Products
Ideal test products should have:
- Greek translations
- Multiple images
- Various specifications
- Brand and category assigned
- Dimensions and weight data

### Edge Cases to Test
- Product with no images
- Product with no Greek translation
- Product with no specifications
- Product with very long descriptions
- Product with special characters in name

## Troubleshooting

### Debug Mode
To enable detailed logging, add to API route:

```typescript
console.log('Product data:', product);
console.log('Template data:', templateData);
console.log('Generated buffer size:', buffer.length);
```

### Common Issues

**Issue:** Document downloads but won't open
- **Cause:** Corrupted buffer or invalid template syntax
- **Fix:** Regenerate template, check template syntax

**Issue:** Images not appearing in document
- **Cause:** Image download failure or invalid image buffer
- **Fix:** Check image URLs, verify image format

**Issue:** Greek characters appear as boxes
- **Cause:** Font not supporting Greek characters
- **Fix:** Change template font to Arial, Calibri, or similar

**Issue:** Placeholders still visible in document
- **Cause:** Placeholder name mismatch
- **Fix:** Verify placeholder names in template match code

## Future Enhancements

### Planned Features
- [ ] Multiple template selection (different styles)
- [ ] PDF export option
- [ ] Bulk document generation (multiple products)
- [ ] Email document directly from the system
- [ ] Custom branding/logo insertion
- [ ] Document versioning and history
- [ ] Template marketplace
- [ ] More language support (English, French, etc.)

### Integration Ideas
- [ ] Auto-generate for new products
- [ ] Schedule periodic document updates
- [ ] Integration with ERP system
- [ ] Customer-facing document portal
- [ ] Document approval workflow

## Support and Maintenance

### Regular Maintenance
- Keep `docxtemplater` and related packages updated
- Review template formatting periodically
- Monitor document generation performance
- Check image download success rates

### Package Versions
```json
{
  "docxtemplater": "^3.x.x",
  "pizzip": "^3.x.x",
  "docxtemplater-image-module-free": "^1.x.x"
}
```

### Getting Help
1. Check this documentation
2. Review template README: `/public/templates/README.md`
3. Check `docxtemplater` documentation: https://docxtemplater.com/
4. Review error logs in Next.js console

## Security Considerations

### Authentication
- All API endpoints require authentication
- Session validation on every request
- User permissions should be checked before generation

### Data Privacy
- Documents contain sensitive product information
- Do not log sensitive data
- Implement rate limiting for document generation
- Consider adding watermarks for draft documents

### File Handling
- Validate file paths to prevent directory traversal
- Sanitize file names to prevent injection
- Limit document file size
- Implement virus scanning for uploaded templates

## Conclusion
The Product Analysis Document Generation System provides a powerful, flexible way to create professional product documentation in Greek. With its template-based approach, it's easy to customize and maintain while providing excellent user experience.

