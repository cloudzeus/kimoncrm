# Generate Button Placement Update

## Overview
Moved the "Generate Infrastructure File" button from the individual step component to the wizard header, making it accessible from all wizard steps.

## Changes Made

### 1. Comprehensive Infrastructure Wizard (`comprehensive-infrastructure-wizard.tsx`)

#### Added State
```typescript
const [generatingFile, setGeneratingFile] = useState(false);
```

#### Added Imports
- `FileDown` icon
- `Loader2` icon for loading animation

#### Added Handler Function
```typescript
const handleGenerateInfrastructureFile = async () => {
  if (wizardData.buildings.length === 0) {
    toast.error("Please add at least one building before generating the infrastructure file");
    return;
  }

  setGeneratingFile(true);
  try {
    // Clean data to prevent circular reference errors
    const cleanData = (obj: any, seen = new WeakSet()): any => {
      // ... implementation
    };

    const cleanedBuildings = cleanData(wizardData.buildings);

    const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-infrastructure-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildings: cleanedBuildings,
      }),
    });

    // Handle response with success/error toasts
  } catch (error) {
    console.error('Error generating infrastructure file:', error);
    toast.error('Failed to generate infrastructure file', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    setGeneratingFile(false);
  }
};
```

#### Added Button to Header
```tsx
<div className="flex items-center gap-4">
  <Button
    variant="outline"
    onClick={saveProgress}
    disabled={saving}
  >
    <Save className="h-4 w-4 mr-2" />
    {saving ? "Saving..." : "Save Progress"}
  </Button>
  <Button
    variant="default"
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
        Generate Infrastructure File
      </>
    )}
  </Button>
</div>
```

### 2. Buildings Step Component (`buildings-step.tsx`)

#### Removed Elements
- Removed `generatingFile` state
- Removed `handleGenerateInfrastructureFile` handler
- Removed "Generate Infrastructure File" button from step header
- Removed `FileDown` and `Loader2` icon imports

#### Updated Header
Simplified the header to only show "Add Building" button:
```tsx
<div className="flex justify-between items-center">
  <div>
    <h3 className="text-lg font-semibold">Buildings & Infrastructure</h3>
    <p className="text-sm text-muted-foreground">
      Define buildings with hierarchical structure: Building → Central Rack & Floors
    </p>
  </div>
  <Button onClick={addBuilding}>
    <Plus className="h-4 w-4 mr-2" />
    Add Building
  </Button>
</div>
```

## Benefits

### 1. **Global Accessibility**
- Button is now visible on **all wizard steps** (Buildings, Equipment Assignment, Central Rack, Proposal Document)
- Users can generate infrastructure files at any point in the wizard process

### 2. **Better UX**
- Consistent placement in the header next to "Save Progress"
- Users don't need to navigate back to step 1 to generate files
- Logical grouping of wizard-level actions (Save Progress + Generate File)

### 3. **Cleaner Component Structure**
- Step components focus on their specific functionality
- Wizard-level operations are handled at the wizard level
- Easier to maintain and extend

### 4. **Data Safety**
- Uses the same `cleanData` helper to prevent circular reference errors
- Accesses wizard-level data (`wizardData.buildings`) ensuring all changes are captured

## Usage

1. **Navigation**: Users can now see the "Generate Infrastructure File" button in the header on every wizard step
2. **Accessibility**: Button is enabled when at least one building exists
3. **Feedback**: Loading state with spinner during generation
4. **Toast Notifications**: Success/error messages with file details

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Infrastructure Survey                                        │
│ Step X of 4: [Step Name]                                    │
│                                [Save Progress] [Generate...] │
└─────────────────────────────────────────────────────────────┘
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░ 25% Complete              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    [Step Content Here]                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

         [Previous]                           [Next] →
```

## Technical Notes

- The handler includes the same `cleanData` helper used in `saveProgress` to handle circular references
- Button is disabled when `wizardData.buildings.length === 0` to prevent empty file generation
- Loading state prevents duplicate requests
- Toast notifications provide detailed feedback about generated files including version numbers

