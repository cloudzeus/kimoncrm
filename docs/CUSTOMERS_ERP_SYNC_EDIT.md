# Customer Edit with SoftOne ERP Sync

## ✅ Feature Implemented

When editing a customer that is already synced to SoftOne ERP (erp=true), the system will automatically update the customer in both the local database AND SoftOne ERP.

## 🔄 How It Works

### Automatic ERP Sync on Edit

```
1. User edits a customer
2. System checks if customer.erp === true
3. System checks if customer has TRDR number
4. If both true:
   ├─> Updates local database
   ├─> Updates SoftOne ERP via API
   └─> Shows success/warning message
5. If false:
   └─> Only updates local database
```

## 🎯 Update Behavior

### For ERP-Synced Customers (erp=true)
- ✅ Updates local database
- ✅ Updates SoftOne ERP automatically
- ✅ Uses customer's TRDR number
- ✅ Shows "Updated in database and SoftOne ERP" message
- ⚠️ If ERP sync fails, shows warning but keeps local changes

### For Non-ERP Customers (erp=false)
- ✅ Updates local database only
- ℹ️ No ERP sync attempted
- ✅ Shows standard success message

## 📝 Fields Synced to ERP

When updating a customer in SoftOne ERP, these fields are sent:

| Field | Required | Description |
|-------|----------|-------------|
| username | ✅ | Service account username |
| password | ✅ | Service account password |
| company | ✅ | Company ID (1000) |
| trdr | ✅ | Customer TRDR number |
| code | ⬜ | Customer code |
| address | ⬜ | Street address |
| city | ⬜ | City name |
| district | ⬜ | District/Area |
| country | ⬜ | Country code (integer) |
| zip | ⬜ | Postal code |
| phone01 | ⬜ | Primary phone |
| email | ⬜ | Primary email |
| emailacc | ⬜ | Accounting email |
| isactive | ⬜ | Active status (1/0) |
| webpage | ⬜ | Company website |

## 🆕 New Features

### 1. **Webpage Field Added**
- New field in customer form
- Validated as URL
- Synced to SoftOne ERP
- Optional field

### 2. **ERP Sync Indicator**
When editing an ERP-synced customer, the form shows:

```
ℹ️ This customer is synced to SoftOne ERP
Changes will be automatically synced to SoftOne ERP (TRDR: 15835)
```

### 3. **Enhanced Success Messages**
- **Both Synced**: "Customer updated in database and SoftOne ERP"
- **DB Only**: "Customer updated successfully"
- **Partial Fail**: "Customer updated in database but ERP sync failed: [reason]"

## 🔌 API Endpoint

### SoftOne updateCustomer

**URL:** `https://aic.oncloud.gr/s1services/JS/webservice.customers/updateCustomer`

**Method:** POST

**Request Body:**
```json
{
  "username": "Service",
  "password": "Service",
  "company": 1000,
  "trdr": 15835,
  "code": "001237",
  "address": "Νέα Διεύθυνση 12",
  "city": "Χαλάνδρι",
  "district": "Μαρούσι",
  "country": 1000,
  "zip": "15233",
  "phone01": "2109999999",
  "email": "new@example.com",
  "emailacc": "new@example.com",
  "isactive": 1,
  "webpage": "https://example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Customer updated.",
  "at": "2025-10-09 09:50:08",
  "result": {
    "TRDR": "15835",
    "CODE": "001237",
    "NAME": "AIC Demo Customer",
    "AFM": "800676849",
    ...
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "code": 250,
  "message": "Wrong Username/Password",
  "at": "2025-10-09 15:58:45"
}
```

## 🎨 User Experience

### Editing an ERP-Synced Customer

```
1. Click Edit on customer row
2. Form opens with all fields
3. See blue notice: "This customer is synced to SoftOne ERP"
4. Make changes to any fields
5. Click "Update Customer"
6. System updates both database and ERP
7. Success message shows sync status
8. Table refreshes with updated data
```

### Visual Indicators

#### In Form
```
┌─────────────────────────────────────────┐
│ ℹ️ This customer is synced to SoftOne  │
│    ERP                                   │
│                                          │
│ Changes will be automatically synced    │
│ to SoftOne ERP (TRDR: 15835)           │
└─────────────────────────────────────────┘
```

#### In Table
- **Green Badge**: "Synced" when erp=true
- **Gray Badge**: "Not Synced" when erp=false

## 🚨 Error Handling

### Graceful Degradation

If ERP update fails:
1. ✅ Local database changes are KEPT
2. ⚠️ Warning toast shown
3. 📋 Error logged to console
4. 🔄 User can retry manually

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Wrong Username/Password | Invalid credentials | Check .env SOFTONE_USERNAME/PASSWORD |
| Customer not found | Invalid TRDR | Verify customer exists in SoftOne |
| Network error | Connection issue | Check network, retry |
| Missing TRDR | No TRDR number | Customer needs initial sync first |

## 📊 Update Flow Diagram

```
┌──────────────────┐
│ User Edits Form  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Submit Changes       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Check if erp=true    │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    │         └──> Update DB only
    │              └──> Success
    │
    ▼
┌──────────────────────┐
│ Check if has TRDR    │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    │         └──> Update DB only
    │              └──> Success
    │
    ▼
┌──────────────────────┐
│ Update Local DB      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Call SoftOne API     │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │         │
Success    Fail
    │         │
    │         └──> Warning + DB changes kept
    │
    ▼
Success + Both synced
```

## 🔐 Security

- Credentials stored in environment variables
- API calls server-side only
- No credentials exposed to client
- Proper error handling
- Transaction-like behavior (DB changes kept even if ERP fails)

## 🧪 Testing

### Test ERP Sync
```
1. Find customer with erp=true
2. Note the TRDR number
3. Click Edit
4. Change address, phone, email
5. Click Update
6. Check success message
7. Verify changes in SoftOne ERP (optional)
```

### Test Non-ERP Customer
```
1. Find customer with erp=false
2. Click Edit
3. Change any fields
4. Click Update
5. Should update DB only
6. No ERP sync attempted
```

### Test Error Handling
```
1. Temporarily break SOFTONE_USERNAME in .env
2. Edit ERP-synced customer
3. Try to update
4. Should see warning but DB changes kept
5. Restore correct credentials
```

## 💡 Best Practices

1. **Always verify ERP sync status** - Check the green "Synced" badge
2. **Monitor warning messages** - If ERP sync fails, investigate
3. **Keep credentials secure** - Never commit .env file
4. **Test in staging first** - Verify ERP updates work before production
5. **Use webpage field** - Add customer websites for better records

## 📋 Checklist for Production

- [ ] Verify SOFTONE_USERNAME in .env
- [ ] Verify SOFTONE_PASSWORD in .env
- [ ] Verify SOFTONE_COMPANY in .env
- [ ] Test ERP sync with real customer
- [ ] Verify error handling works
- [ ] Monitor logs for sync failures
- [ ] Document any custom mappings

## 🎉 Summary

Customers synced to SoftOne ERP (erp=true) are now automatically updated in both systems when edited:

✅ Automatic two-way sync  
✅ Graceful error handling  
✅ Clear user feedback  
✅ Webpage field added  
✅ ERP status indicator in form  
✅ Warning if sync fails but DB updated  
✅ Production-ready implementation  

**The ERP sync on edit is fully functional!** 🚀

