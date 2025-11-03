import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the lead with all related data
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: {
          select: { email: true },
        },
        assignee: {
          select: { email: true },
        },
        leadContacts: {
          select: { email: true },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Collect all email addresses to search for
    const emailAddresses = new Set<string>();
    
    // Add lead contacts emails
    lead.leadContacts.forEach(contact => {
      if (contact.email) {
        emailAddresses.add(contact.email.toLowerCase());
      }
    });
    
    // Add owner and assignee emails
    if (lead.owner?.email) {
      emailAddresses.add(lead.owner.email.toLowerCase());
    }
    if (lead.assignee?.email) {
      emailAddresses.add(lead.assignee.email.toLowerCase());
    }

    // Search for email threads that match any of these emails
    const emailThreads = await prisma.emailThread.findMany({
      where: {
        OR: [
          // Search by lead number in subject
          lead.leadNumber ? {
            subject: { contains: lead.leadNumber },
          } : {},
          // Search by email addresses in messages
          ...(emailAddresses.size > 0 ? [{
            messages: {
              some: {
                OR: [
                  { fromEmail: { in: Array.from(emailAddresses) } },
                  // Check if email is in toList, ccList, or bccList
                ],
              },
            },
          }] : []),
        ],
      },
      include: {
        messages: {
          take: 1,
          orderBy: { receivedAt: "desc" },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ 
      threads: emailThreads,
      leadTitle: lead.title,
      searchCriteria: {
        leadNumber: lead.leadNumber,
        emailAddresses: Array.from(emailAddresses),
      },
    });
  } catch (error: any) {
    console.error("Error searching emails for lead:", error);
    return NextResponse.json(
      { error: "Failed to search emails", details: error.message },
      { status: 500 }
    );
  }
}

