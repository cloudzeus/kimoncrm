# Product Image Search - Multiple API Support

## 🎯 Best Setup for Product Images

Your image search now supports **4 providers** with automatic fallback!

### Recommended: Add SerpAPI + Pexels

**Why these two?**
- ✅ **SerpAPI** = Real Google Images results (best for finding actual product photos)
- ✅ **Pexels** = High-quality stock photos (great backup, generous limits)
- ✅ Combined: 20,000+ searches per month FREE

---

## 🚀 Quick Setup

### Option 1: SerpAPI (BEST for Product Images) ⭐

**Real Google Images results - finds actual product photos**

1. Go to: https://serpapi.com/users/sign_up
2. Sign up (email + password)
3. Go to Dashboard: https://serpapi.com/dashboard
4. Copy your API key
5. Add to `.env`:
   ```env
   SERPAPI_API_KEY=your_key_here
   ```

**Free Tier:**
- 100 searches per month FREE
- $50/month for 5,000 searches
- $125/month for 15,000 searches

**Perfect for:** Finding actual product images from the web

---

### Option 2: Pexels (High-Quality Stock Photos) ⭐

**Professional stock photos - great for product displays**

1. Go to: https://www.pexels.com/api/
2. Click "Get Started"
3. Sign up with email
4. Your API key is shown immediately
5. Add to `.env`:
   ```env
   PEXELS_API_KEY=your_key_here
   ```

**Free Tier:**
- 200 requests per hour
- 20,000 requests per month
- Completely FREE forever

**Perfect for:** High-quality product display images

---

## 📊 Current Setup (You Already Have)

### Google Custom Search ✅
```env
GOOGLE_SEARCH_API_KEY=AIzaSyDrWSRds2EalBKx2nOpK9_hBRW3aAYC5rg
GOOGLE_SEARCH_ENGINE_ID=d5b1ea337fb744a49
```
- ✅ 100 searches per day
- ✅ Already configured

---

## 🔄 How It Works (Automatic Fallback)

The system tries providers in this order:

1. **SerpAPI** (if configured)
   - Real Google Images
   - Best for products
   
2. **Pexels** (if configured)
   - High-quality stock photos
   - Great for product displays

3. **Google Custom Search** ✅ (you have this)
   - Good general results
   - 100/day limit

4. **Bing** (if configured)
   - Microsoft's image search
   - 1,000/month

**If one fails or hits limits, it automatically tries the next one!**

---

## 💡 Recommended Setup

### For Maximum Search Capacity:

Add **both** SerpAPI and Pexels:

```env
# .env file
SERPAPI_API_KEY=your_serpapi_key
PEXELS_API_KEY=your_pexels_key
GOOGLE_SEARCH_API_KEY=AIzaSyDrWSRds2EalBKx2nOpK9_hBRW3aAYC5rg
GOOGLE_SEARCH_ENGINE_ID=d5b1ea337fb744a49
```

**Total FREE searches:**
- SerpAPI: 100/month
- Pexels: 20,000/month
- Google: 3,000/month (100/day)
- **Total: 23,000+ searches/month!** 🎉

---

## 🎯 Which Provider Finds What?

### SerpAPI (Google Images)
- ✅ **Best for:** Finding actual product photos from online stores
- ✅ Shows real products from Amazon, eBay, manufacturer sites
- ✅ Most accurate product matches
- ✅ Multiple angles and variations

**Example:** Search "Cisco switch 2960" → finds real Cisco switches

### Pexels
- ✅ **Best for:** Professional product photography
- ✅ High-quality stock images
- ✅ Clean backgrounds, studio lighting
- ✅ Perfect for catalogs/presentations

**Example:** Search "laptop" → finds professional laptop photos

### Google Custom Search (Your Current)
- ✅ **Best for:** General web images
- ✅ Mix of products, stock photos, diagrams
- ✅ Good variety

### Bing
- ✅ **Best for:** Alternative to Google
- ✅ Similar to Google but different index
- ✅ Good backup

---

## 🚀 Quick Start (5 minutes)

### Just Add SerpAPI:

1. Go to: https://serpapi.com/users/sign_up
2. Sign up
3. Copy API key from: https://serpapi.com/dashboard
4. Add to `.env`:
   ```env
   SERPAPI_API_KEY=paste_key_here
   ```
5. Restart server: `npm run dev`
6. Done! You now have real Google Images results! 🎉

---

## 📈 Usage Stats

The app shows which provider was used in the console:
```javascript
// After search, you'll see:
{ success: true, images: [...], provider: "serpapi" }
// or
{ success: true, images: [...], provider: "pexels" }
```

---

## 🔧 No Code Changes Needed!

Everything is already implemented:
- ✅ Multiple provider support
- ✅ Automatic fallback
- ✅ Error handling
- ✅ Same UI for all providers

Just add API keys to `.env` and restart!

---

## 💰 Cost Comparison

| Provider | Free Limit | Paid Plan | Best For |
|----------|-----------|-----------|----------|
| **SerpAPI** | 100/month | $50 = 5,000 | Real products |
| **Pexels** | 20,000/month | Always free | Stock photos |
| **Google** | 100/day | $5 = 1,000 | General |
| **Bing** | 1,000/month | $5 = 1,000 | Alternative |

**Recommendation:** Use SerpAPI (100 free) + Pexels (20K free) for best results!

---

## 🎉 Ready to Use!

Your image search now supports multiple providers with automatic fallback. Just add the API keys you want and the system will use them automatically!

**Need more searches?** Add SerpAPI + Pexels for 20,000+ free monthly searches! 🚀

