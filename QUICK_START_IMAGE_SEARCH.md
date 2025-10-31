# 🚀 Quick Start: Product Image Search

## What You Need to Do NOW

### 1. Add Bing API Key to `.env`

Open your `.env` file and add:

```env
BING_IMAGE_SEARCH_API_KEY=your_actual_api_key_here
```

### 2. Get Your FREE Bing API Key (2 minutes)

**Option A: Quick Azure Sign-up**
1. Visit: https://portal.azure.com/
2. Sign in with Microsoft account (or create free account)
3. Search for "Bing Search v7" in the marketplace
4. Click "Create"
5. Fill in:
   - Resource name: `kimoncrm-image-search`
   - Pricing tier: **F1 (Free)** - 1,000 calls/month
   - Resource group: Create new or use existing
6. Click "Create"
7. Go to your new resource → "Keys and Endpoint"
8. Copy **KEY 1**
9. Paste it in your `.env` file

**Option B: Cognitive Services Page**
1. Visit: https://azure.microsoft.com/en-us/try/cognitive-services/my-apis/
2. Sign in with Microsoft account
3. Add "Bing Search v7"
4. Copy the API key
5. Paste it in your `.env` file

### 3. Restart Your Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

### 4. Test It!

1. Go to **Products** page
2. Click three dots (⋮) on any product
3. Click **"SEARCH IMAGES"**
4. Search, select images, check "SET AS DEFAULT" on one
5. Click **"UPLOAD"**
6. Done! ✅

---

## That's It!

**Everything else is already installed and configured:**
- ✅ Sharp package installed
- ✅ Components created
- ✅ Server actions ready
- ✅ UI integrated
- ✅ No TypeScript errors
- ✅ Server-side processing (no CORS issues)
- ✅ WebP conversion
- ✅ BunnyCDN upload
- ✅ Database saving

**You only need to:**
1. Add API key to `.env`
2. Restart server
3. Start using it!

---

## Features Available NOW

✅ Search up to 100 images from Bing
✅ 200x200px thumbnails for fast loading
✅ Multi-select with Select All/Deselect All
✅ Checkbox to set default image (with star icon ⭐)
✅ Automatic WebP conversion
✅ Resize to 1200x1200px max
✅ Upload to BunnyCDN
✅ Save to database
✅ Progress tracking
✅ Error handling
✅ Auto-refresh product list

---

## Need Help?

- **Setup details**: See `IMAGE_SEARCH_SETUP.md`
- **Implementation docs**: See `PRODUCT_IMAGE_SEARCH_IMPLEMENTATION.md`
- **Bing API pricing**: Free tier = 1,000 searches/month
- **Troubleshooting**: Check console logs if images fail to download

---

**Have fun! 🎉**

