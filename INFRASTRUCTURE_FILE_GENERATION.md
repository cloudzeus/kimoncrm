# Site Survey File Generation Features

## Overview
This document covers two file generation features in the site survey wizard:
1. **Infrastructure File Generation** (Step 1) - Generates detailed infrastructure reports
2. **BOM File Generation** (Step 2) - Generates Bill of Materials with products and services

Both features automatically upload files to BunnyCDN, link them to the lead, and maintain versioning (up to 10 versions maximum).

---

# 1. Infrastructure File Generation Feature

## Implementation Details

### 1. API Endpoint
**Location:** `/app/api/site-surveys/[id]/generate-infrastructure-file/route.ts`

**Method:** POST

**Request Body:**
```json
{
  "buildings": [
    {
      "name": "Main Building",
      "code": "BLD-01",
      "address": "123 Main St",
      "floors": [...],
      "centralRacks": [...],
      ...
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully generated 1 infrastructure file(s)",
  "files": [
    {
      "buildingName": "Main Building",
      "filename": "LL001 - Infrastructure - Main Building - v2.xlsx",
      "fileId": "clx...",
      "url": "https://...",
      "version": 2
    }
  ],
  "errors": []
}
```

### 2. Versioning Logic

#### File Naming Convention
Files are named using the pattern:
```
{leadNumber} - Infrastructure - {buildingName} - v{version}.xlsx
```

Example: `LL001 - Infrastructure - Main Building - v2.xlsx`

#### Version Management
- **Auto-increment:** Each new generation increments the version number
- **Max versions:** 10 versions per building
- **Auto-cleanup:** When generating an 11th version, the oldest version is automatically deleted
- **Version detection:** Scans existing files to determine the next version number

#### Database Storage
Files are stored in the `File` model with:
- `entityId`: Lead ID (not site survey ID)
- `type`: 'LEAD'
- `name`: Versioned filename
- `url`: BunnyCDN URL
- `description`: Contains building name and version info

### 3. UI Component Changes

**Location:** `/components/site-surveys/wizard-steps/infrastructure-step.tsx`

#### New Button
Added a "Generate Infrastructure File" button in the header section with:
- **Icon:** FileDown icon from lucide-react
- **Loading state:** Shows spinner and "Generating..." text
- **Disabled state:** Disabled when no buildings exist or already generating
- **Position:** First button in the action buttons group

#### User Flow
1. User adds buildings, floors, racks, and rooms in the infrastructure step
2. User clicks "Generate Infrastructure File" button
3. System generates Excel files for all buildings
4. Files are uploaded to BunnyCDN under `leads/{leadId}/infrastructure/`
5. File records are created in the database linked to the lead
6. Success toast shows generated files with version numbers
7. Files are immediately visible in the lead's files tab

### 4. Excel File Structure

The generated Excel file contains 4 tabs:

#### Tab 1: Current Infrastructure
- Building overview
- Central rack details (existing equipment only)
- Floor-by-floor breakdown
- Rooms and existing devices

#### Tab 2: Proposed New Devices
- All proposed new equipment
- Associated products and services
- Location information

#### Tab 3: Pricing
- Products pricing table
- Services pricing table
- Placeholder for unit prices and totals

#### Tab 4: BOM by Brand
- Products grouped by brand
- Services grouped separately
- Location and quantity information

### 5. Integration Points

#### File Storage
- **BunnyCDN Path:** `leads/{leadId}/infrastructure/{timestamp}_{sanitizedFilename}`
- **Database:** Files linked to Lead entity (type: 'LEAD')
- **Visibility:** Files appear in lead files tab automatically

#### Lead Association
- Site survey must be linked to a lead
- Files are linked to the lead (not the site survey)
- Lead number is used in filename for easy identification

### 6. Error Handling

#### Validation
- Checks if site survey exists
- Validates site survey is linked to a lead
- Requires at least one building

#### Partial Success
- If some buildings fail, others still succeed
- Errors are reported in the response
- Success toast shows successful files
- Warning toast shows failed buildings

