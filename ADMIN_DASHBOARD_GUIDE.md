# Admin Dashboard Guide

## Overview

The KimonCRM Admin Dashboard is a comprehensive control panel that provides administrators with a complete view of all system activities, including tasks, leads, site surveys, notes, and communications. The dashboard features professional UI/UX design with drag-and-drop functionality, detailed statistics, and powerful filtering capabilities.

## Features

### 1. **Dual-Pane View System**
The dashboard offers two distinct view modes:

#### All Items View
- Shows **ALL** tasks, leads, site surveys, and notes across the entire system
- Perfect for system-wide oversight and management
- Includes data from all users and departments
- Accessible via the "ALL ITEMS" tab

#### My Items View
- Filters content to show only items where the admin is involved
- Includes:
  - Tasks assigned to or created by the admin
  - Leads owned or assigned to the admin
  - Site surveys assigned to the admin
  - Notes created by the admin
- Accessible via the "MY ITEMS" tab

### 2. **Comprehensive Statistics Dashboard**

#### Key Metrics Cards
- **Total Tasks**: Combined count of lead tasks and project tasks
- **Leads**: Total number of leads with active lead count
- **Site Surveys**: Number of site assessments
- **Notes**: Communication threads count
- **Overdue**: Critical tasks requiring immediate attention

#### Visual Analytics
- **Task Status Distribution**: Pie chart showing task breakdown (Not Started, In Progress, Completed)
- **Lead Status**: Bar chart displaying lead pipeline stages
- **Site Survey Status**: Bar chart for survey progress tracking
- **Activity Timeline**: Line chart showing recent activity trends

### 3. **Drag-and-Drop Task Management**

#### Kanban View
- Visual board with three columns:
  - **NOT STARTED**: New or pending tasks
  - **IN PROGRESS**: Active tasks being worked on
  - **COMPLETED**: Finished tasks
- Drag tasks between columns to update their status
- Real-time updates to the backend
- Optimistic UI updates for instant feedback
- Works with both lead tasks and project tasks

#### List View
- Traditional list layout with detailed information
- Split into Lead Tasks and Project Tasks
- Shows assignees, due dates, and related entities
- Quick action buttons for viewing and editing

### 4. **Advanced Filtering & Search**

#### Search Functionality
- Real-time search across all entities
- Searches task titles, lead names, customer names
- Instant results as you type

#### Status Filters
- Filter by task status:
  - All Status
  - Not Started
  - In Progress
  - Completed
  - Todo (for project tasks)
  - Done (for project tasks)

### 5. **Detailed Modal Views**

Click the eye icon on any item to view comprehensive details:

#### Lead Task Details
- Title and description
- Status with color coding
- Due date and reminders
- Related lead information
- Assigned user(s)
- Additional assignees
- Task history

#### Project Task Details
- Task information
- Project association
- Priority level
- Status and progress
- Assignee details

#### Lead Details
- Lead title and number
- Description
- Status and stage
- Customer information
- Owner and assignee
- Priority level

#### Site Survey Details
- Survey title and type
- Description
- Status
- Customer
- Arranged date
- Address/location

#### Note Details
- Full content
- Related lead
- Author information
- Timestamp
- Threaded replies
- Reply history

### 6. **Activity Tracking**

The Activity tab provides:
- Recent status changes across all leads
- Visual timeline chart
- Detailed change log with:
  - User who made the change
  - From/to status
  - Related lead information
  - Notes and comments
  - Timestamp

### 7. **Direct Navigation**

- Click the edit icon to navigate directly to the entity
- Quick links to:
  - Lead detail pages
  - Project detail pages
  - Site survey pages
- Seamless workflow integration

## Navigation Structure

```
/admin                    → Redirects to /admin/overview
/admin/overview          → Admin control panel with quick access
/admin/dashboard         → Main comprehensive dashboard
/admin/users             → User management
/admin/departments       → Department management
/admin/positions         → Work positions management
```

## Access Levels

### Administrator Role Required
- Only users with `ADMIN` role can access these pages
- Automatic authentication checks on all admin routes
- Secure API endpoints for data fetching

## UI/UX Design Principles

### Professional Design
- **Clean and Modern**: Minimalist design with focus on content
- **Shadow-based Depth**: No borders, uses shadows for visual hierarchy
- **Uppercase Headers**: Greek text preference for headers
- **Color-Coded Status**: Consistent color scheme across all views
- **Responsive Layout**: Works on desktop, tablet, and mobile

### Color Coding System

#### Task Status Colors
- 🔴 **NOT_STARTED / Todo**: Gray (bg-gray-500)
- 🔵 **IN_PROGRESS / In Progress**: Blue (bg-blue-500)
- 🟢 **COMPLETED / Done**: Green (bg-green-500)

#### Lead Status Colors
- 🟢 **ACTIVE**: Green (bg-green-500)
- 🔵 **FROZEN**: Blue (bg-blue-500)
- 🟢 **WON**: Emerald (bg-emerald-500)
- 🔴 **LOST**: Red (bg-red-500)
- ⚫ **CANCELLED**: Gray (bg-gray-500)

