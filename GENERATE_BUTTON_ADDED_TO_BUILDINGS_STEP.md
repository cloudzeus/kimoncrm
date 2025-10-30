# Generate Infrastructure File Button - Added to BuildingsStep

## Issue
The "Generate Infrastructure File" button was **missing** from the first step of the **Comprehensive Infrastructure Wizard**.

## Root Cause
There are **two different wizard systems** in the codebase:

### 1. Regular Site Survey Wizard
- **File:** `components/site-surveys/site-survey-wizard.tsx`
- **Step 1 Component:** `InfrastructureStep` (infrastructure-step.tsx)
- **Status:** ✅ Already had the "Generate Infrastructure File" button

### 2. Comprehensive Infrastructure Wizard
- **File:** `components/site-surveys/comprehensive-infrastructure-wizard.tsx`
- **Step 1 Component:** `BuildingsStep` (buildings-step.tsx)
- **Status:** ❌ Missing the "Generate Infrastructure File" button

The user was using the **Comprehensive Infrastructure Wizard**, which uses `BuildingsStep` component that didn't have the button.

## Solution
Added the "Generate Infrastructure File" button to the `BuildingsStep` component.

### Changes Made
**File:** `/components/site-surveys/wizard-steps/buildings-step.tsx`

#### 1. Added Imports
```typescript
import { Plus, Building2, FileDown, Loader2 } from "lucide-react";
```

#### 2. Added State
```typescript
const [generatingFile, setGeneratingFile] = useState(false);
```

#### 3. Added Handler Function
```typescript
const handleGenerateInfrastructureFile = async () => {
  if (localBuildings.length === 0) {
    toast.error("Please add at least one building before generating the infrastructure file");
    return;
  }

  setGeneratingFile(true);
  try {
    const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-infrastructure-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildings: localBuildings,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate file');
    }

    if (data.success) {
      toast.success(
        data.message || `Successfully generated ${data.files.length} infrastructure file(s)`,
        {
          description: data.files.map((f: any) => `${f.filename} (v${f.version})`).join(', '),
          duration: 5000,
        }
      );
      
      if (data.errors && data.errors.length > 0) {
        toast.warning(
          `Some files had errors`,
          {
            description: data.errors.map((e: any) => `${e.buildingName}: ${e.error}`).join(', '),
            duration: 5000,
          }
        );
      }
    } else {
      throw new Error('Generation failed');
    }
  } catch (error) {
    console.error('Error generating infrastructure file:', error);
    toast.error(
      'Failed to generate infrastructure file',
      {
        description: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  } finally {
    setGeneratingFile(false);
  }
};
```

#### 4. Added Button to Header
```typescript
<div className="flex gap-2">
  <Button 
    onClick={handleGenerateInfrastructureFile}
    disabled={localBuildings.length === 0 || generatingFile}
    variant="default"
  >
    {generatingFile ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <FileDown className="h-4 w-4 mr-2" />
        Generate Infrastructure File
      </>
    )}
  </Button>
  <Button onClick={addBuilding}>
    <Plus className="h-4 w-4 mr-2" />
    Add Building
  </Button>
</div>
```

## Button Location
The button now appears in the **header of Step 1** (Buildings & Infrastructure):

```
┌─────────────────────────────────────────────────────────────┐
│  Buildings & Infrastructure                                 │
│  Define buildings with hierarchical structure...            │
│                                                              │
│     [Generate Infrastructure File]  [Add Building]  ←────┐  │
└──────────────────────────────────────────────────────────┘  │
                                                              │
  Button is here in the top-right corner ───────────────────┘
```

## Features
- ✅ **Disabled State:** Button is disabled when no buildings exist
- ✅ **Loading State:** Shows spinner and "Generating..." text while processing
- ✅ **Error Handling:** Shows error toasts with details
- ✅ **Success Feedback:** Shows success toast with file details
- ✅ **Version Display:** Shows generated file versions (v1, v2, etc.)
- ✅ **Multiple Buildings:** Generates separate Excel files for each building
- ✅ **Partial Success:** Shows warnings if some files fail while others succeed

## How It Works
1. User adds buildings in Step 1
2. User clicks "Generate Infrastructure File" button
3. System sends building data to API endpoint
4. API generates Excel file(s) for each building
5. Files are uploaded to BunnyCDN
6. Files are linked to the lead
7. Versioning is applied (v1, v2, v3... up to 10 versions)
8. Success toast shows file details

## Testing
To test the fix:
1. Navigate to a site survey
2. Click "Edit" or open the Comprehensive Infrastructure Wizard
3. Add at least one building
4. Look for the **"Generate Infrastructure File"** button in the top-right corner
5. Click the button
6. Wait for the success toast
7. Check the lead's files section to see the generated Excel file

## Comparison: Two Wizard Systems

| Feature | Regular Wizard | Comprehensive Wizard |
|---------|---------------|----------------------|
| **File** | site-survey-wizard.tsx | comprehensive-infrastructure-wizard.tsx |
| **Step 1** | InfrastructureStep | BuildingsStep |
| **Generate Button** | ✅ Yes (already had it) | ✅ Yes (now added) |
| **Equipment Step** | EquipmentStep (has button) | EquipmentAssignmentStep |
| **Pricing Step** | PricingStep (has button) | CentralRackStep |

## Related Issues Fixed
This change ensures feature parity between:
- Regular Site Survey Wizard
- Comprehensive Infrastructure Wizard

Both wizards now have the same functionality for generating infrastructure Excel files.

## Conclusion
The "Generate Infrastructure File" button is now **visible and functional** in Step 1 of the Comprehensive Infrastructure Wizard. Users can now generate Excel files at any point during the building definition process.

