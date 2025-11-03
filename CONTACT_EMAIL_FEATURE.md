# Direct Contact Email Feature

## Overview

Send emails directly to lead contacts from the Lead Detail page. Each contact now has a **Mail icon** button that opens a pre-filled email compose dialog.

## ✅ **What Was Implemented**

### 1. **Mail Icon on Each Contact**
- Blue mail button appears next to each contact (if they have an email)
- Click to open email compose dialog
- Contact is automatically selected as recipient
- Located in the Contacts tab of Lead Detail page

### 2. **Enhanced Email Compose Dialog**

#### Pre-filled Information
- **Contact**: Automatically checked as recipient
- **Lead Number**: Pre-filled in subject `[LL001234]`
- **Lead Title**: Displayed in header
- **Customer**: Displayed if associated

#### Additional Recipients
You can add more recipients from:
- ✅ **Admins**: All system administrators
- ✅ **Managers**: Department managers
- ✅ **Employees**: Department team members
- ✅ **Lead Owner**: The lead owner
- ✅ **Lead Assignee**: The assigned salesperson
- ✅ **Participants**: Other lead participants
- ✅ **Other Contacts**: Other lead contacts

#### Email Fields
- **Subject**: Pre-filled with lead number tag
- **Message**: Rich text area
- **Signature**: Automatically appended from user's email signature
- **CC Myself**: Option to receive a copy

### 3. **Automatic Tagging System**

Every email includes these tags for mailbox scanning:

#### Email Headers
```
X-CRM-Lead-ID: lead123abc
X-CRM-Lead-Number: LL001234
X-CRM-Customer-ID: customer456def
X-CRM-Customer-Name: Example Customer Inc.
X-CRM-Tags: LL001234,lead-lead123abc,customer-customer456def,crm-outbound
```

#### Subject Format
```
[LL001234] Your Subject Here
```