#### Priority Indicators
- 🔴 **HIGH**: Red badge
- 🟡 **MEDIUM**: Yellow badge
- 🟢 **LOW**: Green badge

### Overdue Alerts
- Overdue tasks display a prominent **OVERDUE** badge
- Red text for overdue dates
- Visual emphasis to draw attention

## Performance Optimizations

### Server-Side Rendering
- All data fetched server-side using Next.js 15 Server Components
- Direct Prisma database queries (no API overhead)
- Parallel data fetching for optimal performance
- Limited to 500 items per query for responsiveness

### Client-Side Optimizations
- Optimistic UI updates for drag-and-drop
- Minimal client-side JavaScript
- Lazy loading for charts
- Efficient re-renders with React state management

### Caching Strategy
- Server components cache data automatically
- Revalidation on data mutations
- Fresh data on page refresh

## Data Relationships

### Lead Tasks
- Belongs to a Lead
- Has assignees (single + multiple)
- Has status changes history
- Can have attachments

### Project Tasks
- Belongs to a Project
- Has a single assignee
- Tracks hours (estimated vs actual)
- Priority-based ordering

### Leads
- Has an owner (Sales Manager)
- Has an assignee (Sales/Presales person)
- Can have participants
- Connected to customers
- Can have site surveys

### Site Surveys
- Connected to leads (optional)
- Has customer reference
- Assigned from/to users
- Status tracking
- Type categorization

### Notes
- Belongs to a Lead
- Created by a User
- Can have threaded replies
- System vs user notes
- Attachment support

## API Endpoints

### Lead Tasks
- `PATCH /api/leads/[leadId]/tasks/[taskId]` - Update task status

### Project Tasks
- `PUT /api/projects/[projectId]/tasks/[taskId]/status` - Update task status

## Workflow Examples

### Example 1: Reviewing All Pending Tasks
1. Navigate to `/admin/dashboard`
2. Click on "TASKS" tab
3. Use the filter dropdown to select "Not Started" or "In Progress"
4. Review the list or switch to Kanban view
5. Click eye icon to view details
6. Click edit icon to navigate to the lead/project

### Example 2: Managing Overdue Items
1. Go to admin dashboard
2. Check the "OVERDUE" statistics card
3. Use search to filter by specific criteria
4. Drag tasks to "IN_PROGRESS" or "COMPLETED"
5. View details to add notes or updates

### Example 3: Monitoring Lead Activity
1. Navigate to "LEADS" tab
2. Review all leads with status badges
3. Check customer associations
4. View lead details modal for quick info
5. Navigate to lead page for full management

### Example 4: Tracking Site Survey Progress
1. Go to "SURVEYS" tab
2. Filter by status or customer
3. Check arranged dates
4. View assignment details
5. Monitor completion status

### Example 5: Reviewing Communications
1. Click on "NOTES" tab
2. Browse all lead communications
3. Check threaded replies
4. View system notes vs user notes
5. Navigate to lead for context

## Integration with Existing Features

### Kanban Boards
- Uses same drag-and-drop library as lead tasks (`@hello-pangea/dnd`)
- Consistent behavior with existing kanban implementations
- Reuses existing API endpoints

### Charts & Analytics
- Powered by Recharts library
- Responsive and interactive
- Real-time data visualization

### Modals & Dialogs
- Shadcn/ui Dialog components
- Consistent with app-wide UI patterns
- Keyboard navigation support

## Troubleshooting

### Dashboard Not Loading
- Check authentication (must be ADMIN role)
- Verify database connection
- Check browser console for errors

### Drag-and-Drop Not Working
- Ensure JavaScript is enabled
- Check for browser compatibility
- Verify network connection

### Data Not Updating
- Refresh the page
- Check API endpoint availability
- Verify user permissions

### Performance Issues
- Consider reducing query limits
- Check database indexing
- Monitor network requests

## Future Enhancements

Potential additions for future versions:
- Export functionality (CSV, PDF)
- Bulk operations (multi-select tasks)
- Advanced filters (date ranges, custom fields)
- Saved filter presets
- Email notifications for overdue items
- Dashboard customization
- Widget drag-and-drop layout
- Real-time updates (WebSocket)
- Mobile app integration
- Advanced reporting and analytics

## Technical Stack

- **Framework**: Next.js 15.3+
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Drag & Drop**: @hello-pangea/dnd
- **Charts**: Recharts
- **Database**: Prisma + MySQL
- **Authentication**: Better-Auth (Auth.js v5)
- **Icons**: Lucide React

## Conclusion

The Admin Dashboard provides a powerful, professional, and user-friendly interface for managing all aspects of the KimonCRM system. With its dual-pane view, comprehensive statistics, drag-and-drop functionality, and detailed modals, administrators can efficiently oversee operations and make informed decisions.

For questions or issues, refer to the main project documentation or contact the development team.

