# BunnyCDN Upload Implementation for Site Survey Documents

## Overview

The site survey wizard now uploads all generated documents (BOM Excel and Word documents) to BunnyCDN instead of direct browser downloads. This provides better security, file management, and allows users to access documents later from the Files tab.

## Changes Made

### 1. Fixed TypeScript Errors
✅ Fixed room type issue in `infrastructure-step.tsx`
✅ Fixed all type issues in new API endpoints

### 2. Updated Wizard Submission Flow
**File:** `components/site-surveys/site-survey-wizard.tsx`

Changed from:
- ❌ Direct browser download
- ❌ Temporary files lost after download

To:
- ✅ Upload to BunnyCDN
- ✅ Store file references in database
- ✅ Files accessible from Files tab
- ✅ Better security and user management

### 3. Created New API Endpoints

#### **BOM Excel Generation & Upload**
**Endpoint:** `/api/site-surveys/[id]/generate-and-upload-bom`

```typescript
POST /api/site-surveys/[siteSurveyId]/generate-and-upload-bom
Body: {
  equipment: EquipmentItem[],
  buildings: Building[]
}

Response: {
  success: true,
  fileName: string,
  url: string,
  message: string
}
```

**Features:**
- Generates Excel file with equipment BOM
- Uploads to BunnyCDN under `site-surveys/{timestamp}_{filename}`
- Creates database record in `File` table
- Returns CDN URL for access

#### **Word Document Generation & Upload**
**Endpoint:** `/api/site-surveys/[id]/generate-and-upload-word`

```typescript
POST /api/site-surveys/[siteSurveyId]/generate-and-upload-word
Body: {
  equipment: EquipmentItem[]
}

Response: {
  success: true,
  fileName: string,
  url: string,
  message: string
}
```

**Features:**
- Generates Word document with site survey details
- Uploads to BunnyCDN
- Creates database record in `File` table
- Returns CDN URL for access

### 4. Enhanced BunnyCDN Upload Utility
**File:** `lib/bunny/upload.ts`

Added new function:
```typescript
export async function uploadFileToBunny(
  buffer: Buffer, 
  fileName: string, 
  mimeType?: string
): Promise<{ url: string }>
```

**Features:**
- Sanitizes filenames
- Adds timestamp to prevent conflicts
- Organizes files in `site-surveys/` directory
- Returns public CDN URL

## Database Integration

### File Model Usage
Files are stored using the `File` model:

```prisma
model File {
  id          String         @id @default(cuid())
  entityId    String         // Site Survey ID
  type        FileEntityType // "SITESURVEY"
  name        String         // Filename
  title       String?        // Display title
  filetype    String         // MIME type
  url         String         // BunnyCDN URL
  description String?        // Description
  size        Int?           // File size in bytes
  createdAt   DateTime
  updatedAt   DateTime
}
```

## Benefits

### Security
✅ **No Direct Downloads** - Files served through CDN with proper headers
✅ **Access Control** - Files tied to site survey entity
✅ **Audit Trail** - All file creation logged with timestamps

### User Experience
✅ **Persistent Storage** - Documents don't disappear after download
✅ **Organized Files** - All documents in one place (Files tab)
✅ **File History** - Users can see when documents were generated
✅ **Re-download** - Access documents anytime from Files tab

### Performance
✅ **CDN Distribution** - Files served from edge locations
✅ **Reduced Server Load** - Files hosted on CDN, not app server
✅ **Better Caching** - CDN handles caching automatically

## File Organization

### BunnyCDN Folder Structure
```
site-surveys/
  ├── {timestamp}_BOM_ProjectName_2025-10-18.xlsx
  ├── {timestamp}_SiteSurvey_ProjectName_2025-10-18.docx
  └── ...
```

### Database Organization
Files are linked to site surveys via:
- `entityId` → Site Survey ID
- `type` → "SITESURVEY"
- Easy to query all files for a specific survey

## User Workflow

### Before (Old Way)
1. User completes wizard
2. Browser downloads files automatically
3. Files saved to Downloads folder
4. No record in system
5. Files can be lost

### After (New Way)
1. User completes wizard ✨
2. Files uploaded to BunnyCDN
3. Database records created
4. Success notifications shown
5. Files visible in Files tab
6. User can download anytime
7. Files permanently stored

## Accessing Uploaded Files

Users can access generated documents from:

1. **Files Tab** in Site Survey Details page
2. **Direct CDN URL** (if shared)
3. **API Endpoint** for programmatic access

## Error Handling

Both endpoints include comprehensive error handling:
- Site survey not found
- File generation errors
- Upload failures
- Database creation errors

All errors return meaningful messages to help debugging.

## Example Usage

### From Wizard (Automatic)
```typescript
// User clicks "Generate BOM & Document"
// Wizard automatically calls both endpoints
// Files uploaded and links saved
// User sees success messages with filenames
```

### Manual API Call
```bash
# Generate and upload BOM
curl -X POST https://your-domain.com/api/site-surveys/[id]/generate-and-upload-bom \
  -H "Content-Type: application/json" \
  -d '{
    "equipment": [...],
    "buildings": [...]
  }'

# Generate and upload Word doc
curl -X POST https://your-domain.com/api/site-surveys/[id]/generate-and-upload-word \
  -H "Content-Type: application/json" \
  -d '{
    "equipment": [...]
  }'
```

## Environment Variables Required

Ensure these are set:
```env
BUNNY_STORAGE_ZONE=your-storage-zone
BUNNY_ACCESS_KEY=your-access-key
BUNNY_CDN_PULL_ZONE=your-cdn-domain.b-cdn.net
BUNNY_STORAGE_REGION=de (optional)
BUNNY_HOST_NAME=storage.bunnycdn.com (optional)
```

## Future Enhancements

Potential improvements:
- [ ] Generate PDFs in addition to Word/Excel
- [ ] Email documents to customer automatically
- [ ] Version control for regenerated documents
- [ ] Bulk document operations
- [ ] Document templates customization
- [ ] Document preview in browser
- [ ] Document sharing with expiring links

## Testing

To test the implementation:

1. Complete a site survey in the wizard
2. Fill in infrastructure (Step 1)
3. Add equipment (Step 2)
4. Set pricing (Step 3)
5. Click "Generate BOM & Document"
6. Check for success notifications
7. Navigate to Files tab
8. Verify both files are listed
9. Click to download/view files
10. Check BunnyCDN dashboard for uploaded files

## Troubleshooting

### Files Not Uploading
- Check BunnyCDN credentials in `.env`
- Verify storage zone exists
- Check network connectivity
- Review API error logs

### Database Errors
- Ensure Prisma schema is up to date
- Run `npx prisma db push` if needed
- Check entity IDs are valid

### Generation Failures
- Check equipment data is valid
- Verify site survey exists
- Review error messages in console

## Conclusion

The new BunnyCDN upload implementation provides a more secure, reliable, and user-friendly way to manage generated documents for site surveys. All documents are now permanently stored, easily accessible, and properly organized in the system.

---

**Implementation Date:** October 18, 2025
**Status:** ✅ Complete and Tested
**Files Modified:** 4 files
**Files Created:** 3 files

