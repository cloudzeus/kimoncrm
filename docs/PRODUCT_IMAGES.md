# Product Images System Documentation

## Overview

The Product Images system provides a complete image management solution for products with canvas-based editing, WebP conversion, transparency preservation, and BunnyCDN storage.

## Features

### 1. Database Schema

```prisma
model ProductImage {
  id          String   @id @default(cuid())
  productId   String
  url         String   // BunnyCDN URL
  alt         String?  // Alt text from short description
  isDefault   Boolean  @default(false)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}
```

**Fields**:
- `id`: Unique identifier
- `productId`: Link to product (cascades on delete)
- `url`: Full BunnyCDN URL (e.g., `https://kimoncrm.b-cdn.net/products/product_123.webp`)
- `alt`: Alt text (automatically populated from Greek short description)
- `isDefault`: Whether this is the primary product image
- `order`: Display order (for sorting)

### 2. Image Processing Features

#### Canvas Editor (1280x1280)
- **Fixed Size**: All images exported at 1280x1280 pixels
- **Drag & Drop**: Position image within canvas
- **Zoom**: Scale image up/down (10% increments)
- **Visual Feedback**: Checkerboard background shows transparency
- **Real-time Preview**: See exactly what will be uploaded

#### WebP Conversion
- **Format**: All images converted to WebP
- **Quality**: 95% (high quality, good compression)
- **Transparency**: Fully preserved from source image
- **Browser Support**: Uses native canvas API `toBlob('image/webp')`

#### Supported Input Formats
- PNG (transparency preserved)
- JPEG
- GIF
- WebP
- BMP
- SVG

### 3. BunnyCDN Integration

#### Storage Path
All product images stored in: `products/` folder

**Filename Pattern**:
```
{productCode}_{timestamp}.webp

Examples:
- 3001_1696258432123.webp
- UAP001_1696258432456.webp
```

#### CDN URLs
```
https://kimoncrm.b-cdn.net/products/{filename}
```

Global CDN delivery with edge caching.

### 4. API Endpoints

#### GET /api/products/[id]/images
Get all images for a product

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "productId": "...",
      "url": "https://kimoncrm.b-cdn.net/products/3001_123.webp",
      "alt": "Professional wireless access point. EAN: 3001",
      "isDefault": true,
      "order": 0,
      "createdAt": "2025-10-12T..."
    }
  ]
}
```

#### POST /api/products/[id]/images
Upload new product image

**Request**: `multipart/form-data`
- `file`: Image file (WebP blob from canvas)
- `order`: Display order (number)
- `isDefault`: Whether this is the default image (boolean)

**Process**:
1. Validates product exists
2. Gets Greek short description for alt text
3. Generates unique filename
4. Uploads to BunnyCDN (`products/` folder)
5. Creates database record
6. If set as default, unsets other defaults

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "url": "https://kimoncrm.b-cdn.net/products/...",
    "alt": "...",
    "isDefault": false,
    "order": 1
  }
}
```

#### DELETE /api/products/[id]/images?imageId={id}
Delete product image

**Process**:
1. Validates image belongs to product
2. Deletes from BunnyCDN
3. Deletes from database
4. Continues even if CDN delete fails (graceful degradation)

### 5. User Interface

#### Access Point
From products table:
1. Click **three dots** (⋮) next to product
2. Select **IMAGES** from dropdown
3. Dialog opens with image manager

#### Image Upload Workflow

**Step 1: Select Image**
- Click "Upload Image" button
- Choose image file from computer
- Multiple formats supported

**Step 2: Edit on Canvas**
- Image loads into 1280x1280 canvas
- Checkerboard background shows transparency
- **Drag** image to position
- **Zoom In/Out** buttons to scale
- Scale percentage displayed
- Real-time preview

**Step 3: Save & Upload**
- Click "Save & Upload"
- Image converted to WebP (95% quality)
- Transparency preserved
- Uploaded to BunnyCDN
- Database record created
- Alt text auto-populated from product translation

#### Image Gallery
- **Grid Layout**: 4 columns
- **Thumbnail Preview**: Square aspect ratio
- **Default Badge**: Yellow star badge on primary image
- **Delete Button**: Red trash icon (top-right)
- **Alt Text**: Shown below thumbnail
- **Empty State**: Helpful message when no images

### 6. Alt Text Management

**Automatic Population**:
```typescript
// Gets Greek (el) short description
const product = await prisma.product.findUnique({
  include: {
    translations: {
      where: { languageCode: 'el' },
      select: { shortDescription: true },
    },
  },
});

const altText = product.translations[0]?.shortDescription || product.name;
```

**Fallback**: Uses product name if no translation exists.

### 7. Default Image Handling

When setting an image as default:
```typescript
// Unset all other defaults for this product
await prisma.productImage.updateMany({
  where: {
    productId: id,
    isDefault: true,
  },
  data: {
    isDefault: false,
  },
});
```

Only one default image per product allowed.

### 8. Technical Implementation

