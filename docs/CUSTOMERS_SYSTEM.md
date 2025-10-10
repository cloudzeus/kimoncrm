# Customer Management System

This document describes the Customer Management System with SoftOne ERP integration and Greek Tax Authority validation.

## Overview

The customer management system provides:
- Full CRUD operations for customers
- Greek Tax Authority (AADE) AFM validation
- Bi-directional SoftOne ERP synchronization
- Automatic delta sync every 10 minutes via cron job
- Comprehensive customer data with relationships to countries, districts, and tax offices

## Database Schema

### Customer Model

The `Customer` model includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key (CUID) |
| trdr | Int? | SoftOne TRDR number |
| code | String? | Customer code |
| afm | String? | Greek VAT number (AFM) |
| name | String | Customer name (required) |
| sotitle | String? | Commercial title |
| jobtypetrd | String? | Job type/activity description |
| address | String? | Street address |
| city | String? | City |
| zip | String? | Postal code |
| district | String? | District name |
| country | String? | Country code (references Country.softoneCode) |
| isactive | Enum | ACTIVE or INACTIVE |
| erp | Boolean | Whether synced to SoftOne ERP |
| phone01 | String? | Primary phone |
| phone02 | String? | Secondary phone |
| email | String? | Primary email |
| emailacc | String? | Accounting email |
| irsdata | String? | Tax office name |
| socurrency | Int? | Currency code |
| update | DateTime | Last update timestamp |
| createdAt | DateTime | Creation timestamp |

## API Endpoints

### 1. Get All Customers
**GET** `/api/customers`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `search` (string, optional) - Search term (searches name, AFM, code, email, city)

**Response:**
```json
{
  "customers": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### 2. Create Customer
**POST** `/api/customers`

**Body:**
```json
{
  "code": "1001",
  "afm": "801946016",
  "name": "Company Name",
  "sotitle": "Commercial Title",
  "jobtypetrd": "Business Activity",
  "address": "Street Address 123",
  "city": "Athens",
  "zip": "11527",
  "district": "Chalandri",
  "country": "1000",
  "isactive": "ACTIVE",
  "phone01": "210 1234567",
  "phone02": "210 7654321",
  "email": "info@example.com",
  "emailacc": "accounting@example.com",
  "irsdata": "ΚΕΦΟΔΕ ΑΤΤΙΚΗΣ",
  "socurrency": "100",
  "syncToERP": true
}
```

**Response:**
```json
{
  "customer": {...},
  "erpSync": true,
  "erpData": {
    "success": true,
    "TRDR": 15837,
    "result": {...}
  }
}
```

### 3. Get Single Customer
**GET** `/api/customers/[id]`

**Response:**
```json
{
  "customer": {
    "id": "...",
    "name": "...",
    "countryRel": {
      "name": "Greece",
      "softoneCode": "1000"
    },
    ...
  }
}
```

### 4. Update Customer
**PATCH** `/api/customers/[id]`

**Body:** Same as Create Customer (without syncToERP)

### 5. Delete Customer
**DELETE** `/api/customers/[id]`

**Response:**
```json
{
  "success": true
}
```

### 6. Validate AFM with Greek Tax Authority
**POST** `/api/customers/validate-afm`

**Body:**
```json
{
  "afm": "801946016"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "afm": "801946016",
    "irsdata": "ΚΕΦΟΔΕ ΑΤΤΙΚΗΣ",
    "name": "WORLD WIDE ASSOCIATES Ε Ε",
    "sotitle": "WORLD WIDE ASSOCIATES",
    "address": "ΑΛΕΞΑΝΔΡΟΥΠΟΛΕΩΣ 25",
    "zip": "11527",
    "city": "ΑΘΗΝΑ",
    "jobtypetrd": "ΠΑΡΑΓΩΓΗ ΠΡΩΤΟΤΥΠΩΝ ΛΟΓΙΣΜΙΚΟΥ",
    "isactive": "1"
  },
  "raw": {...}
}
```

### 7. Sync Customers from SoftOne ERP
**POST** `/api/customers/sync-softone`

**Query Parameters:**
- `delta` (boolean, optional) - If true, only sync customers updated since last sync

**Response:**
```json
{
  "success": true,
  "syncType": "delta",
  "total": 5733,
  "processed": 120,
  "created": 5,
  "updated": 115,
  "skipped": 5613,
  "timestamp": "2025-10-09T11:42:10Z"
}
```

**GET** `/api/customers/sync-softone` - Get sync status

**Response:**
```json
{
  "total": 5733,
  "erpSynced": 5700,
  "notSynced": 33,
  "lastSync": "2025-10-09T11:42:10Z"
}
```

### 8. Cron Job Endpoint
**POST/GET** `/api/cron/sync-customers`

**Headers:**
- `Authorization: Bearer {CRON_SECRET}` (if CRON_SECRET is set)

This endpoint is automatically called every 10 minutes by the cron scheduler.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# SoftOne ERP Configuration
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_COMPANY=1000

# Cron Job Security (Optional)
CRON_SECRET=your-secret-key-here

# Application URL (for cron jobs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Cron Job Setup

The cron job is automatically initialized when the application starts. It runs every 10 minutes and performs a delta sync (only syncing customers that have been updated since the last sync).

### Manual Initialization

If needed, you can manually initialize the cron jobs:

```bash
curl http://localhost:3000/api/jobs/init
```

### Cron Schedule

- **Customer Sync**: `*/10 * * * *` (Every 10 minutes)

## Character Encoding

The system properly handles Greek characters using `iconv-lite` to convert from Windows-1253 (ANSI 1253) to UTF-8 when receiving data from SoftOne ERP.

## Field Mappings

### Greek Tax Authority (AADE) API → Customer

| AADE Field | Customer Field |
|------------|----------------|
| afm | afm |
| doy_descr | irsdata |
| onomasia | name |
| commer_title | sotitle |
| postal_address + postal_address_no | address |
| postal_zip_code | zip |
| postal_area_description | city |
| firm_act_descr | jobtypetrd |
| deactivation_flag | isactive (1=ACTIVE, 0=INACTIVE) |

### SoftOne ERP → Customer

| SoftOne Field | Customer Field |
|---------------|----------------|
| TRDR | trdr |
| CODE | code |
| AFM | afm |
| NAME | name & sotitle |
| JOBTYPETRD | jobtypetrd |
| ADDRESS | address |
| CITY | city |
| ZIP | zip |
| DISTRICT | district |
| COUNTRY | country |
| ISPROSP | isactive |
| PHONE01 | phone01 |
| IRSDATA / IRSDATA_1 | irsdata |
| SOCURRENCY | socurrency |
| UPDDATE | update |

## Usage

### Frontend (UI)

Navigate to `/customers` to access the customer management interface.

**Features:**
- Search customers by name, AFM, code, email, or city
- Create new customers with automatic AFM validation
- Edit existing customers
- Delete customers
- Sync all customers from SoftOne ERP
- View sync status (ERP badge)
- Pagination

**Creating a Customer:**
1. Click "New Customer"
2. Country is pre-set to Greece (Ελλάς - code 1000) and Currency to EUR (100)
3. Enter AFM and click "Validate" to auto-fill data from Greek Tax Authority
4. Fill in or review the remaining fields
5. Select dropdowns for Country, District, and Tax Office (searchable)
6. Check "Sync to SoftOne ERP" to create the customer in ERP immediately
7. Click "Create Customer"

### Programmatic Access

```typescript
// Fetch customers
const response = await fetch('/api/customers?page=1&limit=50&search=athens');
const { customers, pagination } = await response.json();

