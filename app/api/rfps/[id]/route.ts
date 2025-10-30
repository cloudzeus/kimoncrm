import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

/**
 * GET - Fetch RFP by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const rfp = await prisma.rFP.findUnique({
      where: { id },
      include: {
        customer: true,
        contact: true,
        lead: true,
        assignee: true,
        quotes: true,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    return NextResponse.json(rfp);
  } catch (error) {
    console.error("Error fetching RFP:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFP" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update RFP pricing data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { equipment } = body;

    // Get existing RFP
    const rfp = await prisma.rFP.findUnique({
      where: { id },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // Calculate new totals
    const products = equipment.filter((item: any) => item.type === 'product');
    const services = equipment.filter((item: any) => item.type === 'service');

    const productsSubtotal = products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
    const productsMargin = products.reduce((sum: number, p: any) => {
      const basePrice = p.price * p.quantity;
      return sum + (basePrice * ((p.margin || 0) / 100));
    }, 0);
    const productsTotal = productsSubtotal + productsMargin;

    const servicesSubtotal = services.reduce((sum: number, s: any) => sum + (s.price * s.quantity), 0);
    const servicesMargin = services.reduce((sum: number, s: any) => {
      const basePrice = s.price * s.quantity;
      return sum + (basePrice * ((s.margin || 0) / 100));
    }, 0);
    const servicesTotal = servicesSubtotal + servicesMargin;

    const grandTotal = productsTotal + servicesTotal;

    // Update RFP with new equipment data
    const oldRequirements = rfp.requirements as any || {};
    const updatedRFP = await prisma.rFP.update({
      where: { id },
      data: {
        requirements: {
          ...oldRequirements,
          equipment: equipment.map((item: any) => ({
            id: item.id,
            type: item.type,
            name: item.name,
            brand: item.brand,
            category: item.category,
            quantity: item.quantity,
            price: item.price,
            margin: item.margin || 0,
            totalPrice: item.totalPrice,
            notes: item.notes,
            infrastructureElement: item.infrastructureElement,
            manufacturerCode: item.manufacturerCode,
            eanCode: item.eanCode,
          })),
          totals: {
            productsSubtotal,
            productsMargin,
            productsTotal,
            servicesSubtotal,
            servicesMargin,
            servicesTotal,
            grandTotal,
          },
          lastUpdatedAt: new Date().toISOString(),
          lastUpdatedBy: session.user.email,
        } as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "RFP updated successfully",
      rfp: updatedRFP,
    });
  } catch (error) {
    console.error("Error updating RFP:", error);
    return NextResponse.json(
      { 
        error: "Failed to update RFP",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

