# Menu System with Role and Department-Based Permissions

## Overview

The menu system now supports role-based and department-based access control. Menu items can be restricted to specific user roles (USER, EMPLOYEE, MANAGER, ADMIN) and/or specific departments.

## Database Schema

The `MenuPermission` model has been updated to support both role and department-based permissions:

```prisma
model MenuPermission {
  id           String     @id @default(cuid())
  menuItemId   String
  role         String?      // Optional role restriction
  departmentId String?      // Optional department restriction
  canView      Boolean    @default(true)
  canEdit      Boolean    @default(false)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  menuItem     MenuItem   @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  department   Department? @relation(fields: [departmentId], references: [id])

  @@unique([menuItemId, role, departmentId])
  @@index([departmentId])
}
```

## Permission Logic

### Default Behavior
- If no permissions are set for a menu item, it is **visible to everyone**
- **ADMIN users can see all menu items** regardless of department restrictions
- Permissions can restrict based on:
  1. **Role**: Filter by user role (USER, EMPLOYEE, MANAGER, ADMIN)
  2. **Department**: Filter by user's department
  3. **Combination**: Both role AND department must match

### Important Notes
- **Multiple Departments**: A menu item can be accessible from multiple departments by creating multiple permission entries
- **ADMIN Override**: Users with ADMIN role bypass all department restrictions

### Permission Rules

1. **No permissions set**: Item is visible to all users
2. **Role-only permission**: Only users with that role can see the item (all departments)
3. **Department-only permission**: Only users in that department can see the item (all roles)
4. **Role + Department permission**: User must have the specific role AND be in the specific department
5. **Multiple Departments**: To allow a route for multiple departments, create multiple permission entries (one per department)
6. **ADMIN Override**: Users with ADMIN role always see all menu items

## Usage Examples

### Example 1: Admin-only Menu Item
```typescript
{
  menuItemId: "item-123",
  role: "ADMIN",
  departmentId: null,
  canView: true,
  canEdit: true
}
```
**Result**: Only users with ADMIN role can see this item, regardless of their department.

### Example 2: Sales Department Only
```typescript
{
  menuItemId: "item-456",
  role: null,
  departmentId: "dept-sales-001",
  canView: true,
  canEdit: false
}
```
**Result**: All users in the Sales department can see this item, regardless of their role.

### Example 3: Manager in Sales Department
```typescript
{
  menuItemId: "item-789",
  role: "MANAGER",
  departmentId: "dept-sales-001",
  canView: true,
  canEdit: true
}
```
**Result**: Only users who are both MANAGERS and in the Sales department can see this item.

### Example 4: Route Accessible from Multiple Departments
To allow a route for both Sales and Marketing departments, create two permission entries:

```typescript
// Permission 1: Sales Department
{
  menuItemId: "item-multi-dept",
  role: null,
  departmentId: "dept-sales-001",
  canView: true,
  canEdit: false
}

// Permission 2: Marketing Department
{
  menuItemId: "item-multi-dept",
  role: null,
  departmentId: "dept-marketing-001",
  canView: true,
  canEdit: false
}
```
**Result**: Users in either Sales OR Marketing departments can see this item.

## Implementation

### Frontend (Sidebar Component)
The `ResponsiveSidebar` component now receives both `userRole` and `departmentId`:

```typescript
interface ResponsiveSidebarProps {
  userRole: string;
  departmentId: string | null;
  className?: string;
}
```

### Backend (API Route)
The `/api/menu/groups` endpoint filters menu items based on the user's role and department:

```typescript
// Check if user has permission to view this item
const permission = item.permissions.find(p => {
  const roleMatch = !p.role || p.role === role;
  const departmentMatch = !p.departmentId || p.departmentId === departmentId;
  return p.canView && roleMatch && departmentMatch;
});
```

## Menu Manager UI

The menu management UI (`components/admin/menu-manager.tsx`) has been updated to support department-based permissions. Admins can:

1. Create/Edit menu items with role and department restrictions
2. View permissions in a permissions matrix
3. Configure both `canView` and `canEdit` permissions for each role

## Database Migration

⚠️ **Note**: The schema changes require a database migration. Due to the existing `MenuPermission` data structure, you'll need to:

1. **Backup existing menu permissions**
2. **Update the schema** (already done in `prisma/schema.prisma`)
3. **Run migration**:
   ```bash
   npx prisma db push --accept-data-loss
   ```
   OR
   ```bash
   npx prisma migrate dev --name add_department_to_menu_permissions
   ```

4. **Note**: This will change the unique constraint from `[menuItemId, role]` to `[menuItemId, role, departmentId]`, which may require data cleanup if you have duplicate entries.

## Testing

To test the menu permissions:

1. **Create a test user** with a specific role and department
2. **Configure menu items** with various permission combinations
3. **Log in as the test user** and verify only appropriate menu items are visible
4. **Test edge cases**:
   - User without a department (departmentId = null)
   - User with role but no department restrictions
   - User with department but no role restrictions
   - User matching both role and department requirements
   - Admin user sees all items regardless of restrictions

## Testing Multi-Department Access

1. **Create a menu item** that should be accessible to multiple departments
2. **Add multiple permission entries** - one for each department
3. **Test with users from each department** to verify access
4. **Test with users from other departments** to verify they cannot access
5. **Test with admin user** to verify they can always access

## Future Enhancements

Potential future enhancements to the menu system:

- [ ] Branch-based permissions (filter by user's branch)
- [ ] Position-based permissions (filter by user's work position)
- [ ] Dynamic menu items based on business logic
- [ ] Menu item expiration dates
- [ ] Audit logging for menu access
