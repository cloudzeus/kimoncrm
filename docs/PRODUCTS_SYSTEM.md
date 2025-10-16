# Products System Documentation

## Overview

The Products system provides comprehensive product management with full SoftOne ERP integration. It includes bidirectional sync capabilities, automatic cron jobs, and a modern UI for managing products.

## Features

### 1. Database Schema

#### Product Model
- **SoftOne Fields**:
  - `mtrl`: SoftOne product ID (unique)
  - `code`, `code1`, `code2`: Product codes
  - `name`: Product name (Greek)
  - `mtrmark`: Brand code (links to Brand.code)
  - `mtrmanfctr`: Manufacturer code (links to Manufacturer.softoneCode)
  - `mtrcategory`: Category code
  - `isActive`: Active status

- **Pricing**:
  - `cost`: Purchase cost
  - `pricew`: Wholesale price (from SoftOne)
  - `pricer`: Retail price (from SoftOne)
  - `manualB2BPrice`: Manual B2B override
  - `manualRetailPrice`: Manual retail override

- **Dimensions**:
  - `width`, `length`, `height`: In centimeters
  - `weight`: In kilograms

- **Multilingual Support**:
  - `ProductTranslation` model for name and description in multiple languages
  - Supports Greek, English, and other configured languages

- **ERP Sync Tracking**:
  - `syncedToErp`: Boolean flag
  - `lastSyncAt`: Last sync timestamp

### 2. SoftOne ERP Integration

#### API Endpoints

##### Fetch All Products
- **URL**: `https://aic.oncloud.gr/s1services/JS/webservice.items/getProductsAll`
- **Method**: POST
- **Purpose**: Initial bulk sync of all products
- **Auth**: Username/Password/Company

##### Fetch Updated Products
- **URL**: `https://aic.oncloud.gr/s1services/JS/webservice.items/getProductsUpdated`
- **Method**: POST
- **Purpose**: Incremental sync (15-minute window)
- **Auth**: Username/Password/Company/SodType

##### Update Product
- **URL**: `https://aic.oncloud.gr/s1services/JS/webservice.items/updateItem`
- **Method**: POST
- **Purpose**: Update existing product in ERP
- **Requirements**: 
  - Product must have `mtrl` value
  - Product must be `isActive = 1`

##### Create Product
- **URL**: `https://aic.oncloud.gr/s1services/JS/webservice.items/createNewItem`
- **Method**: POST
- **Purpose**: Create new product in ERP
- **Requirements**: Code and Name are mandatory

#### Encoding Handling
All SoftOne responses use **ANSI 1253** (Windows-1253) encoding and are converted to UTF-8 using:
```typescript
import * as iconv from 'iconv-lite';

const arrayBuffer = await response.arrayBuffer();
const decodedText = iconv.decode(Buffer.from(new Uint8Array(arrayBuffer)), 'win1253');
```

### 3. Cron Jobs

#### Product Sync Cron
- **Schedule**: Every 15 minutes
- **Route**: `/api/cron/sync-products`
- **Function**: Automatically syncs updated products from SoftOne
- **Authentication**: Requires `CRON_SECRET` in Authorization header
- **Registered in**: `lib/jobs/cron-scheduler.ts`

### 4. API Routes

#### GET /api/products
List all products with filtering and pagination
- **Query Params**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50)
  - `search`: Search in name, code, mtrl
  - `isActive`: Filter by active status
  - `brandId`: Filter by brand
  - `manufacturerId`: Filter by manufacturer
  - `categoryId`: Filter by category

#### POST /api/products
Create a new product
- **Body**: Product data including all fields
- **Special Field**: `syncToErp` (boolean) - If true, creates product in ERP immediately

#### GET /api/products/[id]
Get product details by ID
- **Includes**: All relations (brand, manufacturer, category, etc.)

#### PUT /api/products/[id]
Update product by ID
- **Body**: Partial product data
- **Note**: Does not auto-sync to ERP (use sync-to-erp endpoint)

#### DELETE /api/products/[id]
Delete product (Admin only)
- **Cascade**: Deletes translations automatically

#### POST /api/products/[id]/sync-to-erp
Sync individual product to ERP
- **Behavior**:
  - If product has `mtrl` and is active: Updates in ERP
  - If product has no `mtrl`: Creates new in ERP
  - Cannot sync inactive products with existing ERP record

#### POST /api/products/sync-all
Full sync from ERP (Admin only)
- **Purpose**: Initial data load or full resync
- **Process**: Fetches all products and upserts in batches of 100

### 5. User Interface

#### Products Page
- **Route**: `/app/(main)/products/page.tsx`
- **Access**: Admin, Manager, Employee roles
- **Features**:
  - Search and filter products
  - Bulk selection with checkboxes
  - Bulk sync to ERP
  - Create, edit, delete products
  - Visual ERP sync status badges

#### Product Form Dialog
- **Tabbed Interface**:
  1. **Basic**: Codes, names, descriptions, active status
  2. **Pricing**: Cost, wholesale, retail, manual prices
  3. **Dimensions**: Width, length, height, weight
  4. **Relations**: Brand, manufacturer, category, unit, country, VAT rate

- **Features**:
  - Uppercase Greek text (memory preference applied)
  - ERP sync checkbox for new products
  - Combobox selectors for relations
  - Real-time validation

#### Table Features
- **Resizable Columns**: Drag column borders to resize (saves to localStorage)
- **Column Visibility**: Toggle which columns to display via settings button
- **Sorting**: Click column headers to sort (ascending/descending)
  - Sortable: Code, EAN, Mfr Code, Name, Brand, Manufacturer, Category, Dimensions, Status, Created
- **Advanced Search**: Search by specific fields or all fields
  - All Fields (default)
  - Name
  - ERP Code
  - EAN Code
  - Manufacturer Code
  - Brand
  - Category
