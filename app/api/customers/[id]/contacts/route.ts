import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET contacts for a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;

    // Find all contacts associated with this customer
    const contactRelations = await prisma.contactCustomer.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        contact: true,
      },
    });

    const contacts = contactRelations.map((rel) => rel.contact);

    return NextResponse.json({ data: contacts });
  } catch (error) {
    console.error("Error fetching customer contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

