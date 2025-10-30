# Comprehensive Proposal Generation System

## Overview

A complete AI-powered proposal generation system has been implemented that allows users to:
1. Generate comprehensive technical proposals from RFP data
2. Use AI to create technical descriptions in Greek
3. Edit AI-generated content
4. Generate professional Word documents
5. Integrate with SoftOne ERP to create official quotes

---

## 🗄️ Database Schema

### New Model: `Proposal`
**Location:** `/prisma/schema.prisma`

```prisma
model Proposal {
  id                    String          @id @default(cuid())
  proposalNo            String?         @unique
  rfpId                 String
  leadId                String?
  siteSurveyId          String?
  customerId            String
  contactId             String?
  
  // Basic Project Information (User Input)
  projectTitle          String
  projectDescription    String?         @db.Text
  projectScope          String?         @db.Text
  projectDuration       String?
  projectStartDate      DateTime?
  projectEndDate        DateTime?
  
  // AI-Generated Technical Content
  infrastructureDesc    String?         @db.LongText
  technicalDesc         String?         @db.LongText
  productsDesc          String?         @db.LongText
  servicesDesc          String?         @db.LongText
  scopeOfWork           String?         @db.LongText
  
  // Proposal Status & ERP Integration
  status                ProposalStatus  @default(DRAFT)
  stage                 ProposalStage   @default(CONTENT_GENERATION)
  erpQuoteNumber        String?         // From SoftOne (FINCODE)
  erpSeries             Int?            // From SoftOne (SERIES)
  erpSeriesNum          Int?            // From SoftOne (SERIESNUM)
  erpFindoc             Int?            // From SoftOne (FINDOC)
  erpSaldocnum          Int?            // From SoftOne (SALDOCNUM)
  erpTurnover           Decimal?        @db.Decimal(12, 2)
  erpVatAmount          Decimal?        @db.Decimal(12, 2)
  
  // Document Files
  wordDocumentUrl       String?
  pdfDocumentUrl        String?
  
  // Metadata
  generatedBy           String
  submittedDate         DateTime?
  approvedDate          DateTime?
  notes                 String?         @db.Text
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
}

enum ProposalStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  SENT_TO_CUSTOMER
  ACCEPTED
  REJECTED
  REVISION_REQUESTED
}

enum ProposalStage {
  CONTENT_GENERATION
  TECHNICAL_REVIEW
  PRICING_REVIEW
  ERP_INTEGRATION
  DOCUMENT_GENERATION
  READY_TO_SEND
  SUBMITTED
  NEGOTIATION
  CLOSED
}
```

**Database sync:** Schema has been pushed to MySQL database with `prisma db push`.

---

## 🤖 AI Integration

### Proposal Content Generator
**Location:** `/lib/ai/proposal-generator.ts`

**Features:**
- Uses DeepSeek AI API for content generation
- Generates content in Greek with uppercase without accents (ANSI compliance)
- Creates comprehensive technical descriptions based on:
  - Customer information
  - Project details
  - Infrastructure data from site survey
  - Products and services from RFP
  
**Functions:**
1. `generateProposalContent(data)` - Generate all proposal sections
2. `refineProposalContent(existing, feedback, section)` - Edit content based on user feedback

**AI Output Sections:**
- Infrastructure Description (ΥΠΟΔΟΜΗ)
- Technical Description (ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ)
- Products Description (ΠΡΟΪΟΝΤΑ)
- Services Description (ΥΠΗΡΕΣΙΕΣ)
- Scope of Work (ΕΜΒΕΛΕΙΑ ΕΡΓΑΣΙΩΝ)

---

## 🌐 API Endpoints

### 1. Generate Proposal from RFP
**POST** `/api/rfps/[id]/generate-proposal`

Creates a new proposal with AI-generated content from an RFP.

**Request Body:**
```json
{
  "projectTitle": "ΑΝΑΒΑΘΜΙΣΗ ΔΙΚΤΥΑΚΗΣ ΥΠΟΔΟΜΗΣ",
  "projectDescription": "Αναβάθμιση...",
  "projectScope": "Σκοπός...",
  "projectDuration": "3 μήνες",
  "projectStartDate": "2025-01-01T00:00:00Z",
  "projectEndDate": "2025-04-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "proposal": {
    "id": "...",
    "projectTitle": "...",
    "infrastructureDesc": "AI-generated content...",
    "technicalDesc": "AI-generated content...",
    ...
  },
  "message": "Proposal created successfully with AI-generated content"
}
```

