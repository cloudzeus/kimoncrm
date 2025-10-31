# 🔍 Google Custom Search Setup (EASIER ALTERNATIVE!)

## Why Google Instead of Bing?

✅ **Easier to set up** - No Azure marketplace issues
✅ **Works immediately** - No approval needed
✅ **100 free searches per day** - Perfect for product images
✅ **No credit card required** - Truly free
✅ **Better results** - Google's image index

---

## 🚀 Step-by-Step Setup (5 minutes)

### Step 1: Get Google API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. **Sign in** with your Google account
3. If prompted, **create a new project**:
   - Click "SELECT A PROJECT" → "NEW PROJECT"
   - Name: `KimonCRM`
   - Click "CREATE"
4. Click **"+ CREATE CREDENTIALS"** at the top
5. Select **"API key"**
6. **Copy the API key** that appears
7. (Optional) Click "RESTRICT KEY" → Add name: `Image Search Key`

### Step 2: Enable Custom Search API

1. Go to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. Make sure your project is selected at the top
3. Click **"ENABLE"** button
4. Wait 10 seconds for it to activate

### Step 3: Create Search Engine

1. Go to: https://programmablesearchengine.google.com/controlpanel/create
2. Sign in with the **same Google account**
3. Fill in the form:
   - **Search engine name**: `KimonCRM Image Search`
   - **What to search**: Select **"Search the entire web"**
   - **Image search**: Turn **ON** (very important!)
   - **SafeSearch**: Keep enabled
4. Click **"Create"**
5. Click **"Customize"** on your new search engine
6. **Copy the "Search engine ID"** (looks like: `a1b2c3d4e5f6g7h8i`)

### Step 4: Add to Your .env File

Open `/Volumes/EXTERNALSSD/kimoncrm/.env` and add:

```env
GOOGLE_SEARCH_API_KEY=AIzaSyD...your-actual-key-here
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i
```

### Step 5: Restart Server

```bash
# Stop your server (Ctrl+C)
npm run dev
```

### Step 6: Test It! 🎉

1. Go to your Products page
2. Click ⋮ on any product
3. Click **"SEARCH IMAGES"**
4. Search and upload images!

---

## 📊 Google vs Bing Comparison

| Feature | Google Custom Search | Bing Image Search |
|---------|---------------------|-------------------|
| **Setup** | ✅ Easy (3 steps) | ❌ Complex (Azure issues) |
| **Free Tier** | 100 searches/day | 1,000 searches/month |
| **Credit Card** | ❌ Not required | ❌ Not required |
| **Approval** | ✅ Instant | ⚠️ Sometimes delayed |
| **Image Quality** | ✅ Excellent | ✅ Excellent |
| **API Stability** | ✅ Very stable | ⚠️ Marketplace issues |

---

## 💰 Pricing

**Free Tier:**
- ✅ **100 searches per day** = ~3,000 per month
- ✅ Completely free forever
- ✅ No credit card needed
- ✅ Perfect for product image search

**If You Need More:**
- $5 per 1,000 additional queries
- Only pay for what you use beyond free tier

---

## 🔧 How It Works Now

The code has been updated to support **both** Google and Bing:

1. **Tries Google first** (if configured)
2. **Falls back to Bing** (if Google not configured)
3. **Shows clear error** if neither is configured

You can use either one or both!

---

## 🐛 Troubleshooting

### "API key not valid"
- Make sure you **enabled Custom Search API** (Step 2)
- Wait 1-2 minutes after enabling the API
- Check that you copied the key correctly (no spaces)

### "Search engine ID not found"
- Make sure "Search the entire web" is selected
- Make sure "Image search" is turned **ON**
- Try creating a new search engine

### "Quota exceeded"
- Free tier: 100 searches per day
- Resets at midnight Pacific Time
- Upgrade to paid tier if needed (but 100/day is usually enough)

### Still not working?
- Restart your dev server
- Check `.env` file has both values
- Check Google Cloud Console project is correct
- Try in incognito/private browser window

---

## 📝 .env Example

```env
# Google Image Search (RECOMMENDED)
GOOGLE_SEARCH_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g7h8i

# OR Bing (Alternative - only if you prefer Bing)
# BING_IMAGE_SEARCH_API_KEY=your-bing-key-here
```

---

## ✨ Benefits of This Update

✅ **No more Azure marketplace errors**
✅ **Easier setup** (3 steps vs 10 steps)
✅ **Works immediately** (no waiting for approvals)
✅ **More daily searches** (100/day vs 33/day)
✅ **Google's superior image index**
✅ **Automatic fallback** (tries both if configured)

---

## 🎯 Quick Links

- **Get API Key**: https://console.cloud.google.com/apis/credentials
- **Enable API**: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
- **Create Search Engine**: https://programmablesearchengine.google.com/controlpanel/create
- **API Documentation**: https://developers.google.com/custom-search/v1/overview

---

**That's it! Much easier than Bing, right?** 😊

Need help? The setup literally takes 5 minutes and works immediately!

