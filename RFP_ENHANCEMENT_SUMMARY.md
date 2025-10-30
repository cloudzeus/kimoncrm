# RFP Enhancement - Include All New Products and Services

## Problem
The RFP generation in the Comprehensive Infrastructure Wizard was collecting raw equipment data from buildings without complete product/service details and pricing information. The generated RFP Excel files were missing critical data that appears in a proper pricing step.

## Solution
Enhanced the `handleGenerateRFP` function in `ComprehensiveInfrastructureWizard` to:

1. **Fetch Complete Product/Service Data**
   - Retrieves all products from `/api/products`
   - Retrieves all services from `/api/services`
   - Gets full details including name, brand, category, and default pricing

2. **Comprehensive Equipment Collection**
   - Collects from Central Racks (cable terminations, switches, routers, servers)
   - Collects from Floor Racks (switches, routers, servers)
   - Collects from Rooms (devices)
   - Includes associated services for each equipment type

3. **"New" Item Filtering**
   - Only includes items marked with `isFutureProposal: true`
   - This flag indicates items that are part of the new proposal (not existing infrastructure)

4. **Data Enrichment**
   - Looks up each product/service by ID
   - Enriches with:
     - Full product name
     - Brand information
     - Category
     - Default price
     - Margin (initialized to 0, can be edited in RFP management)
   - Aggregates quantities for duplicate items

5. **Proper Data Structure**
   - Each equipment item includes:
     ```typescript
     {
       id: string,
       productId: string,  // or serviceId
       name: string,
       brand: string,
       category: string,
       quantity: number,
       price: number,
       margin: number,
       type: 'product' | 'service'
     }
     ```

## What Changed

### File: `/components/site-surveys/comprehensive-infrastructure-wizard.tsx`

**Before:**
- Collected raw equipment objects from buildings
- Equipment only had `productId` references
- Missing product details (name, brand, category, price)
- Collected ALL equipment (not filtered for new items)

**After:**
- Fetches complete product/service catalogs
- Looks up each product/service by ID
- Creates enriched equipment objects with full details
- Only includes items marked as `isFutureProposal`
- Properly separates products and services
- Aggregates quantities for duplicates

## Equipment Sources Covered

### Central Rack
- ✅ Cable Terminations (products + services)
- ✅ Switches (products + services)
- ✅ Routers (products + services)
- ✅ Servers (products + services)

### Floor Racks
- ✅ Switches (products + services)
- ✅ Routers (products + services)
- ✅ Servers (products + services)

### Rooms
- ✅ Devices (products + services)

## Generated RFP Excel Structure

The RFP Excel file now includes:

### PRODUCTS Sheet
| Product Name | Brand | Category | Quantity | Unit Price | Margin % | Subtotal | Total |
|--------------|-------|----------|----------|------------|----------|----------|-------|
| Cisco Switch | Cisco | Network  | 5        | €450.00    | 0%       | €2,250   | €2,250|

### SERVICES Sheet
| Service Name | Category     | Quantity | Unit Price | Margin % | Subtotal | Total |
|--------------|--------------|----------|------------|----------|----------|-------|
| Installation | Installation | 5        | €100.00    | 0%       | €500     | €500  |

### PRICING SUMMARY Sheet
- Total Products
- Total Services
- Grand Total

## User Experience Improvements

### Before
1. ❌ RFP generated with incomplete data
2. ❌ Missing product names, brands, categories
3. ❌ No pricing information
4. ❌ Included all equipment (old + new)

### After
1. ✅ RFP includes complete product/service details
2. ✅ Full product information (name, brand, category)
3. ✅ Default pricing from product catalog
4. ✅ Only includes "new" items (`isFutureProposal`)
5. ✅ Clear separation of products and services
6. ✅ Aggregated quantities for duplicates
7. ✅ Helpful toast message if no new items found

## Example Usage

### Step 1: Mark Equipment as "New"
In the Equipment Assignment Step (Step 2 of wizard), mark equipment as:
- `isFutureProposal: true` - for new equipment to be quoted

### Step 2: Generate RFP
Click the "RFP" button in the wizard header. The system will:
1. Collect all equipment marked as "new"
2. Fetch full product/service details
3. Generate comprehensive pricing Excel
4. Upload to BunnyCDN
5. Link to lead/customer
6. Auto-download the file

### Step 3: Review & Edit
- RFP includes all new products/services with default pricing
- Can be edited in RFP management section
- Can be regenerated with updated prices

## Benefits

1. **Complete Pricing Data**: RFP includes all information needed for customer review
2. **Professional Output**: Excel files have full product details, not just IDs
3. **Accurate Filtering**: Only new/proposed items included, not existing infrastructure
4. **Proper Aggregation**: Duplicate items automatically combined with total quantities
5. **Service Inclusion**: Services are properly collected and priced alongside products
6. **Ready for Customer**: RFP is customer-ready without manual data entry

## Testing Checklist

- [x] Equipment collected from all locations (central rack, floors, rooms)
- [x] Products have complete details (name, brand, category, price)
- [x] Services have complete details (name, category, price)
- [x] Only `isFutureProposal` items included
- [x] Quantities aggregated for duplicates
- [x] Both products and services in RFP
- [x] Excel file downloads successfully
- [x] File uses Greeklish safe filenames
- [x] Toast notifications work correctly
- [x] No console errors

## Related Files

- `/components/site-surveys/comprehensive-infrastructure-wizard.tsx` - Main wizard component
- `/app/api/site-surveys/[id]/generate-rfp/route.ts` - RFP generation endpoint
- `/lib/utils/greeklish.ts` - Safe filename generation

## Migration Notes

**Old Wizard (SiteSurveyWizard)**:
- Has 3 steps: Infrastructure → Equipment → Pricing
- Step 3 (PricingStep) allows manual price/margin entry
- Equipment is collected and enriched in Step 2

**New Wizard (ComprehensiveInfrastructureWizard)**:
- Has 4 steps: Buildings → Equipment Assignment → Central Rack → Proposal Documents
- No dedicated pricing step
- RFP generation automatically uses default product prices
- Prices can be edited later in RFP management section

## Future Enhancements

Potential improvements for future iterations:

- [ ] Allow inline price/margin editing before RFP generation
- [ ] Add discount percentage option
- [ ] Include installation timeline estimates
- [ ] Support for custom pricing rules (bulk discounts, etc.)
- [ ] Export to multiple formats (PDF, Word, etc.)
- [ ] Email RFP directly to customer

---

**Implementation Date:** January 2025  
**Status:** ✅ Complete  
**Tested:** ✅ Yes

