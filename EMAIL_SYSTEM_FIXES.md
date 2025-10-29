# Email System Fixes & Diagnostics

## Issues Fixed

### 1. ✅ Prisma Field Name Mismatch (FIXED)
**Problem:** The `generateEmailSignature` function was trying to access `phone` and `mobile` fields on Contact model, but the correct field names are:
- `workPhone`
- `mobilePhone`
- `homePhone`

**Fix:** Updated `/Volumes/EXTERNALSSD/kimoncrm/lib/email/signature.ts`
- Changed Prisma query to select correct fields
- Updated field references in signature generation

### 2. ✅ Enhanced Task Notification Email Logging (ADDED)
**Location:** `/Volumes/EXTERNALSSD/kimoncrm/app/api/leads/[id]/tasks/[taskId]/route.ts`

**Added comprehensive logging:**
- Task status change detection
- Recipient collection (owner, assignee, task assignee)
- Email sending attempts and results
- Detailed error messages

**Log output includes:**
```
=== Task Status Changed - Sending Notifications ===
Task ID: xxx
Status Changed: NOT_STARTED → IN_PROGRESS
Sender Email: your@email.com

--- sendTaskNotificationEmails ---
Action: status_changed
Sender: your@email.com
Adding lead owner: owner@email.com
Final recipients: ['owner@email.com']

--- Sending emails ---
Email subject: Lead Task Status Changed: Task Title
Sending to: owner@email.com
✓ Email sent successfully to owner@email.com
```

### 3. ✅ Email System Connection Issues (FIXED)
**Problem:** Email page was using demo tokens instead of real OAuth tokens

**Fixes:**
- Created `/Volumes/EXTERNALSSD/kimoncrm/app/api/emails/token/route.ts` - Fetches real OAuth access tokens from database
- Updated `/Volumes/EXTERNALSSD/kimoncrm/app/(main)/emails/page.tsx` - Uses real tokens instead of demo
- Created `/Volumes/EXTERNALSSD/kimoncrm/app/api/emails/mailboxes/route.ts` - Lists all accessible mailboxes
- Enhanced `/Volumes/EXTERNALSSD/kimoncrm/components/emails/email-client.tsx` - Better error handling and logging

### 4. ✅ Test Email Endpoint (ADDED)
**Location:** `/Volumes/EXTERNALSSD/kimoncrm/app/api/test-email/route.ts`

**Features:**
- Checks environment variables
- Tests signature generation
- Sends test email to yourself
- Provides detailed diagnostics

---

## Diagnostic Steps

### Step 1: Test Email Sending
Visit: `http://localhost:3000/api/test-email`

This will:
- ✓ Check if Microsoft Graph credentials are configured
- ✓ Test signature generation
- ✓ Attempt to send a test email
- ✓ Show detailed error messages

### Step 2: Check Console Logs for Task Notifications
When you change a task status, check your terminal for logs like:

```bash
=== Task Status Changed - Sending Notifications ===
```

Look for:
- `✓` - Success indicators
- `✗` - Failure indicators
- Error messages explaining what failed

### Step 3: Check Email System
1. Go to `/emails` page
2. Check browser console (F12) for logs
3. Look for:
   - "Fetching mailboxes for provider: microsoft"
   - "Found mailboxes: [...]"
   - "Fetching folders for mailbox: xxx"
   - "Found X emails"

---

## Common Issues & Solutions

### Issue: "No recipients to send to"
**Cause:** You are the only person assigned to the lead/task
**Solution:** Assign the lead to another user or assign the task to someone else

### Issue: "No emails found" in Emails Tab
**Possible Causes:**

1. **Not Connected to Email Account**
   - Solution: Click "Connect Email Account" button
   - Sign in with Microsoft or Google

2. **Access Token Expired**
   - Solution: Click the "Refresh" button
   - May need to reconnect account

3. **Wrong Folder Selected**
   - Solution: Try different folders (Inbox, Sent Items, etc.)
   - Check the folder count in sidebar

4. **Demo Token Being Used**
   - Solution: The system now uses real tokens, but check browser console for:
     ```
     Error: No connected email account found
     ```
   - Reconnect your email account

