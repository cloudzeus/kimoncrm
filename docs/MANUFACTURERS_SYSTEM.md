# Manufacturers System Documentation

## Overview

The Manufacturers system provides comprehensive manufacturer management with full SoftOne ERP integration. It includes automatic sync via cron jobs and a clean UI for managing manufacturer data.

## Features

### 1. Database Schema

#### Manufacturer Model
```prisma
model Manufacturer {
  id          String   @id @default(cuid())
  mtrmanfctr  String?  @unique  // SoftOne MTRMANFCTR (manufacturer ID)
  code        String?  @unique  // SoftOne CODE (same as MTRMANFCTR)
  name        String   @unique  // SoftOne NAME
  isActive    Boolean  @default(true)  // SoftOne ISACTIVE
  softoneCode String?  @unique  // Legacy field (mapped to mtrmanfctr)
  logoId      String?  @unique
  logo        FileRef? @relation(fields: [logoId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products    Product[]
  markupRules MarkupRule[]
}
```

**Field Mapping from SoftOne**:
- `MTRMANFCTR` → `mtrmanfctr` (unique manufacturer ID)
- `CODE` → `code` (same as MTRMANFCTR)
- `NAME` → `name` (manufacturer name)
- `ISACTIVE` → `isActive` (1 = active, 0 = inactive)

### 2. SoftOne ERP Integration

#### API Endpoint

**URL**: `https://aic.oncloud.gr/s1services/JS/webservice.utilities/getManufactures`

**Method**: POST

**Request Body**:
```json
{
  "username": "Service",
  "password": "Service",
  "company": 1000
}
```

**Response Example**:
```json
{
  "success": true,
  "code": 200,
  "message": "OK",
  "at": "2025-10-12 09:00:09",
  "company": 1000,
  "total": 113,
  "result": [
    {
      "COMPANY": "1000",
      "MTRMANFCTR": "113",
      "CODE": "113",
      "NAME": "Ubiquiti",
      "ISACTIVE": "1"
    },
    {
      "COMPANY": "1000",
      "MTRMANFCTR": "108",
      "CODE": "108",
      "NAME": "TP-LINK",
      "ISACTIVE": "1"
    }
  ]
}
```

#### Encoding Handling
All SoftOne responses use **ANSI 1253** (Windows-1253) encoding and are converted to UTF-8 using:
```typescript
import * as iconv from 'iconv-lite';

const arrayBuffer = await response.arrayBuffer();
const decodedText = iconv.decode(Buffer.from(new Uint8Array(arrayBuffer)), 'win1253');
```

### 3. Cron Jobs

#### Manufacturer Sync Cron
- **Schedule**: Every 6 hours (`0 */6 * * *`)
- **Route**: `/api/cron/sync-manufacturers`
- **Function**: Automatically syncs manufacturers from SoftOne
- **Authentication**: Requires `CRON_SECRET` in Authorization header
- **Registered in**: `lib/jobs/cron-scheduler.ts`

**Why Every 6 Hours?**
Manufacturers change less frequently than products or customers, so a 6-hour sync interval is sufficient while reducing API load.

### 4. API Routes

#### GET /api/manufacturers
List all manufacturers with filtering and pagination
- **Query Params**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50)
  - `search`: Search in name, code, mtrmanfctr
  - `isActive`: Filter by active status (true/false)
- **Includes**: Product count per manufacturer

#### POST /api/manufacturers
Create a new manufacturer (Admin only)
- **Body**: `{ code, name, isActive }`
- **Validation**: Code and name are required
- **Note**: Manually created manufacturers won't be overwritten by ERP sync

#### GET /api/manufacturers/[id]
Get manufacturer details by ID
- **Includes**: Logo and product count

#### PUT /api/manufacturers/[id]
Update manufacturer by ID (Admin only)
- **Body**: Partial manufacturer data

#### DELETE /api/manufacturers/[id]
Delete manufacturer (Admin only)
- **Protection**: Cannot delete if manufacturer has associated products
- **Validation**: Checks product count before deletion

#### POST /api/manufacturers/sync
Full sync from ERP (Admin only)
- **Purpose**: Manual trigger for synchronization
- **Process**: Fetches all manufacturers and upserts

### 5. User Interface

#### Manufacturers Page
- **Route**: `/app/(main)/manufacturers/page.tsx`
- **Access**: Admin, Manager, Employee roles
- **Features**:
  - Search manufacturers
  - Filter by active status
  - Sync from ERP button
  - Create, edit, delete manufacturers
  - Product count badges
  - Status badges (ACTIVE/INACTIVE)

#### Manufacturers Table
- **Columns**:
  - CODE
  - NAME
  - PRODUCTS (count badge)
  - STATUS (active/inactive badge)
  - CREATED (date)
  - ACTIONS (dropdown menu)

#### Actions Dropdown
- **EDIT**: Open form dialog
- **DELETE**: Delete manufacturer (disabled if has products)

