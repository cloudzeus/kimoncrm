import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/contacts/[id] - Get contact by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        country: true,
        customers: {
          include: {
            customer: true,
          },
        },
        suppliers: {
          include: {
            supplier: true,
          },
        },
        contactProjects: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/contacts/[id] - Update contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      name,
      mobilePhone,
      homePhone,
      workPhone,
      address,
      city,
      zip,
      countryId,
      email,
      notes,
      customerIds,
      supplierIds,
      projectIds,
    } = body;

    // Validate countryId if provided
    let validCountryId = null;
    if (countryId && countryId !== "" && countryId !== "undefined" && countryId !== "null") {
      // Check if country exists
      const countryExists = await prisma.country.findUnique({
        where: { id: countryId },
      });
      
      if (countryExists) {
        validCountryId = countryId;
      } else {
        console.warn(`Invalid countryId provided: ${countryId} - setting to null`);
      }
    }

    // Update contact and manage relationships
    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        title: title || null,
        name,
        mobilePhone: mobilePhone || null,
        homePhone: homePhone || null,
        workPhone: workPhone || null,
        address: address || null,
        city: city || null,
        zip: zip || null,
        countryId: validCountryId,
        email: email || null,
        notes: notes || null,
      },
      include: {
        country: true,
        customers: {
          include: {
            customer: true,
          },
        },
        suppliers: {
          include: {
            supplier: true,
          },
        },
        contactProjects: {
          include: {
            project: true,
          },
        },
      },
    });

    // Handle customer relationships if provided
    if (customerIds !== undefined) {
      // Delete existing relationships
      await prisma.contactCustomer.deleteMany({
        where: { contactId: params.id },
      });

      // Create new relationships
      if (customerIds.length > 0) {
        await prisma.contactCustomer.createMany({
          data: customerIds.map((customerId: string) => ({
            contactId: params.id,
            customerId,
          })),
        });
      }
    }

    // Handle supplier relationships if provided
    if (supplierIds !== undefined) {
      // Delete existing relationships
      await prisma.contactSupplier.deleteMany({
        where: { contactId: params.id },
      });

      // Create new relationships
      if (supplierIds.length > 0) {
        await prisma.contactSupplier.createMany({
          data: supplierIds.map((supplierId: string) => ({
            contactId: params.id,
            supplierId,
          })),
        });
      }
    }

    // Handle project relationships if provided
    if (projectIds !== undefined) {
      // Delete existing relationships
      await prisma.contactProject.deleteMany({
        where: { contactId: params.id },
      });

      // Create new relationships
      if (projectIds.length > 0) {
        await prisma.contactProject.createMany({
          data: projectIds.map((projectId: string) => ({
            contactId: params.id,
            projectId,
          })),
        });
      }
    }

    // Fetch updated contact with all relationships
    const updatedContact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        country: true,
        customers: {
          include: {
            customer: true,
          },
        },
        suppliers: {
          include: {
            supplier: true,
          },
        },
        contactProjects: {
          include: {
            project: true,
          },
        },
      },
    });

    return NextResponse.json(updatedContact);
  } catch (error: any) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact", details: error.message },
      { status: 500 }
    );
  }
}

