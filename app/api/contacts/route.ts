import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/contacts - List all contacts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const customerId = searchParams.get("customerId");
    const supplierId = searchParams.get("supplierId");
    const projectId = searchParams.get("projectId");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { mobilePhone: { contains: search } },
        { workPhone: { contains: search } },
        { homePhone: { contains: search } },
        { city: { contains: search } },
      ];
    }

    // Filter by relationships
    if (customerId) {
      where.customers = {
        some: {
          customerId: customerId,
        },
      };
    }

    if (supplierId) {
      where.suppliers = {
        some: {
          supplierId: supplierId,
        },
      };
    }

    if (projectId) {
      where.contactProjects = {
        some: {
          projectId: projectId,
        },
      };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

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

    // Create contact with relationships
    const contact = await prisma.contact.create({
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
        // Create relationships
        customers: customerIds?.length
          ? {
              create: customerIds.map((customerId: string) => ({
                customerId,
              })),
            }
          : undefined,
        suppliers: supplierIds?.length
          ? {
              create: supplierIds.map((supplierId: string) => ({
                supplierId,
              })),
            }
          : undefined,
        contactProjects: projectIds?.length
          ? {
              create: projectIds.map((projectId: string) => ({
                projectId,
              })),
            }
          : undefined,
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

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact", details: error.message },
      { status: 500 }
    );
  }
}

