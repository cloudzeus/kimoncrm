# Site Survey Wizard - Complete Guide

## Overview

The Site Survey Wizard is a multi-step form system that consolidates infrastructure planning, equipment selection, and pricing into a seamless workflow. It replaces the separate tabs for Infrastructure, Equipment, and BOM with a guided wizard experience.

## Features

### 🏗️ Step 1: Infrastructure
- Define buildings with detailed information (name, code, address, notes)
- Add central racks for core infrastructure
- Create floors with multiple levels
- Add floor racks for distributed equipment
- Define rooms with types (Office, Meeting Room, Closet, etc.)
- Connect multiple buildings with cable types and distances
- Collapsible tree view for easy navigation
- Full CRUD operations for all infrastructure elements

### 📦 Step 2: Equipment Selection
- Browse and search products from your catalog
- Filter by brands and categories
- Search and add services
- View equipment organized by Products and Services
- Track total items, quantities, and values
- Associate equipment with infrastructure elements
- Real-time summary statistics

### 💰 Step 3: Pricing & Final Review
- Edit price, quantity, and margin for each item
- Separate sections for Products and Services
- Real-time total calculations with margin display
- Add notes to individual items
- View infrastructure location for each equipment item
- Summary cards showing:
  - Total items count
  - Subtotal before margins
  - Total margin amount and percentage
  - Grand total
- One-click generation of:
  - BOM Excel file with multiple sheets
  - Professional Word document

## Architecture

### Components Structure

```
components/site-surveys/
├── site-survey-wizard.tsx          # Main wizard container
└── wizard-steps/
    ├── infrastructure-step.tsx     # Step 1: Infrastructure
    ├── equipment-step.tsx          # Step 2: Equipment
    └── pricing-step.tsx            # Step 3: Pricing
```

### API Endpoints

```
/api/site-surveys/[id]/infrastructure
  GET  - Load infrastructure data
  POST - Save infrastructure data

/api/site-surveys/[id]/equipment
  GET  - Load equipment data
  POST - Save equipment data

/api/site-surveys/generate-bom-excel
  POST - Generate BOM Excel file

/api/site-surveys/[id]/generate-word
  POST - Generate Word document
```

### Database Schema

The wizard uses the `SiteSurvey` model with:
- `buildings` (JSON) - Stores infrastructure hierarchy
- `equipment` (JSON) - Stores equipment items with pricing

## Usage

### 1. Navigate to the Wizard

```typescript
// From site survey details page
router.push(`/site-surveys/${siteSurveyId}/wizard`);
```

### 2. Integrate in Your Application

```tsx
import { SiteSurveyWizard } from "@/components/site-surveys/site-survey-wizard";

<SiteSurveyWizard
  siteSurveyId={id}
  siteSurveyData={siteSurvey}
  onComplete={() => {
    // Handle completion
    router.push(`/site-surveys/${id}/details`);
  }}
/>
```

### 3. Data Flow

1. **Initial Load**: Wizard fetches existing data from API endpoints
2. **Step Navigation**: Data is automatically saved when moving to next step
3. **Manual Save**: Users can save progress at any time
4. **Final Submit**: Generates BOM and Word document

## Data Structures

### Building Structure
```typescript
interface Building {
  name: string;
  code?: string;
  address?: string;
  notes?: string;
  floors: Floor[];
  centralRacks: Rack[];
}
```

### Equipment Item Structure
```typescript
interface EquipmentItem {
  id: string;
  itemId: string;
  name: string;
  type: 'product' | 'service';
  brand?: string;
  category: string;
  unit: string;
  quantity: number;
  price: number;
  margin?: number;
  totalPrice: number;
  notes?: string;
  infrastructureElement?: SelectedElement;
}
```

## Features in Detail

### Auto-Save Functionality
- Progress is automatically saved when navigating between steps
- Manual save button available for explicit saves
- Last saved timestamp displayed
- Data persisted to database via API

