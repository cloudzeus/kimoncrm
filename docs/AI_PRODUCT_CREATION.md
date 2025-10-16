# AI-Powered Product Creation System

## Overview
A comprehensive AI-powered system for creating products using DeepSeek and OpenAI to automatically research and populate all product information including specifications, translations, and ERP codes.

## Features

### 1. AI Product Research
- **DeepSeek Integration**: Comprehensive product research including technical specifications
- **OpenAI Integration**: High-quality multilingual translations
- **Automatic Code Discovery**: Finds EAN codes and manufacturer codes
- **Dimension Extraction**: Automatically extracts width, length, height, and weight
- **Smart Brand Detection**: Automatically identifies and matches brand from your database
- **Manufacturer Matching**: Automatically identifies and matches manufacturer from your database
- **Category Matching**: Automatically suggests appropriate category from existing categories
- **Zero Manual Input**: Just enter product name, AI handles the rest

### 2. Duplicate Detection
- Checks for existing products by EAN code
- Checks for existing products by Manufacturer code
- Prevents duplicate entries in both database and ERP
- Shows existing product details when duplicate found

### 3. ERP Code Generation
- Format: `CATEGORY.MANUFACTURER.XXXXX`
- Example: `7.124.00001`
- Automatically increments sequence number (00001 to 99999)
- Zero-padded to 5 digits
- Generated per category-manufacturer combination
- Independent counter for each category-manufacturer pair

### 4. Product Creation Workflow

#### Option A: Quick Create (with ERP)
1. Enter product name and select brand
2. Click "Get Info from AI" button
3. AI researches product information
4. Review AI-generated data in modal
5. Check "Insert to ERP" checkbox
6. Click "CREATE PRODUCT NOW"
7. Product is created with specifications, translations, and ERP code

#### Option B: Manual Review
1. Enter product name and select brand
2. Click "Get Info from AI" button
3. Review AI-generated data
4. Click "APPLY TO FORM"
5. Edit fields as needed
6. Click "Create" to save

## File Structure

### AI Services
- **`lib/ai/product-research.ts`**: Main AI research service
  - `researchProductInformation()`: Coordinates AI research
  - `buildProductResearchPrompt()`: Creates prompt for DeepSeek
  - `buildTranslationPrompt()`: Creates prompt for OpenAI
  - `insertProductToERP()`: Handles ERP insertion

### SoftOne ERP Integration
- **`lib/softone/insert-product.ts`**: ERP product insertion
  - `generateProductCode()`: Generates next available code
  - `checkProductDuplicate()`: Checks for existing products
  - `insertProductToSoftOne()`: Inserts product to ERP

### API Endpoints

#### `/api/products/ai-research` (POST)
Research product information using AI.

**Request:**
```json
{
  "name": "Product Name",
  "eanCode": "1234567890123",
  "brand": "Brand Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Product Name",
    "manufacturerCode": "MODEL-123",
    "eanCode": "1234567890123",
    "width": 25.5,
    "length": 30.2,
    "height": 5.1,
    "weight": 1.2,
    "specifications": [...],
    "translations": [...],
    "suggestedCategoryId": "cat-id",
    "suggestedManufacturerId": "mfr-id"
  }
}
```

#### `/api/products/check-duplicate` (POST)
Check if product already exists.

**Request:**
```json
{
  "eanCode": "1234567890123",
  "manufacturerCode": "MODEL-123"
}
```

**Response:**
```json
{
  "success": true,
  "isDuplicate": true,
  "existingProduct": {
    "id": "prod-id",
    "name": "Existing Product",
    "code1": "1234567890123",
    "code2": "MODEL-123"
  }
}
```

#### `/api/products/create-with-ai` (POST)
Create product with AI-generated data.

