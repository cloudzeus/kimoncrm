# RFP (Request for Proposal) System - Complete Documentation

## Overview
The RFP system allows users to generate professional pricing documents from site surveys, store pricing data in a database, edit prices, and regenerate Excel files. This system is fully integrated with the site survey wizard Step 3 (Pricing & Review).

---

## System Architecture

### Components

1. **Generation** (Step 3 of Site Survey)
   - Generate RFP from pricing data
   - Create Excel file with professional formatting
   - Store RFP in database
   - Link files to lead

2. **Management** (RFP Pages)
   - List all RFPs
   - View RFP details
   - Edit pricing data
   - Regenerate Excel files

3. **Database**
   - RFP record with status tracking
   - Pricing data stored in `requirements` JSON
   - File versioning system

---

## Features

### ✅ RFP Generation (Step 3)

**Location:** Site Survey Wizard → Step 3 (Pricing & Review)

**Button:** "Generate RFP & Pricing"

**What It Does:**
1. Creates RFP database record with auto-generated RFP number (RFP0001, RFP0002, etc.)
2. Stores all pricing data in `requirements` JSON field
3. Generates professional Excel file with 4 tabs:
   - **PRICING SUMMARY** - Overview with totals
   - **PRODUCTS** - Detailed product pricing
   - **SERVICES** - Detailed services pricing
   - **NOTES** - Additional comments
4. Uploads Excel to BunnyCDN
5. Links file to lead (visible in lead files)
6. Maintains version control (v1, v2, v3...)

**User Flow:**
```
1. Complete Steps 1 & 2 (Infrastructure & Equipment)
2. Review pricing in Step 3
3. Adjust quantities, prices, margins
4. Click "Generate RFP & Pricing"
5. RFP created + Excel generated + File uploaded
6. Success toast shows RFP number and file details
```

### ✅ RFP Management

**Location:** `/rfps` page

**Features:**
- View all RFPs in table format
- See RFP number, customer, lead, status, stage
- Filter and search (table supports sorting)
- Click to view details

### ✅ RFP Detail & Editing

**Location:** `/rfps/[id]` page

**View Mode:**
- See all RFP details (customer, assignee, dates)
- View pricing tables for products and services
- See totals and margins
- Download generated Excel files
- View version history

**Edit Mode:**
- Click "Edit Pricing" button
- Inline editing of:
  - Quantities
  - Unit prices
  - Margins
- Live total calculations
- Save changes to database
- Changes stored in RFP `requirements` JSON

**Regenerate Excel:**
- Click "Regenerate Excel" button
- Generates new Excel file with current pricing data
- Creates new version (v2, v3, etc.)
- Uploads to BunnyCDN
- Links to lead

---

## Database Schema

### RFP Model
```prisma
model RFP {
  id            String   @id @default(cuid())
  rfpNo         String?  @unique        // Auto-generated: RFP0001, RFP0002...
  leadId        String?                  // Link to lead
  title         String                   // From site survey title
  description   String?  @db.Text       // Description
  stage         RFPStage @default(RFP_DRAFTING)
  status        RFPStatus @default(IN_PROGRESS)
  requirements  Json?                    // **PRICING DATA STORED HERE**
  customerId    String                   // Customer link
  contactId     String?                  // Contact link
  assigneeId    String?                  // Assigned user
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  customer      Customer
  contact       Contact?
  lead          Lead?
  assignee      User?
  quotes        Quote[]
  statusChanges RFPStatusChange[]
}
```

### Requirements JSON Structure
```json
{
  "equipment": [
    {
      "id": "eq-123",
      "type": "product",
      "name": "Cisco Catalyst 9300",
      "brand": "CISCO",
      "category": "Network Switch",
      "quantity": 2,
      "price": 2500.00,
      "margin": 15,
      "totalPrice": 5750.00,
      "notes": "Optional notes",
      "infrastructureElement": {
        "buildingName": "Main Building",
        "floorName": "Ground Floor",
        "elementName": "Central Rack"
      },
      "manufacturerCode": "C9300-24P",
      "eanCode": "1234567890123"
    }
  ],
  "generalNotes": "Additional project notes...",
  "totals": {
    "productsSubtotal": 10000.00,
    "productsMargin": 1500.00,
    "productsTotal": 11500.00,
    "servicesSubtotal": 2000.00,
    "servicesMargin": 300.00,
    "servicesTotal": 2300.00,
    "grandTotal": 13800.00
  },
  "generatedAt": "2025-01-15T10:30:00Z",
  "generatedBy": "user@example.com",
  "lastUpdatedAt": "2025-01-16T14:20:00Z",
  "lastUpdatedBy": "user@example.com"
}
```

