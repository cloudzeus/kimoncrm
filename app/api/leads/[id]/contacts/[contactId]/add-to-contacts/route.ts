import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// POST add lead contact to main Contacts table
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, contactId } = await params;

    // Get the lead contact
    const leadContact = await prisma.leadContact.findFirst({
      where: {
        id: contactId,
        leadId: id,
      },
    });

    if (!leadContact) {
      return NextResponse.json({ error: "Lead contact not found" }, { status: 404 });
    }

    // Check if already linked to a main contact
    if (leadContact.linkedContactId) {
      return NextResponse.json(
        { error: "Contact is already linked to a main contact", contactId: leadContact.linkedContactId },
        { status: 400 }
      );
    }

    // Get the lead to access customer/company info
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedCompany: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Try to find existing contact by email
    let mainContact = null;
    if (leadContact.email) {
      mainContact = await prisma.contact.findFirst({
        where: { email: leadContact.email },
      });
    }

    // If contact already exists, just link them
    if (mainContact) {
      // Update the lead contact to link to existing contact
      const updatedLeadContact = await prisma.leadContact.update({
        where: { id: contactId },
        data: { linkedContactId: mainContact.id },
        include: {
          linkedContact: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Linked to existing contact",
        contact: mainContact,
        leadContact: updatedLeadContact,
      });
    }

    // Create new contact in the main Contacts table
    const newContact = await prisma.contact.create({
      data: {
        name: leadContact.name,
        email: leadContact.email || undefined,
        mobilePhone: leadContact.phone || undefined,
        notes: leadContact.notes || undefined,
        jobTitle: leadContact.role || undefined,
        // Link to company if available
        companyId: lead.assignedCompanyId || lead.customerId || undefined,
      },
    });

    // Link the lead contact to the new main contact
    const updatedLeadContact = await prisma.leadContact.update({
      where: { id: contactId },
      data: { linkedContactId: newContact.id },
      include: {
        linkedContact: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contact created in main Contacts table",
      contact: newContact,
      leadContact: updatedLeadContact,
    });
  } catch (error: any) {
    console.error("Error adding contact to main Contacts:", error);
    return NextResponse.json(
      { error: "Failed to add contact", details: error.message },
      { status: 500 }
    );
  }
}

