# Lead Email Compose Feature

## Overview

The Lead Email Compose feature allows users to send emails to involved parties directly from a lead's detail page. All emails are automatically tagged and associated with the lead for easy tracking and mailbox scanning.

## Features

### ✅ **Recipient Selection**
Users can select multiple recipients from various categories:

1. **Lead Owner** - The user who owns/manages the lead
2. **Lead Assignee** - The user assigned to work on the lead
3. **Participants** - Users who are participating in the lead
4. **Contacts** - Lead contacts and linked contacts
5. **Admins** - All system administrators
6. **Managers** - Department managers and users with MANAGER role
7. **Employees** - Users in the same department as the lead

### ✅ **Automatic Tagging**

Every email sent through this feature is automatically tagged with:
- **Lead Number**: `[LL001234]` format in subject
- **Lead ID**: Custom header `X-CRM-Lead-ID`
- **CRM Tags**: Custom header `X-CRM-Tags` (lead number, lead-{id}, crm-outbound)

These tags enable:
- Easy identification in email clients
- Automatic mailbox scanning
- Email threading and grouping
- Lead association

### ✅ **Email Association**

All sent emails are:
- Saved to the sender's "Sent" folder
- Recorded in the CRM database
- Automatically linked to the lead
- Visible in the lead's Emails tab

### ✅ **Professional Email Template**

Emails include:
- Clean HTML formatting
- Line breaks preserved
- Automatic footer with lead reference
- Sender information

## User Interface

### Compose Dialog

```
┌─────────────────────────────────────────────────────┐
│  COMPOSE EMAIL FOR LEAD                     [X]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Lead Info:  [LL001234] → Example Lead Title       │
│                                                     │
│  RECIPIENTS (3 selected)                ┌────────┐ │
│  ┌──────────────────────────────────┐   │Select  │ │
│  │ ✓ OWNERS                         │   │All     │ │
│  │   ✓ John Doe (john@company.com)  │   └────────┘ │
│  │                                   │              │
│  │   ASSIGNEES                       │              │
│  │   ✓ Jane Smith (jane@company.com)│              │
│  │                                   │              │
│  │   CONTACTS                        │              │
│  │   □ Client Contact (client@...)  │              │
│  └──────────────────────────────────┘              │
│                                                     │
│  SUBJECT                                            │
│  [LL001234] ___________________________________     │
│  Lead number tag is required for scanning          │
│                                                     │
│  MESSAGE                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │                                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ✓ Send a copy to myself                           │
│                                                     │
│  Tags: [LL001234] [lead-abc123] [crm-outbound]    │
│                                                     │
│              [Cancel]  [Send Email]                 │
└─────────────────────────────────────────────────────┘
```

### Emails Tab with Compose Button

