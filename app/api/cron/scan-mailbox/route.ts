import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/cron/scan-mailbox
 * Scans all user mailboxes for emails with lead tags and imports them
 * Should be called by cron job every few minutes
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  console.log("📬 [MAILBOX SCAN] ========================================");
  console.log("📬 [MAILBOX SCAN] Starting mailbox scan...");
  console.log("📬 [MAILBOX SCAN] Time:", new Date().toISOString());
  
  try {
    // Get all users with email accounts connected
    const accounts = await prisma.account.findMany({
      where: {
        provider: { in: ["microsoft", "google"] },
        access_token: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`📬 [MAILBOX SCAN] Found ${accounts.length} email accounts to scan`);

    if (accounts.length === 0) {
      console.log("📬 [MAILBOX SCAN] ⚠️ No email accounts found. Users need to connect their email accounts.");
      return NextResponse.json({
        success: true,
        message: "No email accounts found",
        processed: 0,
      });
    }

    let totalProcessed = 0;
    let totalImported = 0;
    let totalErrors = 0;
    const results: any[] = [];

    // Scan each account
    for (const account of accounts) {
      try {
        console.log(`📬 [MAILBOX SCAN] ----------------------------------------`);
        console.log(`📬 [MAILBOX SCAN] Scanning mailbox for ${account.user.email} (${account.provider})`);
        
        // Refresh token if needed
        const refreshedAccount = await refreshTokenIfNeeded(account);
        
        const result = await scanAccountMailbox(refreshedAccount);
        totalProcessed += result.processed;
        totalImported += result.imported;
        
        results.push({
          email: account.user.email,
          provider: account.provider,
          processed: result.processed,
          imported: result.imported,
        });
        
        console.log(`📬 [MAILBOX SCAN] ✅ ${account.user.email}: ${result.imported} imported / ${result.processed} processed`);
      } catch (error: any) {
        totalErrors++;
        console.error(`📬 [MAILBOX SCAN] ❌ Error scanning ${account.user.email}:`, error.message);
        console.error(`📬 [MAILBOX SCAN] Stack:`, error.stack);
        
        results.push({
          email: account.user.email,
          provider: account.provider,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`📬 [MAILBOX SCAN] ========================================`);
    console.log(`📬 [MAILBOX SCAN] ✅ COMPLETED in ${duration}ms`);
    console.log(`📬 [MAILBOX SCAN] Summary: ${totalImported} imported, ${totalProcessed} processed, ${totalErrors} errors`);
    console.log(`📬 [MAILBOX SCAN] ========================================`);

    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      imported: totalImported,
      errors: totalErrors,
      accounts: accounts.length,
      duration: `${duration}ms`,
      results,
    });
  } catch (error: any) {
    console.error("📬 [MAILBOX SCAN] ❌ FATAL ERROR:", error.message);
    console.error("📬 [MAILBOX SCAN] Stack:", error.stack);
    return NextResponse.json(
      {
        error: "Mailbox scan failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Refresh Microsoft/Google token if expired or about to expire
 */
async function refreshTokenIfNeeded(account: any) {
  console.log(`📬 [TOKEN] Checking token expiration for ${account.user.email}...`);
  
  // Check if token is expired or will expire in next 5 minutes
  const expiresAt = account.expires_at ? new Date(account.expires_at * 1000) : null;
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (!expiresAt || expiresAt > fiveMinutesFromNow) {
    console.log(`📬 [TOKEN] ✅ Token is valid until ${expiresAt?.toISOString() || 'unknown'}`);
    return account;
  }

  console.log(`📬 [TOKEN] ⚠️ Token expired or expiring soon (${expiresAt.toISOString()}), refreshing...`);

  try {
    if (account.provider === "microsoft") {
      const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: account.refresh_token!,
          grant_type: "refresh_token",
          scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`📬 [TOKEN] ❌ Failed to refresh Microsoft token:`, error);
        throw new Error(`Failed to refresh token: ${error}`);
      }

      const data = await response.json();
      
      // Update account in database
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: data.access_token,
          refresh_token: data.refresh_token || account.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        },
      });

      console.log(`📬 [TOKEN] ✅ Microsoft token refreshed successfully`);
      
      return {
        ...account,
        access_token: data.access_token,
        refresh_token: data.refresh_token || account.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      };
    } else if (account.provider === "google") {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: account.refresh_token!,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`📬 [TOKEN] ❌ Failed to refresh Google token:`, error);
        throw new Error(`Failed to refresh token: ${error}`);
      }

      const data = await response.json();
      
      // Update account in database
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: data.access_token,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        },
      });

      console.log(`📬 [TOKEN] ✅ Google token refreshed successfully`);
      
      return {
        ...account,
        access_token: data.access_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      };
    }
  } catch (error: any) {
    console.error(`📬 [TOKEN] ❌ Error refreshing token:`, error.message);
    throw error;
  }

  return account;
}