### 2. Get Proposal
**GET** `/api/proposals/[id]`

Retrieve a proposal with all related data.

### 3. Update Proposal
**PATCH** `/api/proposals/[id]`

Update proposal fields (including editing AI-generated content).

**Request Body:**
```json
{
  "infrastructureDesc": "Updated content...",
  "technicalDesc": "Updated content...",
  "productsDesc": "Updated content...",
  "servicesDesc": "Updated content...",
  "scopeOfWork": "Updated content...",
  "status": "IN_REVIEW",
  "stage": "TECHNICAL_REVIEW"
}
```

### 4. Generate Word Document
**POST** `/api/proposals/[id]/generate-document`

Generate a professional Word document and upload to BunnyCDN.

**Response:**
```json
{
  "success": true,
  "proposal": {...},
  "file": {
    "url": "https://...",
    "filename": "Proposal_ProjectName.docx"
  },
  "message": "Proposal document generated successfully"
}
```

### 5. Send to ERP
**POST** `/api/proposals/[id]/send-to-erp`

Send proposal to SoftOne ERP and get official quote number.

**SoftOne Request:**
```json
{
  "username": "Service",
  "password": "Service",
  "SERIES": "7001",
  "TRDR": "15835",
  "COMMENTS": "Πρόταση: ...",
  "MTRLINES": [
    { "MTRL": "14266", "QTY1": 1, "PRICE": 100.00 },
    { "MTRL": "14265", "QTY1": 2, "PRICE": 35.50 }
  ]
}
```

**SoftOne Response:**
```json
{
  "success": true,
  "errorcode": 200,
  "error": "No Errors",
  "SALDOCNUM": 68462,
  "FINDOC": 68462,
  "SERIES": 7001,
  "SERIESNUM": 393,
  "FINCODE": "ΠΡΦ0000393",
  "COMMENTS": "",
  "TURNOVR": 810,
  "VATAMNT": 194.4
}
```

**Our Response:**
```json
{
  "success": true,
  "proposal": {...},
  "erp": {
    "quoteNumber": "ΠΡΦ0000393",
    "series": 7001,
    "seriesNum": 393,
    ...
  },
  "message": "Proposal successfully created in ERP with quote number: ΠΡΦ0000393"
}
```

---

## 📄 Word Document Generator

### Full Proposal Generator
**Location:** `/lib/word/full-proposal-generator.ts`

**Features:**
- Uses `docx` library for professional Word documents
- Multi-page comprehensive proposal
- Greek language throughout
- Professional styling with company branding

**Document Structure:**
1. **Cover Page**
   - Company information (name, address, phone, email, tax ID)
   - Document title: "ΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ"
   - Project title
   - Customer information
   - ERP quote number (if available)
   - Date

2. **Project Overview (Page 2)**
   - Project description
   - Project scope
   - Duration and dates

3. **Infrastructure Description (Page 3)**
   - AI-generated infrastructure analysis
   - Network topology
   - Building descriptions

4. **Technical Description (Page 4)**
   - AI-generated technical solution
   - Technology stack
   - Implementation approach

5. **Products Description (Page 5)**
   - AI-generated product descriptions
   - Organized by category and brand

6. **Services Description (Page 6)**
   - AI-generated service descriptions
   - Installation, configuration, support

7. **Scope of Work (Page 7)**
   - AI-generated scope of work
   - Deliverables
   - Timeline

8. **Financial Proposal (Page 8)**
   - Products pricing table
   - Services pricing table
   - Grand total with formulas
   - All prices exclude VAT

9. **Terms & Conditions (Page 9)**
   - Proposal validity (30 days)
   - Warranty (2 years)
   - Installation terms
   - Payment terms (50% advance, 50% on completion)
   - Signature section

---

## 🎨 React Components

### 1. ProposalForm
**Location:** `/components/proposals/proposal-form.tsx`

**Client Component** - Form for creating a new proposal from an RFP.

