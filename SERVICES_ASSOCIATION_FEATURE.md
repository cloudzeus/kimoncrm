# Services Association Feature

## Overview
The infrastructure wizard now supports associating services with both **existing equipment** and **future proposals**, making it easy to add services like cable termination, installation, maintenance, etc.

## Key Concepts

### 1. **Existing Equipment (Descriptive)**
- Equipment is described with brand, model, specifications
- Services can be added (e.g., "Terminate 20 CAT6 cables")
- Equipment stays as-is, services are proposals for work

### 2. **Future Proposals (Product-Based)**
- Equipment is linked to products from your catalog
- Services can be added (e.g., "Install 5 switches")
- Both equipment and services are proposals

## Data Structure

### ServiceAssociationData
```typescript
interface ServiceAssociationData {
  id: string;
  serviceId: string;         // Link to Service from catalog
  serviceName?: string;      // Display name (cached)
  quantity?: number;         // Quantity of service
  notes?: string;            // Specific notes
}
```

### Equipment with Services
Every equipment type now has a `services` array:
```typescript
interface SwitchData {
  // ... existing fields ...
  services: ServiceAssociationData[]; // Works for both existing & future
  isFutureProposal?: boolean;
  productId?: string;        // Only for future proposals
  // ... other fields ...
}
```

## User Interface

### Mode Toggle
Each building has a mode toggle in its header:
- **Existing Mode** (Green): Adding existing equipment with descriptive details
- **Future Proposal Mode** (Blue): Adding proposed equipment linked to products

### Visual Indicators
- **📦 Existing**: Green/secondary badge on equipment cards
- **🔮 Future Proposal**: Blue/primary badge on equipment cards
- Color-coded backgrounds distinguish existing vs future items

### Services Section
Every equipment card has an "Associated Services" section:

1. **Add Service Button**: Adds a new service association
2. **Service Row Fields**:
   - **Service**: Link to service from catalog (text input for now, will be dropdown)
   - **Quantity**: Number of services (e.g., 10 terminations)
   - **Notes**: Specific notes for this service
   - **Delete**: Remove the service association

## Use Cases

### Example 1: Existing Building with New Services
**Scenario**: Customer has existing infrastructure but wants services

1. Set mode to "Existing"
2. Add existing CAT6 cables (100 terminated)
3. Click "Add Service" on the cable termination
4. Add service: "Re-terminate faulty connections" (Qty: 15)
5. Result: Customer knows they have 100 cables, and you're proposing to fix 15

### Example 2: Future Proposal
**Scenario**: Customer wants complete new installation

1. Set mode to "Future Proposal"
2. Add cable termination linked to "CAT6 Cable - Premium" product
3. Add services:
   - "Cable Installation" (Qty: 50)
   - "Cable Testing & Certification" (Qty: 50)
4. Result: Complete proposal with products and services

### Example 3: Mixed Scenario
**Scenario**: Existing equipment needs upgrades

1. Add existing switch (Cisco 2960, descriptive)
2. Add services to existing switch:
   - "Firmware Update"
   - "Configuration Backup"
3. Add future proposal switch (linked to product)
4. Add services to future switch:
   - "Installation"
   - "Initial Configuration"

## Benefits

1. **Flexibility**: Services work on both existing and future items
2. **Clarity**: Clear visual distinction between what exists and what's proposed
3. **Completeness**: Can propose services without changing equipment
4. **Scalability**: Same pattern works for cables, switches, routers, servers, etc.
5. **Proposal Generation**: Easy to generate proposals with both products and services

## Implementation Notes

### Applied To
Services association is available on:
- ✅ Cable Terminations
- ✅ Switches
- ✅ Routers
- ✅ Servers
- ✅ Devices (phones, cameras, APs, etc.)

### Data Flow
1. User adds equipment (existing or future)
2. User adds services to equipment
3. Data is stored in `services` array within equipment object
4. Services can be exported for:
   - Proposals
   - Work orders
   - Quotes
   - BOMs

## Future Enhancements

1. **Service Picker**: Dropdown to select from service catalog
2. **Auto-calculation**: Automatically calculate service quantities based on equipment
3. **Service Templates**: Predefined service bundles (e.g., "Complete Installation Package")
4. **Dependencies**: Mark services as dependent on products
5. **Pricing**: Pull pricing from service catalog
6. **Service Categories**: Group services by type (Installation, Maintenance, Support, etc.)

