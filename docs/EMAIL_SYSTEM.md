# Email System Documentation

A comprehensive server-side email system supporting Microsoft Outlook (Graph API) and Google Gmail integration with full read, compose, and send capabilities.

## 🚀 Features

### Core Email Functionality
- ✅ **Read Emails**: Fetch emails from Microsoft Outlook and Google Gmail
- ✅ **Compose & Send**: Create and send emails with attachments
- ✅ **Reply & Forward**: Full reply and forward functionality
- ✅ **Email Management**: Mark as read/unread, delete, move, archive
- ✅ **Folder Support**: Access to all email folders/labels
- ✅ **Attachment Handling**: Download and manage email attachments
- ✅ **Search & Filter**: Advanced email search capabilities
- ✅ **Unified Interface**: Single API for both Microsoft and Google

### Advanced Features
- ✅ **Context Menu Integration**: Right-click actions for email management
- ✅ **Email Associations**: Link emails to contacts, companies, projects, leads, support tickets
- ✅ **Email Templates**: Reusable email templates
- ✅ **Email Signatures**: User-specific email signatures
- ✅ **Email Settings**: Personalized email preferences
- ✅ **Rate Limiting**: Built-in rate limiting and error handling
- ✅ **Type Safety**: Full TypeScript support

## 🏗️ Architecture

### Components Overview

```
lib/
├── microsoft/
│   └── graph.ts              # Microsoft Graph API client
├── google/
│   └── gmail.ts              # Google Gmail API client
├── email/
│   ├── types.ts              # TypeScript interfaces
│   └── unified-service.ts    # Unified email service
└── shared/
    └── context-menu.tsx      # Reusable context menu

app/api/emails/
├── route.ts                  # Main email API
├── folders/route.ts          # Folder management
├── [id]/route.ts             # Individual email operations
├── [id]/attachments/route.ts # Attachment handling
├── [id]/actions/route.ts     # Email actions
├── [id]/reply/route.ts       # Reply functionality
└── [id]/forward/route.ts     # Forward functionality

components/emails/
├── email-client.tsx          # Main email client UI
├── email-compose.tsx         # Email composition UI
├── email-context-menu.tsx    # Email-specific context menu
└── email-list-example.tsx    # Example usage

app/emails/
└── page.tsx                  # Email page component
```

## 🔧 API Endpoints

### Email Operations

#### GET `/api/emails`
Fetch emails with filtering and pagination.

**Query Parameters:**
- `provider`: 'microsoft' | 'google'
- `accessToken`: OAuth access token
- `folderId`: Folder/label ID (optional)
- `limit`: Number of emails to fetch (1-100, default: 50)
- `offset`: Pagination offset (default: 0)
- `query`: Search query (optional)
- `isRead`: Filter by read status (optional)
- `hasAttachments`: Filter by attachment presence (optional)
- `fromDate`: Start date filter (ISO string, optional)
- `toDate`: End date filter (ISO string, optional)

#### POST `/api/emails`
Send a new email.

**Request Body:**
```json
{
  "provider": "microsoft",
  "accessToken": "oauth_token",
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Email Subject",
  "body": "Email body content",
  "isHtml": true,
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64_encoded_content",
      "mimeType": "application/pdf"
    }
  ]
}
```

#### GET `/api/emails/folders`
Get email folders/labels.

**Query Parameters:**
- `provider`: 'microsoft' | 'google'
- `accessToken`: OAuth access token

#### GET `/api/emails/[id]`
Get specific email by ID.

#### GET `/api/emails/[id]/attachments`
Get email attachments.

#### POST `/api/emails/[id]/actions`
Perform email actions (mark as read, delete, move, etc.).

**Request Body:**
```json
{
  "provider": "microsoft",
  "accessToken": "oauth_token",
  "action": {
    "type": "mark_read",
    "folderId": "archive",
    "labelIds": ["IMPORTANT"]
  }
}
```

#### POST `/api/emails/[id]/reply`
Reply to an email.

**Request Body:**
```json
{
  "provider": "microsoft",
  "accessToken": "oauth_token",
  "content": "Reply content",
  "replyAll": false
}
```

#### POST `/api/emails/[id]/forward`
Forward an email.

**Request Body:**
```json
{
  "provider": "microsoft",
  "accessToken": "oauth_token",
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "content": "Additional message"
}
```

## 🔐 Authentication

### Microsoft Graph API
- **Scopes Required**: `Mail.ReadWrite`, `Mail.Send`, `Calendars.ReadWrite`, `Files.ReadWrite.All`
- **OAuth Flow**: Authorization Code with PKCE
- **Token Management**: Access tokens with refresh capability

### Google Gmail API
- **Scopes Required**: `https://www.googleapis.com/auth/gmail.modify`, `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/drive.file`
- **OAuth Flow**: Authorization Code with PKCE
- **Token Management**: Access tokens with refresh capability

## 📊 Database Schema

### Core Models

#### EmailThread
```prisma
model EmailThread {
  id          String   @id @default(cuid())
  subject     String?
  companyId   String?
  contactId   String?
  projectId   String?
  leadId      String?
  supportId   String?
  externalId  String?  @unique
  provider    EmailProvider
  folderId    String?
  isRead      Boolean  @default(false)
  isFlagged   Boolean  @default(false)
  isArchived  Boolean  @default(false)
  messageCount Int     @default(0)
  lastMessageAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company     Company? @relation(fields: [companyId], references: [id])
  contact     Contact? @relation(fields: [contactId], references: [id])
  project     Project? @relation(fields: [projectId], references: [id])
  lead        Lead?    @relation(fields: [leadId], references: [id])
  support     Ticket?  @relation(fields: [supportId], references: [id])

  messages    EmailMessage[]
  attachments EmailAttachment[]
}
```