**Props:**
```typescript
interface ProposalFormProps {
  rfpId: string;
  customerName: string;
  leadNumber?: string;
}
```

**Fields:**
- Project Title (required)
- Project Description
- Project Scope
- Project Duration
- Project Start Date
- Project End Date

**Features:**
- Form validation
- Loading states
- Date pickers
- Auto-uppercase for Greek text
- Toast notifications
- Automatic navigation to editor after creation

### 2. ProposalEditor
**Location:** `/components/proposals/proposal-editor.tsx`

**Client Component** - Main editor for reviewing and editing AI-generated content.

**Props:**
```typescript
interface ProposalEditorProps {
  proposal: any; // Proposal with all relations
}
```

**Features:**
- **5 Tabbed Sections**:
  1. Infrastructure (ΥΠΟΔΟΜΗ)
  2. Technical (ΤΕΧΝΙΚΑ)
  3. Products (ΠΡΟΪΟΝΤΑ)
  4. Services (ΥΠΗΡΕΣΙΕΣ)
  5. Scope (ΕΜΒΕΛΕΙΑ)

- **Action Buttons**:
  - **Save** - Save changes to database
  - **Generate Word** - Create Word document and download
  - **Download Word** - Download existing document
  - **Send to ERP** - Create official quote in SoftOne ERP

- **Status Display**:
  - Proposal status badge
  - Stage badge
  - ERP quote number (after integration)

- **Real-time Editing**:
  - Large textarea for each section
  - Monospace font for better editing
  - Auto-save capability

---

## 📱 Pages

### 1. Generate Proposal from RFP
**Location:** `/app/(main)/rfps/[id]/generate-proposal/page.tsx`

**Server Component** - Initial page for starting proposal generation.

**Features:**
- RFP summary display
  - RFP title
  - Products count
  - Services count
  - Description
  - Site survey connection indicator
- Proposal form for project details
- Info card explaining what will be generated
- Breadcrumb navigation

**URL:** `/rfps/{rfpId}/generate-proposal`

### 2. Edit Proposal
**Location:** `/app/(main)/proposals/[id]/edit/page.tsx`

**Server Component** - Editor page for reviewing and editing proposals.

**Features:**
- Fetches proposal with all relations
- Displays `ProposalEditor` component
- Breadcrumb navigation
- Error handling (proposal not found)

**URL:** `/proposals/{proposalId}/edit`

---

## 🔐 Environment Variables

Add these to your `.env` file:

```bash
# DeepSeek AI Configuration (for proposal generation)
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat

# SoftOne ERP Configuration (for quote creation)
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_QUOTE_SERIES=7001
SOFTONE_QUOTE_ENDPOINT=https://aic.oncloud.gr/s1services/JS/webservice.utilities/getOrderDoc
```

---

## 📋 Usage Flow

### Complete Workflow

1. **Start from RFP**
   ```
   Navigate to: /rfps/{rfpId}/generate-proposal
   ```

2. **Fill Project Information**
   - Enter project title (required)
   - Add description, scope, duration
   - Set start/end dates
   - Click "ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΤΑΣΗΣ ΜΕ AI"

3. **AI Generation** (automatic)
   - System fetches RFP data (products, services)
   - Fetches site survey data (if linked)
   - Calls DeepSeek AI to generate:
     - Infrastructure description
     - Technical description
     - Products description
     - Services description
     - Scope of work
   - Creates proposal record in database
   - Redirects to editor

4. **Review & Edit**
   ```
   Redirected to: /proposals/{proposalId}/edit
   ```
   - Review AI-generated content in 5 tabs
   - Edit any section as needed
   - Click "ΑΠΟΘΗΚΕΥΣΗ" to save changes

5. **Generate Word Document**
   - Click "ΔΗΜΙΟΥΡΓΙΑ WORD"
   - System generates professional Word document
   - Uploads to BunnyCDN
   - Creates file record
   - Auto-downloads to user's computer
   - Document URL stored in proposal

6. **Send to ERP**
   - Review proposal one last time
   - Click "ΑΠΟΣΤΟΛΗ ΣΤΟ ERP"
   - System:
     - Validates customer has SoftOne TRDR code
     - Prepares MTRLINES from equipment
     - Sends request to SoftOne API
     - Receives official quote number (e.g., "ΠΡΦ0000393")
     - Updates proposal with ERP data
     - Changes status to APPROVED
     - Changes stage to ERP_INTEGRATION

