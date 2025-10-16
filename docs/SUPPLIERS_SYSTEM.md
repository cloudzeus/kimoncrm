# Suppliers System Documentation

## Overview

The Suppliers system is a complete module that mirrors the Customers functionality, allowing you to manage supplier data and automatically sync with SoftOne ERP. The system includes full CRUD operations, automatic cron-based synchronization, and a comprehensive UI.

## Implementation Summary

### ✅ Database Schema

**New Prisma Models**:
- `Supplier` - Main supplier model (identical fields to Customer)
- `SupplierActiveStatus` - Enum for active/inactive status

**Fields**:
- `id` - Unique identifier (cuid)
- `trdr` - SoftOne TRDR number
- `code` - Supplier code
- `afm` - Tax ID (Greek VAT number)
- `name` - Supplier name
- `sotitle` - Alternative title
- `jobtypetrd` - Job type
- `address` - Street address
- `city` - City
- `zip` - Postal code
- `district` - District/region
- `country` - Country (references Country.softoneCode)
- `isactive` - Active status (ACTIVE/INACTIVE)
- `erp` - Synced to ERP flag
- `phone01` - Primary phone
- `phone02` - Secondary phone
- `email` - Email address
- `emailacc` - Accounting email
- `irsdata` - IRS data
- `socurrency` - Currency ID
- `update` - Last update timestamp
- `createdAt` - Creation timestamp

### ✅ API Endpoints

#### 1. `/api/suppliers` (GET/POST)
- **GET**: Fetch all suppliers with pagination and search
  - Query params: `page`, `limit`, `search`, `searchField`
  - Returns: Suppliers list with pagination metadata
- **POST**: Create new supplier
  - Body: Supplier data
  - Optional: `syncToERP` flag to sync with SoftOne

#### 2. `/api/suppliers/[id]` (GET/PATCH/DELETE)
- **GET**: Fetch single supplier by ID
- **PATCH**: Update supplier (auto-syncs to ERP if `erp=true`)
- **DELETE**: Delete supplier

#### 3. `/api/suppliers/sync-softone` (POST/GET)
- **POST**: Manual sync from SoftOne ERP
  - Query param: `?delta=true` for incremental sync
  - Uses `sodtype: 12` for suppliers
- **GET**: Get sync status

#### 4. `/api/cron/sync-suppliers` (POST/GET)
- Cron job endpoint for automatic supplier sync
- Uses delta sync (only updated/new suppliers)
- Secured with optional `CRON_SECRET`

### ✅ Cron Job Scheduler

**Schedule**: Every 10 minutes (`*/10 * * * *`)

The cron scheduler now manages two sync jobs:
1. Customer sync - Every 10 minutes
2. Supplier sync - Every 10 minutes

Console output:
```
✅ Cron job scheduler initialized
   - Customer sync: Every 10 minutes
   - Supplier sync: Every 10 minutes
```

### ✅ Frontend Components

#### 1. `/app/(main)/suppliers/page.tsx`
Main suppliers page with:
- Page title: "SUPPLIERS"
- Loading skeleton
- Suspense boundary

#### 2. `/components/suppliers/suppliers-manager.tsx`
Main management component with:
- Data table with resizable columns
- Search functionality (all fields or specific field)
- Pagination controls
- Column visibility toggle
- Excel export functionality
- Create/Edit/Delete operations
- Sync from ERP button
- View supplier details
- Update from AFM (tax registry)

#### 3. `/components/suppliers/supplier-form-dialog.tsx`
Form dialog for creating/editing suppliers with:
- All supplier fields
- Validation
- Optional ERP sync on create/update
- Country selection
- Status toggle

#### 4. `/components/suppliers/supplier-detail-view.tsx`
Detailed supplier view with:
- All supplier information
- ERP sync status
- Edit and delete actions
- Update from AFM functionality

## SoftOne ERP Integration

### Endpoint Configuration