#### EmailMessage
```prisma
model EmailMessage {
  id          String   @id @default(cuid())
  threadId    String
  externalId  String?  @unique
  provider    EmailProvider
  subject     String?
  fromName    String?
  fromEmail   String
  toList      String[] @db.Json
  ccList      String[] @db.Json
  bccList     String[] @db.Json
  bodyHtml    String?
  bodyText    String?
  contentType EmailContentType @default(HTML)
  receivedAt  DateTime
  sentAt      DateTime?
  isRead      Boolean  @default(false)
  isDraft     Boolean  @default(false)
  isFlagged   Boolean  @default(false)
  importance  EmailImportance @default(NORMAL)
  hasAttachments Boolean @default(false)
  folderId    String?
  webLink     String?
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  thread      EmailThread @relation(fields: [threadId], references: [id])
  user        User?       @relation("EmailToUser", fields: [userId], references: [id])
  attachments EmailAttachment[]
  actions     EmailAction[]
}
```

## 🎨 UI Components

### EmailClient
Main email client interface with:
- Provider switching (Microsoft/Google)
- Folder navigation
- Email list with context menus
- Search functionality
- Real-time updates

### EmailCompose
Email composition interface with:
- Rich text editing
- Multiple recipients (To, CC, BCC)
- File attachments
- HTML/Text mode switching
- Template support

### EmailContextMenu
Right-click context menu with:
- Reply/Reply All/Forward
- Mark as Read/Unread
- Delete/Archive/Flag
- Associate to Contact/Company/Project/Lead/Support

## 🚀 Usage Examples

### Basic Email Fetching
```typescript
import { createEmailService } from '@/lib/email/unified-service'

const emailService = await createEmailService({
  type: 'microsoft',
  accessToken: 'your_access_token'
})

const emails = await emailService.getMessages({
  folderId: 'inbox',
  limit: 50,
  isRead: false
})
```

### Sending an Email
```typescript
await emailService.sendEmail({
  to: ['recipient@example.com'],
  subject: 'Hello World',
  body: '<h1>Hello!</h1><p>This is a test email.</p>',
  isHtml: true,
  attachments: [
    {
      filename: 'document.pdf',
      content: 'base64_content',
      mimeType: 'application/pdf'
    }
  ]
})
```

### Replying to an Email
```typescript
await emailService.replyToEmail(
  'message_id',
  '<p>Thank you for your email!</p>',
  false // replyAll
)
```

## 🔧 Configuration

### Environment Variables
```env
# Microsoft Graph
TENANT_ID=your_tenant_id
AUTH_MICROSOFT_ENTRA_ID_ID=your_client_id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your_client_secret
GRAPH_SCOPES=offline_access openid profile Mail.ReadWrite Mail.Send Calendars.ReadWrite Files.ReadWrite.All

# Google Gmail
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SCOPES=openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file
```

## 🛡️ Security Features

- **Rate Limiting**: Built-in rate limiting for API calls
- **Token Validation**: Access token validation and refresh
- **Error Handling**: Comprehensive error handling with retry logic
- **Input Validation**: Zod schema validation for all API inputs
- **CORS Protection**: Proper CORS configuration
- **Authentication Guards**: Session-based authentication for all endpoints

## 📈 Performance Optimizations

- **Connection Pooling**: Efficient database connection management
- **Caching**: Redis-based caching for frequently accessed data
- **Pagination**: Efficient pagination for large email lists
- **Lazy Loading**: On-demand loading of email content
- **Batch Operations**: Bulk operations for multiple emails

## 🔄 Integration Points

### CRM Integration
- **Contact Association**: Link emails to contact records
- **Company Association**: Associate emails with company records
- **Project Integration**: Link emails to project discussions
- **Lead Management**: Associate emails with lead records
- **Support Tickets**: Link emails to support ticket threads

### Context Menu Integration
The email system integrates seamlessly with the context menu system:
- Right-click actions on email items
- Bulk operations for selected emails
- Quick access to common email functions
- Association actions for CRM entities

## 🚨 Error Handling

The system includes comprehensive error handling:

```typescript
// Email-specific error types
export class EmailError extends Error {
  constructor(
    message: string,
    public provider: 'microsoft' | 'google',
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message)
    this.name = 'EmailError'
  }
}

export class EmailAuthenticationError extends EmailError {
  constructor(provider: 'microsoft' | 'google', originalError?: any) {
    super(`Authentication failed for ${provider}`, provider, 401, originalError)
    this.name = 'EmailAuthenticationError'
  }
}

export class EmailRateLimitError extends EmailError {
  constructor(provider: 'microsoft' | 'google', retryAfter?: number, originalError?: any) {
    super(`Rate limit exceeded for ${provider}`, provider, 429, originalError)
    this.name = 'EmailRateLimitError'
  }
}
```

## 📝 Next Steps

1. **Database Migration**: Run Prisma migration to create email tables
2. **OAuth Setup**: Configure Microsoft and Google OAuth applications
3. **Environment Configuration**: Set up required environment variables
4. **Testing**: Test email functionality with real accounts
5. **Deployment**: Deploy to production environment

## 🤝 Contributing

When contributing to the email system:

1. Follow the existing code structure and patterns
2. Add proper TypeScript types for new features
3. Include comprehensive error handling
4. Write tests for new functionality
5. Update documentation for API changes

## 📚 Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Google Gmail API Documentation](https://developers.google.com/gmail/api)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [shadcn/ui Components](https://ui.shadcn.com/)
