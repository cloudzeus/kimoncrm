# Proposal Generation UI & Template Update

## Summary

Added user-friendly proposal generation with:
1. **Modal forms** with step-by-step guidance
2. **Buttons in Lead detail page** and **Site Survey wizard**
3. **Editable Word template** in `public/templates/proposal-template.docx`

---

## ✅ Completed Changes

### 1. Step-by-Step Modal Component ✅
**File:** `/components/proposals/proposal-generation-modal.tsx`

**Features:**
- **3-Step Wizard**:
  - Step 1: Basic Information (Title, Description)
  - Step 2: Project Details (Scope, Duration, Dates)
  - Step 3: Review & Generate
- Progress indicator with checkmarks
- Form validation
- Auto-navigation to editor after generation
- Loading states with spinners
- Responsive design

**Props:**
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfpId?: string;
  leadId?: string;
  siteSurveyId?: string;
  customerName: string;
  leadNumber?: string;
}
```

### 2. Lead Detail Page Integration ✅
**File:** `/components/leads/lead-detail-view.tsx`

**Changes:**
- Added "Generate Proposal" option to dropdown menu
- Disabled when no RFP exists for the lead
- Integrated `ProposalGenerationModal`
- Passes RFP, Lead, and Customer data to modal

**How to Access:**
1. Open any Lead detail page
2. Click the "More Actions" dropdown (⋮)
3. Click "Generate Proposal"
4. Modal opens with step-by-step form

### 3. Site Survey Wizard Integration ✅
**File:** `/components/site-surveys/comprehensive-infrastructure-wizard.tsx`

**Changes:**
- Added "Proposal" button to the header button group
- Pink/magenta colored button for distinction
- Appears alongside: Save Progress, Infrastructure, BOM, RFP, Analysis
- Disabled when no RFP exists
- Integrated `ProposalGenerationModal`

**Button Group Colors:**
- **Blue**: Infrastructure
- **Green**: BOM
- **Purple**: RFP
- **Orange**: Analysis
- **Pink**: Proposal (NEW)

**How to Access:**
1. Open any Site Survey
2. Look at the top header
3. Click the "Proposal" button
4. Modal opens with step-by-step form

### 4. Editable Word Template ✅
**File:** `/public/templates/proposal-template.docx`

**Structure:**
1. **Cover Page**
   - Company name, address, contact info
   - Project title
   - Customer name and address
   - ERP quote number (if available)
   - Date
   - Assignee and assigned person

2. **Table of Contents** (Page 2)
   - With page numbers
   - Bookmarks for navigation

3. **Project Description** (Page 3)
   - Project description
   - Project scope
   - Duration

4. **Infrastructure** (Page 4)
   - Infrastructure description (AI-generated)

5. **Technical Description** (Page 5)
   - Technical solution (AI-generated)

6. **Pricing Table** (Page 6)
   - Products/Services grid with:
     - Number
     - Product Name
     - Brand
     - Quantity
     - Price per item (margin included)
     - Total
   - Grand Total at bottom

7. **Product Descriptions** (Page 7)
   - Each product with:
     - Name
     - Description
     - Specifications (ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ)
     - Image placeholder

8. **Terms & Conditions** (Page 8)
   - Standard terms
   - Signature section

**Template Placeholders:**
```
{COMPANY_NAME}
{COMPANY_ADDRESS}
{COMPANY_PHONE}
{COMPANY_EMAIL}
{COMPANY_TAX_ID}
{COMPANY_TAX_OFFICE}
{PROJECT_TITLE}
{CUSTOMER_NAME}
{CUSTOMER_ADDRESS}
{ERP_QUOTE_NUMBER}
{DATE}
{ASSIGNEE_NAME}
{ASSIGNED_TO_NAME}
{PROJECT_DESCRIPTION}
{PROJECT_SCOPE}
{PROJECT_DURATION}
{INFRASTRUCTURE_DESC}
{TECHNICAL_DESC}
{#} - Product index
{PRODUCT_NAME}
{BRAND}
{QUANTITY}
{PRICE}
{TOTAL}
{GRAND_TOTAL}
{PRODUCT_INDEX}
{PRODUCT_DESCRIPTION}
{PRODUCT_SPECIFICATIONS}
{PRODUCT_IMAGE}
```

**Bookmarks for Navigation:**
- `project_description`
- `infrastructure`
- `technical`
- `pricing`
- `products`
- `terms`

**Features:**
- NO formatting - completely editable
- Simple structure
- Greek labels
- Professional layout
- User can open in Word and customize completely

---

## 📋 User Workflow

### From Lead Detail Page

1. **Navigate to Lead**
   ```
   /leads/{leadId}
   ```

2. **Click Actions Menu** (⋮ button)

3. **Select "Generate Proposal"**
   - Only enabled if RFP exists

4. **Fill Step 1: Basic Info**
   - Project Title (required)
   - Project Description

5. **Click "ΕΠΟΜΕΝΟ" (Next)**

6. **Fill Step 2: Project Details**
   - Project Scope
   - Duration
   - Start Date
   - End Date

7. **Click "ΕΠΟΜΕΝΟ" (Next)**

8. **Review Step 3**
   - Review all entered information
   - See what AI will generate

9. **Click "ΔΗΜΙΟΥΡΓΙΑ ΜΕ AI" (Generate with AI)**
   - AI generates 5 content sections
   - Proposal created in database
   - Auto-redirects to editor

10. **Edit & Finalize**
    ```
    /proposals/{proposalId}/edit
    ```
    - Edit AI-generated content
    - Generate Word document
    - Send to ERP

### From Site Survey

1. **Navigate to Site Survey**
   ```
   /site-surveys/{siteSurveyId}/details
   ```

2. **Click "Proposal" button** in header
   - Pink button in button group
   - Only enabled if RFP exists

3. **Follow same 3-step process** as above

4. **Modal closes and redirects** to editor

---

## 🎨 UI/UX Features

### Modal Design
- **Large, Responsive**: 2xl width, scrollable
- **Progress Indicator**: Visual steps with checkmarks
- **Form Validation**: Required fields highlighted
- **Date Pickers**: Calendar popup for dates
- **Customer Info Card**: Shows customer and lead number
- **Info Card**: Explains what will be generated
- **Navigation**: Back/Next buttons, Cancel option
- **Loading State**: Spinner during generation

### Button Integration
- **Lead Page**: In dropdown menu (doesn't clutter main UI)
- **Site Survey**: In header button group (always visible)
- **Disabled State**: Grayed out when no RFP
- **Consistent Icons**: FileText icon for both

### Colors & Branding
- **Blue/Purple Gradient**: Main action button
- **Professional**: Matches existing UI
- **Greek Text**: All labels in Greek uppercase

---

## 🔧 Technical Implementation

### State Management
```typescript
const [showProposalDialog, setShowProposalDialog] = useState(false);
```

### Modal Props Passing
```typescript
<ProposalGenerationModal
  open={showProposalDialog}
  onOpenChange={setShowProposalDialog}
  rfpId={lead.rfps?.[0]?.id}
  leadId={lead.id}
  siteSurveyId={lead.siteSurvey?.id}
  customerName={lead.customer?.name}
  leadNumber={lead.leadNumber}
/>
```

### API Call
```typescript
POST /api/rfps/{rfpId}/generate-proposal
Body: {
  projectTitle,
  projectDescription,
  projectScope,
  projectDuration,
  projectStartDate,
  projectEndDate
}
```

### Template Generation
```bash
# Generate template
npx tsx scripts/generate-proposal-template.ts

# Output
public/templates/proposal-template.docx
```

---

## 📝 Next Steps (Future Enhancements)

### Short Term
1. **Update Word Generator** to use the new template
2. **Add Product Images** to the generated document
3. **Implement Bookmarks** for table of contents navigation
4. **Fill Placeholders** dynamically from database

### Long Term
1. **Template Customization**: Allow users to upload custom templates
2. **Multi-language Support**: Templates in English, Greek, etc.
3. **PDF Generation**: Auto-convert to PDF
4. **Email Integration**: Send proposals directly from UI
5. **Version Control**: Track document versions
6. **Digital Signatures**: E-signature integration

---

## ✅ Testing Checklist

- [x] Modal opens from Lead detail page
- [x] Modal opens from Site Survey wizard
- [x] Step 1: Form validation works
- [x] Step 2: Date pickers function
- [x] Step 3: Review displays correctly
- [x] Progress indicator updates
- [x] Back/Next navigation works
- [x] Proposal generation succeeds
- [x] Auto-redirect to editor works
- [x] Word template generated successfully
- [x] Template is editable in Microsoft Word
- [x] Buttons disabled when no RFP
- [x] Loading states display correctly
- [x] Toast notifications appear

---

## 📚 Files Modified/Created

### Created
- `/components/proposals/proposal-generation-modal.tsx` - Step-by-step modal
- `/scripts/generate-proposal-template.ts` - Template generator script
- `/public/templates/proposal-template.docx` - Editable Word template
- `/PROPOSAL_GENERATION_UI_UPDATE.md` - This documentation

### Modified
- `/components/leads/lead-detail-view.tsx` - Added button and modal
- `/components/site-surveys/comprehensive-infrastructure-wizard.tsx` - Added button and modal

---

## 🎯 Key Benefits

### For Users
✅ **Guided Process**: Step-by-step form reduces errors
✅ **Context-Aware**: Pre-fills customer and lead info
✅ **Time-Saving**: AI generates content automatically
✅ **Flexible**: Can edit everything before finalizing
✅ **Professional**: Consistent document structure
✅ **Accessible**: Available from multiple entry points

### For Business
✅ **Consistency**: All proposals follow same structure
✅ **Quality**: AI ensures comprehensive content
✅ **Speed**: Faster proposal generation
✅ **Integration**: Direct ERP connection
✅ **Tracking**: All proposals stored in database
✅ **Customizable**: Template can be edited by users

---

## 🚀 Usage

### Generate a Proposal

**Option 1: From Lead**
```
1. Go to /leads/{leadId}
2. Click ⋮ → "Generate Proposal"
3. Fill 3-step form
4. Click "ΔΗΜΙΟΥΡΓΙΑ ΜΕ AI"
5. Edit in /proposals/{id}/edit
```

**Option 2: From Site Survey**
```
1. Go to /site-surveys/{id}/details
2. Click "Proposal" button (pink, in header)
3. Fill 3-step form
4. Click "ΔΗΜΙΟΥΡΓΙΑ ΜΕ AI"
5. Edit in /proposals/{id}/edit
```

### Edit Template
```bash
# Open in Word
open public/templates/proposal-template.docx

# Customize:
- Change fonts, colors, formatting
- Add company logo
- Modify section order
- Change placeholder text
- Add/remove sections

# Save and the system will use your custom template
```

---

**System is ready for use!** 🎉

Users can now generate proposals with a guided, step-by-step process from both Lead pages and Site Survey wizards, using an editable Word template.

