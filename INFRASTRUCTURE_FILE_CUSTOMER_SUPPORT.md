# Infrastructure File Generation - Customer Support

## Overview
Enhanced the infrastructure file generation system to support site surveys that are linked to customers directly (without a lead association).

## Problem
Previously, the system would throw an error: **"Site survey is not linked to a lead"** when attempting to generate infrastructure files for site surveys that were only associated with a customer.

## Solution
Modified the API endpoint to support both scenarios:
1. **Lead-based**: Site survey linked to a lead → Files stored under LEAD entity
2. **Customer-based**: Site survey only linked to a customer → Files stored under CUSTOMER entity

## Changes Made

### API Endpoint: `/api/site-surveys/[id]/generate-infrastructure-file/route.ts`

#### 1. Enhanced Entity Detection
```typescript
// Determine if we're linking to a lead or customer
const isLinkedToLead = !!siteSurvey.leadId;
const isLinkedToCustomer = !!siteSurvey.customerId;

if (!isLinkedToLead && !isLinkedToCustomer) {
  return NextResponse.json(
    { error: "Site survey is not linked to a lead or customer" },
    { status: 400 }
  );
}

// Use lead info if available, otherwise use customer info
const entityId = siteSurvey.leadId || siteSurvey.customerId;
const entityType = isLinkedToLead ? 'LEAD' : 'CUSTOMER';
const referenceNumber = siteSurvey.lead?.leadNumber || siteSurvey.customer?.name || "REF";
```

#### 2. Dynamic File Naming
- **Lead-based**: `{leadNumber} - Infrastructure - {buildingName} - v{X}.xlsx`
- **Customer-based**: `{customerName} - Infrastructure - {buildingName} - v{X}.xlsx`

#### 3. Dynamic BunnyCDN Path
```typescript
const entityFolder = entityType === 'LEAD' ? 'leads' : 'customers';
const bunnyPath = `${entityFolder}/${entityId}/infrastructure/${timestamp}_${sanitizedFileName}`;
```

**Results in:**
- Lead files: `leads/{leadId}/infrastructure/...`
- Customer files: `customers/{customerId}/infrastructure/...`

#### 4. Database File Record
```typescript
const fileRecord = await prisma.file.create({
  data: {
    name: filename,
    filetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
    url: uploadResult.url,
    entityId: entityId!,      // Lead ID or Customer ID
    type: entityType,          // 'LEAD' or 'CUSTOMER'
    description: `Infrastructure report for ${buildingName} - Generated from Site Survey (v${versionNumber})`,
  },
});
```

## File Organization Structure

### Lead-Based Site Survey
```
BunnyCDN:
  └── leads/
      └── {leadId}/
          └── infrastructure/
              └── {timestamp}_{leadNumber}_-_Infrastructure_-_{buildingName}_-_v1.xlsx

Database (File table):
  - entityId: {leadId}
  - type: 'LEAD'
  - name: "{leadNumber} - Infrastructure - {buildingName} - v1.xlsx"
```

### Customer-Based Site Survey
```
BunnyCDN:
  └── customers/
      └── {customerId}/
          └── infrastructure/
              └── {timestamp}_{customerName}_-_Infrastructure_-_{buildingName}_-_v1.xlsx

Database (File table):
  - entityId: {customerId}
  - type: 'CUSTOMER'
  - name: "{customerName} - Infrastructure - {buildingName} - v1.xlsx"
```

## Versioning
Both lead-based and customer-based files maintain the same versioning system:
- Maximum 10 versions per building
- Auto-increment version numbers (v1, v2, v3, ...)
- Automatic cleanup of oldest version when exceeding 10

## File Visibility

### Lead-Based Files
Files are visible in:
- **Lead Detail Page** → Files tab
- Query: `WHERE entityId = {leadId} AND type = 'LEAD'`

### Customer-Based Files
Files are visible in:
- **Customer Detail Page** → Files tab
- Query: `WHERE entityId = {customerId} AND type = 'CUSTOMER'`

## Use Cases

### Scenario 1: Project Lead with Site Survey
```
Lead → Site Survey → Generate Infrastructure File
Result: File linked to Lead, visible in Lead files
```

### Scenario 2: Direct Customer Site Survey
```
Customer → Site Survey (no lead) → Generate Infrastructure File
Result: File linked to Customer, visible in Customer files
```

### Scenario 3: Lead Conversion
```
Customer → Site Survey → Later: Lead Created
Result: 
  - Old files remain linked to Customer
  - New files (after linking) will link to Lead
  - Both accessible from respective entities
```

## Benefits

1. **Flexibility**: Supports both lead-based and customer-based workflows
2. **No Data Loss**: Files are always associated with either lead or customer
3. **Proper Organization**: Files stored in appropriate BunnyCDN folders
4. **Version Control**: Same versioning logic regardless of entity type
5. **Backward Compatible**: Existing lead-based functionality unchanged

## Error Handling

### Valid Cases
✅ Site survey linked to lead → Files stored under LEAD
✅ Site survey linked to customer → Files stored under CUSTOMER
✅ Site survey linked to both → Files stored under LEAD (lead takes priority)

### Invalid Cases
❌ Site survey not linked to lead OR customer → Error: "Site survey is not linked to a lead or customer"
❌ No buildings provided → Error: "No buildings data provided"
❌ Invalid site survey ID → Error: "Site survey not found"

## Testing Checklist

- [ ] Generate infrastructure file for lead-based site survey
- [ ] Generate infrastructure file for customer-based site survey
- [ ] Verify files appear in correct entity's files tab
- [ ] Verify BunnyCDN paths are correct (leads/ vs customers/)
- [ ] Verify versioning works for both scenarios
- [ ] Verify version cleanup (after 10 versions)
- [ ] Verify filename uses leadNumber vs customerName appropriately
- [ ] Verify error handling for unlinked site surveys

## Related Files
- `/app/api/site-surveys/[id]/generate-infrastructure-file/route.ts` - Main endpoint
- `/lib/excel/building-report-excel.ts` - Excel generation logic
- `/lib/bunny/upload.ts` - BunnyCDN upload utility
- `/components/site-surveys/comprehensive-infrastructure-wizard.tsx` - UI component