### RFP Statuses
```typescript
enum RFPStatus {
  DRAFT           // Initial state
  IN_PROGRESS     // Being worked on
  SUBMITTED       // Submitted to customer
  AWARDED         // Won the RFP
  LOST            // Lost the RFP
  CANCELLED       // RFP cancelled
}
```

### RFP Stages
```typescript
enum RFPStage {
  RFP_RECEIVED         // RFP received from customer
  RFP_GO_NO_GO         // Decision phase
  RFP_DRAFTING         // Creating proposal
  RFP_INTERNAL_REVIEW  // Internal review
  RFP_SUBMITTED        // Submitted
  RFP_CLARIFICATIONS   // Answering questions
  RFP_AWARDED          // Won
  RFP_LOST             // Lost
  RFP_CANCELLED        // Cancelled
}
```

---

## API Endpoints

### 1. Generate RFP
**Endpoint:** `POST /api/site-surveys/[id]/generate-rfp`

**Request:**
```json
{
  "equipment": [/* EquipmentItem[] */],
  "generalNotes": "Project notes..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully generated RFP with pricing document",
  "rfp": {
    "id": "clx...",
    "rfpNo": "RFP0005",
    "status": "IN_PROGRESS",
    "stage": "RFP_DRAFTING"
  },
  "file": {
    "filename": "LL001 - RFP Pricing - v1.xlsx",
    "fileId": "clx...",
    "url": "https://cdn.example.com/...",
    "version": 1,
    "productsCount": 15,
    "servicesCount": 5
  },
  "totals": {
    "grandTotal": 13800.00,
    "productsTotal": 11500.00,
    "servicesTotal": 2300.00,
    "totalMargin": 1800.00
  }
}
```

**Features:**
- Creates or updates RFP record
- Generates RFP number (RFP0001, RFP0002...)
- Stores all pricing data in `requirements` JSON
- Generates Excel file
- Uploads to BunnyCDN
- Links file to lead
- Maintains versioning

### 2. Update RFP
**Endpoint:** `PATCH /api/rfps/[id]`

**Request:**
```json
{
  "equipment": [/* Updated EquipmentItem[] */]
}
```

**Response:**
```json
{
  "success": true,
  "message": "RFP updated successfully",
  "rfp": {/* Updated RFP object */}
}
```

**Features:**
- Updates pricing data in `requirements` JSON
- Recalculates all totals
- Tracks last update time and user

### 3. Regenerate Excel
**Endpoint:** `POST /api/rfps/[id]/regenerate-excel`

**Response:**
```json
{
  "success": true,
  "message": "Successfully regenerated pricing Excel",
  "file": {
    "filename": "LL001 - RFP Pricing - v3.xlsx",
    "fileId": "clx...",
    "url": "https://cdn.example.com/...",
    "version": 3,
    "productsCount": 15,
    "servicesCount": 5
  },
  "totals": {
    "grandTotal": 14200.00,
    "productsTotal": 12000.00,
    "servicesTotal": 2200.00
  }
}
```

**Features:**
- Reads current RFP data from database
- Generates fresh Excel file
- Creates new version number
- Uploads to BunnyCDN
- Links to lead

### 4. Get RFP
**Endpoint:** `GET /api/rfps/[id]`

**Response:**
```json
{
  "id": "clx...",
  "rfpNo": "RFP0005",
  "title": "RFP for Site Survey XYZ",
  "status": "IN_PROGRESS",
  "stage": "RFP_DRAFTING",
  "requirements": {/* Full pricing data */},
  "customer": {/* Customer object */},
  "lead": {/* Lead object */},
  "assignee": {/* User object */},
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-16T14:20:00Z"
}
```

---

## Excel File Structure

