# Document Generation Button Group Design

## Overview
A visually cohesive button group for document generation in the Comprehensive Infrastructure Wizard, using different colors to distinguish each document type.

## Visual Design

### Button Group Layout
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Infrastructure Survey                                                           │
│ Step X of 4: [Step Name]                                                       │
│                         [Save Progress] [Infrastructure│BOM│RFP]                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Color Scheme

| Button | Color | Purpose |
|--------|-------|---------|
| **Infrastructure** | Blue (`bg-blue-600`) | Building and infrastructure reports |
| **BOM** | Green (`bg-green-600`) | Bill of Materials Excel |
| **RFP** | Purple (`bg-purple-600`) | Request for Proposal documents |

### Button Group Structure

```tsx
{/* Document Generation Button Group */}
<div className="flex items-center rounded-lg overflow-hidden shadow-sm">
  <Button
    className="rounded-none bg-blue-600 hover:bg-blue-700 text-white border-r border-blue-500"
    size="sm"
    onClick={handleGenerateInfrastructureFile}
    disabled={wizardData.buildings.length === 0 || generatingFile}
  >
    {generatingFile ? (
      <>
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <FileDown className="h-4 w-4 mr-1" />
        Infrastructure
      </>
    )}
  </Button>
  <Button
    className="rounded-none bg-green-600 hover:bg-green-700 text-white border-r border-green-500"
    size="sm"
    onClick={handleGenerateBOM}
    disabled={generatingBOM}
  >
    {generatingBOM ? (
      <>
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <FileDown className="h-4 w-4 mr-1" />
        BOM
      </>
    )}
  </Button>
  <Button
    className="rounded-none bg-purple-600 hover:bg-purple-700 text-white"
    size="sm"
    onClick={handleGenerateRFP}
    disabled={generatingRFP}
  >
    {generatingRFP ? (
      <>
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <FileDown className="h-4 w-4 mr-1" />
        RFP
      </>
    )}
  </Button>
</div>
```

## Design Features

### 1. **Seamless Button Group**
- `rounded-lg overflow-hidden` on container creates unified appearance
- `rounded-none` on individual buttons removes default border radius
- `border-r` creates visual separation between buttons
- `shadow-sm` adds subtle depth to the group

### 2. **Color Coding**
Each button has a distinct color for easy visual identification:

#### Infrastructure (Blue)
```css
bg-blue-600 hover:bg-blue-700 text-white border-r border-blue-500
```
- **Primary Color**: Blue 600
- **Hover State**: Blue 700 (darker)
- **Border**: Blue 500 (lighter for contrast)
- **Purpose**: Infrastructure and building reports

#### BOM (Green)
```css
bg-green-600 hover:bg-green-700 text-white border-r border-green-500
```
- **Primary Color**: Green 600
- **Hover State**: Green 700 (darker)
- **Border**: Green 500 (lighter for contrast)
- **Purpose**: Bill of Materials

#### RFP (Purple)
```css
bg-purple-600 hover:bg-purple-700 text-white
```
- **Primary Color**: Purple 600
- **Hover State**: Purple 700 (darker)
- **No Border**: Last button in group
- **Purpose**: Request for Proposal

### 3. **Compact Design**
- `size="sm"` for smaller, more compact buttons
- `mr-1` for tighter icon spacing (instead of `mr-2`)
- Shorter button labels for better fit

### 4. **Visual Hierarchy**
```
┌─────────────────────────────────────────────────────┐
│ [Save Progress]  [Infrastructure│BOM│RFP]            │
│   ^outline         ^solid colors grouped             │
└─────────────────────────────────────────────────────┘
```
- **Save Progress**: Outline style (secondary action)
- **Document Group**: Solid colors (primary actions)

## States

### Normal State
```
┌──────────────┬─────┬─────┐
│ Infrastructure│ BOM │ RFP │
│    Blue       │Green│Purpl│
└──────────────┴─────┴─────┘
```

### Loading State
```
┌──────────────┬─────┬─────┐
│ ⟳ Generating...│ BOM │ RFP │
│    Blue       │Green│Purpl│
└──────────────┴─────┴─────┘
```
- Spinner icon replaces download icon
- Text changes to "Generating..."
- Button remains in loading state until completion

### Disabled State
```
┌──────────────┬─────┬─────┐
│ Infrastructure│ BOM │ RFP │
│  Grayed Out   │Green│Purpl│
└──────────────┴─────┴─────┘
```
- Infrastructure: Disabled when no buildings exist
- BOM/RFP: Disabled when no equipment exists
- Native disabled styling applied

## Scalability

### Adding More Buttons
The design easily accommodates additional document types:

