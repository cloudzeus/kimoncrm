# Lead Notes & Messaging System

## Overview
A comprehensive notes/messaging system for leads that allows all participants (lead owner, assignee, task assignees, and added collaborators) to communicate and share files exclusively within a lead context. All participants receive email notifications when new notes or replies are posted.

## Features Implemented

### 1. Database Schema
Created the following models in Prisma:

#### **LeadNote Model**
- Threaded conversation support (parent-child relationships)
- Support for multiple file attachments per note
- System notes capability for automated messages
- Timestamp tracking (created/updated)
- Relations to users, lead, and attachments

#### **LeadParticipant Model**
- Tracks all users who can access lead notes
- Role-based access (OWNER, ASSIGNEE, TASK_ASSIGNEE, COLLABORATOR, VIEWER)
- Audit trail (who added whom and when)
- Automatic participation for lead owners, assignees, and task assignees

#### **LeadNoteAttachment Model**
- Links files to notes/replies
- Supports multiple files per note
- Cascading deletion when note is removed

### 2. API Endpoints

#### **Notes API** (`/api/leads/[id]/notes`)
- **GET**: Fetch all notes with nested replies and attachments
  - Access control: Only participants, lead owner/assignee, task assignees, managers, and admins
  - Returns threaded structure with top-level notes and their replies
  
- **POST**: Create new note or reply
  - Supports file attachments (multiple files)
  - Email notifications sent to all participants
  - Access control: Same as GET

#### **Participants API** (`/api/leads/[id]/participants`)
- **GET**: Fetch all participants
  - Returns user details, role, and who added them
  
- **POST**: Add new participant
  - Add any employee, manager, or admin as collaborator
  - Set role (COLLABORATOR or VIEWER)
  
- **DELETE**: Remove participant
  - Cannot remove lead owner or assignee
  - Only owner, assignee, managers, and admins can manage participants

### 3. Email Notifications
Automated email notifications sent to all participants when:
- A new note is posted
- A reply is added to an existing note

Email includes:
- Note content
- Author name and timestamp
- List of attachments (if any)
- Lead information
- Personalized email signature

Recipients:
- Lead owner
- Lead assignee
- All participants
- All task assignees (automatically included)
- **Excludes**: The person who posted the note

### 4. UI Components

#### **LeadNotesTimeline Component**
Location: `/components/leads/lead-notes-timeline.tsx`

Features:
- Timeline view with expandable note threads
- Reply functionality on any top-level note
- Multiple file upload support (drag & drop compatible)
- File attachment preview with download links
- Real-time UI updates after posting
- User avatars and initials
- Relative timestamps ("2 hours ago")
- Visual thread indicators
- Empty state messaging

#### **LeadParticipantsManager Component**
Location: `/components/leads/lead-participants-manager.tsx`

Features:
- List all current participants with roles
- Add new participants via dropdown
- Select from all employees, managers, and admins
- Assign roles (Collaborator or Viewer)
- Remove participants (except owner/assignee)
- Visual role badges
- User avatars
- Empty state messaging

### 5. Integration

#### **Lead Detail Page**
Location: `/app/(main)/leads/[id]/page.tsx`

Added to tabs:
- **Notes Tab**: Shows timeline with count badge
- **Participants Tab**: Shows participant manager with count badge

Server-side data fetching includes:
- All notes with nested replies
- All attachments
- All participants with user details

### 6. Task Creation Enhancement
Added console logging for calendar event creation:
- Logs successful calendar event creation for each assignee
- Includes assignee email and response details
- Helps with debugging calendar integration

## User Permissions

### Who Can Access Notes?
1. Lead owner (ownerId)
2. Lead assignee (assigneeId)
3. Task assignees (anyone assigned to tasks on the lead)
4. Added participants (via Participants tab)
5. Managers (role: MANAGER)
6. Admins (role: ADMIN)

### Who Can Add Participants?
1. Lead owner
2. Lead assignee
3. Managers
4. Admins

### Who Can Remove Participants?
- Same as "Who Can Add Participants"
- **Cannot remove**: Lead owner or assignee

## File Upload Support

