import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { createMicrosoftGraphClient } from "@/lib/microsoft/graph";

/**
 * GET /api/contacts/[id]/emails
 * Get all email threads associated with a contact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Search for email threads by contactId or by matching email in messages
    let emailThreads = await prisma.emailThread.findMany({
      where: {
        contactId: id,
      },
      include: {
        messages: {
          orderBy: {
            receivedAt: 'desc',
          },
          take: 10, // Get the latest 10 messages per thread
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        lead: {
          select: {
            id: true,
            title: true,
          },
        },
        support: {
          select: {
            id: true,
            subject: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    // If no threads found by contactId, try to find by matching email
    if (emailThreads.length === 0 && contact.email) {
      // Find messages that match the contact's email
      const matchingMessages = await prisma.emailMessage.findMany({
        where: {
          OR: [
            { fromEmail: contact.email },
            // Check if email is in toList, ccList, or bccList (JSON fields)
          ],
        },
        select: {
          threadId: true,
        },
        take: 100,
      });

      const uniqueThreadIds = [...new Set(matchingMessages.map(m => m.threadId))];

      if (uniqueThreadIds.length > 0) {
        emailThreads = await prisma.emailThread.findMany({
          where: {
            id: { in: uniqueThreadIds },
          },
          include: {
            messages: {
              orderBy: {
                receivedAt: 'desc',
              },
              take: 10,
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            lead: {
              select: {
                id: true,
                title: true,
              },
            },
            support: {
              select: {
                id: true,
                subject: true,
              },
            },
          },
          orderBy: {
            lastMessageAt: 'desc',
          },
        });
      }

      // If still no results, try fetching from Office 365
      if (emailThreads.length === 0) {
        try {
          // Get the user's Microsoft account to fetch access token
          const account = await prisma.account.findFirst({
            where: {
              userId: session.user.id,
              provider: "microsoft-entra-id",
            },
            select: {
              access_token: true,
            },
          });

          if (account?.access_token) {
            console.log(`Attempting to fetch emails for contact: ${contact.email}`);
            
            // Use Microsoft Graph API to search for emails from/to this contact
            const graphClient = await createMicrosoftGraphClient(account.access_token);
            
            // Try using Microsoft Graph search API instead of filter
            // First, get all recent emails and filter client-side
            console.log("Fetching recent emails from inbox...");
            const emails = await graphClient.getEmails('inbox', 100, 0);
            
            console.log(`Found ${emails.messages?.length || 0} messages in inbox`);
            
            if (emails.messages && emails.messages.length > 0) {
              // Filter emails where the contact's email appears in from/to/cc
              const contactEmailLower = contact.email.toLowerCase();
              const matchingMessages = emails.messages.filter((msg: any) => {
                const fromEmail = msg.from?.emailAddress?.address?.toLowerCase() || '';
                const toEmails = msg.toRecipients?.map((r: any) => r.emailAddress?.address?.toLowerCase()) || [];
                const ccEmails = msg.ccRecipients?.map((r: any) => r.emailAddress?.address?.toLowerCase()) || [];
                
                return fromEmail === contactEmailLower || 
                       toEmails.includes(contactEmailLower) || 
                       ccEmails.includes(contactEmailLower);
              });
              
              console.log(`Found ${matchingMessages.length} messages matching contact email`);
              
              if (matchingMessages.length > 0) {
              // Convert Microsoft emails to our format
              const convertedThreads = matchingMessages.slice(0, 10).map((msg: any) => {
                console.log("Processing message:", msg.subject, "from:", msg.from?.emailAddress?.address);
                return {
                  id: msg.id || `temp-${Date.now()}-${Math.random()}`,
                  subject: msg.subject,
                  messageCount: 1,
                  lastMessageAt: msg.receivedDateTime,
                  messages: [{
                    id: msg.id || `temp-msg-${Date.now()}`,
                    subject: msg.subject,
                    fromEmail: msg.from?.emailAddress?.address || '',
                    fromName: msg.from?.emailAddress?.name,
                    toList: msg.toRecipients || [],
                    ccList: msg.ccRecipients || [],
                    bodyText: msg.bodyPreview || msg.body?.content || '',
                    bodyHtml: msg.body?.content,
                    receivedAt: msg.receivedDateTime,
                    isRead: msg.isRead,
                  }],
                };
              });

                             // Return the converted threads
              return NextResponse.json({
                success: true,
                data: convertedThreads,
                source: 'office365',
              });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching from Office 365:", error);
          console.error("Full error details:", error instanceof Error ? error.message : String(error));
          // Continue and return empty results
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: emailThreads,
    });
  } catch (error: any) {
    console.error("Error fetching contact emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact emails", details: error.message },
      { status: 500 }
    );
  }
}
