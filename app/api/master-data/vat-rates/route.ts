import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

const createVatRateSchema = z.object({
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
  softoneCode: z.string().optional(),
});

const updateVatRateSchema = createVatRateSchema.partial();

// GET /api/master-data/vat-rates
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search ? {
      name: { contains: search },
    } : {};

    const vatRates = await prisma.vatRate.findMany({
      where,
      orderBy: { rate: 'asc' },
    });

    return NextResponse.json({ vatRates });
  } catch (error) {
    console.error('VAT Rates GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch VAT rates" },
      { status: 500 }
    );
  }
}

// POST /api/master-data/vat-rates
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const data = createVatRateSchema.parse(body);

    const vatRate = await prisma.vatRate.create({
      data,
    });

    return NextResponse.json(vatRate, { status: 201 });
  } catch (error) {
    console.error('VAT Rates POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create VAT rate" },
      { status: 500 }
    );
  }
}

// PUT /api/master-data/vat-rates
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { id, ...data } = updateVatRateSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { message: "VAT Rate ID is required" },
        { status: 400 }
      );
    }

    const vatRate = await prisma.vatRate.update({
      where: { id },
      data,
    });

    return NextResponse.json(vatRate);
  } catch (error) {
    console.error('VAT Rates PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update VAT rate" },
      { status: 500 }
    );
  }
}

// DELETE /api/master-data/vat-rates
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "VAT Rate ID is required" },
        { status: 400 }
      );
    }

    await prisma.vatRate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "VAT Rate deleted successfully" });
  } catch (error) {
    console.error('VAT Rates DELETE error:', error);
    return NextResponse.json(
      { message: "Failed to delete VAT rate" },
      { status: 500 }
    );
  }
}
