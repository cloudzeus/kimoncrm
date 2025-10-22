# Final Implementation - EXACTLY What User Wants

## Requirements (from user):
1. Floor racks VISIBLE in DOM with ability to add devices, connections, terminations (same as central rack)
2. Upload images and blueprints to floor (in dropdown menu)
3. Notes should be optional - add to floor menu, not always visible
4. Rooms as accordion that expands to show devices and outlets

## Files to Modify:
1. `components/site-surveys/wizard-steps/building-tree-view.tsx`

## Changes Required:

### 1. Add Imports (top of file)
- Add `FileText` to lucide-react imports
- Add `import { ImageUploadButton } from "@/components/site-surveys/image-upload-button";`

### 2. Floor Dropdown Menu (line ~3527)
**Current:** TODO comment for floor rack
**Change to:** Implement addFloorRack function call

**Current:** Empty Images/Blueprints menu items  
**Change to:** Trigger ImageUploadButton clicks

**Add:** Notes menu item

### 3. Add Floor Rack Display Section (after floor expansion section)
**Location:** After floor fields, before rooms
**Add:** Floor Racks section that:
- Shows all racks with their properties
- Has buttons to add switches, devices, connections, terminations
- Always visible (no condition)

### 4. Make Rooms Accordion (current rooms section)
**Current:** Rooms always expanded
**Change to:** Wrap each room in Collapsible with:
- Header showing room name + device/outlet count badges
- ChevronDown button to expand
- Content inside CollapsibleContent

### 5. Remove Always-Visible Notes
**Current:** Notes textarea always shown
**Change to:** Remove textarea, only show notes in menu

## Implementation Strategy:
- Do ALL changes in ONE batch
- Test after completion
- NO partial implementations

