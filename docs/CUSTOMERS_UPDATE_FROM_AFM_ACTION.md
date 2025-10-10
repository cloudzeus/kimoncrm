# Update Customer from Greek Tax Authority Action

## Overview

A new action button has been added to the customers table that allows users to update customer details directly from the Greek Tax Authority (AADE) using the AFM validation API.

## 🔄 What It Does

The **Update from AFM** action:
1. Takes the customer's existing AFM number
2. Queries the Greek Tax Authority API (vat.wwa.gr/afm2info)
3. Updates ONLY the fields that come from that API
4. Preserves all other customer data
5. Shows confirmation of which fields were updated

## 📋 Fields Updated

The following fields are updated from the Greek Tax Authority:

| Field | Source | Description |
|-------|--------|-------------|
| `name` | onomasia | Official company name |
| `sotitle` | commer_title | Commercial title |
| `address` | postal_address + postal_address_no | Full address |
| `zip` | postal_zip_code | Postal code |
| `city` | postal_area_description | City/Area |
| `irsdata` | doy_descr | Tax office name |
| `jobtypetrd` | firm_act_descr | Business activity |
| `isactive` | deactivation_flag | Active status (1=Active, 0=Inactive) |

## 🔒 Fields NOT Updated

These fields are preserved and NOT changed:
- `code` - Customer code
- `afm` - AFM number itself
- `trdr` - SoftOne TRDR number
- `phone01` - Primary phone
- `phone02` - Secondary phone
- `email` - Email address
- `emailacc` - Accounting email
- `district` - District
- `country` - Country code
- `socurrency` - Currency code
- `erp` - ERP sync status

## 🎯 Use Cases

### 1. Company Name Changed
A company has changed its official name with Greek authorities.
- Click **🔄 Update from AFM**
- New name automatically fetched and updated
- Commercial title also updated

### 2. Address Changed
A company has moved to a new address.
- Click **🔄 Update from AFM**
- Address, city, and ZIP code updated
- Contact information preserved

### 3. Tax Office Changed
A company's tax office has changed.
- Click **🔄 Update from AFM**
- Tax office (irsdata) updated to latest
- All other data remains unchanged

### 4. Business Activity Changed
A company's primary business activity has changed.
- Click **🔄 Update from AFM**
- Job type/activity (jobtypetrd) updated
- Everything else stays the same

## 🖱️ How to Use

### From the Table
1. Locate the customer you want to update
2. Look for the **🔄** button in the Actions column (blue color)
3. Click the button
4. Wait for the update (shows loading toast)
5. Success message shows which fields were updated
6. Table automatically refreshes

### Button Visibility
- The **🔄** button only appears for customers that have an AFM
- If no AFM exists, only Edit and Delete buttons are shown
- Button shows tooltip on hover: "Update from Greek Tax Authority"

## ✅ Success Response

When successful, you'll see a toast notification like:

```
✓ Customer updated successfully. 
  Fields updated: name, sotitle, address, zip, city, irsdata
```

## ❌ Error Handling

### No AFM
```
✗ Customer has no AFM to validate
```

### Invalid AFM / API Error
```
✗ Failed to validate AFM with Greek authorities
```

### Customer Not Found
```
✗ Customer not found
```

## 🔌 API Endpoint

### PATCH `/api/customers/[id]/update-from-afm`

**Description:** Updates customer from Greek Tax Authority API

**Parameters:**
- `id` (path): Customer ID

**Request:** No body required (uses customer's existing AFM)

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": "...",
    "name": "Updated Company Name",
    "address": "New Address 123",
    ...
  },
  "updatedFields": ["name", "sotitle", "address", "zip", "city", "irsdata"],
  "message": "Customer updated successfully from Greek Tax Authority"
}
```

**Error Response:**
```json
{
  "error": "Customer has no AFM to validate"
}
```

## 🎨 UI Design

### Button Appearance
- **Icon:** RotateCw (circular arrows)
- **Color:** Blue (`text-blue-600`)
- **Size:** Icon button (same as Edit/Delete)
- **Position:** First in actions (before Edit and Delete)

### Action Buttons Order
```
[🔄 Update] [✏️ Edit] [🗑️ Delete]
   Blue      Default    Red
```

### Conditional Rendering
```tsx
{customer.afm && (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => handleUpdateFromAFM(customer)}
    title="Update from Greek Tax Authority"
  >
    <RotateCw className="h-4 w-4 text-blue-600" />
  </Button>
)}
```

## 📊 User Workflow

```
Customer needs update
        ↓
Check if has AFM → No AFM → Edit manually
        ↓ Yes
Click 🔄 button
        ↓
Loading... (toast notification)
        ↓
API calls Greek Tax Authority
        ↓
Receives latest data
        ↓
Updates only relevant fields
        ↓
Shows success with updated fields list
        ↓
Table refreshes
        ↓
Customer data is current
```

## 🔐 Security & Validation

1. **Customer Exists:** Checks customer exists before proceeding
2. **Has AFM:** Validates customer has an AFM number
3. **API Response:** Validates response from Greek authorities
4. **Data Validation:** Only updates if valid data received
5. **Error Handling:** Graceful error messages for all failure cases

## 📝 Implementation Details

### Files Created/Modified

**Created:**
- `app/api/customers/[id]/update-from-afm/route.ts` - API endpoint

**Modified:**
- `components/customers/customers-manager.tsx` - Added button and handler
- `docs/CUSTOMERS_TABLE_ENHANCEMENTS.md` - Updated documentation

### Key Functions

```typescript
// Handler in customers-manager.tsx
const handleUpdateFromAFM = async (customer: Customer) => {
  if (!customer.afm) {
    toast.error("Customer has no AFM to validate");
    return;
  }

  const response = await fetch(
    `/api/customers/${customer.id}/update-from-afm`,
    { method: "PATCH" }
  );
  
  const data = await response.json();
  
  if (data.success) {
    toast.success(
      `Customer updated successfully. Fields updated: ${data.updatedFields.join(", ")}`
    );
    fetchCustomers(...);
  }
};
```

## 💡 Best Practices

1. **Before Bulk Updates:** Use this to refresh data before syncing to ERP
2. **After Company Changes:** When you know a company has updated their info
3. **Periodic Refresh:** Run on important customers quarterly
4. **Verification:** Always verify the updated data makes sense
5. **Manual Override:** If data is incorrect, use Edit to override manually

## ⚠️ Important Notes

1. **One-Way Update:** This only updates FROM Greek authorities TO your database
2. **No Overwrite of Custom Data:** Phone numbers, emails, etc. are preserved
3. **AFM Required:** Customer must have an AFM for this to work
4. **Live Data:** Always fetches the latest data from Greek authorities
5. **No History:** Previous values are overwritten (consider adding audit log)

## 🚀 Future Enhancements

Potential improvements:
- [ ] Bulk update multiple customers at once
- [ ] Audit trail of what changed
- [ ] Schedule automatic updates
- [ ] Show diff before confirming update
- [ ] Update history log

---

**Status:** ✅ Implemented and Ready to Use

The Update from AFM action is fully functional and integrated into the customers table!

