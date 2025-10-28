# Menu System: Admin Permissions & Multi-Department Access

## Key Features

### 1. ADMIN Role Override
**ADMIN users can see ALL menu items** regardless of:
- Department restrictions
- Role-specific permissions
- Department-specific permissions

This ensures administrators have full visibility into all areas of the application.

### 2. Multiple Department Access
A single menu item (route) can be accessible to **multiple departments** by creating multiple permission entries:

```
Menu Item: "Customer Portal"
├── Permission 1: Sales Department (departmentId: "sales-001")
│   └── Users in Sales can access
│
├── Permission 2: Marketing Department (departmentId: "marketing-001")
│   └── Users in Marketing can access
│
└── Permission 3: ADMIN role (role: "ADMIN", departmentId: null)
    └── All ADMINS can access
```

## Implementation

### Permission Logic Flow

```typescript
// Check if user can see menu item
function canViewMenuItem(user, menuItem) {
  // 1. Admin override - admins see everything
  if (user.role === 'ADMIN') return true;
  
  // 2. Check permissions
  for (permission of menuItem.permissions) {
    // 3. Check role match
    if (permission.role && permission.role !== user.role) continue;
    
    // 4. Check department match
    if (permission.departmentId && permission.departmentId !== user.departmentId) continue;
    
    // 5. Permission matches!
    if (permission.canView) return true;
  }
  
  // 6. No matching permission found
  return false;
}
```

### Database Structure

```prisma
model MenuPermission {
  id           String     @id
  menuItemId   String     // Reference to menu item
  role         String?    // Optional: restrict to specific role
  departmentId String?    // Optional: restrict to specific department
  canView      Boolean
  canEdit      Boolean
  
  @@unique([menuItemId, role, departmentId])
}
```

## Usage Examples

### Example 1: Admin-Only Item
```json
{
  "menuItemId": "admin-panel",
  "permissions": [
    {
      "role": "ADMIN",
      "departmentId": null,
      "canView": true
    }
  ]
}
```
**Result**: Only ADMIN users can see this item.

### Example 2: Single Department Access
```json
{
  "menuItemId": "sales-dashboard",
  "permissions": [
    {
      "role": null,
      "departmentId": "sales-001",
      "canView": true
    }
  ]
}
```
**Result**: All users in the Sales department can see this item (any role).

### Example 3: Role + Department Restriction
```json
{
  "menuItemId": "manager-reports",
  "permissions": [
    {
      "role": "MANAGER",
      "departmentId": "sales-001",
      "canView": true
    }
  ]
}
```
**Result**: Only users who are MANAGERS in the Sales department can see this item.

### Example 4: Multiple Departments (Multi-Access)
```json
{
  "menuItemId": "customer-portal",
  "permissions": [
    {
      "role": null,
      "departmentId": "sales-001",
      "canView": true
    },
    {
      "role": null,
      "departmentId": "marketing-001",
      "canView": true
    },
    {
      "role": "ADMIN",
      "departmentId": null,
      "canView": true
    }
  ]
}
```
**Result**: 
- Sales department users can access
- Marketing department users can access
- All ADMIN users can access
- Other users cannot access

### Example 5: Universal Access (No Restrictions)
```json
{
  "menuItemId": "public-dashboard",
  "permissions": []
}
```
**Result**: All users can see this item (no restrictions).

## Best Practices

1. **Always include ADMIN permission** for important menu items:
   ```json
   { "role": "ADMIN", "departmentId": null, "canView": true }
   ```

2. **For multi-department access**, create separate permission entries:
   - One permission per department
   - Use `departmentId` to specify the department
   - Use `role: null` to allow all roles in that department

3. **For role-only restrictions**, set `departmentId: null`:
   ```json
   { "role": "MANAGER", "departmentId": null, "canView": true }
   ```

4. **Test permissions** with different user roles and departments to ensure proper access control.

## Migration Notes

⚠️ **Database Migration Required**: Run the following to apply schema changes:

```bash
npx prisma db push --accept-data-loss
```

This will:
- Add `departmentId` field to `MenuPermission`
- Update unique constraint to `[menuItemId, role, departmentId]`
- Allow multiple departments per menu item

## API Endpoints

### Get Menu with Permissions
```
GET /api/menu/groups?includeItems=true&role=MANAGER&departmentId=sales-001
```

Query Parameters:
- `includeItems`: boolean - Include menu items
- `role`: string - User's role (for filtering)
- `departmentId`: string - User's department (for filtering)

Response:
```json
{
  "menuGroups": [
    {
      "id": "group-1",
      "name": "Main Navigation",
      "items": [
        {
          "id": "item-1",
          "name": "Dashboard",
          "path": "/dashboard",
          "permissions": [...]
        }
      ]
    }
  ]
}
```

## Testing Checklist

- [ ] Admin user sees all menu items
- [ ] Regular user only sees items they have permission for
- [ ] Department-specific items only visible to users in that department
- [ ] Multi-department items visible to users in any of the allowed departments
- [ ] Role-specific items only visible to users with that role
- [ ] Combined role + department restrictions work correctly
- [ ] Items with no permissions are visible to everyone
- [ ] Child menu items inherit parent restrictions

