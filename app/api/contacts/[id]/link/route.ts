import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// POST /api/contacts/[id]/link - Link contact to customer/supplier/project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, entityId } = body;

    if (!type || !entityId) {
      return NextResponse.json(
        { error: "Type and entityId are required" },
        { status: 400 }
      );
    }

    const contactId = params.id;

    // Validate contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    switch (type) {
      case "customer":
        // Check if already linked
        const existingCustomerLink = await prisma.contactCustomer.findFirst({
          where: { contactId, customerId: entityId },
        });

        if (existingCustomerLink) {
          return NextResponse.json(
            { error: "Contact already linked to this customer" },
            { status: 400 }
          );
        }

        await prisma.contactCustomer.create({
          data: {
            contactId,
            customerId: entityId,
          },
        });
        break;

      case "supplier":
        // Check if already linked
        const existingSupplierLink = await prisma.contactSupplier.findFirst({
          where: { contactId, supplierId: entityId },
        });

        if (existingSupplierLink) {
          return NextResponse.json(
            { error: "Contact already linked to this supplier" },
            { status: 400 }
          );
        }

        await prisma.contactSupplier.create({
          data: {
            contactId,
            supplierId: entityId,
          },
        });
        break;

      case "project":
        // Check if already linked
        const existingProjectLink = await prisma.contactProject.findFirst({
          where: { contactId, projectId: entityId },
        });

        if (existingProjectLink) {
          return NextResponse.json(
            { error: "Contact already linked to this project" },
            { status: 400 }
          );
        }

        await prisma.contactProject.create({
          data: {
            contactId,
            projectId: entityId,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type. Must be customer, supplier, or project" },
          { status: 400 }
        );
    }

    return NextResponse.json({ message: "Contact linked successfully" });
  } catch (error: any) {
    console.error("Error linking contact:", error);
    return NextResponse.json(
      { error: "Failed to link contact", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id]/link - Unlink contact from customer/supplier/project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const entityId = searchParams.get("entityId");

    if (!type || !entityId) {
      return NextResponse.json(
        { error: "Type and entityId are required" },
        { status: 400 }
      );
    }

    const contactId = params.id;

    switch (type) {
      case "customer":
        await prisma.contactCustomer.deleteMany({
          where: { contactId, customerId: entityId },
        });
        break;

      case "supplier":
        await prisma.contactSupplier.deleteMany({
          where: { contactId, supplierId: entityId },
        });
        break;

      case "project":
        await prisma.contactProject.deleteMany({
          where: { contactId, projectId: entityId },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type. Must be customer, supplier, or project" },
          { status: 400 }
        );
    }

    return NextResponse.json({ message: "Contact unlinked successfully" });
  } catch (error: any) {
    console.error("Error unlinking contact:", error);
    return NextResponse.json(
      { error: "Failed to unlink contact", details: error.message },
      { status: 500 }
    );
  }
}


