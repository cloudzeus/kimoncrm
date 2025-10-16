# Testing AI Product Creation - Step by Step

## Prerequisites
✅ Dev server running (`npm run dev`)
✅ Database connected
✅ DEEPSEEK_API_KEY in .env
✅ SoftOne credentials in .env

## Test 1: AI Product Research

### Steps:
1. Go to `/products` page
2. Click "Create Product" button
3. Enter product name: **"Yealink T58W Pro"**
4. Click **"Get Info from AI"** button
5. Wait 5-10 seconds for AI research

### Expected Result:
- Modal opens with AI results
- Shows:
  - ✅ Product name
  - ✅ EAN code (13 digits)
  - ✅ Manufacturer code
  - ✅ Suggested Brand (highlighted in blue)
  - ✅ Suggested Manufacturer (highlighted in green)
  - ✅ Suggested Category (highlighted in purple)
  - ✅ Dimensions (width, length, height, weight)
  - ✅ 10+ specifications
  - ✅ Translations (EN & EL)
  - ✅ Greek text uses Greek characters: Γιαλινκ, τηλεφωνο, etc.

### Check Console:
```
🔍 Raw AI research response: {...
✅ AI research complete
```

## Test 2: Create Product with ERP

### Steps:
1. After AI research completes
2. Check the **"INSERT TO ERP"** checkbox (blue box)
3. Click **"CREATE PRODUCT NOW"** button
4. Wait for creation

### Expected Result:
- Toast: "Product created and inserted to ERP with code: 7.124.00001"
- Redirects to products list
- Product appears in table with code and MTRL

### Check Console:
```
🔍 Starting code search from 7.124.00001 (based on DB)
✅ Found available code: 7.124.00001
🔢 Generated available product code: 7.124.00001
🏷️ Brand ID: cmgeu... → Numeric: 5
🔄 Full payload to SoftOne ERP: {
  "username": "Service",
  "password": "Service",
  "company": 1000,
  "CODE": "7.124.00001",
  "NAME": "YEALINK T58W PRO...",
  "MTRUNIT1": 101,
  "VAT": 1410,
  ...
}
📥 SoftOne ERP Response: {
  "success": true,
  "MTRL": 14256,
  ...
}
✅ Product inserted to SoftOne ERP successfully, MTRL: 14256
```

## Test 3: Add Existing Product to ERP

### Steps:
1. Create a product WITHOUT checking "Insert to ERP"
2. Go to product detail page
3. Click **"ADD TO ERP"** button (shows if no MTRL)
4. Confirm the dialog

### Expected Result:
- Toast: "Product added to ERP successfully. Code: 7.124.00002, MTRL: 14257"
- Page refreshes
- Code and MTRL now visible in header
- "ADD TO ERP" button disappears

## Test 4: Edit Translation

### Steps:
1. Go to product detail page
2. Scroll to "TRANSLATIONS" section
3. Click **Edit icon** (pencil) on any translation
4. Modify name, short description, or description
5. Click **"SAVE TRANSLATION"**

### Expected Result:
- Toast: "Translation Updated"
- Page refreshes with new translation

## Test 5: Edit Specification

### Steps:
1. Go to product detail page
2. Click "SPECIFICATIONS" tab
3. Click **Edit icon** (pencil) on any spec
4. Modify spec name or value for any language
5. Click **"SAVE SPECIFICATION"**

### Expected Result:
- Toast: "Specification Updated"
- Page refreshes with new spec values

## Test 6: Delete Specification

### Steps:
1. Go to product detail page
2. Click "SPECIFICATIONS" tab
3. Click **Delete icon** (red trash) on any spec
4. Confirm deletion

### Expected Result:
- Toast: "Specification Deleted"
- Page refreshes, spec is gone

## Test 7: Add Product Images

### Steps:
1. Go to product detail page
2. Click **"ADD IMAGES"** button in images section
3. Upload images via the products manager

### Expected Result:
- Redirects to products page with edit mode
- Can upload/manage images

## Common Issues & Solutions

### Issue: "AI Research Failed"
**Check:**
- DEEPSEEK_API_KEY is valid
- Console shows API error
- Network connection

### Issue: "Product already exists"
**Check:**
- EAN or Manufacturer code already in DB
- Check products table for duplicates

### Issue: "Failed to insert to ERP"
**Check Console for:**
- Full payload sent to ERP
- ERP response
- Error message from SoftOne

**Common causes:**
- Invalid credentials
- Missing required fields
- Code already exists in ERP
- Invalid category/brand/manufacturer codes

### Issue: Greek text is Latin
**Check:**
- AI response in console
- Should see: "Το προιον" not "To proion"
- If wrong, AI prompt needs adjustment

### Issue: Code not saved to DB
**Check:**
- ERP insertion successful?
- Update query executed?
- Console shows MTRL received?

## Success Criteria

✅ AI research completes in 5-10 seconds
✅ Greek translations use Greek alphabet
✅ EAN and Manufacturer codes are different
✅ Code generated: CATEGORY.MANUFACTURER.XXXXX
✅ Product saved to DB with all specs and translations
✅ Product inserted to ERP (if checked)
✅ MTRL and code updated in DB
✅ Product visible in products table
✅ Product detail page shows all data
✅ Can edit translations and specifications
✅ Can delete specifications
✅ "ADD TO ERP" button works for existing products

## Performance Expectations

- AI Research: 5-10 seconds
- Code Generation: < 1 second (DB check + ERP verify)
- ERP Insertion: 2-3 seconds
- Total Creation Time: 8-15 seconds

## Next Steps After Testing

1. If ERP insertion fails, check console logs
2. Share the full payload and response
3. Verify SoftOne credentials
4. Check if category/brand/manufacturer codes are valid in ERP
5. Test with different products