### Tab 1: PRICING SUMMARY
```
┌─────────────────────────────────────────┐
│     RFP PRICING DOCUMENT                │
├─────────────────────────────────────────┤
│ RFP Number:      RFP0005                │
│ Lead Number:     LL001                  │
│ Customer:        ABC Corporation        │
│ Project:         Office Network Upgrade │
│ Generated:       15/01/2025 10:30       │
├─────────────────────────────────────────┤
│         PRICING SUMMARY                 │
├──────────┬────────┬─────────┬──────────┤
│ Category │ Count  │ Subtotal│ Total    │
├──────────┼────────┼─────────┼──────────┤
│ Products │   15   │ €10,000 │ €11,500  │
│ Services │    5   │  €2,000 │  €2,300  │
├──────────┴────────┴─────────┴──────────┤
│ GRAND TOTAL              €13,800        │
└─────────────────────────────────────────┘
```

### Tab 2: PRODUCTS
- **Columns:** #, Product, Brand, Category, Qty, Unit Price, Margin %, Total, Location, Notes
- **Formatting:** 
  - Currency: €#,##0.00
  - Margins: 0.00%
  - Colors: Teal blue headers
  - Borders: All cells
- **Subtotals:** Shows subtotal, margin, and total
- **Professional styling** with color-coded rows

### Tab 3: SERVICES
- **Columns:** #, Service, Category, Qty, Unit Price, Margin %, Total, Location, Notes
- **Formatting:**
  - Currency: €#,##0.00
  - Margins: 0.00%
  - Colors: Green headers
  - Borders: All cells
- **Subtotals:** Shows subtotal, margin, and total

### Tab 4: NOTES
- **Contains:** General notes and additional comments
- **Layout:** Full-width text area

---

## File Versioning

### Naming Convention
```
{LeadNumber} - RFP Pricing - v{Version}.xlsx
```

Examples:
- `LL001 - RFP Pricing - v1.xlsx`
- `LL001 - RFP Pricing - v2.xlsx`
- `LL001 - RFP Pricing - v3.xlsx`

### Version Management
- **Max versions:** 10 per lead
- **Auto-cleanup:** When generating 11th version, oldest is deleted
- **Version detection:** Scans existing files and increments
- **Storage path:** `leads/{leadId}/rfp-pricing/{timestamp}_{filename}`

### Version Workflow
```
1. Generate RFP → Creates v1
2. Edit pricing → No new file yet
3. Regenerate Excel → Creates v2
4. Edit again → Still v2
5. Regenerate again → Creates v3
... up to v10
11. Generate v11 → Deletes v1, creates v11
```

---

## User Workflows

### Workflow 1: Initial RFP Generation
```
1. Open Site Survey
2. Navigate to Step 3 (Pricing & Review)
3. Review/adjust quantities, prices, margins
4. Add general notes (optional)
5. Click "Generate RFP & Pricing"
6. ✅ RFP created in database
7. ✅ Excel file generated and uploaded
8. ✅ File linked to lead
9. ✅ Success notification
10. File visible in lead files tab
```

### Workflow 2: Edit Pricing & Regenerate
```
1. Go to /rfps page
2. Find RFP in list
3. Click "View" button
4. Click "Edit Pricing" button
5. Adjust quantities, prices, margins
6. See live total updates
7. Click "Save Changes"
8. ✅ Database updated
9. Click "Regenerate Excel"
10. ✅ New Excel file created (v2)
11. ✅ Uploaded to BunnyCDN
12. ✅ Linked to lead
13. Download new file
```

### Workflow 3: Multiple Regenerations
```
1. View RFP
2. Edit prices → Save
3. Regenerate → v2 created
4. Share v2 with customer
5. Customer requests changes
6. Edit prices again → Save
7. Regenerate → v3 created
8. Share v3 with customer
... repeat as needed
```

---

## Integration Points

### Site Survey Integration
- **Step 3:** Generate RFP button
- **Data flow:** Equipment data → RFP → Excel
- **Linked entities:** Lead, Customer, Contact

### Lead Integration
- **Files:** All RFP Excel files linked to lead
- **Visibility:** Appear in lead files tab
- **Naming:** Include lead number for easy identification

### Customer Integration
- **RFP record:** Linked to customer
- **Contact:** Optional contact link
- **History:** Track all RFPs per customer

---

## Color Schemes

