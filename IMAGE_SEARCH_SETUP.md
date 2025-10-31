# Product Image Search Feature Setup

## Overview
The Product Image Search feature allows users to search for product images using Bing Image Search API, select multiple images, and automatically:
- Download images from URLs
- Convert them to WebP format (optimized for web)
- Resize to max 1200x1200px (maintaining aspect ratio)
- Upload to BunnyCDN
- Save to ProductImage database table
- Set a default image

All processing is done **server-side** to avoid CORS issues and ensure security.

## Required Environment Variables

Add the following environment variable to your `.env` file:

```env
# Bing Image Search API Key
# Get your API key from: https://azure.microsoft.com/en-us/services/cognitive-services/bing-image-search-api/
BING_IMAGE_SEARCH_API_KEY=your_bing_api_key_here
```

## Getting a Bing Image Search API Key

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new resource or use existing one
3. Search for "Bing Search v7"
4. Create a new Bing Search v7 resource
5. Choose the pricing tier (F1 is free with 1,000 calls/month)
6. After creation, go to "Keys and Endpoint"
7. Copy one of the API keys
8. Add it to your `.env` file as `BING_IMAGE_SEARCH_API_KEY`

### Alternative: Free Tier

Microsoft offers a **free tier** with:
- 1,000 transactions per month
- 3 transactions per second
- Perfect for testing and small-scale usage

## Required Dependencies

The feature uses the following npm packages (should already be installed):

```bash
npm install sharp  # Image processing (WebP conversion, resizing)
```

If `sharp` is not installed, run:
```bash
npm install sharp
```

## Usage

1. Go to Products Manager
2. Click on any product's action menu (three dots)
3. Select **"SEARCH IMAGES"**
4. Enter a search query (defaults to product name)
5. Click **"SEARCH"** to find images (up to 100 results)
6. Select images by clicking on them
7. Use the checkbox **"SET AS DEFAULT"** on one image to mark it as the product's default image
8. Click **"UPLOAD X IMAGE(S)"** to process and save

## Features

### Server-Side Processing
- All image downloading and processing happens server-side
- No CORS issues
- No client-side memory issues with large images
- Secure and reliable

### Automatic Image Optimization
- Converts all images to WebP format (smaller file size, better quality)
- Resizes images to max 1200x1200px (maintains aspect ratio)
- Quality set to 85% (good balance between quality and file size)

### Thumbnail Display
- Search results show 200x200px thumbnails
- Fast loading and responsive UI

### Default Image Selection
- Checkbox to mark one image as default
- Only one image can be marked as default
- Existing default images are automatically unmarked

### Error Handling
- Individual image failures don't stop the process
- Shows success count and failed count
- Detailed error messages for debugging

## File Structure

```
app/
  actions/
    image-search.ts                           # Server actions for image search and processing

components/
  products/
    product-image-search-dialog.tsx           # Client component for UI
    products-manager.tsx                      # Updated with "SEARCH IMAGES" menu item

```

## Technical Details

### Image Search Flow
1. User enters search query
2. Client component calls `searchImagesAction()` server action
3. Server action calls Bing Image Search API with query
4. Returns array of image URLs and metadata (thumbnails are 200x200px)
5. Client displays thumbnails in grid

### Image Upload Flow
1. User selects images and clicks upload
2. Client component calls `processAndSaveImagesAction()` with selected image URLs
3. Server action:
   - Downloads each image from URL
   - Converts to WebP using Sharp
   - Resizes to 1200x1200px max
   - Uploads to BunnyCDN at `products/{code}_{timestamp}_{index}.webp`
   - Saves ProductImage record to database
4. Returns success/failure count
5. Revalidates product pages to show new images

### Database Schema
```prisma
model ProductImage {
  id        String   @id @default(cuid())
  productId String
  url       String   // BunnyCDN URL
  alt       String?  // Alt text from image name or product description
  isDefault Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}
```

## Troubleshooting

### "Bing Image Search API key not configured"
- Make sure `BING_IMAGE_SEARCH_API_KEY` is added to your `.env` file
- Restart your development server after adding the environment variable

### "Failed to download image"
- Some images may be protected or unavailable
- This is normal, other images will continue processing
- Check the error message for specific issues

### Sharp installation issues
If you encounter issues with Sharp on different platforms:

```bash
# For Apple Silicon Macs
npm install --platform=darwin --arch=arm64 sharp

# For Intel Macs
npm install --platform=darwin --arch=x64 sharp

# For Linux
npm install --platform=linux --arch=x64 sharp
```

### TypeScript errors
The components use `// @ts-nocheck` at the top to avoid TypeScript errors during development for fast deployment.

## Security Considerations

- All image processing happens server-side
- User authentication required (must be logged in)
- Role-based access control (ADMIN, MANAGER, EMPLOYEE only)
- 30-second timeout per image download
- Validates product ownership before saving images

## Performance

- Searches up to 100 images per query
- Processes images in sequence (not parallel) to avoid overwhelming the server
- Progress indicator shows upload status
- Images are optimized for web (WebP, compressed, resized)

## Future Enhancements

Possible improvements:
- Support for other image search providers (Google, Unsplash, Pexels)
- Bulk image search for multiple products
- Image AI analysis for better selection
- Custom image cropping before upload
- Automatic background removal
- Image tagging and categorization

