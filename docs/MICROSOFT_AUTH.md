# Microsoft Authentication Implementation

This document describes the comprehensive Microsoft authentication system implemented for the CRM application, including proper session management, user role assignment, and avatar handling.

## Overview

The Microsoft authentication system provides:
- **Tenant-wide access**: Any user from the configured Microsoft tenant can log in
- **Default USER role**: New users are assigned the USER role by default
- **Admin management**: Administrators can assign roles, departments, positions, and branches
- **Avatar support**: Users can upload custom avatars or sync from Microsoft/Google
- **Robust error handling**: Comprehensive validation and error management for Microsoft Graph API responses

## Architecture

### Components

1. **Authentication Provider** (`lib/auth/microsoft.ts`)
   - Enhanced Microsoft provider with custom user creation callback
   - Handles Microsoft-specific profile data extraction
   - Manages avatar URL processing from Microsoft Graph

2. **Microsoft Graph Client** (`lib/microsoft/graph.ts`)
   - Type-safe Microsoft Graph API client
   - Rate limiting and retry logic with exponential backoff
   - Comprehensive error handling

3. **Validation System** (`lib/microsoft/validation.ts`)
   - Zod schemas for Microsoft Graph API responses
   - Custom error classes for Microsoft Graph errors
   - Token validation and avatar URL processing

4. **Avatar Management** (`lib/avatar/upload.ts`)
   - BunnyCDN integration for avatar storage
   - Provider avatar synchronization
   - File validation and processing

5. **User Management** (`components/admin/user-manager.tsx`)
   - Admin interface for user role assignment
   - Department and position management
   - User activation/deactivation

6. **Profile Management** (`components/user/profile-form.tsx`)
   - User profile editing interface
   - Avatar upload functionality
   - Contact information management

## Configuration

### Environment Variables

```env
# Microsoft Authentication
TENANT_ID=your-tenant-id
AUTH_MICROSOFT_ENTRA_ID_ID=your-client-id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-client-secret

# Microsoft Graph API
GRAPH_TENANT_ID=${TENANT_ID}
GRAPH_CLIENT_ID=${AUTH_MICROSOFT_ENTRA_ID_ID}
GRAPH_CLIENT_SECRET=${AUTH_MICROSOFT_ENTRA_ID_SECRET}
GRAPH_SCOPES=offline_access openid profile Mail.ReadWrite Mail.Send Calendars.ReadWrite Files.ReadWrite.All

# BunnyCDN (for avatar storage)
BUNNY_STORAGE_ZONE=your-storage-zone
BUNNY_STORAGE_REGION=de
BUNNY_ACCESS_KEY=your-access-key
BUNNY_CDN_PULL_ZONE=your-cdn-domain
```

### Prisma Schema Updates

The user model has been enhanced with:

```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  passwordHash   String?  // null if SSO-only
  name           String?
  image          String?  // OAuth provider avatar URL
  avatar         String?  // Custom uploaded avatar URL (BunnyCDN)
  role           UserRole @default(USER)
  phone          String?
  workPhone      String?
  mobile         String?
  departmentId   String?
  workPositionId String?
  branchId       String?  // User's primary branch
  microsoftId    String?  @unique // Microsoft Graph user ID
  googleId        String?  @unique // Google user ID
  isActive        Boolean  @default(true)
  lastLoginAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations
  department     Department?  @relation(fields: [departmentId], references: [id])
  workPosition   WorkPosition? @relation(fields: [workPositionId], references: [id])
  branch         Branch?      @relation(fields: [branchId], references: [id])
}
```

## API Endpoints

### User Profile Management

#### GET `/api/users/profile`
Get current user profile information.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER",
    "phone": "+1234567890",
    "workPhone": "+1234567891",
    "mobile": "+1234567892",
    "avatar": "https://cdn.example.com/avatars/user-id/avatar.jpg",
    "image": "https://graph.microsoft.com/v1.0/me/photo/$value",
    "department": { "id": "dept-id", "name": "Sales" },
    "workPosition": { "id": "pos-id", "title": "Sales Manager" },
    "branch": { "id": "branch-id", "name": "Main Office" },
    "isActive": true,
    "lastLoginAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT `/api/users/profile`
Update current user profile.

**Request:**
```json
{
  "name": "Updated Name",
  "phone": "+1234567890",
  "workPhone": "+1234567891",
  "mobile": "+1234567892"
}
```

#### POST `/api/users/profile/avatar`
Upload user avatar.

**Request:** `multipart/form-data`
- `avatar`: Image file (JPEG, PNG, WebP, GIF, max 5MB)

**Response:**
```json
{
  "success": true,
  "url": "https://cdn.example.com/avatars/user-id/avatar.jpg",
  "message": "Avatar uploaded successfully"
}
```

#### DELETE `/api/users/profile/avatar`
Delete user avatar.

**Response:**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

### Admin User Management

