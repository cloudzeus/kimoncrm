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

    // Build search conditions
    const searchConditions: any[] = [];

    // 1. Direct lead ID match
    searchConditions.push({ leadId: id });

    // 2. Lead number in subject (case-insensitive)
    if (lead.leadNumber) {
      searchConditions.push({
        subject: { contains: lead.leadNumber, mode: "insensitive" },
      });
    }

    // 3. Search by email addresses in messages
    if (emailAddresses.size > 0) {
      const emailArray = Array.from(emailAddresses);
      
      searchConditions.push({
        messages: {
          some: {
            OR: [
              { fromEmail: { in: emailArray } },
              // Note: toList, ccList, bccList are JSON fields in Prisma
              // We need to search them differently
            ],
          },
        },
      });
    }

    console.log("Searching emails with criteria:", {
      leadId: id,
      leadNumber: lead.leadNumber,
      emailAddresses: Array.from(emailAddresses),
    });

    // Search for email threads
    const emailThreads = await prisma.emailThread.findMany({
      where: {
        OR: searchConditions.length > 0 ? searchConditions : [{ id: "none" }],
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

    console.log(`Found ${emailThreads.length} email threads for lead ${lead.leadNumber}`);

    return NextResponse.json({ 
      threads: emailThreads,
      leadTitle: lead.title,
      searchCriteria: {
        leadId: id,
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

