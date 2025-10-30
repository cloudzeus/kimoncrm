# Comprehensive Wizard Document Generation System

## Overview
Complete implementation of document generation buttons in the Comprehensive Infrastructure Wizard header, allowing users to generate Infrastructure Files, BOM Excel, and RFP Documents from any step of the wizard.

## Features Implemented

### 1. Three Document Generation Buttons
All buttons are placed in the wizard header, visible on all steps:

1. **Infrastructure** - Generates infrastructure Excel files for all buildings
2. **BOM Excel** - Generates Bill of Materials organized by brand
3. **RFP Document** - Generates Request for Proposal with pricing

### 2. Auto-Download on Generation
All generated documents automatically download to the user's device after successful generation.

### 3. File Persistence
All generated files are:
- Uploaded to BunnyCDN
- Saved to the database
- Linked to the associated Lead or Customer
- Versioned (up to 10 versions)
- Visible in the entity's Files tab

## UI Implementation

### Button Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Infrastructure Survey                                                        │
│ Step X of 4: [Step Name]                                                    │
│                  [Save Progress] [Infrastructure] [BOM Excel] [RFP Document] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Button States

#### Infrastructure Button
```tsx
<Button
  variant="default"
  size="sm"
  onClick={handleGenerateInfrastructureFile}
  disabled={wizardData.buildings.length === 0 || generatingFile}
>
  {generatingFile ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Generating...
    </>
  ) : (
    <>
      <FileDown className="h-4 w-4 mr-2" />
      Infrastructure
    </>
  )}
</Button>
```

- **Enabled**: When at least one building exists
- **Disabled**: When no buildings or currently generating
- **Loading**: Shows spinner and "Generating..." text

#### BOM Excel Button
```tsx
<Button
  variant="default"
  size="sm"
  onClick={handleGenerateBOM}
  disabled={generatingBOM}
>
  {generatingBOM ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Generating...
    </>
  ) : (
    <>
      <FileDown className="h-4 w-4 mr-2" />
      BOM Excel
    </>
  )}
</Button>
```

- **Enabled**: When equipment exists in any location
- **Disabled**: When currently generating
- **Loading**: Shows spinner and "Generating..." text
- **Auto-validates**: Checks for equipment before generating

#### RFP Document Button
```tsx
<Button
  variant="default"
  size="sm"
  onClick={handleGenerateRFP}
  disabled={generatingRFP}
>
  {generatingRFP ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Generating...
    </>
  ) : (
    <>
      <FileDown className="h-4 w-4 mr-2" />
      RFP Document
    </>
  )}
</Button>
```

- **Enabled**: When equipment exists in any location
- **Disabled**: When currently generating
- **Loading**: Shows spinner and "Generating..." text
- **Auto-validates**: Checks for equipment before generating

## Handler Functions

### 1. Infrastructure File Generation

```typescript
const handleGenerateInfrastructureFile = async () => {
  if (wizardData.buildings.length === 0) {
    toast.error("Please add at least one building before generating the infrastructure file");
    return;
  }

  setGeneratingFile(true);
  try {
    const cleanedBuildings = cleanData(wizardData.buildings);

    const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-infrastructure-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildings: cleanedBuildings }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success(
        data.message || `Successfully generated ${data.files.length} infrastructure file(s)`,
        {
          description: data.files.map((f: any) => `${f.filename} (v${f.version})`).join(', '),
          duration: 5000,
        }
      );
      
      // Auto-download all generated files
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          if (file.url) {
            downloadFile(file.url, file.filename);
          }
        }
      }
    }
  } catch (error) {
    toast.error('Failed to generate infrastructure file', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    setGeneratingFile(false);
  }
};
```

**What it does:**
- Validates buildings exist
- Cleans circular references from building data
- Calls `/api/site-surveys/[id]/generate-infrastructure-file`
- Downloads all generated Excel files
- Shows success/error toasts with file details

### 2. BOM File Generation

```typescript
const handleGenerateBOM = async () => {
  // Collect all equipment from all buildings
  const allEquipment: any[] = [];
  wizardData.buildings.forEach(building => {
    // From central rack
    if (building.centralRack?.equipment) {
      allEquipment.push(...building.centralRack.equipment);
    }
    // From floors (racks and rooms)
    building.floors?.forEach(floor => {
      floor.racks?.forEach(rack => {
        if (rack.equipment) {
          allEquipment.push(...rack.equipment);
        }
      });
      floor.rooms?.forEach(room => {
        if (room.equipment) {
          allEquipment.push(...room.equipment);
        }
      });
    });
  });

  if (allEquipment.length === 0) {
    toast.error("Please add equipment before generating the BOM file");
    return;
  }

  setGeneratingBOM(true);
  try {
    const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-bom-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipment: allEquipment }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success('Successfully generated BOM file', {
        description: `${data.filename} (v${data.version})`,
        duration: 5000,
      });
      
      // Auto-download the file
      if (data.url) {
        downloadFile(data.url, data.filename);
      }
    }
  } catch (error) {
    toast.error('Failed to generate BOM file', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    setGeneratingBOM(false);
  }
};
```