**Base URL**: `https://aic.oncloud.gr/s1services/JS/webservice.customers/`

**Methods**:
1. `getCustomers` - Fetch all suppliers (manual full sync)
   - POST body includes `sodtype: 12` (for suppliers vs. customers which use `sodtype: 13`)
2. `getRecentSuppliers` - Fetch recently updated/created suppliers (cron job)
   - Endpoint: [`https://aic.oncloud.gr/s1services/JS/webservice.customers/getRecentSuppliers`](https://aic.oncloud.gr/s1services/JS/webservice.customers/getRecentSuppliers)
   - Returns only suppliers modified in the last 10 minutes
   - Optimized for automatic cron sync
3. `createNewSupplier` - Create new supplier
   - Endpoint: [`https://aic.oncloud.gr/s1services/JS/webservice.customers/createNewSupplier`](https://aic.oncloud.gr/s1services/JS/webservice.customers/createNewSupplier)
   - Requires many fields (name, code, afm, country, socurrency, etc.)
4. `updateSupplier` - Update existing supplier
   - Endpoint: [`https://aic.oncloud.gr/s1services/JS/webservice.customers/updateSupplier`](https://aic.oncloud.gr/s1services/JS/webservice.customers/updateSupplier)
   - Requires `trdr` (SoftOne ID) + fields to update

### Sync Strategy

**Delta Sync** (Cron Job):
- Runs every 10 minutes
- Uses dedicated `getRecentSuppliers` endpoint
- ERP returns only suppliers updated/created in the last 10 minutes
- If `total === 0`, skips processing
- Processes all suppliers in the result array
- No need for `sodtype` parameter (endpoint is supplier-specific)

**Full Sync** (Manual):
- Available via "Sync from ERP" button
- Uses `getCustomers` with `sodtype: 12`
- Fetches all suppliers from ERP
- Can be filtered with `?delta=true` for incremental

### Encoding

The system handles ANSI 1253 (win1253) encoding from SoftOne:
```typescript
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const decodedText = iconv.decode(buffer, "win1253");
const data = JSON.parse(decodedText);
```

## Usage

### 1. Access the Suppliers Page

Navigate to: `/suppliers`

### 2. Sync from ERP (Initial Load)

Click the "Sync from ERP" button to fetch all suppliers from SoftOne.

### 3. Automatic Sync

The cron job will automatically sync new/updated suppliers every 10 minutes.

### 4. Search Suppliers

Use the search bar to find suppliers by:
- All fields (default)
- Specific field (name, AFM, code, email, phone, city)

### 5. Create New Supplier

Click "Add Supplier" button and fill in the form.
- Optional: Check "Sync to ERP" to create in SoftOne

### 6. Edit Supplier

Click the actions menu (⋮) and select "Edit".
- If synced to ERP (`erp: true`), changes will automatically sync to SoftOne

### 7. View Supplier Details

Click the actions menu (⋮) and select "View Details".

### 8. Update from AFM

For suppliers with a valid AFM (Greek tax ID), click "Update from AFM" to fetch data from the Greek tax registry.

### 9. Export to Excel

Click the "Export" button to download all suppliers as an Excel file.

### 10. Customize Table

- **Resize columns**: Drag column borders
- **Hide/show columns**: Click the settings icon
- **Adjust page size**: 25, 50, 100, or 200 records per page

## Environment Variables

Required in `.env`:

```env
# SoftOne ERP Credentials
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_COMPANY=1000

# App URL (for cron jobs)
NEXT_PUBLIC_APP_URL=https://your-domain.com
# or
APP_URL=http://localhost:3000

# Optional: Cron job security
CRON_SECRET=your-secure-secret-here
```

## Differences from Customers

The Suppliers module is identical to Customers with these key differences:

1. **SoftOne sodtype**: `12` (suppliers) vs. `13` (customers)
2. **Database table**: `Supplier` vs. `Customer`
3. **API routes**: `/api/suppliers/...` vs. `/api/customers/...`
4. **Components**: `suppliers-*` vs. `customers-*`
5. **UI labels**: "SUPPLIERS" vs. "CUSTOMERS"

## API Response Examples

### Successful Sync with Updates

```json
{
  "success": true,
  "total": 5,
  "processed": 5,
  "created": 2,
  "updated": 3,
  "skipped": 0,
  "window_start": "2025-10-11 08:48:45",
  "at": "2025-10-11 08:58:45",
  "timestamp": "2025-10-11T08:58:45.123Z"
}
```

### Successful Sync with No Updates

```json
{
  "success": true,
  "total": 0,
  "processed": 0,
  "created": 0,
  "updated": 0,
  "skipped": 0,
  "message": "No new or updated suppliers to sync",
  "window_start": "2025-10-11 08:48:45",
  "at": "2025-10-11 08:58:45",
  "timestamp": "2025-10-11T08:58:45.123Z"
}
```

## Console Monitoring

The cron job logs its activity:

```
⏰ Running supplier sync cron job...
✅ Supplier sync completed: No new or updated suppliers
```

Or with updates:

```
⏰ Running supplier sync cron job...
✅ Supplier sync completed: 2 created, 3 updated (5 total in window)
```

## Testing

### Test Cron Endpoint Manually

```bash
curl -X POST http://localhost:3000/api/cron/sync-suppliers
```

With authentication:

```bash
curl -X POST http://localhost:3000/api/cron/sync-suppliers \
  -H "Authorization: Bearer your-secret-here"
```

### Test Manual Sync

```bash
# Full sync
curl -X POST http://localhost:3000/api/suppliers/sync-softone

# Delta sync
curl -X POST http://localhost:3000/api/suppliers/sync-softone?delta=true
```

### Get Sync Status

```bash
curl http://localhost:3000/api/suppliers/sync-softone
```

Response:
```json
{
  "total": 150,
  "erpSynced": 148,
  "notSynced": 2,
  "lastSync": "2025-10-11T08:58:45.000Z"
}
```

## Troubleshooting

### No Suppliers Syncing

1. Check SoftOne credentials in `.env`
2. Verify `sodtype: 12` is being used (not 13)
3. Test endpoint manually
4. Check console logs for errors

### Cron Job Not Running

1. Verify cron scheduler is initialized (check console logs)
2. Restart the development server
3. Check if `APP_URL` or `NEXT_PUBLIC_APP_URL` is set

### Encoding Issues (Greek Characters)

The system uses `iconv-lite` with `win1253` encoding. If you see garbled text:

1. Verify `iconv-lite` is installed
2. Check the ERP response encoding
3. Ensure the ArrayBuffer → Buffer → decode chain is working

## Database Schema Pushed

The schema has been successfully pushed to the database using:

```bash
npx prisma db push
```

This created the `Supplier` table with all fields and indexes.

## Next Steps

### To Add Menu Item

Add a suppliers menu item to your navigation:

```typescript
{
  name: "SUPPLIERS",
  path: "/suppliers",
  icon: <TruckIcon />,
  group: "Master Data"
}
```

### To Create a Supplier via API

**Endpoint**: `POST /api/suppliers`

**Body**:
```json
{
  "name": "ACME Supplies",
  "afm": "123456789",
  "code": "SUP001",
  "address": "123 Main St",
  "city": "Athens",
  "country": "1000",
  "phone01": "+30 210 1234567",
  "email": "info@acmesupplies.gr",
  "isactive": "1",
  "syncToERP": true
}
```

### Create Supplier Directly in SoftOne ERP

**Endpoint**: `POST https://aic.oncloud.gr/s1services/JS/webservice.customers/createNewSupplier`

**Example Body**:
```json
{
  "username": "Service",
  "password": "Service",
  "company": 1000,
  "name": "Demo Supplier SA",
  "code": "SUP-000123",
  "afm": "999999999",
  "isactive": 1,
  "country": 1000,
  "socurrency": 100,
  "vatsts": 1,
  "kepyosts": 1,
  "kepyomd": 1,
  "gsismd": 1,
  "cmpmode": 0,
  "efkflag": 0,
  "opitmode": 0,
  "opitfindoc": 0,
  "trdtype1": 0,
  "inpayvat": 0,
  "sotitle": "ΔΗΜΟ SUPPLIER",
  "address": "Λ. Κηφισίας 99",
  "zip": "15124",
  "district": "Μαρούσι",
  "city": "Αθήνα",
  "areas": 0,
  "phone01": "2100000000",
  "phone02": "2100000001",
  "fax": "2100000002",
  "webpage": "https://demo-supplier.gr",
  "email": "info@demo-supplier.gr",
  "emailacc": "accounting@demo-supplier.gr",
  "jobtype": 0,
  "jobtypetrd": "Χονδρικό Εμπόριο",
  "trdgroup": 0,
  "trdpgroup": 0,
  "shipment": 0,
  "payment": 0,
  "priority": 0,
  "prcpolicy": 0,
  "dscpolicy": 0,
  "isvalcredit": 0,
  "socarrier": 0,
  "trucks": 0,
  "routing": 0,
  "salesman": 0,
  "code1": "ALT-001",
  "irsdata": "ΔΟΥ Χολαργού",
  "receiptcard": "",
  "glncode": "",
  "numcg": "",
  "cbearer": "SLEV",
  "reltrdr": 0,
  "costcntr": 0,
  "remarks": "New supplier created via API"
}
```

### Update Supplier Directly in SoftOne ERP

**Endpoint**: `POST https://aic.oncloud.gr/s1services/JS/webservice.customers/updateSupplier`

**Example Body** (only include fields to update):
```json
{
  "username": "Service",
  "password": "Service",
  "company": 1000,
  "trdr": 1234,
  "name": "Demo Supplier SA (Updated)",
  "afm": "999999990",
  "address": "Λ. Κηφισίας 101",
  "zip": "15125",
  "city": "Αθήνα",
  "phone01": "2101111111",
  "email": "sales@demo-supplier.gr",
  "isactive": 1,
  "remarks": "Updated via API"
}
```

## Key Differences from Customers

| Feature | Customers | Suppliers |
|---------|-----------|-----------|
| **Delta Sync Endpoint** | `getCustomers` | **`getRecentSuppliers`** |
| **Full Sync sodtype** | 13 | **12** |
| **Create Endpoint** | `createCustomer` | **`createNewSupplier`** |
| **Update Endpoint** | `updateCustomer` | **`updateSupplier`** |
| **API Route** | `/api/customers/*` | `/api/suppliers/*` |
| **Cron Endpoint** | `/api/cron/sync-customers` | `/api/cron/sync-suppliers` |
| **Database Model** | `Customer` | `Supplier` |
| **Page URL** | `/customers` | `/suppliers` |

### ERP Endpoint Comparison

**Customers**:
- Fetch: `getCustomers` with `sodtype: 13`
- Create: `createCustomer`
- Update: `updateCustomer`

**Suppliers**:
- Fetch (Full): `getCustomers` with `sodtype: 12`
- **Fetch (Recent)**: `getRecentSuppliers` ⭐ (dedicated endpoint for cron)
- Create: `createNewSupplier`
- Update: `updateSupplier`

All other functionality is identical - same fields, same sync logic, same UI/UX!

## Summary

✅ **Database**: Supplier model created and pushed to MySQL
✅ **API**: Full CRUD endpoints with ERP sync
✅ **Cron Jobs**: Automatic sync every 10 minutes using `getRecentSuppliers`
✅ **Frontend**: Complete UI with search, export, and management
✅ **ERP Integration**: Dedicated supplier endpoints
✅ **Documentation**: Complete implementation guide

The suppliers system is fully functional and ready to use! Simply navigate to `/suppliers` to start managing your supplier data.