#### Email Footer
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
This email was sent from KimonCRM regarding Lead LL001234:
Example Lead Title
```

### 4. **Lead & Customer Association**

Emails are linked to:
- ✅ The specific **Lead** (via lead ID)
- ✅ The **Customer** (via customer ID)
- ✅ Stored in database with full metadata
- ✅ Visible in lead's Emails tab

### 5. **Email Signature Integration**

- ✅ Automatically fetches user's active email signature
- ✅ Appends to email body
- ✅ Preview shown in compose dialog
- ✅ Supports HTML signatures

## 🎨 **UI/UX Design**

### Contact Card Layout
```
┌─────────────────────────────────────────────────┐
│ 👤  John Doe                    [📧] [✓] [✏️] [🗑️] │
│     ✉️  john@company.com                        │
│     📞  +1234567890                             │
│     Title: Decision Maker                       │
│     Notes: Primary contact                      │
└─────────────────────────────────────────────────┘
```

### Buttons on Each Contact
- **[📧]** Blue mail button - Send email (NEW!)
- **[✓]** Link to main contacts
- **[✏️]** Edit contact
- **[🗑️]** Delete contact

### Email Dialog Features
- **Recipient Groups**: Organized by role
- **Select All**: Per category
- **Visual Tags**: Shows all applied tags
- **Signature Preview**: See what will be appended
- **Customer Info**: Displayed prominently
- **Pre-selected Contact**: Highlighted

## 📁 **Files Created/Modified**

### Modified Files
1. `/components/leads/lead-detail-view.tsx`
   - Added mail button to each contact
   - Added email compose dialog state
   - Integrated LeadEmailComposeDialog

2. `/components/leads/lead-email-compose-dialog.tsx`
   - Added `prefilledContact` prop
   - Added `customerId` and `customerName` props
   - Added signature support
   - Auto-check prefilled contact

3. `/app/api/leads/[id]/emails/send/route.ts`
   - Added customer metadata
   - Added customer headers
   - Updated tags to include customer

### New Files
1. `/app/api/user/email-signature/route.ts`
   - Fetches active email signature
   - Returns HTML or plain text

## 🚀 **How to Use**

### Scenario 1: Quick Email to Contact
1. Open any lead detail page
2. Go to **Contacts** tab
3. Find the contact you want to email
4. Click the **blue mail icon** 📧
5. Contact is pre-selected
6. Add subject and message
7. Click **Send Email**

### Scenario 2: Email to Contact + Others
1. Click mail icon on contact
2. Contact is pre-selected
3. **Add more recipients**:
   - Check admins for oversight
   - Check managers for approval
   - Check lead owner for coordination
4. Write your message
5. Signature automatically appended
6. Click **Send Email**

### Scenario 3: Email All Involved Parties
1. Click mail icon on any contact
2. Use **"Select All"** buttons to add:
   - All managers
   - All participants
   - All contacts
3. Write announcement or update
4. Send to everyone at once

## 🔍 **Mailbox Scanning Strategy**

Your email system can scan for CRM emails using:

### Method 1: Subject Line Pattern
```javascript
if (email.subject.includes('[LL')) {
  // This is a CRM lead email
  const leadNumber = email.subject.match(/\[LL\d+\]/)[0];
}
```

### Method 2: Custom Headers
```javascript
const headers = email.headers;
if (headers['X-CRM-Lead-ID']) {
  // This is a CRM email
  const leadId = headers['X-CRM-Lead-ID'];
  const customerId = headers['X-CRM-Customer-ID'];
  const tags = headers['X-CRM-Tags'].split(',');
}
```

### Method 3: Tag Matching
```javascript
const tags = email.headers['X-CRM-Tags']?.split(',') || [];
const isLeadEmail = tags.some(tag => tag.startsWith('lead-'));
const isCustomerEmail = tags.some(tag => tag.startsWith('customer-'));
const isCRMOutbound = tags.includes('crm-outbound');
```

## 📊 **Benefits**

### For Sales Team
- ✅ One-click email to contacts
- ✅ No manual email address copy/paste
- ✅ Automatic CRM logging
- ✅ Professional email templates
- ✅ Team visibility

### For Managers
- ✅ Track all communications
- ✅ Easy to CC on important emails
- ✅ Full audit trail
- ✅ Customer association

### For System
- ✅ Structured data
- ✅ Searchable metadata
- ✅ Reportable communications
- ✅ Integration-ready

## 🔐 **Security & Privacy**

- ✅ Only contacts with email addresses show mail icon
- ✅ Requires email account connection
- ✅ Uses authenticated APIs
- ✅ Respects user permissions
- ✅ Secure token handling

## 📝 **Example Use Cases**

### Use Case 1: Request Information
```
Contact: Technical Contact
Subject: [LL001234] Additional Technical Requirements
Message: Hi John,

Following up on our discussion about the network infrastructure 
project. Could you please provide the current equipment list?

Thanks!
```

### Use Case 2: Meeting Coordination
```
Recipients: 
  ✓ Contact
  ✓ Lead Owner
  ✓ Manager
  
Subject: [LL001234] Site Survey Scheduling
Message: Team,

I'd like to schedule a site survey for next week. 
Please let me know your availability.
```

### Use Case 3: Project Update
```
Recipients:
  ✓ All Contacts
  ✓ Lead Assignee
  ✓ Participants
  
Subject: [LL001234] Project Status Update
Message: Hi everyone,

Just wanted to share an update on the project progress...
```

## ✨ **Key Features Summary**

| Feature | Status |
|---------|--------|
| Mail icon on contacts | ✅ |
| Pre-filled recipient | ✅ |
| Add users/managers/admins | ✅ |
| Subject field | ✅ |
| Message field | ✅ |
| Email signature | ✅ |
| Lead association | ✅ |
| Customer association | ✅ |
| Auto-tagging | ✅ |
| Mailbox scanning headers | ✅ |
| CC myself option | ✅ |
| Professional template | ✅ |

## 🎯 **Complete!**

The contact email feature is fully implemented and ready to use. Sales teams can now send professional, tracked emails directly from the CRM with full lead and customer association!