- **Status Filter**: All / Active / Inactive
- **Results Counter**: Shows "Showing X of Y products"
- **Pagination**: Navigate through large datasets
- **Persistent Settings**: Column widths and visibility saved to localStorage
- **Status Badges**: ACTIVE/INACTIVE with color coding
- **Actions Dropdown**: Edit, Translations, Delete

### 6. Brand & Manufacturer Integration

#### Brand Integration
The user specified using brands with:
- `Brand.name` as the label
- `Brand.code` as `mtrmark` (SoftOne brand code)

When creating/updating products:
```typescript
// Brand code is automatically mapped to mtrmark
if (brandId) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { code: true },
  });
  mtrmark = brand?.code;
}
```

#### Manufacturer Integration
The product form uses manufacturers with:
- `Manufacturer.code` as the value (not ID)
- `Manufacturer.name` as the label

When creating/updating products:
```typescript
// Manufacturer code is used to look up and link manufacturer
if (manufacturerCode) {
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { code: manufacturerCode },
    select: { id: true, code: true },
  });
  manufacturerId = manufacturer?.id;
  mtrmanfctr = manufacturer?.code;
}
```

This ensures:
- Form displays manufacturer name (user-friendly)
- Database stores manufacturer code (mtrmanfctr) for ERP sync
- Proper foreign key relationship (manufacturerId) maintained

### 7. Environment Variables

Add to `.env`:
```env
# SoftOne API Credentials
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_COMPANY=1000

# Cron Job Security
CRON_SECRET=your-secret-key-here
```

## Data Flow

### Inbound Sync (ERP → CRM)

1. **Initial Sync**: Admin triggers full sync via UI
2. **Incremental Sync**: Cron job runs every 15 minutes
3. **Mapping**: SoftOne fields mapped to Prisma model
4. **Relations**: Brand and manufacturer linked by code
5. **Upsert**: Products created or updated based on `mtrl`

### Outbound Sync (CRM → ERP)

1. **New Product**: User creates product with "Sync to ERP" checkbox
2. **Manual Sync**: User clicks sync button for existing products
3. **Validation**: Checks for required fields and active status
4. **API Call**: Creates or updates in SoftOne
5. **Update Local**: Stores `mtrl` and sync timestamp

## User Preferences Applied

Based on user memories:

1. **ANSI 1253 Encoding**: Using iconv-lite with ArrayBuffer approach [[memory:7208361]]
2. **Uppercase Greek Text**: All Greek text fields converted to uppercase without tones [[memory:7208358]]
3. **Server-Side Operations**: All CRUD operations use server-side code [[memory:5079569]]
4. **Bulk Imports**: Using batch processing (100 items) for database operations [[memory:5079579]]
5. **Modern UI/UX**: Shadcn components with checkboxes, shadows instead of borders [[memory:5079581]]
6. **DB Push**: Using `prisma db push` instead of migrations [[user rule]]

## Testing

### Test Initial Sync
```bash
# Trigger full sync (requires admin user)
POST /api/products/sync-all
```

### Test Incremental Sync
```bash
# Manually trigger cron job
POST /api/cron/sync-products
Authorization: Bearer YOUR_CRON_SECRET
```

### Test Product Creation with ERP Sync
```bash
POST /api/products
{
  "code": "TEST001",
  "name": "TEST PRODUCT",
  "syncToErp": true
}
```

## Troubleshooting

### Encoding Issues
If Greek characters appear garbled:
- Verify `iconv-lite` is installed: `npm install iconv-lite`
- Check that ArrayBuffer conversion is working
- Confirm SoftOne is sending Windows-1253 encoding

### Cron Job Not Running
- Verify `lib/jobs/cron-scheduler.ts` is imported in app initialization
- Check `CRON_SECRET` is set in environment
- Review server logs for cron execution

### Brand/Manufacturer Not Linking
- Ensure `Brand.code` matches SoftOne `MTRMARK`
- Ensure `Manufacturer.softoneCode` matches SoftOne `MTRMANFCTR`
- Check that master data has been synced first

## Future Enhancements

Potential improvements:
1. Product image management via BunnyCDN
2. Inventory level sync from SoftOne
3. Price history tracking
4. Excel import/export for bulk updates
5. Advanced filtering (price range, dimensions)
6. Product duplicate detection
7. Multi-warehouse inventory management

## File Structure

```
/Volumes/EXTERNALSSD/kimoncrm/
├── lib/softone/
│   └── products.ts                           # SoftOne API integration
├── app/api/
│   ├── products/
│   │   ├── route.ts                          # List & Create
│   │   ├── [id]/route.ts                     # Get, Update, Delete
│   │   ├── [id]/sync-to-erp/route.ts         # Sync to ERP
│   │   └── sync-all/route.ts                 # Full sync
│   └── cron/
│       └── sync-products/route.ts            # Cron job
├── app/(main)/products/
│   └── page.tsx                              # Products page
├── components/products/
│   ├── products-manager.tsx                  # Main table component
│   └── product-form-dialog.tsx               # Create/Edit form
├── prisma/
│   └── schema.prisma                         # Product & ProductTranslation models
└── lib/jobs/
    └── cron-scheduler.ts                     # Cron registration
```

## Related Documentation

- [SUPPLIERS_SYSTEM.md](./SUPPLIERS_SYSTEM.md) - Similar pattern for suppliers
- [CUSTOMERS_SYSTEM.md](./CUSTOMERS_SYSTEM.md) - Customer ERP integration
- [CUSTOMER_SYNC_CRON.md](./CUSTOMER_SYNC_CRON.md) - Cron job patterns

---

**Last Updated**: October 12, 2025
**Version**: 1.0.0
**Author**: Kimon CRM Development Team