### Excel Formatting
- **Dark Blue (#1F4E78):** Main headers
- **Teal Blue (#2E86AB, #4A90A4):** Products section
- **Green (#16A085, #27AE60):** Services section
- **Yellow (#FFD966):** Subtotals
- **Red (#FF6B6B):** Grand total
- **Gray (#7F8C8D):** Notes section

### Status Badges
- **DRAFT:** Gray
- **IN_PROGRESS:** Blue
- **SUBMITTED:** Purple
- **AWARDED:** Green
- **LOST:** Red
- **CANCELLED:** Light gray

---

## Error Handling

### Validation
- ✅ Site survey must exist
- ✅ Site survey must link to lead
- ✅ Equipment array must not be empty
- ✅ All quantities must be > 0
- ✅ All prices must be >= 0

### Error Messages
```typescript
// No equipment
"Please add at least one equipment item before generating RFP"

// Invalid data
"All items must have valid quantities and prices"

// No lead link
"Site survey is not linked to a lead"

// RFP not found
"RFP not found"

// Excel regeneration failure
"Failed to regenerate Excel" + details
```

---

## Testing Checklist

### RFP Generation
- [ ] Generate RFP from site survey step 3
- [ ] Verify RFP number auto-generates (RFP0001, RFP0002...)
- [ ] Verify pricing data stored in `requirements` JSON
- [ ] Verify Excel file generated with all tabs
- [ ] Verify file uploaded to BunnyCDN
- [ ] Verify file linked to lead
- [ ] Verify file appears in lead files tab
- [ ] Verify filename includes lead number
- [ ] Verify version starts at v1
- [ ] Test with products only
- [ ] Test with services only
- [ ] Test with both products and services
- [ ] Test with general notes
- [ ] Test without general notes

### RFP Management
- [ ] View all RFPs in list
- [ ] View RFP details
- [ ] See customer information
- [ ] See pricing tables
- [ ] See totals and margins
- [ ] Click edit pricing
- [ ] Edit quantities
- [ ] Edit prices
- [ ] Edit margins
- [ ] See live total calculations
- [ ] Save changes
- [ ] Verify database updated
- [ ] Click regenerate
- [ ] Verify new version created
- [ ] Verify file uploaded
- [ ] Download file
- [ ] Verify Excel contains updated data

### Versioning
- [ ] Generate v1
- [ ] Regenerate → v2
- [ ] Regenerate → v3
- [ ] Continue to v10
- [ ] Generate v11 → verify v1 deleted
- [ ] Verify max 10 versions maintained
- [ ] Verify version numbers increment correctly
- [ ] Verify old files deleted from BunnyCDN

### Error Handling
- [ ] Try generate without equipment
- [ ] Try generate without lead link
- [ ] Try edit non-existent RFP
- [ ] Try regenerate non-existent RFP
- [ ] Try invalid quantities (0, negative)
- [ ] Try invalid prices (negative)

---

## Future Enhancements

### Phase 2
1. **PDF Generation** - Generate PDF version of pricing
2. **Email Integration** - Send RFP directly to customer
3. **Templates** - Custom Excel templates
4. **Approval Workflow** - Multi-step approval process
5. **Comments System** - Add comments to RFP items
6. **Comparison** - Compare versions side-by-side
7. **Analytics** - RFP win/loss analytics
8. **Bulk Actions** - Edit multiple items at once

### Phase 3
1. **Custom Fields** - Add custom fields to RFP
2. **Pricing Rules** - Auto-apply pricing rules
3. **Discount Management** - Apply discounts
4. **Multi-Currency** - Support multiple currencies
5. **Tax Calculations** - Auto-calculate VAT/taxes
6. **Integration** - Connect to accounting systems
7. **Mobile App** - Mobile RFP management
8. **AI Pricing** - AI-suggested pricing

---

## Summary

The RFP system provides:
- ✅ **Professional pricing documents** from site surveys
- ✅ **Database storage** of all pricing data
- ✅ **Easy editing** of quantities, prices, margins
- ✅ **Excel regeneration** with version control
- ✅ **Lead integration** - files visible in lead files
- ✅ **Version management** - max 10 versions, auto-cleanup
- ✅ **Professional formatting** - color-coded, organized
- ✅ **Complete workflow** - from generation to management

This system streamlines the RFP process and provides professional deliverables for customers while maintaining full pricing control and version history.

---

## Related Documentation

- `INFRASTRUCTURE_FILE_GENERATION.md` - Infrastructure & BOM file generation
- Site Survey Wizard documentation
- Lead management documentation
- File management documentation

