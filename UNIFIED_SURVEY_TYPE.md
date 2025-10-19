# Unified Survey Type - COMPREHENSIVE

## Overview
We have consolidated all survey types into a single **COMPREHENSIVE** survey type that handles all infrastructure needs through the comprehensive infrastructure wizard.

## Changes Made

### 1. **Schema Changes**
- Added `COMPREHENSIVE` to `SurveyType` enum in Prisma schema
- Kept legacy types (VOIP, CABLING, WIFI, etc.) for backward compatibility
- Database synced with `prisma db push`

### 2. **Form Changes**
**File**: `components/site-surveys/site-survey-form-dialog.tsx`
- Removed the "Type" dropdown from the UI
- Set default type to "COMPREHENSIVE" for all new surveys
- Simplified form to only show status (type is automatic)

### 3. **API Changes**
**File**: `app/api/site-surveys/route.ts`
- Updated validation schema to support COMPREHENSIVE as default
- Maintains backward compatibility with legacy types

### 4. **UI Cleanup - Site Surveys List Page**
**File**: `app/(main)/site-surveys/page.tsx`
- Removed type-specific dropdown menu items:
  - ❌ "VOIP DETAILS"
  - ❌ "CABLING DETAILS"  
  - ❌ "SHOW DIAGRAM"
- All surveys now use the unified comprehensive wizard

### 5. **UI Cleanup - Site Survey Details Page**
**File**: `app/(main)/site-surveys/[id]/details/page.tsx`
- Removed type-specific action buttons:
  - ❌ "EDIT VOIP DETAILS"
  - ❌ "EDIT CABLING DETAILS"
  - ❌ "NETWORK DIAGRAM"
- Removed type-specific dialogs (VoipSurveyForm, CablingHierarchyForm, NetworkDiagramModal)
- Kept essential buttons:
  - ✅ "DOWNLOAD WORD DOC"
  - ✅ "DOWNLOAD BOM"

## Benefits

### 1. **Simplified User Experience**
- No need to choose survey type - one size fits all
- Consistent interface regardless of infrastructure needs
- Less confusion about which type to select

### 2. **Flexible Infrastructure Management**
- Single wizard handles: VOIP, cabling, WiFi, CCTV, network, and more
- Hierarchical structure supports any infrastructure complexity
- Can document existing and propose future equipment in one place

### 3. **Backward Compatibility**
- Legacy surveys still work
- Old survey types preserved in database
- Gradual migration path

### 4. **Streamlined Development**
- One wizard to maintain instead of multiple type-specific forms
- Consistent data structure
- Easier to add new features

## Migration Path for Existing Surveys

### Legacy Surveys (VOIP, CABLING, etc.)
- Continue to exist in the database
- Can still be viewed and edited
- Type badge still displays correctly
- Generate reports as before

### New Surveys
- All automatically created as COMPREHENSIVE
- Use the unified infrastructure wizard
- Support all infrastructure types in one survey

## User Workflow

### Creating a Survey
1. Click "New Site Survey"
2. Enter title, description, customer, etc.
3. Type is automatically set to "COMPREHENSIVE" (hidden from user)
4. Save and proceed to comprehensive wizard

### Managing Infrastructure
1. Open survey details
2. Use comprehensive infrastructure wizard
3. Add buildings with hierarchical structure
4. Document existing equipment (descriptive)
5. Propose future equipment (product-linked)
6. Associate services with both existing and future items

### Generating Outputs
1. Download Word Doc - Complete survey report
2. Download BOM - Bill of materials for proposals
3. All infrastructure included regardless of type

## Technical Notes

### Type Field Behavior
- **New Surveys**: Type = "COMPREHENSIVE" (auto-assigned)
- **Legacy Surveys**: Type = original value (VOIP, CABLING, etc.)
- **Database**: All types coexist peacefully
- **Forms**: Type field hidden from users

### Comprehensive Wizard Coverage
The unified wizard supports:
- ✅ Buildings & Floors
- ✅ Central Racks & ISP Connections
- ✅ Cable Terminations (all types)
- ✅ Network Equipment (switches, routers, servers)
- ✅ VOIP Equipment (PBX, phone lines, ATA)
- ✅ Security (CCTV, NVR, cameras)
- ✅ IoT Devices
- ✅ Services Association
- ✅ Future Proposals with Product Links

### Removed Features
- ❌ Type selection dropdown in forms
- ❌ Type-specific menu items in dropdowns
- ❌ Separate VOIP/Cabling detail forms
- ❌ Network diagram button (will be integrated into wizard later)

### Retained Features
- ✅ Type badge display (shows survey type)
- ✅ Type icon in survey list
- ✅ Legacy survey support
- ✅ Word document generation
- ✅ BOM generation
- ✅ Files & attachments

## Future Enhancements

1. **Network Diagram Integration**: Add network diagram viewer to comprehensive wizard
2. **Type Migration Tool**: Batch convert legacy surveys to COMPREHENSIVE
3. **Template System**: Save survey templates for common scenarios
4. **Auto-Documentation**: AI-assisted infrastructure documentation