#### User Feedback
- Success: Shows number of files generated with version numbers
- Error: Shows specific error message
- Partial: Shows both success and warning toasts

## Usage Example

### Step 1: Add Infrastructure
```typescript
// User adds buildings in the UI
const buildings = [
  {
    name: "Main Building",
    code: "BLD-01",
    floors: [
      {
        name: "Ground Floor",
        level: 0,
        racks: [...],
        rooms: [...]
      }
    ],
    centralRacks: [...]
  }
];
```

### Step 2: Generate File
```typescript
// User clicks "Generate Infrastructure File" button
// System makes API call
const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-infrastructure-file`, {
  method: 'POST',
  body: JSON.stringify({ buildings })
});
```

### Step 3: View Files
- Files are automatically linked to the lead
- Visible in lead detail view → Files tab
- Can be downloaded directly from BunnyCDN

## Technical Notes

### Version Detection Algorithm
```typescript
// Extract version numbers from existing files
const versions = existingFiles
  .map(f => {
    const match = f.name.match(/ - v(\d+)\.xlsx$/);
    return match ? parseInt(match[1]) : 0;
  })
  .filter(v => v > 0);

// Calculate next version
const versionNumber = versions.length > 0 
  ? Math.max(...versions) + 1 
  : 1;
```

### Auto-cleanup Logic
```typescript
// Check if we have reached max versions (10)
if (existingFiles.length >= 10) {
  // Delete the oldest version
  const oldestFile = existingFiles[existingFiles.length - 1];
  await prisma.file.delete({
    where: { id: oldestFile.id },
  });
}
```

## Security Considerations

1. **Authentication:** Requires authenticated session
2. **Authorization:** User must have access to the site survey
3. **File naming:** Sanitizes filenames to prevent path traversal
4. **Rate limiting:** Should be implemented at the API gateway level
5. **File size:** Excel generation is memory-efficient using streams

## Future Enhancements

1. **Download history:** Track when files are downloaded
2. **File comparison:** Show differences between versions
3. **Custom templates:** Allow users to customize Excel template
4. **Bulk operations:** Generate files for multiple site surveys
5. **Email notification:** Send files via email when generated
6. **Archive old versions:** Move old versions to archive storage instead of deletion

## Database Schema Reference

### File Model
```prisma
model File {
  id          String   @id @default(cuid())
  entityId    String   // Lead ID
  type        FileEntityType // 'LEAD'
  name        String   // Versioned filename
  filetype    String   // Excel MIME type
  url         String   // BunnyCDN URL
  description String?  // Building name + version info
  size        Int?     // File size in bytes
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([entityId, type])
}
```

### SiteSurvey → Lead Relationship
```prisma
model SiteSurvey {
  id     String  @id @default(cuid())
  leadId String? @unique
  lead   Lead?   @relation(fields: [leadId], references: [id])
  ...
}