// Validate AFM
const validation = await fetch('/api/customers/validate-afm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ afm: '801946016' })
});
const { success, data } = await validation.json();

// Sync from SoftOne
const sync = await fetch('/api/customers/sync-softone?delta=true', {
  method: 'POST'
});
const syncResult = await sync.json();
```

## Testing

### Test AFM Validation

```bash
curl -X POST http://localhost:3000/api/customers/validate-afm \
  -H "Content-Type: application/json" \
  -d '{"afm":"801946016"}'
```

### Test SoftOne Sync

```bash
curl -X POST http://localhost:3000/api/customers/sync-softone
```

### Test Customer Creation with ERP Sync

```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "afm": "123456789",
    "syncToERP": true
  }'
```

## Troubleshooting

### Cron Job Not Running

1. Check if cron jobs were initialized:
   ```bash
   curl http://localhost:3000/api/jobs/init
   ```

2. Check server logs for cron job execution messages

3. Manually trigger sync:
   ```bash
   curl -X POST http://localhost:3000/api/cron/sync-customers
   ```

### Character Encoding Issues

If you see garbled Greek characters:
- Verify that `iconv-lite` is installed
- Check that the encoding is set to `win1253` in the sync endpoints
- Ensure the database collation supports UTF-8

### ERP Sync Failing

1. Verify environment variables are set correctly
2. Check SoftOne ERP credentials
3. Test the SoftOne endpoint directly
4. Check network connectivity to SoftOne server

## Security Considerations

1. **CRON_SECRET**: Set a strong secret to protect cron endpoints from unauthorized access
2. **API Authentication**: Consider adding authentication middleware to customer endpoints
3. **Rate Limiting**: Implement rate limiting for AFM validation to prevent abuse
4. **Input Validation**: All inputs are validated using Zod schemas
5. **SQL Injection**: Protected by Prisma's parameterized queries

## Future Enhancements

- Bulk import/export functionality
- Customer activity logs
- Advanced filtering and sorting
- Customer merge functionality
- Duplicate detection
- Historical data tracking
- Customer analytics dashboard