**Request:**
```json
{
  "productData": {
    "name": "Product Name",
    "code1": "1234567890123",
    "code2": "MODEL-123",
    "brandId": "brand-id",
    "categoryId": "cat-id",
    "manufacturerId": "mfr-id",
    "unitId": "unit-id",
    "width": 25.5,
    "length": 30.2,
    "height": 5.1,
    "weight": 1.2,
    "isActive": true
  },
  "aiData": {
    "specifications": [...],
    "translations": [...]
  },
  "insertToERP": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {...},
  "erpInserted": true,
  "generatedCode": "101.25.00001",
  "message": "Product created and inserted to ERP successfully"
}
```

#### `/api/products/[id]/translations/[translationId]` (PUT)
Update a specific product translation.

**Request:**
```json
{
  "name": "Updated Name",
  "shortDescription": "Updated short description",
  "description": "Updated full description"
}
```

## UI Components

### Product Form Dialog (`components/products/product-form-dialog.tsx`)
Enhanced with AI research functionality:
- "Get Info from AI" button (requires name and brand)
- Shows researching state while AI works
- Opens AI results modal when complete
- Three action options:
  1. Discard results
  2. Apply to form (for manual editing)
  3. Create product now (direct creation with optional ERP)

### AI Results Modal
Displays comprehensive AI research results:
- **Basic Information**: Product name, EAN, manufacturer code
- **Dimensions & Weight**: Width, length, height, weight
- **Specifications**: Technical specifications with translations
- **Translations**: English and Greek translations
- **ERP Option**: Checkbox to insert to ERP with auto-generated code

### Product Detail Client (`components/products/product-detail-client.tsx`)
Added translation editing:
- Edit icon button on each translation card
- Modal for editing name, short description, description
- Updates translations in real-time

## Code Generation Logic

### Format
`CATEGORY_CODE.MANUFACTURER_CODE.SEQUENCE`

### Examples
- `7.124.00001` - First product in category 7, manufacturer 124
- `7.124.00002` - Second product in same category/manufacturer
- `200.13.00001` - First product in category 200, manufacturer 13

### Sequence Rules
- Starts at 00001
- Increments per category-manufacturer combination
- Zero-padded to 5 digits (00001-99999)
- Independent sequences for each category-manufacturer pair

## AI Prompt Engineering

### DeepSeek (Product Research)
- Focuses on technical specifications
- Extracts accurate measurements
- Finds product codes (EAN, manufacturer)
- Matches to existing categories and manufacturers
- Returns structured JSON

### OpenAI (Translations)
- Generates technical descriptions (not marketing)
- Greek translations:
  - Names: UPPERCASE
  - Descriptions: Normal text (no uppercase)
  - Removes ALL accent marks/tones
- English translations preserve original formatting
- Both short and detailed descriptions

## Security

- **Authentication**: Requires ADMIN or MANAGER role
- **Session Validation**: All API endpoints check session
- **Duplicate Prevention**: Checks before creating
- **ERP Validation**: Validates all required fields before insertion

## Error Handling

### Duplicate Detection
- Shows clear error message with existing product details
- Prevents both database and ERP duplicates

### Missing Required Fields
- Validates brand, category, manufacturer, unit
- Clear error messages for missing data

### AI Failures
- Graceful degradation if AI service fails
- User can still create products manually

### ERP Errors
- Catches ERP insertion failures
- Returns detailed error messages
- Allows retry or manual creation

## Best Practices

1. **Always provide brand and name**: Required for AI research
2. **Review AI results**: Check specifications and translations for accuracy
3. **Use ERP insertion**: Ensures consistent code generation
4. **Check for duplicates**: System checks automatically, but verify manually if unsure
5. **Edit after creation**: Translations can be edited after product creation

## Environment Variables Required

```env
DEEPSEEK_API_KEY=your-deepseek-api-key
OPENAI_API_KEY=your-openai-api-key
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_COMPANY=1000
```

## Future Enhancements

- [ ] Image search integration
- [ ] Price suggestion based on similar products
- [ ] Competitor price comparison
- [ ] Automatic datasheet PDF parsing
- [ ] Bulk AI product creation from CSV
- [ ] AI-powered product recommendations
- [ ] Automatic category prediction using ML
