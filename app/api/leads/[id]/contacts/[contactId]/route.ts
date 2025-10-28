import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateLeadContactSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.preprocess(
    (val) => val === "" ? undefined : val,
    z.string().email().optional().nullable()
  ),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  linkedContactId: z.string().optional().nullable(),
  linkedCustomerId: z.string().optional().nullable(),
  linkedSupplierId: z.string().optional().nullable(),
});

// PATCH update a lead contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, contactId } = await params;
    const body = await request.json();
    const validatedData = updateLeadContactSchema.parse(body);

    // Verify the lead contact exists and belongs to the lead
    const existingContact = await prisma.leadContact.findFirst({
      where: {
        id: contactId,
        leadId: id,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Lead contact not found" }, { status: 404 });
    }

    // Convert empty strings to null
    const cleanedData: any = {};
    if (validatedData.name !== undefined) {
      cleanedData.name = validatedData.name;
    }
    if (validatedData.email !== undefined) {
      cleanedData.email = validatedData.email && validatedData.email !== "" ? validatedData.email : null;
    }
    if (validatedData.phone !== undefined) {
      cleanedData.phone = validatedData.phone && validatedData.phone !== "" ? validatedData.phone : null;
    }
    if (validatedData.role !== undefined) {
      cleanedData.role = validatedData.role && validatedData.role !== "" ? validatedData.role : null;
    }
    if (validatedData.notes !== undefined) {
      cleanedData.notes = validatedData.notes && validatedData.notes !== "" ? validatedData.notes : null;
    }
    if (validatedData.linkedContactId !== undefined) {
      cleanedData.linkedContactId = validatedData.linkedContactId && validatedData.linkedContactId !== "" ? validatedData.linkedContactId : null;
    }
    if (validatedData.linkedCustomerId !== undefined) {
      cleanedData.linkedCustomerId = validatedData.linkedCustomerId && validatedData.linkedCustomerId !== "" ? validatedData.linkedCustomerId : null;
    }
    if (validatedData.linkedSupplierId !== undefined) {
      cleanedData.linkedSupplierId = validatedData.linkedSupplierId && validatedData.linkedSupplierId !== "" ? validatedData.linkedSupplierId : null;
    }

    const leadContact = await prisma.leadContact.update({
      where: { id: contactId },
      data: cleanedData,
      include: {
        linkedContact: {
          select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            workPhone: true,
          },
        },
        linkedCustomer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone01: true,
          },
        },
        linkedSupplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone01: true,
          },
        },
      },
    });

    return NextResponse.json(leadContact);
  } catch (error: any) {
    console.error("Error updating lead contact:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update lead contact", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE a lead contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, contactId } = await params;

    // Verify the lead contact exists and belongs to the lead
    const existingContact = await prisma.leadContact.findFirst({
      where: {
        id: contactId,
        leadId: id,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Lead contact not found" }, { status: 404 });
    }

    await prisma.leadContact.delete({
      where: { id: contactId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead contact:", error);
    return NextResponse.json(
      { error: "Failed to delete lead contact", details: error.message },
      { status: 500 }
    );
  }
}