5. **Microsoft Graph API Permissions Missing**
   - Required permissions:
     - `Mail.Read` (delegated)
     - `Mail.ReadWrite` (delegated)
     - `Mail.Send` (application) - for sending on behalf of users
   - Check in Azure Portal → App Registrations → Your App → API Permissions

### Issue: Emails Not Sending from Task Status Change
**Possible Causes:**

1. **Missing Application Permissions**
   - Required: `Mail.Send` (application permission, not delegated)
   - Location: Azure Portal → App Registrations → API Permissions
   - Must be admin-consented

2. **Invalid Sender Email**
   - The sender must be a valid mailbox in your Microsoft 365 tenant
   - Check console logs for the sender email address

3. **Signature Generation Failed**
   - Now fixed with correct Prisma field names
   - Check logs for "Signature Generation: ✓ Success"

---

## How to Check Multiple Mailboxes

The email system now supports checking multiple mailboxes:

1. **Primary Mailbox**: Your own mailbox (automatic)
2. **Shared Mailboxes**: Any shared mailboxes you have access to

If you have access to multiple mailboxes, you'll see a dropdown at the top of the email client to switch between them.

**Note:** To access shared mailboxes, you need:
- `Mail.Read.Shared` or `Mail.ReadWrite.Shared` permission
- Explicit permission granted to those mailboxes

---

## Required Microsoft Graph API Permissions

### For Email Reading (Delegated - User signs in):
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Read.Shared` (for shared mailboxes)
- `offline_access` (for refresh tokens)

### For Email Sending (Application - Server sends on behalf):
- `Mail.Send` (application permission)
- Requires admin consent

### How to Add Permissions:
1. Go to Azure Portal
2. Navigate to: App Registrations → Your App → API Permissions
3. Click "Add a permission"
4. Select "Microsoft Graph"
5. Choose permission type (Delegated or Application)
6. Search for and add the permission
7. Click "Grant admin consent" (required for application permissions)

---

## Environment Variables Check

Ensure these are set in your `.env` file:

```env
# Microsoft Graph
TENANT_ID=your-tenant-id
AUTH_MICROSOFT_ENTRA_ID_ID=your-client-id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-client-secret
GRAPH_TENANT_ID=your-tenant-id
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-client-secret
```

---

## Testing Checklist

- [ ] Visit `/api/test-email` - Should send test email
- [ ] Change task status - Check console for email sending logs
- [ ] Visit `/emails` page - Should show real emails, not demo
- [ ] Check multiple folders - Should see email counts
- [ ] Check browser console - Should see "Found X emails" logs
- [ ] Try sending email - Should work if permissions are correct

---

## Next Steps if Still Having Issues

1. **Check Azure App Permissions**
   - Ensure all required permissions are added
   - Ensure admin consent is granted

2. **Check User OAuth Connection**
   - Visit `/profile` or user settings
   - Verify Microsoft/Google account is connected
   - Try disconnecting and reconnecting

3. **Check Database**
   - Verify `Account` table has entries for users
   - Check `access_token` field is not null
   - Check `expires_at` is in the future

4. **Check Console Logs**
   - Browser console (F12)
   - Server terminal logs
   - Look for specific error messages

5. **Test with Test Endpoint**
   - `/api/test-email` provides comprehensive diagnostics
   - Share the error message from this endpoint for further help

---

## Files Modified

1. `/Volumes/EXTERNALSSD/kimoncrm/lib/email/signature.ts` - Fixed Prisma field names
2. `/Volumes/EXTERNALSSD/kimoncrm/app/api/leads/[id]/tasks/[taskId]/route.ts` - Added logging
3. `/Volumes/EXTERNALSSD/kimoncrm/app/api/test-email/route.ts` - NEW test endpoint
4. `/Volumes/EXTERNALSSD/kimoncrm/app/(main)/emails/page.tsx` - Real token integration
5. `/Volumes/EXTERNALSSD/kimoncrm/app/api/emails/token/route.ts` - NEW token fetcher
6. `/Volumes/EXTERNALSSD/kimoncrm/app/api/emails/mailboxes/route.ts` - NEW mailbox lister
7. `/Volumes/EXTERNALSSD/kimoncrm/components/emails/email-client.tsx` - Enhanced with logging & multi-mailbox support