### Progress Tracking
- Visual progress bar showing completion percentage
- Step indicators with completed/active/pending states
- Click on any completed step to go back
- Current step highlighted with badge

### Calculations
- Automatic total price calculation: `(price × quantity) + margin`
- Margin as percentage of base price
- Real-time updates as values change
- Separate totals for products and services
- Grand total with combined margins

### Document Generation
- **BOM Excel**: Multi-sheet workbook with:
  - Project Information
  - Site Structure
  - File Links
  - BOM Summary (consolidated items)
  - Detailed BOM (all items)
  - Products Only
  - Services Only
  - Cost Analysis
  
- **Word Document**: Professional report with:
  - Project details
  - Customer information
  - Infrastructure overview
  - Equipment list
  - Pricing summary

## Customization

### Adding Custom Fields

To add custom fields to infrastructure elements:

1. Update the interface in `infrastructure-step.tsx`
2. Add form fields to the respective dialog
3. Update the save logic to include new fields

### Styling

The wizard uses shadcn/ui components with Tailwind CSS. Customize by:
- Modifying color schemes in `tailwind.config.js`
- Adjusting component variants
- Customizing card layouts

### Validation

Add custom validation:

```typescript
const validateStep = () => {
  if (currentStep === 1 && buildings.length === 0) {
    toast.error("Please add at least one building");
    return false;
  }
  return true;
};
```

## Best Practices

1. **Save Regularly**: Use auto-save or manual save to prevent data loss
2. **Complete Steps in Order**: Follow the wizard flow for best results
3. **Review Pricing**: Always review the pricing step before final submission
4. **Add Notes**: Use notes fields for important details
5. **Organize Infrastructure**: Use logical names for buildings/floors/racks

## Troubleshooting

### Data Not Loading
- Check API endpoints are accessible
- Verify site survey ID is valid
- Check browser console for errors

### Calculations Incorrect
- Ensure quantity and price are positive numbers
- Check margin is entered as percentage (0-100)
- Verify decimal places in currency fields

### Document Generation Fails
- Ensure equipment list is not empty
- Check all required fields are filled
- Verify server-side API is running

## Integration with Existing System

The wizard integrates with:
- **Equipment Selection Dialog**: Reuses existing product/service browser
- **BOM Generation API**: Uses existing Excel generation logic
- **Word Document API**: Uses existing document generation
- **File Management**: Compatible with existing file uploads

## Migration from Old System

To migrate from the tab-based system:

1. Existing infrastructure data is automatically loaded
2. Equipment from old BOM tab is imported
3. All existing functionality is preserved
4. Old tabs can remain for backward compatibility

## Future Enhancements

Potential improvements:
- [ ] Add equipment templates for common configurations
- [ ] Bulk import from CSV/Excel
- [ ] Equipment comparison and alternatives
- [ ] Price history and trends
- [ ] Multi-currency support
- [ ] Equipment availability checking
- [ ] Automated margin calculations based on rules
- [ ] Export to multiple formats (PDF, CSV)

## API Reference

### Load Infrastructure
```typescript
GET /api/site-surveys/[id]/infrastructure
Response: {
  buildings: Building[],
  buildingConnections: BuildingConnection[]
}
```

### Save Infrastructure
```typescript
POST /api/site-surveys/[id]/infrastructure
Body: {
  buildings: Building[],
  buildingConnections: BuildingConnection[]
}
```

### Load Equipment
```typescript
GET /api/site-surveys/[id]/equipment
Response: {
  equipment: EquipmentItem[]
}
```

### Save Equipment
```typescript
POST /api/site-surveys/[id]/equipment
Body: {
  equipment: EquipmentItem[]
}
```

## Support

For issues or questions:
1. Check console logs for error details
2. Verify API endpoints are responding
3. Check database connectivity
4. Review Prisma schema for data structure

## Conclusion

The Site Survey Wizard provides a streamlined, user-friendly interface for creating comprehensive site surveys with infrastructure, equipment, and pricing all in one place. The multi-step approach guides users through the process while maintaining flexibility and data integrity.