async function scanAccountMailbox(account: any) {
  const provider = account.provider;
  const accessToken = account.access_token;
  let processed = 0;
  let imported = 0;

  console.log(`📬 [SCAN] Starting scan for ${account.user.email}...`);

  try {
    // Get all lead numbers to search for
    const leads = await prisma.lead.findMany({
      where: {
        leadNumber: { not: null },
      },
      select: {
        id: true,
        leadNumber: true,
      },
    });

    console.log(`📬 [SCAN] Found ${leads.length} leads with lead numbers in database`);

    if (leads.length === 0) {
      console.log(`📬 [SCAN] ⚠️ No leads with lead numbers found. Skipping scan.`);
      return { processed: 0, imported: 0 };
    }

    // Search for emails containing any lead number
    let emails: any[] = [];

    console.log(`📬 [SCAN] Searching mailbox for emails with lead tags...`);
    
    if (provider === "microsoft") {
      emails = await searchMicrosoftEmails(accessToken, leads);
    } else if (provider === "google") {
      emails = await searchGoogleEmails(accessToken, leads);
    }

    console.log(`📬 [SCAN] Found ${emails.length} emails with potential lead tags`);

    if (emails.length === 0) {
      console.log(`📬 [SCAN] No emails found with lead tags`);
      return { processed: 0, imported: 0 };
    }

    // Process each email
    for (const email of emails) {
      processed++;
      
      console.log(`📬 [SCAN] Processing email ${processed}/${emails.length}: "${email.subject}"`);
      
      try {
        // Extract lead number from subject or headers
        const leadNumber = extractLeadNumber(email.subject, leads);
        
        if (!leadNumber) {
          console.log(`📬 [SCAN] ⚠️ Could not extract valid lead number from: "${email.subject}"`);
          continue;
        }

        console.log(`📬 [SCAN] ✓ Extracted lead number: ${leadNumber}`);

        const lead = leads.find(l => l.leadNumber === leadNumber);
        
        if (!lead) {
          console.log(`📬 [SCAN] ⚠️ Lead not found in database for number: ${leadNumber}`);
          continue;
        }

        // Check if email already exists by subject and received date
        const existing = await prisma.emailMessage.findFirst({
          where: {
            subject: email.subject,
            receivedAt: email.receivedAt,
          },
        });

        if (existing) {
          console.log(`📬 [SCAN] ⏭️ Email already imported: "${email.subject}"`);
          continue;
        }

        // Import email
        console.log(`📬 [SCAN] Importing email for lead ${leadNumber}...`);
        await importEmail(email, lead.id, provider);
        imported++;
        
        console.log(`📬 [SCAN] ✅ Successfully imported email for lead ${leadNumber}`);
      } catch (emailError: any) {
        console.error(`📬 [SCAN] ❌ Error processing email "${email.subject}":`, emailError.message);
        console.error(`📬 [SCAN] Error stack:`, emailError.stack);
      }
    }

    console.log(`📬 [SCAN] Completed: ${imported} imported out of ${processed} processed`);
    return { processed, imported };
  } catch (error: any) {
    console.error(`📬 [SCAN] ❌ Fatal error scanning account:`, error.message);
    console.error(`📬 [SCAN] Stack:`, error.stack);
    throw error;
  }
}

