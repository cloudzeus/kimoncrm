# Product ERP Integration - Complete Guide

## Overview
Complete integration between our product database and SoftOne ERP system with AI-powered product creation.

## Current Status

### ✅ What's Working
1. **AI Product Research** - DeepSeek researches product info
2. **Greek Translations** - Proper Greek characters (Α-Ω, α-ω)
3. **Duplicate Detection** - Checks EAN and Manufacturer codes
4. **Code Generation** - Format: `CATEGORY.MANUFACTURER.XXXXX`
5. **Database Storage** - Saves products with specs and translations
6. **Specification Edit/Delete** - Full CRUD on specs

### ⚠️ Issues Being Debugged
1. **ERP Insertion** - createNewItem endpoint
2. **Code/MTRL Update** - After ERP insertion

## Product Creation Flow

### Option 1: AI Product Creation (New Products)

```
1. User enters product name in form
2. Clicks "Get Info from AI"
3. DeepSeek researches:
   - Product details
   - EAN code
   - Manufacturer code
   - Dimensions & weight
   - Technical specifications (10+)
   - Translations (EN & EL with proper Greek)
   - Suggested brand, category, manufacturer

4. User reviews AI results in modal
5. User checks "Insert to ERP" checkbox
6. Clicks "CREATE PRODUCT NOW"

7. Backend Flow:
   a) Check for duplicates (EAN/Mfr code)
   b) Save to DB: product + specs + translations
   c) If ERP checked:
      - Generate code from DB counter
      - Verify code available in ERP
      - Insert to ERP via createNewItem
      - Get MTRL from response
      - Update DB with code + MTRL

8. Result: Product in both systems ✓
```

### Option 2: Add Existing Product to ERP

```
1. User creates product manually (without ERP)
2. Product saved to DB with all data
3. User opens product detail page
4. Clicks "ADD TO ERP" button (shows if no MTRL)
5. System:
   - Generates code
   - Inserts to ERP
   - Updates product with code + MTRL
```

## Code Generation Logic

### Format
`CATEGORY.MANUFACTURER.XXXXX`

### Process
1. Query our DB for highest code with prefix
2. Increment counter (+1)
3. Verify code available in ERP
4. If exists, increment and try again
5. Return first available code

### Examples
```
Category: 7, Manufacturer: 124
Existing: 7.124.00015

Generated: 7.124.00016
```

## SoftOne ERP API

### Endpoint
```
POST https://aic.oncloud.gr/s1services/JS/webservice.items/createNewItem
```

### Required Payload
```json
{
  "username": "Service",
  "password": "Service",
  "company": 1000,
  "code": "7.124.00001",
  "name": "PRODUCT NAME",
  "MTRUNIT1": 101,
  "VAT": 1410,
  "PRICER": 0,
  "REMARKS": "Created via AI Product Research"
}
```

### Optional Fields
```json
{
  "CODE1": "EAN code",
  "CODE2": "Manufacturer code",
  "MTRMARK": 113,           // Brand ID (number)
  "MTRCATEGORY": 7,         // Category code (number)
  "MTRMANFCTR": "124",      // Manufacturer code (string)
  "DIM1": "24.5",           // Width in cm
  "DIM2": "21.5",           // Length in cm
  "DIM3": "7.5",            // Height in cm
  "WEIGHT": "1.4",          // Weight in kg
  "ISACTIVE": "1"           // Active status
}
```

### Response
```json
{
  "success": true,
  "errorcode": 200,
  "error": "No Errors",
  "MTRL": 14256,
  "result": {
    "COMPANY": "1000",
    "MTRL": "14256",
    "CODE": "7.124.00001",
    ...
  }
}
```

## Database Schema

### Product Model
```prisma
model Product {
  id              String   @id @default(cuid())
  mtrl            String?  // SoftOne ERP ID
  code            String?  // Generated: CATEGORY.MANUFACTURER.XXXXX
  code1           String?  // EAN code
  code2           String?  // Manufacturer code
  name            String
  
  brandId         String
  categoryId      String
  manufacturerId  String?
  unitId          String?
  
  width           Decimal?
  length          Decimal?
  height          Decimal?
  weight          Decimal?
  
  isActive        Boolean  @default(true)
  
  brand           Brand     @relation(...)
  category        Category  @relation(...)
  manufacturer    Manufacturer? @relation(...)
  unit            Unit?     @relation(...)
  
  translations    ProductTranslation[]
  images          ProductImage[]
  specifications  ProductSpec[]
  stock           ProductStock[]
}
```