model Lead {
  id          String      @id @default(cuid())
  leadNumber  String?     @unique
  siteSurvey  SiteSurvey?
  ...
}
```

## Testing Checklist

- [ ] Generate file with single building
- [ ] Generate file with multiple buildings
- [ ] Verify version increments correctly (v1, v2, v3...)
- [ ] Verify max 10 versions limit
- [ ] Verify old files are deleted when exceeding 10 versions
- [ ] Verify files are linked to lead (not site survey)
- [ ] Verify files appear in lead files tab
- [ ] Verify filename includes lead number
- [ ] Test error handling (no buildings, no lead link, etc.)
- [ ] Test with complex infrastructure (many floors, racks, rooms)
- [ ] Verify BunnyCDN upload works correctly
- [ ] Test loading states in UI
- [ ] Verify toast notifications work correctly

## Support

For issues or questions, refer to:
- `/lib/excel/building-report-excel.ts` - Excel generation logic
- `/lib/bunny/upload.ts` - BunnyCDN upload utilities
- `/app/api/leads/[id]/files/route.ts` - Lead files API reference

---

# 2. BOM (Bill of Materials) File Generation Feature

## Overview
The BOM feature allows users to generate comprehensive Excel files containing all selected products and services from the Equipment Selection step (Step 2) of the site survey wizard.

## Implementation Details

### 1. API Endpoint
**Location:** `/app/api/site-surveys/[id]/generate-bom-file/route.ts`

**Method:** POST

**Request Body:**
```json
{
  "equipment": [
    {
      "id": "eq-1",
      "type": "product",
      "name": "Cisco Catalyst 9300",
      "brand": "CISCO",
      "category": "Network Switch",
      "quantity": 2,
      "price": 2500.00,
      "totalPrice": 5000.00,
      "infrastructureElement": {
        "buildingName": "Main Building",
        "floorName": "Ground Floor",
        "elementName": "Central Rack"
      }
    },
    {
      "id": "eq-2",
      "type": "service",
      "name": "Installation Service",
      "category": "Installation",
      "quantity": 1,
      "price": 500.00,
      "totalPrice": 500.00
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully generated BOM file",
  "file": {
    "filename": "LL001 - BOM - v3.xlsx",
    "fileId": "clx...",
    "url": "https://...",
    "version": 3,
    "productsCount": 15,
    "servicesCount": 5
  }
}
```

### 2. Excel File Structure

The BOM Excel file is organized with multiple tabs:

#### Tab 1: SUMMARY (Always first)
- **Customer Information:** Lead number, customer name, generation date
- **Products Summary:** Table showing each brand with:
  - Brand name
  - Products count
  - Total quantity
  - Total value (€)
- **Services Summary:** Count, quantity, and total value
- **Grand Total:** Overall project value

#### Tab 2-N: One Tab Per Brand (Alphabetically sorted)
Each product brand gets its own tab with:
- **Columns:**
  1. # (Row number)
  2. Product (Name)
  3. Category
  4. Manufacturer Code
  5. EAN Code
  6. Qty (Quantity)
  7. Unit Price (€)
  8. Margin (%)
  9. Total (€)
  10. Location (Building - Floor - Element)
- **Subtotal Row:** Shows total value for that brand
- **Professional Formatting:** Color-coded headers, borders, number formatting

#### Last Tab: SERVICES
- **Columns:**
  1. # (Row number)
  2. Service (Name)
  3. Category
  4. Qty (Quantity)
  5. Unit Price (€)
  6. Margin (%)
  7. Total (€)
  8. Location
- **Subtotal Row:** Shows total services value
- **Green Color Scheme:** Distinguished from product tabs

### 3. Key Features

#### Brand Organization
- **Automatic Grouping:** Products automatically grouped by brand
- **Uppercase Normalization:** Brand names converted to uppercase for consistency
- **Generic Fallback:** Products without brand assigned to "GENERIC" tab
- **Alphabetical Sorting:** Brand tabs sorted alphabetically
- **Sheet Name Sanitization:** Excel-safe names (max 31 chars, no special characters)

#### Versioning Logic (Same as Infrastructure)
- **File Naming:** `{leadNumber} - BOM - v{version}.xlsx`
- **Example:** `LL001 - BOM - v3.xlsx`
- **Auto-increment:** Each generation increments version
- **Max 10 versions:** Oldest deleted when creating 11th
- **Smart Detection:** Scans existing files for next version number

#### Location Tracking
- Products/services linked to infrastructure elements
- Shows: `Building Name - Floor Name - Element Name`
- General items shown as "General" location

### 4. UI Component

**Location:** `/components/site-surveys/wizard-steps/equipment-step.tsx`

#### Button Features
- **Icon:** FileDown icon from lucide-react
- **Text:** "Generate BOM File"
- **Loading State:** Shows spinner and "Generating..." text
- **Disabled When:**
  - No equipment selected
  - Already generating
- **Position:** Next to "Add Equipment" button

#### User Flow
1. User adds products/services in equipment step
2. User clicks "Generate BOM File" button
3. System generates Excel with:
   - Summary tab
   - One tab per brand (alphabetically)
   - Services tab (if services exist)
4. File uploaded to BunnyCDN under `leads/{leadId}/bom/`
5. File record created in database linked to lead
6. Success toast shows filename, version, and counts
7. File immediately visible in lead files tab

### 5. Data Processing

#### Products Processing
```typescript
// Group by brand
const productsByBrand = products.reduce((acc, product) => {
  const brand = (product.brand || 'Generic').trim().toUpperCase();
  if (!acc[brand]) acc[brand] = [];
  acc[brand].push(product);
  return acc;
}, {});

// Sort brands alphabetically
const sortedBrands = Object.keys(productsByBrand).sort();

// Create tab for each brand
sortedBrands.forEach(brand => {
  const sheet = workbook.addWorksheet(sanitizeName(brand));
  // ... populate sheet
});
```

#### Services Processing
```typescript
// Services in separate tab (no brand grouping)
if (services.length > 0) {
  const servicesSheet = workbook.addWorksheet('Services');
  // ... populate with green color scheme
}
```

### 6. Visual Styling

#### Color Scheme
- **Summary Tab:** Dark blue (#1F4E78)
- **Product Tabs:** Teal blue (#2E86AB, #4A90A4)
- **Services Tab:** Green (#16A085, #27AE60)
- **Totals:** Yellow (#FFD966) for products, light green for services
- **Grand Total:** Red (#FF6B6B)

#### Number Formatting
- **Currency:** `€#,##0.00` (e.g., €1,234.56)
- **Percentage:** `0.00"%"` (e.g., 15.50%)
- **Quantity:** Plain integer

#### Cell Styles
- **Headers:** Bold, white text, colored background, centered
- **Data Rows:** Bordered, vertically aligned
- **Subtotals:** Bold, colored background
- **Right-aligned:** Numbers and currency

### 7. Database Storage

Files stored with:
- **entityId:** Lead ID
- **type:** 'LEAD'
- **name:** `{LeadNumber} - BOM - v{version}.xlsx`
- **url:** BunnyCDN URL
- **description:** "Bill of Materials (BOM) - X products, Y services (vZ)"
- **size:** File size in bytes

### 8. Integration Points

#### BunnyCDN
- **Path:** `leads/{leadId}/bom/{timestamp}_{sanitizedFilename}`
- **Example:** `leads/cl123/bom/1704067200000_LL001_-_BOM_-_v3.xlsx`

#### Lead Files
- Automatically appears in lead detail view
- Listed in Files tab
- Can be downloaded directly
- Shows in chronological order with other lead files

### 9. Error Handling

#### Validation Checks
- Site survey exists
- Site survey linked to lead
- Equipment array not empty
- At least one product or service

#### User Feedback
- **Success:** "Successfully generated BOM file" with details
- **Error:** Specific error message with description
- **Empty Equipment:** "Please add at least one product or service"

### 10. Comparison with Infrastructure Feature

| Feature | Infrastructure Files | BOM Files |
|---------|---------------------|-----------|
| **Trigger Step** | Step 1 (Infrastructure) | Step 2 (Equipment) |
| **Input Data** | Buildings, Floors, Racks, Rooms | Products, Services |
| **File Naming** | `{Lead} - Infrastructure - {Building} - v{X}` | `{Lead} - BOM - v{X}` |
| **Tab Structure** | Current + Proposed + Pricing + BOM | Summary + Brands + Services |
| **Multiple Files** | One per building | One file total |
| **Grouping** | By infrastructure element | By brand (products) |
| **BunnyCDN Path** | `leads/{id}/infrastructure/` | `leads/{id}/bom/` |
| **Versioning** | Per building | Per site survey |

## Usage Example

### Step 1: Add Equipment
```typescript
// User adds products
addProduct({
  name: "Cisco Catalyst 9300",
  brand: "CISCO",
  category: "Switch",
  quantity: 2,
  price: 2500,
  totalPrice: 5000
});

addService({
  name: "Installation",
  category: "Service",
  quantity: 1,
  price: 500,
  totalPrice: 500
});
```

### Step 2: Generate BOM
```typescript
// User clicks button
handleGenerateBOMFile();

// API call
const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-bom-file`, {
  method: 'POST',
  body: JSON.stringify({ equipment })
});
```

### Step 3: Result
```
Excel File Generated:
├── SUMMARY
│   ├── Lead: LL001
│   ├── Customer: ABC Corp
│   ├── CISCO: 2 products, 10 qty, €15,000
│   ├── UBIQUITI: 5 products, 25 qty, €8,500
│   ├── Services: 3 services, €2,500
│   └── GRAND TOTAL: €26,000
├── CISCO (Tab)
│   └── Products with details and subtotal
├── UBIQUITI (Tab)
│   └── Products with details and subtotal
└── Services (Tab)
    └── Services with details and subtotal

Uploaded to: https://cdn.example.com/.../LL001_-_BOM_-_v1.xlsx
Linked to Lead: LL001
```

## Testing Checklist (BOM Feature)

- [ ] Generate BOM with products only
- [ ] Generate BOM with services only
- [ ] Generate BOM with both products and services
- [ ] Verify products grouped by brand in separate tabs
- [ ] Verify brand tabs sorted alphabetically
- [ ] Verify brands normalized to uppercase
- [ ] Verify "Generic" tab for products without brand
- [ ] Verify Summary tab shows correct totals
- [ ] Verify version increments correctly (v1, v2, v3...)
- [ ] Verify max 10 versions limit
- [ ] Verify old files deleted when exceeding 10
- [ ] Verify files linked to lead (not site survey)
- [ ] Verify files appear in lead files tab
- [ ] Verify filename includes lead number
- [ ] Test with many brands (10+)
- [ ] Test with long brand names (31+ chars)
- [ ] Test with special characters in brand names
- [ ] Verify location tracking works correctly
- [ ] Verify number formatting (currency, percentages)
- [ ] Test loading states in UI
- [ ] Verify toast notifications with counts

## Technical Notes

### Sheet Name Limitations
Excel has strict sheet name requirements:
- Max 31 characters
- Cannot contain: `\ / ? * [ ]`
- Must be unique within workbook

Solution:
```typescript
const sanitizedBrandName = brand
  .replace(/[\\/?*[\]]/g, '')
  .substring(0, 31);
```

### Brand Normalization
To avoid duplicates like "cisco", "CISCO", "Cisco":
```typescript
const brand = (product.brand || 'Generic').trim().toUpperCase();
```

### Performance Considerations
- Efficient grouping with `reduce()`
- Single pass through equipment array
- Minimal memory footprint with streams
- Fast Excel generation with ExcelJS

## Future Enhancements

1. **Custom Column Selection:** Allow users to choose which columns to include
2. **Pricing Tiers:** Support for different pricing levels
3. **Supplier Information:** Add supplier details per product
4. **Discount Columns:** Add discount percentage and net price
5. **Tax Calculations:** Automatic VAT/tax calculations
6. **Multi-Currency:** Support for different currencies
7. **Comparison Mode:** Compare multiple BOM versions side-by-side
8. **Export to PDF:** Generate PDF version of BOM
9. **Email BOM:** Send BOM directly via email
10. **Print Optimization:** Special formatting for printing

## Summary

Both features (Infrastructure & BOM) provide:
- ✅ **Automatic Excel generation** with professional formatting
- ✅ **BunnyCDN upload** for fast, reliable delivery
- ✅ **Lead integration** - files appear in lead files
- ✅ **Versioning** with auto-cleanup (max 10 versions)
- ✅ **Smart organization** - by building or by brand
- ✅ **User-friendly UI** with loading states and feedback
- ✅ **Error handling** with detailed messages
- ✅ **Consistent file naming** with lead numbers

These features streamline the site survey process and provide professional deliverables for customers.