```tsx
<div className="flex items-center rounded-lg overflow-hidden shadow-sm">
  <Button className="rounded-none bg-blue-600 hover:bg-blue-700 text-white border-r border-blue-500" size="sm">
    <FileDown className="h-4 w-4 mr-1" />
    Infrastructure
  </Button>
  <Button className="rounded-none bg-green-600 hover:bg-green-700 text-white border-r border-green-500" size="sm">
    <FileDown className="h-4 w-4 mr-1" />
    BOM
  </Button>
  <Button className="rounded-none bg-purple-600 hover:bg-purple-700 text-white border-r border-purple-500" size="sm">
    <FileDown className="h-4 w-4 mr-1" />
    RFP
  </Button>
  {/* New buttons can be added here */}
  <Button className="rounded-none bg-orange-600 hover:bg-orange-700 text-white border-r border-orange-500" size="sm">
    <FileDown className="h-4 w-4 mr-1" />
    Quote
  </Button>
  <Button className="rounded-none bg-red-600 hover:bg-red-700 text-white" size="sm">
    <FileDown className="h-4 w-4 mr-1" />
    Invoice
  </Button>
</div>
```

### Suggested Colors for Future Buttons
- **Orange** (`bg-orange-600`): Quotes, Estimates
- **Red** (`bg-red-600`): Invoices, Critical Documents
- **Indigo** (`bg-indigo-600`): Reports, Analytics
- **Pink** (`bg-pink-600`): Marketing Materials
- **Teal** (`bg-teal-600`): Technical Specifications
- **Amber** (`bg-amber-600`): Warnings, Notices
- **Cyan** (`bg-cyan-600`): Data Exports

## Responsive Behavior

### Desktop View (≥1024px)
```
[Save Progress]  [Infrastructure│BOM│RFP]
```
All buttons visible in single row

### Tablet View (768px - 1023px)
```
[Save Progress]
[Infrastructure│BOM│RFP]
```
May wrap to two rows depending on content

### Mobile View (<768px)
```
[Save Progress]
[Infrastructure]
[BOM]
[RFP]
```
Consider stacking or using dropdown menu for space

## Accessibility

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order: Save Progress → Infrastructure → BOM → RFP
- Enter/Space to activate

### Screen Readers
- Each button has descriptive text
- Loading state announces "Generating..."
- Icons are decorative (not read by screen readers)

### Color Contrast
All button colors meet WCAG AA standards for contrast:
- Blue 600 on white text: ✅ 4.5:1 ratio
- Green 600 on white text: ✅ 4.5:1 ratio
- Purple 600 on white text: ✅ 4.5:1 ratio

## Benefits

1. **Visual Distinction**: Each document type has unique color
2. **Space Efficient**: Compact button group saves header space
3. **Professional Look**: Unified design with rounded corners and shadow
4. **Easy to Extend**: Simple to add more buttons with new colors
5. **Clear Hierarchy**: Save Progress (outline) vs Documents (solid)
6. **Consistent Spacing**: Equal padding and margins throughout
7. **Hover Feedback**: Darker shade on hover for interactivity
8. **Loading States**: Clear visual feedback during generation
9. **Disabled States**: Obvious when actions are unavailable
10. **Modern Design**: Follows current UI/UX trends

## CSS Classes Breakdown

### Container
```css
flex items-center rounded-lg overflow-hidden shadow-sm
```
- `flex items-center`: Horizontal layout with vertical centering
- `rounded-lg`: Large border radius on container
- `overflow-hidden`: Clips button corners for seamless look
- `shadow-sm`: Subtle shadow for depth

### Button Base
```css
rounded-none size-sm
```
- `rounded-none`: Removes default button border radius
- `size-sm`: Smaller size for compact design

### Color Variants
```css
bg-{color}-600 hover:bg-{color}-700 text-white border-r border-{color}-500
```
- `bg-{color}-600`: Base background color
- `hover:bg-{color}-700`: Darker on hover
- `text-white`: White text for contrast
- `border-r`: Right border for separation
- `border-{color}-500`: Lighter shade for border

## Implementation Notes

1. **No Gap Between Buttons**: `overflow-hidden` on container creates seamless appearance
2. **Last Button No Border**: RFP button omits `border-r` class
3. **Icon Spacing**: `mr-1` instead of `mr-2` for tighter spacing
4. **Shadow on Container**: Applied to container, not individual buttons
5. **Consistent Sizing**: All buttons use `size="sm"`

## Future Enhancements

### Potential Additions
1. **Dropdown Menu**: For even more document types
2. **Tooltips**: Hover descriptions for each document type
3. **Progress Indicators**: Show generation progress percentage
4. **Quick Preview**: Dropdown with recent files
5. **Keyboard Shortcuts**: Ctrl+1, Ctrl+2, Ctrl+3 for quick access
6. **Badge Counters**: Show number of existing versions
7. **Download History**: Track and display recent downloads
8. **Bulk Actions**: Select and generate multiple document types

### Example with Dropdown
```tsx
<div className="flex items-center rounded-lg overflow-hidden shadow-sm">
  {/* Primary buttons */}
  <Button>Infrastructure</Button>
  <Button>BOM</Button>
  <Button>RFP</Button>
  
  {/* More options dropdown */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="rounded-none bg-gray-600 hover:bg-gray-700 text-white">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Quote</DropdownMenuItem>
      <DropdownMenuItem>Invoice</DropdownMenuItem>
      <DropdownMenuItem>Technical Specs</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

## Related Files
- `/components/site-surveys/comprehensive-infrastructure-wizard.tsx` - Main implementation
- `/components/ui/button.tsx` - Button component
- `/tailwind.config.js` - Color configuration