7. **Final Document**
   - Click "ΛΗΨΗ WORD" to download final document
   - Document includes ERP quote number
   - Ready to send to customer

---

## 🎯 Key Features

### AI-Powered Content Generation
- **Greek Language**: All content in Greek (uppercase, no accents)
- **Context-Aware**: Uses customer info, project details, infrastructure data
- **Comprehensive**: 5 distinct sections of technical content
- **Editable**: Users can review and edit all AI-generated content
- **Refinement Capability**: Future support for AI refinement based on feedback

### Professional Document Generation
- **Multi-Page Layout**: 9-page comprehensive proposal
- **Professional Styling**: Corporate colors, fonts, tables
- **Dynamic Content**: Populated from database and AI content
- **Pricing Tables**: Products and services with formulas
- **Terms & Conditions**: Standard T&C included
- **Signature Section**: Ready for company stamp

### ERP Integration
- **SoftOne API**: Direct integration with SoftOne ERP
- **Auto-Numbering**: Gets official quote number from ERP
- **Product Mapping**: Maps products/services to ERP codes (MTRL)
- **Error Handling**: Validates customer codes, products before sending
- **Status Tracking**: Stores all ERP response data

### File Management
- **BunnyCDN Upload**: All documents uploaded to CDN
- **File Versioning**: Support for multiple document versions
- **Safe Filenames**: Greeklish conversion for file names
- **Download Proxy**: Server-side proxy to avoid CORS issues
- **File Records**: Track all generated documents in database

---

## 🛠️ Technical Details

### Architecture
- **Server Components**: Pages and data fetching
- **Client Components**: Forms and interactive editors
- **Server Actions**: Not used (prefer API routes)
- **API Routes**: All mutations via RESTful endpoints
- **AI Service**: Separate utility module
- **Word Generation**: Separate utility module

### Data Flow
```
RFP (with products/services)
  ↓
Site Survey (infrastructure data) [optional]
  ↓
User Input (project details)
  ↓
AI Generation (DeepSeek API)
  ↓
Proposal Record (database)
  ↓
User Editing (React components)
  ↓
Word Document (docx generation)
  ↓
BunnyCDN Upload
  ↓
ERP Integration (SoftOne API)
  ↓
Final Proposal with Quote Number
```

### Error Handling
- Database errors (Prisma)
- AI API errors (DeepSeek)
- File upload errors (BunnyCDN)
- ERP API errors (SoftOne)
- Validation errors (missing data)
- User feedback via toast notifications

---

## 📝 Next Steps & Enhancements

### Potential Improvements
1. **PDF Generation**: Convert Word to PDF
2. **Email Integration**: Send proposals directly to customers
3. **Template Customization**: Allow custom Word templates
4. **AI Refinement**: Add "Refine with AI" button for each section
5. **Version Control**: Track document versions
6. **Approval Workflow**: Multi-stage approval process
7. **Analytics**: Track proposal success rates
8. **Customer Portal**: Allow customers to view/approve proposals online

### Accessing the System

#### For Testing/Development
```bash
# From RFP page (if you have RFPs with equipment data)
/rfps/{rfpId}/generate-proposal

# From Lead detail page
# Add a button to navigate to RFP → Generate Proposal
```

#### Creating Navigation
Add a button to your existing RFP detail page:
```typescript
<Button onClick={() => router.push(`/rfps/${rfp.id}/generate-proposal`)}>
  <FileText className="mr-2 h-4 w-4" />
  ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΤΑΣΗΣ
</Button>
```

---

## ✅ Completed Implementation

All tasks have been completed:
- ✅ Prisma model for Proposal
- ✅ AI content generation utility
- ✅ API endpoint for proposal generation
- ✅ API endpoint for proposal CRUD
- ✅ API endpoint for Word document generation
- ✅ API endpoint for ERP integration
- ✅ Word document generator
- ✅ Proposal form component
- ✅ Proposal editor component
- ✅ Proposal generation page
- ✅ Proposal edit page

The system is ready for testing and use! 🎉