### Features
- Multiple files per note/reply
- Files stored via BunnyCDN
- File metadata: name, type, size, URL
- Visual file badges in UI
- Click to download/view
- Remove files before posting

### Entity Type
Files are tagged with entity type: `LEAD_NOTE`

## Database Migration

To apply the schema changes:

```bash
npx prisma db push
```

This will create:
- `LeadNote` table
- `LeadParticipant` table
- `LeadNoteAttachment` table
- `LeadParticipantRole` enum

## User Flow

### 1. Viewing Notes
1. Navigate to lead detail page
2. Click "Notes" tab
3. See timeline of all conversations
4. Expand/collapse threads to see replies

### 2. Adding a Note
1. Type message in "Add New Note" form
2. Optionally attach files (click "Attach files" or drag & drop)
3. Click "POST NOTE"
4. All participants receive email notification
5. Note appears in timeline

### 3. Replying to a Note
1. Click "Reply" button on any note
2. Type your reply
3. Optionally attach files
4. Click "Send Reply"
5. Reply appears nested under parent note
6. All participants receive email notification

### 4. Managing Participants
1. Click "Participants" tab
2. Click "ADD PARTICIPANT" button
3. Select user from dropdown (employees/managers/admins)
4. Choose role (Collaborator or Viewer)
5. Click "ADD"
6. User can now access notes and receive notifications

### 5. Removing Participants
1. Go to "Participants" tab
2. Click X button next to participant
3. Confirm removal
4. User loses access to notes (except if owner/assignee)

## Technical Details

### File Upload Flow
1. User selects files
2. Files uploaded to BunnyCDN via `/api/files/upload`
3. File IDs collected
4. Note/reply created with file IDs
5. `LeadNoteAttachment` records created linking note to files

### Email Notification Flow
1. Note/reply created
2. System collects all participant emails
3. Gets lead owner, assignee, task assignees
4. Removes sender from recipient list
5. Generates HTML email with signature
6. Sends email to each recipient via Microsoft Graph API
7. Failures logged but don't prevent note creation

### Access Control
- Every API endpoint checks user permissions
- Prisma queries filter based on user relationships
- Frontend conditionally renders based on role
- No data leakage to unauthorized users

## Future Enhancements (Potential)

1. **Edit/Delete Notes**: Allow authors to edit/delete their notes
2. **Mentions**: @mention specific users in notes
3. **Rich Text**: Support markdown or WYSIWYG editor
4. **Reactions**: Like/emoji reactions to notes
5. **Search**: Full-text search across notes
6. **Attachments**: Preview images/PDFs inline
7. **Notifications**: In-app notifications (not just email)
8. **Read Receipts**: Track who has read notes
9. **Export**: Export conversation as PDF
10. **Categories**: Tag notes with categories

## Testing Checklist

- [ ] Create a new lead
- [ ] Post a note as lead owner
- [ ] Add a participant
- [ ] Post note as participant
- [ ] Reply to a note
- [ ] Attach multiple files
- [ ] Download attached files
- [ ] Remove a participant
- [ ] Verify email notifications sent
- [ ] Test access control (unauthorized users)
- [ ] Test task assignee automatic access
- [ ] Expand/collapse threads
- [ ] Test with manager/admin roles

## Files Modified/Created

### Created
- `/app/api/leads/[id]/notes/route.ts`
- `/app/api/leads/[id]/participants/route.ts`
- `/components/leads/lead-notes-timeline.tsx`
- `/components/leads/lead-participants-manager.tsx`
- `/LEAD_NOTES_SYSTEM.md` (this file)

### Modified
- `/prisma/schema.prisma` - Added LeadNote, LeadParticipant, LeadNoteAttachment models
- `/app/(main)/leads/[id]/page.tsx` - Added notes and participants data fetching
- `/components/leads/lead-detail-view.tsx` - Added Notes and Participants tabs
- `/app/api/leads/[id]/tasks/route.ts` - Added console.log for calendar responses

## Support & Maintenance

For issues or questions:
1. Check console logs for errors
2. Verify Prisma schema is pushed
3. Check email service configuration
4. Verify BunnyCDN credentials
5. Review access control permissions