async function searchMicrosoftEmails(accessToken: string, leads: any[]) {
  const emails: any[] = [];
  
  console.log(`📬 [MICROSOFT] Fetching emails from Microsoft Graph API...`);
  
  try {
    // Search for emails with LL in subject (most lead numbers start with LL)
    const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=contains(subject,'LL')&$top=100&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,body,bodyPreview,receivedDateTime,sentDateTime,isRead,hasAttachments`;
    
    console.log(`📬 [MICROSOFT] Request URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`📬 [MICROSOFT] ❌ API error (${response.status}):`, errorText);
      return [];
    }

    const data = await response.json();
    
    console.log(`📬 [MICROSOFT] API returned ${data.value?.length || 0} messages`);
    
    for (const msg of data.value || []) {
      emails.push({
        messageId: msg.id,
        subject: msg.subject || "",
        from: msg.from?.emailAddress?.address || "",
        fromName: msg.from?.emailAddress?.name || "",
        to: msg.toRecipients?.map((r: any) => r.emailAddress?.address) || [],
        cc: msg.ccRecipients?.map((r: any) => r.emailAddress?.address) || [],
        bcc: msg.bccRecipients?.map((r: any) => r.emailAddress?.address) || [],
        body: msg.body?.content || "",
        bodyPreview: msg.bodyPreview || "",
        isHtml: msg.body?.contentType === "html",
        receivedAt: new Date(msg.receivedDateTime),
        sentAt: new Date(msg.sentDateTime),
        isRead: msg.isRead || false,
        hasAttachments: msg.hasAttachments || false,
      });
      
      console.log(`📬 [MICROSOFT] - "${msg.subject}" from ${msg.from?.emailAddress?.address}`);
    }
    
    console.log(`📬 [MICROSOFT] ✅ Parsed ${emails.length} emails`);
  } catch (error: any) {
    console.error("📬 [MICROSOFT] ❌ Error fetching emails:", error.message);
    console.error("📬 [MICROSOFT] Stack:", error.stack);
  }

  return emails;
}

async function searchGoogleEmails(accessToken: string, leads: any[]) {
  const emails: any[] = [];
  
  try {
    // Search for emails with LL in subject
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=subject:LL&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("📬 [MAILBOX SCAN] Gmail API error:", error);
      return [];
    }

    const data = await response.json();
    
    // Fetch full details for each message
    for (const msg of (data.messages || []).slice(0, 10)) {
      try {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
          const from = headers.find((h: any) => h.name === "From")?.value || "";
          const to = headers.find((h: any) => h.name === "To")?.value || "";
          
          emails.push({
            messageId: detail.id,
            subject,
            from,
            fromName: from,
            to: to.split(",").map((e: string) => e.trim()),
            cc: [],
            bcc: [],
            body: detail.snippet || "",
            bodyPreview: detail.snippet || "",
            isHtml: false,
            receivedAt: new Date(parseInt(detail.internalDate)),
            sentAt: new Date(parseInt(detail.internalDate)),
            isRead: !detail.labelIds?.includes("UNREAD"),
            hasAttachments: false,
          });
        }
      } catch (msgError) {
        console.error(`📬 [MAILBOX SCAN] Error fetching Gmail message ${msg.id}`);
      }
    }
  } catch (error: any) {
    console.error("📬 [MAILBOX SCAN] Error fetching Gmail emails:", error.message);
  }

  return emails;
}

function extractLeadNumber(subject: string, leads: any[]): string | null {
  for (const lead of leads) {
    if (subject.includes(lead.leadNumber)) {
      return lead.leadNumber;
    }
  }
  return null;
}

async function importEmail(email: any, leadId: string, provider: string) {
  // Create or find email thread
  let thread = await prisma.emailThread.findFirst({
    where: {
      subject: email.subject,
      leadId,
    },
  });

  if (!thread) {
    thread = await prisma.emailThread.create({
      data: {
        provider: provider === "microsoft" ? "MICROSOFT" : "GOOGLE",
        subject: email.subject,
        leadId,
        messageCount: 1,
        lastMessageAt: email.receivedAt,
      },
    });
  } else {
    await prisma.emailThread.update({
      where: { id: thread.id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: email.receivedAt,
      },
    });
  }

  // Create email message
  await prisma.emailMessage.create({
    data: {
      provider: provider === "microsoft" ? "MICROSOFT" : "GOOGLE",
      threadId: thread.id,
      fromEmail: email.from,
      fromName: email.fromName,
      subject: email.subject,
      toList: email.to,
      ccList: email.cc,
      bccList: email.bcc,
      bodyText: email.body,
      bodyHtml: email.isHtml ? email.body : null,
      receivedAt: email.receivedAt,
      sentAt: email.sentAt,
      isRead: email.isRead,
      hasAttachments: email.hasAttachments,
    },
  });
  
  console.log(`📬 [IMPORT] ✅ Email imported successfully`);
}

