import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createLeadContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
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

// GET all contacts for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const leadContacts = await prisma.leadContact.findMany({
      where: { leadId: id },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contacts: leadContacts });
  } catch (error: any) {
    console.error("Error fetching lead contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead contacts", details: error.message },
      { status: 500 }
    );
  }
}

// POST create a new lead contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = createLeadContactSchema.parse(body);

    // Verify the lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Convert empty strings to null
    const cleanedData = {
      ...validatedData,
      email: validatedData.email && validatedData.email !== "" ? validatedData.email : null,
      phone: validatedData.phone && validatedData.phone !== "" ? validatedData.phone : null,
      role: validatedData.role && validatedData.role !== "" ? validatedData.role : null,
      notes: validatedData.notes && validatedData.notes !== "" ? validatedData.notes : null,
      linkedContactId: validatedData.linkedContactId && validatedData.linkedContactId !== "" ? validatedData.linkedContactId : null,
      linkedCustomerId: validatedData.linkedCustomerId && validatedData.linkedCustomerId !== "" ? validatedData.linkedCustomerId : null,
      linkedSupplierId: validatedData.linkedSupplierId && validatedData.linkedSupplierId !== "" ? validatedData.linkedSupplierId : null,
      leadId: id,
    };

    const leadContact = await prisma.leadContact.create({
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

    return NextResponse.json(leadContact, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lead contact:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create lead contact", details: error.message },
      { status: 500 }
    );
  }
}

