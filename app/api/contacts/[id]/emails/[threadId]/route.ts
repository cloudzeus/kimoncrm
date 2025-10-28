import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, threadId } = await params;

    // First, try to find the thread in the database
    const thread = await prisma.emailThread.findFirst({
      where: {
        OR: [
          { id: threadId },
          { externalId: threadId }
        ]
      },
      include: {
        messages: {
          orderBy: { receivedAt: 'desc' }
        },
        customer: {
          select: { id: true, name: true }
        },
        supplier: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        },
        company: {
          select: { id: true, name: true }
        },
        contact: {
          select: { id: true, email: true }
        }
      }
    });

    console.log("=== EMAIL THREAD API ===");
    console.log("Thread ID:", threadId);
    console.log("Thread found:", !!thread);
    console.log("Has messages:", thread?.messages?.length || 0);
    
    // If thread exists but has no messages, it's likely a minimal thread from Office 365
    // We need to fetch the actual email from Office 365
    if (thread && thread.externalId && (!thread.messages || thread.messages.length === 0)) {
      console.log("Thread has externalId but no messages - fetching from Office 365");
      
      try {
        // Use application-level credentials instead of user tokens
        // Get the user's email for the API call
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { email: true }
        });

        if (!user?.email) {
          console.error("User email not found");
          return NextResponse.json({
            success: true,
            data: thread
          });
        }

        // Get application-level access token (same as OneDrive does)
        const clientId = process.env.GRAPH_CLIENT_ID;
        const clientSecret = process.env.GRAPH_CLIENT_SECRET;
        const tenantId = process.env.TENANT_ID || process.env.GRAPH_TENANT_ID;

        if (!clientId || !clientSecret || !tenantId) {
          console.error("Microsoft Graph credentials not configured");
          return NextResponse.json({
            success: true,
            data: thread
          });
        }

        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        
        const params = new URLSearchParams({
          client_id: clientId,
          scope: "https://graph.microsoft.com/.default",
          client_secret: clientSecret,
          grant_type: "client_credentials",
        });

        console.log("Requesting application-level token for Microsoft Graph...");
        const tokenResponse = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("Failed to get application token:", errorText);
          return NextResponse.json({
            success: true,
            data: thread
          });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        console.log("Successfully obtained application-level token");
        console.log("Fetching email for user:", user.email);
        
        // Use the application-level token with the user's email
        // Try fetching as a message first (in case externalId is actually a message ID)
        let graphUrl = `https://graph.microsoft.com/v1.0/users/${user.email}/messages/${thread.externalId}?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,body,bodyPreview,hasAttachments`;
        
        let graphResponse = await fetch(graphUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // If that fails (404), try to search for messages in the conversation
        if (!graphResponse.ok && graphResponse.status === 404) {
          console.log("Message not found, searching conversation thread...");
          // Search for the conversation thread
          graphUrl = `https://graph.microsoft.com/v1.0/users/${user.email}/messages?$filter=conversationId eq '${thread.externalId}'&$top=1&$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,body,bodyPreview`;
          graphResponse = await fetch(graphUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (graphResponse.ok) {
            const searchData = await graphResponse.json();
            if (searchData.value && searchData.value.length > 0) {
              const firstMessage = searchData.value[0];
              // Now fetch the full message details
              graphUrl = `https://graph.microsoft.com/v1.0/users/${user.email}/messages/${firstMessage.id}?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,body,bodyPreview`;
              graphResponse = await fetch(graphUrl, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
            }
          }
        }

        if (graphResponse.ok) {
          const msg: any = await graphResponse.json();
          
          console.log("Successfully fetched message from Office 365:", msg.subject);
          console.log("Message body:", {
            hasBody: !!msg.body,
            bodyType: msg.body?.contentType,
            bodyContentLength: msg.body?.content?.length || 0,
            hasBodyPreview: !!msg.bodyPreview,
            hasAttachments: msg.hasAttachments,
          });
          
          // Fetch attachments if the message has them
          let attachments: any[] = [];
          if (msg.hasAttachments) {
            try {
              const attachmentsUrl = `https://graph.microsoft.com/v1.0/users/${user.email}/messages/${msg.id}/attachments`;
              const attachmentsResponse = await fetch(attachmentsUrl, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (attachmentsResponse.ok) {
                const attachmentsData = await attachmentsResponse.json();
                attachments = attachmentsData.value || [];
                console.log(`Found ${attachments.length} attachments`);
              }
            } catch (error) {
              console.error("Error fetching attachments:", error);
            }
          }
          
          // Convert to our message format
          let bodyText = '';
          let bodyHtml = '';
          
          if (msg.body && msg.body.content) {
            if (msg.body.contentType === 'text') {
              bodyText = msg.body.content;
            } else if (msg.body.contentType === 'html') {
              bodyHtml = msg.body.content;
            } else {
              // Default to HTML if content exists
              bodyHtml = msg.body.content;
            }
          }
          
          // Fallback to bodyPreview if no body content
          if (!bodyText && !bodyHtml && msg.bodyPreview) {
            bodyText = msg.bodyPreview;
          }
          
          const messageObj = {
            id: msg.id,
            subject: msg.subject || 'No Subject',
            fromEmail: msg.from?.emailAddress?.address || '',
            fromName: msg.from?.emailAddress?.name || '',
            toList: msg.toRecipients || [],
            ccList: msg.ccRecipients || [],
            bodyText: bodyText,
            bodyHtml: bodyHtml,
            receivedAt: msg.receivedDateTime,
            isRead: msg.isRead || false,
            attachments: attachments.map((att: any) => ({
              id: att.id,
              name: att.name,
              size: att.size,
              contentType: att.contentType,
              contentBytes: att.contentBytes,
            })),
          };
          
          // Add the message to the thread
          thread.messages = [messageObj] as any;
          thread.subject = msg.subject;
          
          console.log("Created message object:", {
            subject: messageObj.subject,
            fromEmail: messageObj.fromEmail,
            hasBodyText: !!messageObj.bodyText,
            bodyTextLength: messageObj.bodyText?.length || 0,
            hasBodyHtml: !!messageObj.bodyHtml,
            bodyHtmlLength: messageObj.bodyHtml?.length || 0,
          });
        } else {
          // Log the error response from Graph API
          const errorText = await graphResponse.text();
          console.error("Failed to fetch message from Office 365:");
          console.error("Status:", graphResponse.status, graphResponse.statusText);
          console.error("Error response:", errorText);
          
          if (graphResponse.status === 401) {
            console.error("Authentication failed - token expired and refresh failed");
          }
        }
      } catch (error: any) {
        console.error("Error fetching message from Office 365:", error);
      }
    }

    if (thread) {
      return NextResponse.json({
        success: true,
        data: thread
      });
    }

    // If not in database, return error
    return NextResponse.json(
      { error: "Email thread not found" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error fetching email thread:", error);
    return NextResponse.json(
      { error: "Failed to fetch email thread", details: error.message },
      { status: 500 }
    );
  }
}