```
┌─────────────────────────────────────────────────────┐
│  EMAIL COMMUNICATIONS         [COMPOSE] [Refresh]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Email threads list...]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Technical Implementation

### Components

#### 1. `LeadEmailComposeDialog`
**Location**: `/components/leads/lead-email-compose-dialog.tsx`

**Props**:
```typescript
interface LeadEmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadNumber: string;
  leadTitle: string;
  onEmailSent?: () => void;
}
```

**Features**:
- Recipient selection with checkboxes
- Grouped by role (owner, assignee, etc.)
- Select/deselect all per category
- Subject validation (must include lead number)
- Message body validation
- CC to sender option
- Loading states
- Error handling

#### 2. `EnhancedLeadEmailsTab` (Updated)
**Location**: `/components/leads/enhanced-lead-emails-tab.tsx`

**Updates**:
- Added "COMPOSE EMAIL" button
- Integrated compose dialog
- Refresh emails after sending

### API Endpoints

#### 1. Get Email Recipients
**Endpoint**: `GET /api/leads/[id]/email-recipients`

**Response**:
```json
{
  "recipients": [
    {
      "id": "user123",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "owner",
      "checked": false
    }
  ],
  "leadTitle": "Example Lead"
}
```

**Logic**:
1. Fetches lead with all relations
2. Collects unique recipients from:
   - Lead owner
   - Lead assignee
   - Participants
   - Lead contacts (including linked contacts)
   - Department manager
   - All admins
   - All managers
   - Department employees
3. Returns deduplicated list

#### 2. Send Email
**Endpoint**: `POST /api/leads/[id]/emails/send`

**Request Body**:
```json
{
  "to": [
    { "email": "recipient@example.com", "name": "Recipient Name" }
  ],
  "subject": "[LL001234] Email Subject",
  "body": "Email message content",
  "ccMyself": true,
  "metadata": {
    "leadId": "lead123",
    "leadNumber": "LL001234",
    "leadTitle": "Example Lead",
    "tags": ["LL001234", "lead-lead123", "crm-outbound"]
  }
}
```

**Process**:
1. Validates input
2. Checks lead exists
3. Gets sender's email account (Microsoft/Google)
4. Formats email with HTML template
5. Adds custom headers for tagging
6. Sends via Microsoft Graph API or Gmail API
7. Saves to database (EmailThread + EmailMessage)
8. Returns success/error response

**Email Headers Added**:
```
X-CRM-Lead-ID: lead123
X-CRM-Lead-Number: LL001234
X-CRM-Tags: LL001234,lead-lead123,crm-outbound
```

#### 3. Search Emails (Updated)
**Endpoint**: `GET /api/leads/[id]/emails/search`

**Updates**:
- Now returns `leadTitle` in response
- Used by compose dialog

### Email Template

HTML email template includes:
```html
<div style="font-family: Arial, sans-serif;">
  <p>[User's message with line breaks]</p>
  <br>
  <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
  <p style="color: #666; font-size: 12px;">
    This email was sent from KimonCRM regarding Lead LL001234:<br>
    <strong>Example Lead Title</strong>
  </p>
</div>
```

## Mailbox Scanning

### Tag Strategy

Emails can be scanned and identified using:

1. **Subject Line**: Contains `[LL001234]` format
2. **Custom Headers**: `X-CRM-Lead-ID`, `X-CRM-Lead-Number`, `X-CRM-Tags`
3. **Email Footer**: Includes lead reference

### Scanning Implementation

```typescript
// Example scanner logic
function scanEmailForLead(email) {
  // Check subject
  const subjectMatch = email.subject.match(/\[LL\d+\]/);
  
  // Check custom headers
  const leadId = email.headers['X-CRM-Lead-ID'];
  const leadNumber = email.headers['X-CRM-Lead-Number'];
  const tags = email.headers['X-CRM-Tags']?.split(',');
  
  // Check body for lead reference
  const bodyMatch = email.body.includes('KimonCRM regarding Lead');
  
  return {
    isLeadEmail: !!(subjectMatch || leadId || bodyMatch),
    leadNumber: leadNumber || subjectMatch?.[0],
    leadId: leadId,
    tags: tags || []
  };
}
```

## Usage Flow

### For End Users

1. Navigate to lead detail page
2. Click "Emails" tab
3. Click "COMPOSE EMAIL" button
4. Select recipients from organized lists
   - Use "Select All" for entire categories
   - Or check individual recipients
5. Enter subject (lead number pre-filled)
6. Type message
7. Optionally CC yourself
8. Click "Send Email"
9. Email appears in lead's email thread list

### For Administrators

Recipients include:
- All leads they own
- All leads they're assigned to
- All leads they participate in
- Plus access to all system emails as admin

### For Managers

Recipients include:
- Leads in their managed departments
- Leads where they are owner/assignee
- Department employees

### For Employees

Recipients include:
- Leads they're assigned to
- Leads they participate in
- Contacts from those leads

## Security

### Authorization
- Must be authenticated
- Can only send from connected email account
- Validates lead access

### Email Provider Integration
- Uses existing OAuth tokens
- Supports Microsoft Graph API
- Supports Gmail API
- Respects provider rate limits

### Data Validation
- Validates all input fields
- Sanitizes HTML content
- Prevents header injection
- Checks recipient email formats

## Error Handling

### User-Facing Errors
- "No recipients selected"
- "Subject is required"
- "Message body is required"
- "No email account connected"
- "Failed to send email"

### Backend Errors
- Provider API failures (with retry)
- Token expiration (requires reconnection)
- Database save failures (email still sent)
- Network timeouts

## Benefits

### For Users
- ✅ Quick access to all involved parties
- ✅ Automatic lead association
- ✅ No need to copy email addresses
- ✅ Professional email formatting
- ✅ Audit trail in CRM

### For Administrators
- ✅ All communications tracked
- ✅ Easy email search by lead
- ✅ Automatic categorization
- ✅ Compliance and record-keeping
- ✅ Integration with existing workflows

### For System
- ✅ Structured data storage
- ✅ Searchable and reportable
- ✅ API-based integration
- ✅ Scalable architecture
- ✅ Provider-agnostic

## Future Enhancements

Potential improvements:
- [ ] Email templates library
- [ ] Attachment support
- [ ] Rich text editor (WYSIWYG)
- [ ] Email scheduling
- [ ] Auto-reply detection
- [ ] Read receipts tracking
- [ ] Bulk email sending
- [ ] Email signatures
- [ ] CC/BCC support
- [ ] Reply/Forward from CRM
- [ ] Conversation threading
- [ ] Email analytics

## Troubleshooting

### Email Not Sending
1. Check if email account is connected (Email Settings)
2. Verify OAuth token is valid
3. Check provider API status
4. Review error logs

### Email Not Appearing in Lead
1. Check if email was saved to database
2. Verify lead ID is correct
3. Check email thread association
4. Refresh emails tab

### Recipients Not Loading
1. Check lead has owner/assignee
2. Verify participants exist
3. Check user permissions
4. Review API logs

## Conclusion

The Lead Email Compose feature provides a seamless way to communicate with all parties involved in a lead while maintaining complete traceability and organization within the CRM system.