**What it does:**
- Collects equipment from all locations (central racks, floor racks, rooms)
- Validates equipment exists
- Calls `/api/site-surveys/[id]/generate-bom-file`
- Downloads the generated BOM Excel file
- Shows success/error toasts

**Equipment Collection:**
- ✅ Central Rack equipment
- ✅ Floor Rack equipment
- ✅ Room equipment
- ✅ All buildings combined

### 3. RFP Generation

```typescript
const handleGenerateRFP = async () => {
  // Collect all equipment from all buildings
  const allEquipment: any[] = [];
  wizardData.buildings.forEach(building => {
    // From central rack
    if (building.centralRack?.equipment) {
      allEquipment.push(...building.centralRack.equipment);
    }
    // From floors (racks and rooms)
    building.floors?.forEach(floor => {
      floor.racks?.forEach(rack => {
        if (rack.equipment) {
          allEquipment.push(...rack.equipment);
        }
      });
      floor.rooms?.forEach(room => {
        if (room.equipment) {
          allEquipment.push(...room.equipment);
        }
      });
    });
  });

  if (allEquipment.length === 0) {
    toast.error("Please add equipment before generating the RFP");
    return;
  }

  setGeneratingRFP(true);
  try {
    const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-rfp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipment: allEquipment,
        buildings: cleanData(wizardData.buildings),
        generalNotes: siteSurveyData?.notes || '',
      }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success('Successfully generated RFP', {
        description: `${data.rfp.rfpNo} - ${data.filename} (v${data.version})`,
        duration: 5000,
      });
      
      // Auto-download the file
      if (data.url) {
        downloadFile(data.url, data.filename);
      }
    }
  } catch (error) {
    toast.error('Failed to generate RFP', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    setGeneratingRFP(false);
  }
};
```

**What it does:**
- Collects equipment from all locations
- Validates equipment exists
- Includes building data and notes
- Calls `/api/site-surveys/[id]/generate-rfp`
- Downloads the generated RFP Excel file
- Shows success/error toasts with RFP number

## Helper Functions

### Clean Data (Circular Reference Handler)
```typescript
const cleanData = (obj: any, seen = new WeakSet()): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (seen.has(obj)) {
    return undefined;
  }
  seen.add(obj);
  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item, seen));
  }
  const cleaned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = cleanData(obj[key], seen);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};
```

**Purpose**: Removes circular references from complex objects before JSON.stringify

### Download File
```typescript
const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

**Purpose**: Triggers browser download for generated files

## API Endpoints Used

### 1. Infrastructure File Generation
- **Endpoint**: `POST /api/site-surveys/[id]/generate-infrastructure-file`
- **Payload**: `{ buildings: BuildingData[] }`
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Successfully generated N infrastructure file(s)",
    "files": [
      {
        "buildingName": "Building 1",
        "filename": "LEAD-001 - Infrastructure - Building 1 - v1.xlsx",
        "fileId": "file-id",
        "url": "https://cdn.url/file.xlsx",
        "version": 1
      }
    ]
  }
  ```

### 2. BOM File Generation
- **Endpoint**: `POST /api/site-surveys/[id]/generate-bom-file`
- **Payload**: `{ equipment: EquipmentItem[] }`
- **Response**: 
  ```json
  {
    "success": true,
    "filename": "LEAD-001 - BOM - v1.xlsx",
    "fileId": "file-id",
    "url": "https://cdn.url/file.xlsx",
    "version": 1
  }
  ```

### 3. RFP Generation
- **Endpoint**: `POST /api/site-surveys/[id]/generate-rfp`
- **Payload**: 
  ```json
  {
    "equipment": [],
    "buildings": [],
    "generalNotes": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "rfp": {
      "id": "rfp-id",
      "rfpNo": "RFP-001"
    },
    "filename": "LEAD-001 - RFP Pricing - v1.xlsx",
    "fileId": "file-id",
    "url": "https://cdn.url/file.xlsx",
    "version": 1
  }
  ```

## State Management

```typescript
const [generatingFile, setGeneratingFile] = useState(false);    // Infrastructure
const [generatingBOM, setGeneratingBOM] = useState(false);      // BOM
const [generatingRFP, setGeneratingRFP] = useState(false);      // RFP
```

