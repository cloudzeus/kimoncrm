# Wizard Data Visibility Fix - Summary

## Problem
After completing the wizard, users couldn't see:
1. Infrastructure data (buildings)
2. Equipment data (products/services)
3. Generated documents (BOM Excel and Word documents)

## Root Causes

### 1. **Prisma Schema Issue**
The `buildings` field was defined as a relation array (`Building[]`) but the wizard was trying to save it as JSON data, causing a Prisma validation error.

### 2. **Data Loading Issue**
The details page was only trying to load data from the legacy `/api/site-surveys/${id}/cabling` endpoint instead of the wizard endpoints:
- `/api/site-surveys/${id}/infrastructure`
- `/api/site-surveys/${id}/equipment`

### 3. **Display Logic Issue**
The Infrastructure and Equipment tabs were checking for the wrong data or conditions, preventing proper display even when data existed.

### 4. **React Duplicate Key Error**
Equipment state wasn't syncing properly with props, causing duplicate keys when the same equipment was rendered multiple times.

## Fixes Applied

### 1. Fixed Prisma Schema (✅ COMPLETED)
**File:** `prisma/schema.prisma`

Changed the `buildings` field from a relation to a JSON field:

```prisma
model SiteSurvey {
  // ... other fields
  equipment    Json?
  buildings    Json?              // Changed from Building[] to Json?
  buildingRecords Building[]      // Renamed relation to preserve it
  // ... other relations
}
```

**Result:** Data now saves successfully without Prisma errors.

### 2. Fixed Data Loading (✅ COMPLETED)
**File:** `app/(main)/site-surveys/[id]/details/page.tsx`

Updated `fetchSurveyDetails()` to load from all endpoints:

```typescript
// Load infrastructure data (buildings) from wizard endpoint
const infraResponse = await fetch(`/api/site-surveys/${id}/infrastructure`);
if (infraResponse.ok) {
  const infraData = await infraResponse.json();
  setBuildings(infraData.buildings || []);
}

// Load equipment data from wizard endpoint
const equipmentResponse = await fetch(`/api/site-surveys/${id}/equipment`);
if (equipmentResponse.ok) {
  const equipmentData = await equipmentResponse.json();
  setEquipment(equipmentData.equipment || []);
}

// Fallback to legacy cabling endpoint for backwards compatibility
if (data.type === 'CABLING') {
  const cablingResponse = await fetch(`/api/site-surveys/${id}/cabling`);
  // Only use if we don't have infrastructure data
  if (cablingResponse.ok && buildings.length === 0) {
    const cablingData = await cablingResponse.json();
    setBuildings(cablingData.data?.buildings || []);
  }
}
```

**Result:** Data now loads correctly from all available endpoints.

### 3. Fixed Display Logic (✅ COMPLETED)
**File:** `app/(main)/site-surveys/[id]/details/page.tsx`

**Infrastructure Tab:**
- Now displays infrastructure using the `EquipmentDisplay` component
- Shows "Add Infrastructure via Wizard" button when empty
- Uses `buildings.length > 0` check instead of type-specific checks

**Equipment Tab:**
- Now displays products and services in separate tables
- Shows "Add Equipment via Wizard" button when empty
- Uses `equipment.length > 0` check

**BOM Tab:**
- Already working correctly with equipment state
- Generates consolidated BOM from equipment data

**Files Tab:**
- Already working correctly using `FilesList` component
- Shows all uploaded files including BOM Excel and Word documents

**Result:** All tabs now display data correctly.

### 4. Fixed React Duplicate Keys (✅ COMPLETED)
**Files:**
- `components/site-surveys/wizard-steps/equipment-step.tsx`
- `components/site-surveys/wizard-steps/pricing-step.tsx`

Added state synchronization and deduplication:

```typescript
// Sync equipment prop with local state and deduplicate by ID
useEffect(() => {
  const seenIds = new Set<string>();
  const deduplicated = equipment.filter(item => {
    if (seenIds.has(item.id)) {
      console.warn(`Duplicate equipment ID found: ${item.id}`);
      return false;
    }
    seenIds.add(item.id);
    return true;
  });
  setLocalEquipment(deduplicated);
}, [equipment]);
```

**Result:** No more duplicate key errors in React.

## Document Generation

Both document generation endpoints are working correctly:

### BOM Excel Generation
**Endpoint:** `/api/site-surveys/[id]/generate-and-upload-bom`
- Generates consolidated BOM Excel with all products and services
- Uploads to BunnyCDN
- Saves file reference to database (line 258)
- ✅ Files appear in FILES tab

### Word Document Generation
**Endpoint:** `/api/site-surveys/[id]/generate-and-upload-word`
- Generates comprehensive site survey report
- Uploads to BunnyCDN
- Saves file reference to database (line 140)
- ✅ Files appear in FILES tab

## Testing Checklist

After completing the wizard:

- [x] Infrastructure data visible in INFRASTRUCTURE tab
- [x] Equipment data visible in EQUIPMENT tab
- [x] BOM displays correctly in BOM tab with Excel export
- [x] Documents appear in FILES tab
- [x] BOM Excel file is downloadable
- [x] Word document is downloadable
- [x] No React duplicate key errors in console
- [x] Data persists after page refresh

## Usage Flow

1. **Create/Open Site Survey** → Navigate to wizard
2. **Step 1: Infrastructure** → Add buildings, floors, racks, rooms
3. **Step 2: Equipment** → Select products and services
4. **Step 3: Pricing** → Review and adjust prices/margins
5. **Complete Wizard** → Documents generated and uploaded
6. **View Details** → All tabs show data correctly

## API Endpoints Used

```
GET  /api/site-surveys/[id]                      - Basic site survey data
GET  /api/site-surveys/[id]/infrastructure       - Buildings data
GET  /api/site-surveys/[id]/equipment            - Equipment data
POST /api/site-surveys/[id]/infrastructure       - Save buildings
POST /api/site-surveys/[id]/equipment            - Save equipment
POST /api/site-surveys/[id]/generate-and-upload-bom   - Generate BOM Excel
POST /api/site-surveys/[id]/generate-and-upload-word  - Generate Word doc
GET  /api/files?entityId=[id]&type=SITESURVEY   - Fetch documents
```

## Database Schema Changes

```sql
-- Buildings field changed from relation to JSON
ALTER TABLE SiteSurvey MODIFY buildings JSON;

-- No data migration needed as old data format is compatible
```

## Files Modified

1. `prisma/schema.prisma` - Schema update
2. `app/(main)/site-surveys/[id]/details/page.tsx` - Data loading and display
3. `components/site-surveys/wizard-steps/equipment-step.tsx` - Deduplication
4. `components/site-surveys/wizard-steps/pricing-step.tsx` - Deduplication

## Notes

- The wizard automatically saves progress between steps
- Documents are generated only on final submit
- All files are uploaded to BunnyCDN with database references
- Legacy cabling endpoint still works for backwards compatibility
- Equipment IDs are unique per item (includes timestamp and random string)

## Status

✅ **ALL ISSUES RESOLVED** - Wizard data is now fully visible after completion

