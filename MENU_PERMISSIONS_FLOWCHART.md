# Menu Permissions Flowchart

## Permission Evaluation Flow

```
User Requests Menu Item
        |
        v
    Is user ADMIN?
        |
        +-- YES --> Show Item (Always)
        |
        NO
        |
        v
    Does item have permissions?
        |
        +-- NO --> Show Item (Public)
        |
        YES
        |
        v
    Loop through permissions:
        |
        For each permission:
            |
            v
        Does role match?
            |
            +-- Specified AND Different --> Skip
            |
            Matches or Not Specified
            |
            v
        Does department match?
            |
            +-- Specified AND Different --> Skip
            |
            Matches or Not Specified
            |
            v
        Can View?
            |
            +-- NO --> Skip
            |
            YES
            |
            v
        Show Item
        |
        v
    No Permission Match
        |
        v
    Hide Item
```

## Decision Matrix

| User Role | User Department | Permission Role | Permission Department | Can View? | Notes |
|-----------|----------------|-----------------|----------------------|-----------|-------|
| ADMIN | Any | Any | Any | ✅ Yes | Admin override |
| MANAGER | Sales | null | null | ✅ Yes | Universal permission |
| MANAGER | Sales | MANAGER | null | ✅ Yes | Role matches |
| MANAGER | Sales | null | Sales | ✅ Yes | Department matches |
| MANAGER | Sales | MANAGER | Sales | ✅ Yes | Both match |
| USER | Sales | MANAGER | null | ❌ No | Role mismatch |
| MANAGER | Marketing | null | Sales | ❌ No | Department mismatch |
| MANAGER | Marketing | MANAGER | Sales | ❌ No | Department mismatch |
| EMPLOYEE | Sales | null | Sales | ✅ Yes | Department matches |
| EMPLOYEE | Sales | MANAGER | Sales | ❌ No | Role mismatch |

## Multi-Department Example

```
Menu Item: "Customer Portal"

Permission 1:
    Role: null
    Department: Sales
    Can View: Yes

Permission 2:
    Role: null
    Department: Marketing
    Can View: Yes

Permission 3:
    Role: ADMIN
    Department: null
    Can View: Yes

Result:
    ✅ Users in Sales → Can access
    ✅ Users in Marketing → Can access
    ✅ ADMIN users → Can access (any department)
    ❌ Users in other departments → Cannot access
```

## Code Implementation

```typescript
// Simplified permission check
function canUserViewMenuItem(user: User, item: MenuItem): boolean {
  // 1. Admin sees everything
  if (user.role === 'ADMIN') return true;
  
  // 2. No permissions = public
  if (item.permissions.length === 0) return true;
  
  // 3. Check each permission
  for (const perm of item.permissions) {
    // Check role match
    if (perm.role && perm.role !== user.role) continue;
    
    // Check department match
    if (perm.departmentId && perm.departmentId !== user.departmentId) continue;
    
    // Permission matches!
    if (perm.canView) return true;
  }
  
  // No matching permission found
  return false;
}
```

## Permission Types

### 1. Universal Permission
```json
{ "role": null, "departmentId": null }
```
- Applies to everyone
- Use when you want public access

### 2. Role-Only Permission
```json
{ "role": "MANAGER", "departmentId": null }
```
- Applies to all users with the specified role
- Works across all departments

### 3. Department-Only Permission
```json
{ "role": null, "departmentId": "sales-001" }
```
- Applies to all users in the specified department
- Works for all roles in that department

### 4. Combined Permission
```json
{ "role": "MANAGER", "departmentId": "sales-001" }
```
- Applies only to users who match both criteria
- Most restrictive type

### 5. Multiple Permissions (OR Logic)
```json
[
  { "role": null, "departmentId": "sales-001" },
  { "role": null, "departmentId": "marketing-001" }
]
```
- Applies to users matching ANY of the permissions
- Used for multi-department access

## Best Practices Flow

```
Create Menu Item
        |
        v
    Determine Access Requirements
        |
        +-- Public? --> No permissions needed
        |
        +-- Role-based? --> Add role permission
        |
        +-- Department-based? --> Add department permission
        |
        +-- Multiple departments? --> Add multiple permissions (one per department)
        |
        v
    Always add ADMIN permission for important items
        |
        v
    Test with different user roles and departments
```

