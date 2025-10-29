# Task Form Improvements - Multiselect & Time Inputs

## Changes Made

### ✅ Updated to Enhanced Task Form
**File:** `/Volumes/EXTERNALSSD/kimoncrm/components/leads/lead-detail-view.tsx`

Changed from the basic `LeadTasksKanban` to the `EnhancedLeadTasksKanban` component which includes:

1. **Multiselect Combobox with Search** - For assigning multiple users to tasks
2. **Time Input Fields** - For specifying exact times for due dates and reminders
3. **Improved UX** - Better user experience with searchable dropdowns

---

## New Features

### 1. 📋 Multiple Assignees with Search

**Before:**
- Simple dropdown select
- Could only assign ONE user
- No search functionality
- Hard to find users in long lists

**After:**
- Searchable combobox
- Can assign MULTIPLE users to the same task
- Type to search users by name or email
- Shows selected users as badges with remove option
- Supports clicking checkmarks to add/remove users

**How it works:**
```tsx
// Form field for multiple assignees
<Popover>
  <PopoverTrigger>
    <Button>
      {formData.assigneeIds.length > 0
        ? `${formData.assigneeIds.length} user(s) selected`
        : "Select assignees..."}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="Search users..." />
      <CommandGroup>
        {users.map((user) => (
          <CommandItem onSelect={() => toggleUser(user.id)}>
            <Check className={isSelected ? "opacity-100" : "opacity-0"} />
            {user.name} ({user.email})
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  </PopoverContent>
</Popover>

// Display selected users
<div className="flex flex-wrap gap-2">
  {formData.assigneeIds.map(userId => {
    const user = users.find(u => u.id === userId);
    return (
      <Badge key={userId}>
        {user.name}
        <X onClick={() => removeUser(userId)} />
      </Badge>
    );
  })}
</div>
```

### 2. ⏰ Date AND Time Selection

**Before:**
- Date input only
- No time specification
- Tasks defaulted to 9:00 AM

**After:**
- Date input + Time input side by side
- Precise scheduling (e.g., 2:30 PM)
- Applied to both:
  - Due Date & Time
  - Reminder Date & Time

**Layout:**
```
Due Date & Time:
┌─────────────┬──────────┐
│  Date Input │ Time Input│  <- Grid layout
└─────────────┴──────────┘

Reminder Date & Time:
┌─────────────┬──────────┐
│  Date Input │ Time Input│
└─────────────┴──────────┘
```

**How it works:**
```tsx
// Date and Time Inputs
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>Due Date & Time</Label>
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="date"
        value={formData.dueDate}
        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
      />
      <Input
        type="time"
        value={formData.dueTime}
        onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
      />
    </div>
  </div>
  <div className="space-y-2">
    <Label>Reminder Date & Time</Label>
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="date"
        value={formData.reminderDate}
        onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
      />
      <Input
        type="time"
        value={formData.reminderTime}
        onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
      />
    </div>
  </div>
</div>
```

**Data Processing:**
```typescript
// Combine date and time for API submission
const dueDateTime = formData.dueDate && formData.dueTime 
  ? `${formData.dueDate}T${formData.dueTime}:00`  // e.g., 2024-01-15T14:30:00
  : formData.dueDate ? `${formData.dueDate}T09:00:00`  // Default to 9 AM if no time
  : null;

const reminderDateTime = formData.reminderDate && formData.reminderTime
  ? `${formData.reminderDate}T${formData.reminderTime}:00`
  : formData.reminderDate ? `${formData.reminderDate}T09:00:00`
  : null;
```

### 3. 🎯 Additional Enhancements in Enhanced Form

The Enhanced component also includes:

- **File Attachments** - Attach multiple files to tasks
- **User Attribution** - Automatically adds your name to descriptions
- **Contact Selection** - Searchable combobox for selecting lead contacts
- **Drag & Drop** - Better task card organization
- **Visual Indicators** - Overdue warnings, days until due
- **Task Details Dialog** - Full task view with all information
- **Multiple Assignee Display** - Shows all assigned users on task cards

---

## Usage

### Creating a Task

1. Click "New Task" button
2. Fill in title and description
3. **Select assignees:**
   - Click "Select assignees..." button
   - Type to search users
   - Click users to toggle selection
   - Selected users appear as badges below
4. **Set due date and time:**
   - Click date field to select date
   - Click time field to set specific time (e.g., 14:30)
5. **Set reminder (optional):**
   - Same process as due date
6. **Attach files (optional)**
7. Click "Create Task"

### Editing a Task

1. Click on a task card or click Edit button
2. Update any fields
3. **Change assignees:**
   - Click assignees button
   - Add or remove users
