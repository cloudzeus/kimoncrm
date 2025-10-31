# Site Survey Floor Switch Display Fix

## Issue Description
When adding a new device (like a switch) to a floor rack in the site survey's first step, the device was not immediately displayed in the DOM. The data was being saved correctly, but the UI was not showing the newly added devices.

## Root Cause
The floor rack device sections (switches, routers, servers, connections, etc.) were using **conditional rendering** that only displayed the section if the array had items:

```typescript
{rack.switches && rack.switches.length > 0 && (
  <div className="mt-4">
    {/* Switches section */}
  </div>
)}
```

This caused a race condition where:
1. User clicks "Add Switch"
2. The `addFloorRackSwitch` function adds the switch to the data
3. It calls `toggleFloorRackSection(rackId, 'switches')` to expand the section
4. BUT the section doesn't exist in the DOM yet because the component hasn't re-rendered with the new data
5. The section only appears after a full re-render or page refresh

## Solution Applied

### 1. Fixed Switches Section (Line 4349-4414)
Changed from conditional rendering to **always render** the section, with conditional content inside:

**Before:**
```typescript
{rack.switches && rack.switches.length > 0 && (
  <div className="mt-4">
    <Collapsible>
      {rack.switches.map(...)}
    </Collapsible>
  </div>
)}
```

**After:**
```typescript
<div className="mt-4">
  <Collapsible>
    <CollapsibleContent>
      {rack.switches && rack.switches.length > 0 ? (
        rack.switches.map(...)
      ) : (
        <p className="text-xs text-muted-foreground p-2">No switches added yet</p>
      )}
    </CollapsibleContent>
  </Collapsible>
</div>
```

### 2. Added Missing Routers Section (Line 4416-4481)
Routers had an "Add Router" button but no rendering section. Added complete rendering with auto-expand support.

### 3. Added Missing Servers Section (Line 4483-4539)
Servers had an "Add Server" button but no rendering section. Added complete rendering with auto-expand support.

### 4. Fixed Connections Section (Line 4717-4781)
Applied the same always-render pattern with empty state message.

### 5. Added Missing Device Type Sections (Line 4541-4715)
Added rendering for devices that had "Add" buttons but no display:
- **ATA** (Analog Telephone Adapter) - Single device with brand, model, ports
- **NVR** (Network Video Recorder) - Single device with channels, VMS
- **Headend** - Single device with name, brand, model, channels
- **LoRaWAN Gateway** - Single device with name, brand, model, EUI

## Benefits

### Immediate User Feedback
- Users now see devices immediately after adding them
- No need to collapse/expand or refresh the page
- Clear empty state messages guide users

### Consistent UX
- All device types now follow the same pattern
- Sections always visible with proper badges showing count
- Auto-expand works correctly on first add

### Complete Feature Coverage
- All "Add" menu items now have corresponding display sections
- No more "ghost" devices that are saved but not shown
- Readonly display appropriate for this step (first step is just viewing)

## Files Modified
- `/components/site-surveys/wizard-steps/building-tree-view.tsx`

## Testing Recommendations
1. Add a switch to a floor rack - should appear immediately
2. Add a router to a floor rack - should appear immediately
3. Add a server to a floor rack - should appear immediately
4. Add an ATA, NVR, Headend, or LoRaWAN Gateway - should appear immediately
5. Add a connection to a floor rack - should appear immediately
6. Verify the section auto-expands when adding the first device
7. Verify empty state messages show when no devices are added
8. Verify badge counts update correctly

## Related Components
This fix is specific to the `BuildingTreeView` component used in the site survey wizard. Similar patterns may exist in other components like:
- `EquipmentAssignmentStep` 
- `InfrastructureStep`
- `CablingHierarchyForm`

These should be reviewed for similar conditional rendering issues.