#### GET `/api/admin/users`
Get all users (admin only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `role`: Filter by role (ADMIN, MANAGER, USER, B2B)
- `departmentId`: Filter by department
- `branchId`: Filter by branch
- `isActive`: Filter by active status (true/false)

**Response:**
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

#### PUT `/api/admin/users?id={userId}`
Update user (admin only).

**Request:**
```json
{
  "role": "MANAGER",
  "departmentId": "dept-id",
  "workPositionId": "pos-id",
  "branchId": "branch-id",
  "isActive": true,
  "name": "Updated Name",
  "phone": "+1234567890",
  "workPhone": "+1234567891",
  "mobile": "+1234567892"
}
```

#### DELETE `/api/admin/users?id={userId}`
Deactivate user (admin only).

**Response:**
```json
{
  "message": "User deactivated successfully"
}
```

### Microsoft Graph Integration

#### POST `/api/microsoft/sync`
Sync Microsoft user data.

**Request:**
```json
{
  "accessToken": "microsoft-access-token"
}
```

**Response:**
```json
{
  "user": { /* updated user data */ },
  "microsoftProfile": {
    "id": "microsoft-user-id",
    "displayName": "User Display Name",
    "mail": "user@company.com",
    "userPrincipalName": "user@company.com",
    "jobTitle": "Software Engineer",
    "department": "Engineering",
    "officeLocation": "Seattle"
  },
  "avatarSync": {
    "success": true,
    "url": "https://cdn.example.com/avatars/user-id/synced-avatar.jpg"
  },
  "message": "Microsoft profile synced successfully"
}
```

#### GET `/api/microsoft/sync?accessToken={token}`
Get Microsoft profile data.

**Response:**
```json
{
  "profile": {
    "id": "microsoft-user-id",
    "displayName": "User Display Name",
    "mail": "user@company.com",
    "userPrincipalName": "user@company.com",
    "jobTitle": "Software Engineer",
    "department": "Engineering",
    "officeLocation": "Seattle",
    "businessPhones": ["+1234567890"],
    "mobilePhone": "+1234567891"
  },
  "photo": {
    "@odata.mediaContentType": "image/jpeg",
    "@odata.mediaEtag": "etag-value",
    "id": "photo-id",
    "height": 648,
    "width": 648
  }
}
```

## Error Handling

### Microsoft Graph Errors

The system handles various Microsoft Graph API errors:

```typescript
class MicrosoftGraphError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly requestId?: string;
  public readonly date?: string;
}
```

**Common Error Codes:**
- `INVALID_TOKEN`: Access token is invalid or expired
- `RATE_LIMIT_EXCEEDED`: Too many requests to Microsoft Graph API
- `VALIDATION_ERROR`: Invalid response format from Microsoft Graph
- `NETWORK_ERROR`: Network connectivity issues
- `TIMEOUT_ERROR`: Request timeout

### Rate Limiting

The system implements rate limiting for Microsoft Graph API calls:
- **Default limit**: 100 requests per minute
- **Retry logic**: Exponential backoff with up to 3 retries
- **Automatic retry**: For server errors (5xx) and rate limit errors

### Validation

All Microsoft Graph API responses are validated using Zod schemas:
- User profile data validation
- Photo metadata validation
- Error response validation
- Token format validation

## Security Considerations

### Session Management

- **Secure cookies**: Enabled in production
- **Session expiration**: 7 days with 1-day update age
- **Cookie caching**: Enabled for performance
- **Cross-subdomain**: Disabled for security

### Data Protection

- **Sensitive data removal**: Password hashes excluded from API responses
- **Input validation**: All user inputs validated and sanitized
- **File upload security**: Avatar files validated for type and size
- **Access control**: Admin-only endpoints protected with role checks

### Microsoft Graph Security

- **Token validation**: Access tokens validated before use
- **Scope management**: Minimal required scopes requested
- **Error handling**: Sensitive error information not exposed to clients
- **Rate limiting**: Prevents abuse of Microsoft Graph API

## Usage Examples

### User Login Flow

1. User clicks "Sign in with Microsoft"
2. Redirected to Microsoft OAuth consent screen
3. User grants permissions
4. Microsoft redirects back with authorization code
5. Better-Auth exchanges code for access token
6. User profile created/updated with Microsoft data
7. User assigned default USER role
8. Session created and user redirected to dashboard

### Admin User Management

1. Admin accesses user management interface
2. Views all users with filtering options
3. Selects user to edit
4. Updates role, department, position, branch
5. Changes saved to database
6. User permissions updated immediately

### Avatar Management

1. User uploads custom avatar
2. File validated (type, size)
3. Uploaded to BunnyCDN
4. Database updated with avatar URL
5. Avatar displayed in UI
6. Fallback to provider avatar if custom avatar not available

## Troubleshooting

### Common Issues

1. **Microsoft Graph API errors**
   - Check tenant ID and client credentials
   - Verify required scopes are granted
   - Check rate limiting status

2. **Avatar upload failures**
   - Verify BunnyCDN credentials
   - Check file size and type restrictions
   - Ensure proper CORS configuration

3. **Session management issues**
   - Verify NEXTAUTH_SECRET is set
   - Check cookie domain configuration
   - Ensure HTTPS in production

### Debugging

Enable detailed logging by setting:
```env
NODE_ENV=development
```

Check browser network tab for API call details and error responses.

## Dependencies

### Required Packages

```json
{
  "@microsoft/microsoft-graph-client": "^3.0.0",
  "better-auth": "^0.7.0",
  "zod": "^3.22.0",
  "node-fetch": "^3.3.0"
}
```

### Database Migration

Run the following to update your database schema:

```bash
npx prisma db push
```

This will add the new fields to the User model without data loss.