#### Manufacturer Form Dialog
- **Fields**:
  - Code (required, uppercase)
  - Name (required, uppercase)
  - Active status (checkbox)
- **Validation**: Prevents duplicate codes
- **Simple**: No unnecessary fields

### 6. Integration with Products

When products are synced from SoftOne:
```typescript
// Product's mtrmanfctr field links to Manufacturer.softoneCode
const manufacturer = await prisma.manufacturer.findUnique({
  where: { softoneCode: product.mtrmanfctr },
});
```

This automatically links products to their manufacturers during sync.

### 7. Data Protection

**Delete Protection**:
```typescript
// Check if manufacturer has products
const productCount = await prisma.product.count({
  where: { manufacturerId: id },
});

if (productCount > 0) {
  return error; // Cannot delete
}
```

This prevents orphaned products and maintains data integrity.

## Workflow

### Initial Setup
1. Navigate to `/manufacturers`
2. Click "Sync from ERP" button
3. System fetches all 113+ manufacturers from SoftOne
4. Manufacturers are created in database
5. Ready to use in product forms

### Ongoing Sync
1. Cron job runs every 6 hours automatically
2. Fetches latest manufacturer list from SoftOne
3. Updates existing manufacturers
4. Creates new manufacturers
5. Logs results to console

### Manual Management
1. Add custom manufacturers not in ERP (optional)
2. Edit manufacturer names/codes
3. Deactivate manufacturers (don't delete if has products)
4. View product counts per manufacturer

## Environment Variables

Reuses existing SoftOne credentials:
```env
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_COMPANY=1000
CRON_SECRET=your-secret-key
```

## User Preferences Applied

Based on user memories:

1. **ANSI 1253 Encoding**: Using iconv-lite with ArrayBuffer approach [[memory:7208361]]
2. **Uppercase Text**: All Greek text fields converted to uppercase without tones [[memory:7208358]]
3. **Server-Side Operations**: All CRUD operations use server-side code [[memory:5079569]]
4. **Modern UI/UX**: Shadcn components with shadows instead of borders [[memory:5079581]]
5. **DB Push**: Using `prisma db push` instead of migrations [[user rule]]
6. **Dropdown Actions**: Following suppliers/customers pattern

## File Structure

```
/Volumes/EXTERNALSSD/kimoncrm/
├── lib/softone/
│   └── manufacturers.ts                      # SoftOne API integration
├── app/api/
│   ├── manufacturers/
│   │   ├── route.ts                          # List & Create
│   │   ├── [id]/route.ts                     # Get, Update, Delete
│   │   └── sync/route.ts                     # Manual sync
│   └── cron/
│       └── sync-manufacturers/route.ts       # Cron job
├── app/(main)/manufacturers/
│   └── page.tsx                              # Manufacturers page
├── components/manufacturers/
│   ├── manufacturers-manager.tsx             # Main table component
│   └── manufacturer-form-dialog.tsx          # Create/Edit form
├── prisma/
│   └── schema.prisma                         # Manufacturer model
└── lib/jobs/
    └── cron-scheduler.ts                     # Cron registration
```

## Testing

### Test Manual Sync
```bash
# Trigger sync (requires admin user)
POST /api/manufacturers/sync
```

### Test Cron Job
```bash
# Manually trigger cron
POST /api/cron/sync-manufacturers
Authorization: Bearer YOUR_CRON_SECRET
```

### Test Creation
```bash
POST /api/manufacturers
{
  "code": "TEST",
  "name": "TEST MANUFACTURER",
  "isActive": true
}
```

## Troubleshooting

### Encoding Issues
If manufacturer names appear garbled:
- Verify `iconv-lite` is installed
- Check ArrayBuffer conversion
- Confirm SoftOne sends Windows-1253

### Cron Job Not Running
- Verify scheduler is initialized in app
- Check `CRON_SECRET` environment variable
- Review server logs

### Cannot Delete Manufacturer
**Expected Behavior**: Manufacturers with products cannot be deleted
- Solution: Reassign products to different manufacturer first
- Or: Deactivate instead of delete

### Duplicate Code Error
If sync fails with duplicate code:
- Check for manually created manufacturers with same code
- ERP data should take precedence
- May need to manually resolve conflicts

## Related Systems

- **Products**: Products link to manufacturers via `manufacturerId`
- **Pricing**: Markup rules can be applied per manufacturer
- **Sync Chain**: Sync manufacturers before products for proper linking

## Future Enhancements

1. Manufacturer logos/images via BunnyCDN
2. Manufacturer description fields
3. Contact information for manufacturers
4. Website URLs
5. Product catalog filtering by manufacturer
6. Manufacturer performance analytics
7. Bulk edit capabilities

---

**Last Updated**: October 12, 2025
**Version**: 1.0.0
**Author**: Kimon CRM Development Team

