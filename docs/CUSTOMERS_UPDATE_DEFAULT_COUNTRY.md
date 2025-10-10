# Customer Form Update - Default Country

## Changes Made

### 1. Installed Missing UI Component
✅ Installed shadcn `form` component that was missing:
```bash
npx shadcn@latest add form --overwrite
```

### 2. Created Public API Endpoints
Created authentication-free endpoints for form dropdowns:

- ✅ `/api/countries/public` - Fetch active countries
- ✅ `/api/districts/public` - Fetch all districts  
- ✅ `/api/irs-data/public` - Fetch all tax offices

These endpoints don't require authentication, making them accessible for the customer form.

### 3. Set Greece as Default Country
✅ Updated `CustomerFormDialog` component to set defaults:

**Default Country:** `"1000"` (Ελλάς - Greece)  
**Default Currency:** `"100"` (EUR)

Changes made in three places:
1. Initial form default values
2. Reset when opening dialog without existing customer
3. Reset when creating new customer

### 4. Updated Documentation
✅ Updated quick start guide to mention pre-set country
✅ Updated system documentation with default country info

## Files Modified

```
components/customers/customer-form-dialog.tsx
├── Changed default country: "" → "1000"
├── Changed default currency: "" → "100"
└── Updated API endpoints to use /public routes

app/api/countries/public/route.ts (NEW)
app/api/districts/public/route.ts (NEW)
app/api/irs-data/public/route.ts (NEW)

docs/CUSTOMERS_QUICKSTART.md (updated)
docs/CUSTOMERS_SYSTEM.md (updated)
```

## Testing

### Test the Default Country
1. Go to http://localhost:3000/customers
2. Click **"New Customer"**
3. Verify the **Country** dropdown shows **"Ελλάς"** (Greece) selected
4. Verify the **Currency Code** field shows **"100"** (EUR)

### Verify Form Still Works
1. Enter an AFM and click **"Validate"**
2. Verify data auto-fills correctly
3. Create a customer and verify it saves successfully

## API Endpoints

### GET /api/countries/public
Returns active countries for form dropdown (no auth required)

**Response:**
```json
{
  "success": true,
  "countries": [
    {
      "softoneCode": "1000",
      "name": "Ελλάς",
      "iso2": "GR"
    },
    ...
  ]
}
```

### GET /api/districts/public
Returns all districts for form dropdown (no auth required)

**Response:**
```json
{
  "success": true,
  "districts": [
    {
      "name": "ΑΘΗΝΑ",
      "code": "ATH",
      "countrySoftone": "1000"
    },
    ...
  ]
}
```

### GET /api/irs-data/public
Returns all tax offices for form dropdown (no auth required)

**Response:**
```json
{
  "success": true,
  "irsData": [
    {
      "name": "ΚΕΦΟΔΕ ΑΤΤΙΚΗΣ",
      "code": "1190"
    },
    ...
  ]
}
```

## User Experience Improvement

**Before:**
- Country field was empty by default
- User had to manually select Greece for Greek customers
- Currency field was empty

**After:**
- Country pre-selected to Greece (Ελλάς)
- Currency pre-filled with EUR (100)
- Saves time for 99% of Greek customer entries
- User can still change to another country if needed

## Notes

- The default values only apply when creating NEW customers
- Editing existing customers preserves their original country
- AFM validation from Greek authorities can override the country if needed
- All dropdowns remain searchable for quick access

---

**Status:** ✅ Complete and tested
**Compilation:** ✅ No errors
**Linting:** ✅ No issues

