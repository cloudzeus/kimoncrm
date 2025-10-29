# Build Fix: Missing Avatar Utils Module

## Issue
Build error when accessing lead detail pages due to missing avatar utility module.

### Error Message
```
Module not found: Can't resolve '@/lib/avatar/avatar-utils'
./components/leads/lead-notes-timeline.tsx:12:1
./components/leads/lead-participants-manager.tsx
```

## Root Cause
The `lead-notes-timeline.tsx` and `lead-participants-manager.tsx` components were importing `getAvatarUrl` from `@/lib/avatar/avatar-utils`, but this file didn't exist in the codebase.

## Solution
Created the missing utility file: `/lib/avatar/avatar-utils.ts`

### Functions Provided

#### 1. `getAvatarUrl(user)`
Returns the avatar URL for a user, with fallback logic.

**Behavior**:
- Prefers `user.avatar` over `user.image`
- Returns `undefined` if user is null/undefined
- Returns `undefined` if no avatar/image exists

**Usage**:
```typescript
import { getAvatarUrl } from "@/lib/avatar/avatar-utils";

<AvatarImage src={getAvatarUrl(user)} />
```

#### 2. `getInitials(name)`
Extracts initials from a name for fallback avatar display.

**Behavior**:
- Returns first letter of each word (up to 2 letters)
- Returns "?" if name is null/undefined
- Converts to uppercase

**Usage**:
```typescript
import { getInitials } from "@/lib/avatar/avatar-utils";

<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
```

#### 3. `isValidImageUrl(url)`
Validates if a URL is properly formatted.

**Behavior**:
- Returns `false` for null/undefined
- Returns `true` if URL can be parsed
- Returns `false` for invalid URLs

**Usage**:
```typescript
import { isValidImageUrl } from "@/lib/avatar/avatar-utils";

if (isValidImageUrl(avatarUrl)) {
  // Load image
}
```

## Files Created
- ✅ `/lib/avatar/avatar-utils.ts` - Avatar utility functions

## Files Using This Module
- `/components/leads/lead-notes-timeline.tsx`
- `/components/leads/lead-participants-manager.tsx`

## Testing
- [x] Build completes without errors
- [x] No TypeScript linting errors
- [x] Functions properly typed
- [x] Follows existing codebase patterns

## Next Steps
None required - build error is resolved.

## Notes
This utility provides a centralized way to handle avatar URLs across the application, ensuring consistent behavior when dealing with user avatars vs images.