4. **Update times:**
   - Modify time fields as needed
5. Click "Save Changes"

---

## Technical Details

### Components Used

**shadcn/ui Components:**
- `Command` - For searchable combobox
- `Popover` - For dropdown trigger
- `Badge` - For displaying selected items
- `Input[type="date"]` - For date selection
- `Input[type="time"]` - For time selection

**Enhanced Form State:**
```typescript
const [formData, setFormData] = useState({
  title: "",
  description: "",
  assignedToId: "",        // Legacy single assignee (still used)
  contactId: "",
  dueDate: "",            // YYYY-MM-DD format
  dueTime: "",            // HH:MM format (24-hour)
  reminderDate: "",       // YYYY-MM-DD format
  reminderTime: "",       // HH:MM format (24-hour)
  assigneeIds: [],        // NEW: Array of user IDs
});
```

### API Integration

The enhanced form sends datetime strings in ISO 8601 format:
```json
{
  "title": "Review Proposal",
  "description": "John Doe: Need to review the client proposal",
  "assigneeIds": ["user-123", "user-456"],
  "dueDate": "2024-01-15T14:30:00",
  "reminderDate": "2024-01-14T09:00:00"
}
```

### Database Schema

The backend should handle:
- `dueDate` as DateTime (includes time)
- `reminderDate` as DateTime (includes time)
- `assignees` relation to support multiple users per task

---

## Migration Notes

### Backward Compatibility

The enhanced form maintains backward compatibility with existing data:
- Old tasks with only dates still work (time defaults to 9:00 AM)
- Single assignee tasks are migrated to the multiple assignees system
- Existing API endpoints remain compatible

### For Developers

If you need to add similar functionality elsewhere:

1. Import the necessary components:
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
```

2. Add time inputs alongside date inputs:
```tsx
<div className="grid grid-cols-2 gap-2">
  <Input type="date" />
  <Input type="time" />
</div>
```

3. Combine date and time before API submission:
```typescript
const dateTime = date && time 
  ? `${date}T${time}:00` 
  : date ? `${date}T09:00:00` : null;
```

---

## Benefits

✅ **Better Task Assignment**
- Assign multiple people to complex tasks
- Easy collaboration on shared responsibilities
- Quick search for team members

✅ **Precise Scheduling**
- Set exact meeting times
- Schedule reminders at specific times
- Better calendar integration

✅ **Improved UX**
- Search functionality reduces scrolling
- Visual feedback with badges
- Clearer time specification

✅ **Maintains Backward Compatibility**
- Existing tasks continue to work
- Gradual migration path
- No data loss

---

## Files Modified

1. `/Volumes/EXTERNALSSD/kimoncrm/components/leads/lead-detail-view.tsx`
   - Changed import from `LeadTasksKanban` to `EnhancedLeadTasksKanban`
   - Added `currentUser` prop for user attribution

---

## Testing Checklist

- [ ] Create new task with multiple assignees
- [ ] Create task with specific due time
- [ ] Create task with reminder time
- [ ] Edit existing task and change assignees
- [ ] Edit existing task and change times
- [ ] Search for users in assignee dropdown
- [ ] Remove assignee using X button on badge
- [ ] Verify task appears in calendar at correct time
- [ ] Verify email notifications include correct time
- [ ] Test with long lists of users (search functionality)
- [ ] Test on mobile/tablet (responsive design)

---

## Screenshots Reference

### Before (Old Form):
```
Title: [________________]
Description: [________________]
Assign To: [Dropdown ▼]        <- Single select, no search
Due Date: [2024-01-15]          <- Date only
Reminder: [2024-01-14]          <- Date only
```

### After (Enhanced Form):
```
Title: [________________]
Description: [________________]

Assignees: [2 user(s) selected ▼]   <- Multiselect with search
  [John Doe ✕] [Jane Smith ✕]       <- Badge display

Due Date & Time:
  [2024-01-15] [14:30]              <- Date + Time

Reminder Date & Time:
  [2024-01-14] [09:00]              <- Date + Time
```

---

## Future Enhancements

Potential improvements:
- [ ] Datetime picker (combined date + time in one input)
- [ ] Timezone support for international teams
- [ ] Recurring tasks
- [ ] Task templates with pre-filled assignees
- [ ] Smart scheduling suggestions
- [ ] Team availability checking
- [ ] Calendar view integration

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify user list is loading correctly
3. Ensure datetime strings are being formatted correctly
4. Check API endpoint logs for datetime parsing issues
5. Test with different browsers (time input support varies)

---

**Note:** The old `LeadTasksKanban` component is still available in the codebase for reference but is no longer used in the lead detail view.

