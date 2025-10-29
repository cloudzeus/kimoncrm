# Cache Clear Fix - LeadTasksKanban Error

## Error Message
```
ReferenceError: LeadTasksKanban is not defined
at LeadDetailView (components/leads/lead-detail-view.tsx:897:16)
```

## Root Cause
Next.js was serving cached/stale build files that still referenced the old `LeadTasksKanban` component, even though the source code was updated to use `EnhancedLeadTasksKanban`.

## Solution Applied

### 1. Cleared Next.js Build Cache
```bash
rm -rf .next
```

### 2. Cleared TypeScript Build Cache
```bash
rm -f tsconfig.tsbuildinfo
```

### 3. Restart Development Server
After clearing caches, restart your dev server:
```bash
npm run dev
```

## What Changed

**File:** `components/leads/lead-detail-view.tsx`

**Line 74 - Import:**
```tsx
// OLD (removed):
import { LeadTasksKanban } from "./lead-tasks-kanban";

// NEW:
import { EnhancedLeadTasksKanban } from "./enhanced-lead-tasks-kanban";
```

**Line 897 - Usage:**
```tsx
// OLD:
<LeadTasksKanban
  leadId={lead.id}
  leadContacts={leadContacts}
  users={users}
  onTasksChange={fetchTaskStats}
/>

// NEW:
<EnhancedLeadTasksKanban
  leadId={lead.id}
  leadContacts={leadContacts}
  users={users}
  onTasksChange={fetchTaskStats}
  currentUser={users.find(u => u.id === currentUserId)}
/>
```

## Verification Steps

1. **Stop** your development server (Ctrl+C)
2. **Clear** caches (already done)
3. **Restart** the dev server:
   ```bash
   npm run dev
   ```
4. **Navigate** to a lead detail page
5. **Click** on the "Tasks" tab
6. **Verify** the enhanced form loads with:
   - Multiselect assignee dropdown with search
   - Time inputs for due date and reminder

## If Error Persists

If you still see the error after restarting:

### Option 1: Hard Refresh Browser
- Chrome/Edge: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

### Option 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Clean Install
```bash
# Stop dev server
# Clear everything
rm -rf .next
rm -rf node_modules
rm -f package-lock.json
rm -f tsconfig.tsbuildinfo

# Reinstall
npm install

# Restart
npm run dev
```

### Option 4: Check for Multiple Instances
Make sure you don't have multiple dev servers running on different ports:
```bash
# Kill all node processes (careful!)
pkill -f "next dev"

# Or check what's running
lsof -i :3000
```

## Why This Happens

Next.js caches compiled components for faster builds. When you:
1. Rename a component
2. Change imports
3. Restructure files

The cache may serve old versions until explicitly cleared.

## Prevention

To avoid this in the future:

1. **After major refactoring**, always clear `.next`:
   ```bash
   rm -rf .next && npm run dev
   ```

2. **Use Fast Refresh properly** - Save files one at a time to let Fast Refresh update

3. **Watch for import errors** - TypeScript will warn you before runtime

4. **Check build output** - Look for "compiled successfully" messages

## Technical Details

### What Was Cached
- Component bundle with old `LeadTasksKanban` import
- TypeScript compilation results
- Module resolution mapping
- Webpack chunk references

### What Got Cleared
- `.next/` directory (entire Next.js build)
- `tsconfig.tsbuildinfo` (TypeScript incremental build info)

### What Wasn't Affected
- `node_modules/` (dependencies)
- Source files
- Database
- Environment variables

## Success Indicators

After restarting, you should see:
```
✓ Compiled /leads/[id] in XXXms
✓ Compiled /api/leads/[id]/tasks in XXXms
```

And the Tasks tab should show the enhanced form with:
- ✅ Searchable multi-select for assignees
- ✅ Time inputs next to date inputs
- ✅ No console errors
- ✅ No "LeadTasksKanban is not defined" error

## Related Documentation
- See `TASK_FORM_IMPROVEMENTS.md` for feature details
- See `EMAIL_SYSTEM_FIXES.md` for email-related fixes

