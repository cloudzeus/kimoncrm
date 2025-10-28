# Department-Based Dashboard System

## Overview
The application now supports department-based dashboard redirection and menu filtering based on user roles and departments.

## How It Works

### 1. Admin Dashboard
- **Path**: `/admin`
- **Access**: Only ADMIN role
- **Features**: 
  - User management
  - Department management
  - Work positions management
  - Menu configuration

### 2. Department Dashboards
When users access `/dashboard`, the system:
1. Checks if user is ADMIN → Redirects to `/admin`
2. Checks for department-specific dashboard via multiple methods:
   - By department ID: `{departmentId}-dashboard`
   - By department name: `{department-name}-dashboard`
   - By menu permissions: Checks menu items for any dashboard accessible to user's role and department

### 3. Menu Filtering
The sidebar menu is automatically filtered based on:
- **User Role**: Menu items are filtered by permissions set for specific roles
- **Department**: Menu items can be restricted to specific departments
- **Permissions**: Each menu item has `canView`, `canEdit`, `canDelete` permissions

## Configuration

### Setting Up Department Dashboards

#### Option 1: Create a Custom Dashboard Menu Item
1. Go to `/settings/menu`
2. Create a new menu item with:
   - **Key**: `{department-id}-dashboard` or `{department-name}-dashboard`
   - **Path**: Custom dashboard route (e.g., `/dashboard/sales`)
   - **Permissions**: Set role and department restrictions

#### Option 2: Create a Custom Dashboard Page
1. Create a new page at `app/(main)/dashboard/{department-name}/page.tsx`
2. Add a menu item pointing to that page
3. Set proper permissions for that menu item

### Menu Permission Configuration

Each menu item has permissions that can be set in `/settings/menu`:

- **Role**: Restrict to specific roles (ADMIN, MANAGER, EMPLOYEE, etc.)
- **Department**: Restrict to specific departments
- **Can View**: Allow user to see and access the menu item
- **Can Edit**: Allow user to edit content (if applicable)
- **Can Delete**: Allow user to delete content (if applicable)

## Examples

### Example 1: Sales Department Dashboard
1. Create department "Sales" with ID `sales-dept-123`
2. Create menu item:
   - Key: `sales-dept-123-dashboard`
   - Name: "Sales Dashboard"
   - Path: `/dashboard/sales`
   - Permissions: Role = "SALES", Department = "Sales"
3. All sales department users will be redirected to `/dashboard/sales`

### Example 2: IT Department Dashboard
1. Create department "IT" with ID `it-dept-456`
2. Create menu item:
   - Key: `it-dept-456-dashboard`
   - Name: "IT Dashboard"
   - Path: `/dashboard/it`
   - Permissions: Role = "EMPLOYEE" or "IT", Department = "IT"
3. All IT department users will be redirected to `/dashboard/it`

## User Flow

1. User signs in
2. System checks user role:
   - If ADMIN → Redirect to `/admin`
   - If other role → Continue to step 3
3. System fetches user's department
4. System searches for department-specific dashboard in this order:
   - By department ID key
   - By department name key
   - By menu permissions (first accessible dashboard)
5. If found → Redirect to custom dashboard
6. If not found → Show default dashboard with user info

## Benefits

1. **Centralized Configuration**: All dashboard routing managed through menu system
2. **Flexible Permissions**: Fine-grained control over who sees what
3. **Scalable**: Easy to add new departments and dashboards
4. **Role-Based Access**: Natural integration with existing role system
5. **Department Isolation**: Departments can have completely separate workflows

## Technical Details

### Key Files
- `app/(main)/dashboard/page.tsx` - Main dashboard redirection logic
- `app/(main)/admin/page.tsx` - Admin dashboard
- `app/(main)/layout.tsx` - Sidebar menu rendering
- `components/layout/responsive-sidebar.tsx` - Menu filtering logic
- `app/api/menu/groups/route.ts` - Menu API with permission filtering

### Database Models
- `User` - Contains `role` and `departmentId`
- `Department` - Department information
- `MenuItem` - Menu items with permissions
- `MenuPermission` - Role and department-based permissions