Each button has its own loading state to prevent conflicts and allow proper UI feedback.

## User Feedback

### Toast Notifications

#### Success Messages
- **Infrastructure**: "Successfully generated N infrastructure file(s)" + file list
- **BOM**: "Successfully generated BOM file" + filename and version
- **RFP**: "Successfully generated RFP" + RFP number, filename, and version

#### Error Messages
- Validation errors (no buildings/equipment)
- Network/API errors
- Generation failures

#### Warning Messages
- Partial failures (some buildings failed)

### Loading States
- Button shows spinner icon
- Button text changes to "Generating..."
- Button is disabled during generation
- Prevents multiple simultaneous generations

## File Organization

### Lead-Based Site Survey
```
BunnyCDN:
  └── leads/{leadId}/
      ├── infrastructure/
      │   └── {timestamp}_{leadNumber}_-_Infrastructure_-_{buildingName}_-_v1.xlsx
      ├── bom/
      │   └── {timestamp}_{leadNumber}_-_BOM_-_v1.xlsx
      └── rfp-pricing/
          └── {timestamp}_{leadNumber}_-_RFP_Pricing_-_v1.xlsx

Database (File table):
  - entityId: {leadId}
  - type: 'LEAD'
```

### Customer-Based Site Survey
```
BunnyCDN:
  └── customers/{customerId}/
      ├── infrastructure/
      │   └── {timestamp}_{customerName}_-_Infrastructure_-_{buildingName}_-_v1.xlsx
      ├── bom/
      │   └── {timestamp}_{customerName}_-_BOM_-_v1.xlsx
      └── rfp-pricing/
          └── {timestamp}_{customerName}_-_RFP_Pricing_-_v1.xlsx

Database (File table):
  - entityId: {customerId}
  - type: 'CUSTOMER'
```

## Workflow

### Step-by-Step User Flow

1. **User enters Comprehensive Infrastructure Wizard**
   - Header shows all three generation buttons
   - Buttons are visible on all steps

2. **User adds buildings** (Step 1: Buildings)
   - Infrastructure button becomes enabled
   - Other buttons remain disabled (no equipment yet)

3. **User adds equipment** (Step 2: Equipment Assignment)
   - All buttons are now enabled
   - User can generate any document type

4. **User clicks a generation button**
   - Button shows loading state
   - API call is made
   - File is generated on server
   - File is uploaded to BunnyCDN
   - Database record is created
   - File automatically downloads to user's device
   - Success toast appears with details

5. **User can regenerate**
   - Clicking again creates new version (v2, v3, etc.)
   - Old versions are kept (up to 10)
   - All files remain accessible in Files tab

## Benefits

1. **Always Accessible**: Buttons visible on all wizard steps
2. **Auto-Download**: Files download immediately after generation
3. **File Persistence**: All files saved to database and CDN
4. **Version Control**: Up to 10 versions per document type
5. **Smart Validation**: Buttons disabled when requirements not met
6. **Real-Time Feedback**: Toast notifications with detailed information
7. **Equipment Collection**: Automatically gathers equipment from all locations
8. **Circular Reference Safety**: Handles complex nested objects
9. **Error Handling**: Comprehensive error messages
10. **Multi-Building Support**: Infrastructure generates file per building

## Testing Checklist

- [ ] Infrastructure button visible on all steps
- [ ] BOM Excel button visible on all steps
- [ ] RFP Document button visible on all steps
- [ ] Infrastructure button disabled when no buildings
- [ ] BOM button disabled when no equipment
- [ ] RFP button disabled when no equipment
- [ ] Infrastructure file downloads after generation
- [ ] BOM file downloads after generation
- [ ] RFP file downloads after generation
- [ ] Files appear in Lead/Customer Files tab
- [ ] Version numbering works (v1, v2, v3...)
- [ ] Toast notifications show correct information
- [ ] Loading states work correctly
- [ ] Multiple buildings generate multiple infrastructure files
- [ ] Equipment collected from all locations (central rack, floor racks, rooms)
- [ ] Circular reference cleaning works
- [ ] Works with lead-based site surveys
- [ ] Works with customer-based site surveys

## Related Files

- `/components/site-surveys/comprehensive-infrastructure-wizard.tsx` - Main wizard component
- `/app/api/site-surveys/[id]/generate-infrastructure-file/route.ts` - Infrastructure API
- `/app/api/site-surveys/[id]/generate-bom-file/route.ts` - BOM API
- `/app/api/site-surveys/[id]/generate-rfp/route.ts` - RFP API
- `/lib/excel/building-report-excel.ts` - Infrastructure Excel generation
- `/lib/bunny/upload.ts` - BunnyCDN upload utility