## Field Mapping

| Database | SoftOne | Type | Notes |
|----------|---------|------|-------|
| `name` | `name` | string | Product name |
| `code` | `code` | string | Generated code |
| `code1` | `CODE1` | string | EAN |
| `code2` | `CODE2` | string | Mfr code |
| `mtrl` | `MTRL` | string | ERP ID |
| `brandId` | `MTRMARK` | number | Brand ID |
| `categoryId` | `MTRCATEGORY` | number | Category code |
| `manufacturerId` | `MTRMANFCTR` | string | Mfr code |
| `unitId` | `MTRUNIT1` | number | Unit code (101) |
| `width` | `DIM1` | string | cm |
| `length` | `DIM2` | string | cm |
| `height` | `DIM3` | string | cm |
| `weight` | `WEIGHT` | string | kg |
| `isActive` | `ISACTIVE` | string | "1"/"0" |
| - | `VAT` | number | 1410 (fixed) |
| - | `PRICER` | number | 0 (default) |

## AI Translation Rules

### DeepSeek Prompt Requirements

**Greek (el) - CRITICAL:**
- ✅ Use Greek alphabet: Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω
- ✅ Names: UPPERCASE (ΓΙΑΛΙΝΚ T48U)
- ✅ Descriptions: Normal text (Το προιον...)
- ✅ NO accents/tones (ά→α, έ→ε, ή→η)
- ❌ NEVER use Latin (a, b, g, d, e, z)

**English (en):**
- Names: UPPERCASE
- Descriptions: Normal capitalization
- Technical language only

## Debugging Steps

### Check Console Logs
```bash
# Look for these logs:
🔍 Starting code search from... # Code generation start
✅ Found available code: ...    # Code available
🔢 Generated available product code: ... # Final code
🏷️ Brand ID: ... → Numeric: ... # Brand ID conversion
🔄 Full payload to SoftOne ERP: ... # Complete payload
📥 SoftOne ERP Response: ...    # ERP response
✅ Product inserted to SoftOne ERP successfully # Success
```

### Common Issues

**Issue 1: MTRMARK is NaN**
- Cause: Brand ID is CUID, not number
- Fix: Extract numeric part or hash the ID

**Issue 2: Greek is Latin characters**
- Cause: AI using transliteration
- Fix: Enhanced prompt with examples

**Issue 3: specValue error**
- Cause: Wrong Prisma schema structure
- Fix: Put specValue in translations, not spec

**Issue 4: MTRL type error**
- Cause: Trying to save int to string field
- Fix: Save product first, then update with MTRL

**Issue 5: NAME/CODE undefined**
- Cause: Lowercase keys (name/code)
- Fix: Use uppercase (NAME/CODE)

## Files Created

### Core Logic
- `lib/softone/insert-product.ts` - ERP insertion
- `lib/softone/check-code.ts` - Code generation & verification
- `lib/softone/product-mapping.ts` - Bidirectional mapping
- `lib/ai/product-research.ts` - AI research (DeepSeek only)

### API Endpoints
- `app/api/products/ai-research/route.ts` - AI research
- `app/api/products/check-duplicate/route.ts` - Duplicate check
- `app/api/products/create-with-ai/route.ts` - Create with AI
- `app/api/products/[id]/add-to-erp/route.ts` - Add existing to ERP
- `app/api/products/[id]/translations/[translationId]/route.ts` - Edit translation
- `app/api/products/[id]/specifications/[specId]/route.ts` - Edit/delete spec

### UI Components
- `components/products/product-form-dialog.tsx` - AI research UI
- `components/products/product-detail-client.tsx` - Detail page with edit buttons

## Next Steps

1. Test ERP insertion with logging
2. Verify code generation works
3. Confirm MTRL update
4. Test add existing product to ERP
5. Test specification edit/delete
6. Test translation edit

## Environment Variables

```env
DEEPSEEK_API_KEY=your-key-here
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_COMPANY=1000
```