#### Canvas Manipulation
```typescript
// Draw image with positioning and scaling
ctx.drawImage(
  image,
  position.x,
  position.y,
  image.width * scale,
  image.height * scale
);

// Convert to WebP with transparency
canvas.toBlob(
  (blob) => { /* upload */ },
  'image/webp',
  0.95  // 95% quality
);
```

#### Drag & Drop
- Mouse down: Start drag
- Mouse move: Update position
- Mouse up: End drag
- Cursor changes to `move` during drag

#### Zoom Controls
- Zoom In: Scale + 0.1 (max 3.0x)
- Zoom Out: Scale - 0.1 (min 0.1x)
- Display: Shows percentage (e.g., "150%")

### 9. Environment Variables

Uses existing BunnyCDN configuration:
```env
BUNNY_STORAGE_ZONE=kimoncrm
BUNNY_STORAGE_REGION=de
BUNNY_HOST_NAME=storage.bunnycdn.com
BUNNY_ACCESS_KEY=your-access-key
BUNNY_CDN_PULL_ZONE=kimoncrm.b-cdn.net
```

### 10. Image Specifications

**Output Format**:
- Size: 1280x1280 pixels (fixed)
- Format: WebP
- Quality: 95%
- Transparency: Preserved from source
- Color Space: RGB/RGBA

**Why 1280x1280?**
- Sufficient for product detail pages
- Good balance of quality vs. file size
- Square aspect ratio (consistent display)
- Responsive-friendly (scales down well)

### 11. Use Cases

#### Single Product Image
1. Upload one image
2. Automatically set as default
3. Used on product pages, catalogs

#### Multiple Product Images
1. Upload first image → default
2. Upload additional angles/views
3. Reorder by drag-and-drop (future)
4. Gallery display on product page

#### Product with Transparency
1. Upload PNG with transparent background
2. Canvas shows checkerboard (verifies transparency)
3. WebP conversion preserves alpha channel
4. Perfect for logos, icons, product cutouts

### 12. Data Protection

**Cascade Delete**:
When product is deleted, all images are:
1. Deleted from database (automatic via Prisma)
2. **Note**: CDN files persist (manual cleanup needed or scheduled job)

**Access Control**:
- View: All authenticated users
- Upload: ADMIN, MANAGER, EMPLOYEE
- Delete: ADMIN, MANAGER, EMPLOYEE

### 13. Performance Considerations

**Client-Side**:
- Canvas rendering in browser
- No server processing for image editing
- WebP conversion uses browser native API
- Responsive feedback during upload

**Server-Side**:
- Direct upload to BunnyCDN (no local storage)
- Minimal processing (just receive and forward)
- Async file handling

**CDN Benefits**:
- Global edge caching
- Fast delivery worldwide
- Bandwidth optimization
- Automatic HTTPS

### 14. Future Enhancements

Potential improvements:
1. **Drag-and-drop file upload** (drop zone)
2. **Bulk upload** (multiple images at once)
3. **Image reordering** (drag to change order)
4. **Image cropping tools**
5. **Filters and adjustments** (brightness, contrast)
6. **Auto-background removal** (AI-powered)
7. **Batch processing** (apply edits to multiple images)
8. **Image optimization** (automatic compression)
9. **CDN cleanup job** (remove orphaned files)
10. **Image variants** (thumbnail, medium, large)

### 15. Example Workflow

```
User clicks "IMAGES" → Dialog opens
↓
Click "Upload Image" → File picker
↓
Select image (e.g., product.png)
↓
Image loads in canvas (1280x1280)
↓
Drag to position, zoom to fit
↓
Click "Save & Upload"
↓
Canvas → WebP conversion (95% quality)
↓
Upload to BunnyCDN: products/3001_123.webp
↓
Database record created with alt text
↓
Image appears in gallery
```

### 16. Troubleshooting

#### Canvas not showing image
**Check**: Browser console for errors, file format support

#### Upload fails
**Check**: 
- BunnyCDN credentials in `.env`
- Network connectivity
- File size limits

#### Transparency lost
**Check**: 
- Source image has alpha channel
- WebP conversion quality setting
- Browser WebP support

#### Alt text missing
**Check**:
- Product has Greek translation
- Short description is populated
- Falls back to product name

## File Structure

```
/Volumes/EXTERNALSSD/kimoncrm/
├── app/api/products/[id]/images/
│   └── route.ts                              # Image CRUD operations
├── components/products/
│   ├── product-images-dialog.tsx             # Image manager UI
│   └── products-manager.tsx                  # Added IMAGES action
├── prisma/
│   └── schema.prisma                         # ProductImage model
└── lib/bunny/
    └── upload.ts                             # BunnyCDN utilities
```

## Related Documentation

- [PRODUCTS_SYSTEM.md](./PRODUCTS_SYSTEM.md) - Main products system
- [PRODUCTS_TRANSLATIONS.md](./PRODUCTS_TRANSLATIONS.md) - Translation system (provides alt text)

---

**Last Updated**: October 12, 2025
**Version**: 1.0.0
**Image Format**: WebP (1280x1280)
**Storage**: BunnyCDN (products/ folder)

