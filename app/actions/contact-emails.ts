"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createMicrosoftGraphClient } from "@/lib/microsoft/graph";

export async function fetchContactEmails(contactId: string) {
  console.log("\n=== FETCH CONTACT EMAILS CALLED ===");
  console.log(`Contact ID: ${contactId}`);
  
  try {
    const session = await auth();
    console.log(`Session exists: ${!!session}`);
    console.log(`User ID: ${session?.user?.id || 'N/A'}`);
    
    if (!session?.user?.id) {
      console.log("ERROR: Unauthorized - no session");
      return { error: "Unauthorized", data: null };
    }

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    
    console.log(`Contact found: ${contact ? 'Yes' : 'No'}`);
    console.log(`Contact email: ${contact?.email || 'N/A'}`);

    if (!contact) {
      return { error: "Contact not found", data: null };
    }

    // Search for email threads by contactId
    const initialEmailThreads = await prisma.emailThread.findMany({
      where: {
        contactId: contactId,
      },
      include: {
        messages: {
          orderBy: { receivedAt: 'desc' },
          take: 10,
        },
        company: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        lead: { select: { id: true, title: true } },
        support: { select: { id: true, subject: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    let emailThreads = initialEmailThreads;

    // If no threads found, try Office 365
    if (emailThreads.length === 0 && contact.email) {
      console.log("No email threads in database, checking Office 365...");
      try {
        // Use application-level permissions (like OneDrive does)
        const clientId = process.env.GRAPH_CLIENT_ID;
        const clientSecret = process.env.GRAPH_CLIENT_SECRET;
        const tenantId = process.env.TENANT_ID || process.env.GRAPH_TENANT_ID;

        if (!clientId || !clientSecret || !tenantId) {
          console.log("Microsoft Graph credentials not configured");
          throw new Error("Microsoft Graph credentials not configured");
        }

        // Get application access token
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        
        const params = new URLSearchParams({
          client_id: clientId,
          scope: "https://graph.microsoft.com/.default",
          client_secret: clientSecret,
          grant_type: "client_credentials",
        });

        console.log("Requesting application token for Microsoft Graph...");
        const tokenResponse = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("Failed to get access token:", errorText);
          throw new Error(`Failed to get access token: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        console.log("Successfully obtained application token");

        if (accessToken) {
          console.log(`Attempting to fetch emails for contact: ${contact.email}`);
          
          // Query specific user's mailbox using app permissions
          const userEmail = session.user?.email;
          if (!userEmail) {
            console.log("No user email found in session");
            throw new Error("User email not found");
          }
          
          console.log(`Querying mailbox for user: ${userEmail}`);
          
          // Get recent emails and filter client-side - include body content and attachments flag
          const graphUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages?$top=100&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,bodyPreview,body,hasAttachments`;
          
          console.log("Fetching recent emails from logged-in user's mailbox...");
          const graphResponse = await fetch(graphUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!graphResponse.ok) {
            const errorText = await graphResponse.text();
            console.error("Graph API error:", errorText);
            throw new Error(`Failed to fetch emails: ${graphResponse.status}`);
          }
          
          const emailData = await graphResponse.json();
          const allMessages = emailData.value || [];
          
          console.log(`Found ${allMessages.length} total emails in mailbox`);
          
          // Log first email structure for debugging
          if (allMessages.length > 0) {
            console.log("\n=== SAMPLE EMAIL STRUCTURE ===");
            console.log("First email:", JSON.stringify(allMessages[0], null, 2));
            console.log("=== END SAMPLE ===\n");
          }
          
          // Filter for emails from/to the contact
          const contactEmailLower = contact.email.toLowerCase();
          const matchingMessages = allMessages.filter((msg: any) => {
            const fromEmail = msg.from?.emailAddress?.address?.toLowerCase() || '';
            const toEmails = msg.toRecipients?.map((r: any) => r.emailAddress?.address?.toLowerCase()) || [];
            const ccEmails = msg.ccRecipients?.map((r: any) => r.emailAddress?.address?.toLowerCase()) || [];
            
            return fromEmail === contactEmailLower || 
                   toEmails.includes(contactEmailLower) || 
                   ccEmails.includes(contactEmailLower);
          });
          
          const emails = {
            messages: matchingMessages,
            totalCount: matchingMessages.length,
          };
          
          console.log(`=== FOUND ${emails.messages?.length || 0} MESSAGES MATCHING CONTACT ===`);
          
          // Log all found emails
          if (emails.messages && emails.messages.length > 0) {
            console.log("\n=== MATCHING EMAILS ===");
            emails.messages.forEach((msg: any, index: number) => {
              console.log(`\nEmail ${index + 1}:`);
              console.log(`  Subject: ${msg.subject}`);
              console.log(`  From: ${msg.from?.emailAddress?.address || 'N/A'}`);
              console.log(`  To: ${msg.toRecipients?.map((r: any) => r.emailAddress?.address).join(', ') || 'N/A'}`);
              console.log(`  Received: ${msg.receivedDateTime}`);
            });
            console.log("\n=== END OF MATCHING EMAILS ===\n");
            
            const matchingMessages = emails.messages;
            
            if (matchingMessages.length > 0) {
              // Convert Microsoft emails to our format
              const convertedThreads = matchingMessages.slice(0, 10).map((msg: any) => {
                console.log("Processing message:", msg.subject, "from:", msg.from?.emailAddress?.address);
                console.log("Message data:", {
                  hasBody: !!msg.body,
                  bodyType: msg.body?.contentType,
                  hasBodyPreview: !!msg.bodyPreview,
                  bodyPreviewLength: msg.bodyPreview?.length || 0,
                });
                
                // Extract body content
                let bodyText = '';
                let bodyHtml = '';
                
                if (msg.body) {
                  if (msg.body.contentType === 'text') {
                    bodyText = msg.body.content || '';
                  } else if (msg.body.contentType === 'html') {
                    bodyHtml = msg.body.content || '';
                  }
                }
                
                // Fallback to bodyPreview if no body content
                if (!bodyText && !bodyHtml) {
                  bodyText = msg.bodyPreview || '';
                }
                
                // Note: Attachments are not fetched here for performance - they will be fetched when viewing the message
                // Create message object with all required fields
                const messageObj = {
                  id: msg.id || `temp-msg-${Date.now()}`,
                  subject: msg.subject || 'No Subject',
                  fromEmail: msg.from?.emailAddress?.address || '',
                  fromName: msg.from?.emailAddress?.name || '',
                  toList: msg.toRecipients || [],
                  ccList: msg.ccRecipients || [],
                  bodyText: bodyText,
                  bodyHtml: bodyHtml,
                  receivedAt: msg.receivedDateTime,
                  isRead: msg.isRead || false,
                  hasAttachments: msg.hasAttachments || false,
                };
                
                console.log("Created message object:", {
                  id: messageObj.id,
                  subject: messageObj.subject,
                  fromEmail: messageObj.fromEmail,
                  toList: messageObj.toList.length,
                  hasBodyText: !!messageObj.bodyText,
                  bodyTextLength: messageObj.bodyText?.length || 0,
                  hasBodyHtml: !!messageObj.bodyHtml,
                  bodyHtmlLength: messageObj.bodyHtml?.length || 0,
                });
                
                return {
                  id: msg.id || `temp-${Date.now()}-${Math.random()}`,
                  subject: msg.subject || 'No Subject',
                  messageCount: 1,
                  lastMessageAt: msg.receivedDateTime,
                  messages: [messageObj],
                };
              });
              
              console.log(`Converted ${convertedThreads.length} email threads`);
              
              return {
                data: { success: true, data: convertedThreads, source: 'office365' },
                error: null
              };
            }
          }
        }
      } catch (error) {
        console.error("Error fetching from Office 365:", error);
        console.error("Full error details:", error instanceof Error ? error.message : String(error));
      }
    }

    return {
      data: { success: true, data: emailThreads, source: 'database' },
      error: null
    };
  } catch (error) {
    console.error("Error fetching contact emails:", error);
    return { error: "Failed to fetch emails", data: null };
  }
}
