import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

const createCountrySchema = z.object({
  iso2: z.string().length(2),
  name: z.string().min(1),
  softoneCode: z.string().optional(),
});

const updateCountrySchema = createCountrySchema.partial();

// GET /api/master-data/countries
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { iso2: { contains: search } },
      ],
    } : {};

    const countries = await prisma.country.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ countries });
  } catch (error) {
    console.error('Countries GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}

// POST /api/master-data/countries
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const data = createCountrySchema.parse(body);

    const country = await prisma.country.create({
      data,
    });

    return NextResponse.json(country, { status: 201 });
  } catch (error) {
    console.error('Countries POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create country" },
      { status: 500 }
    );
  }
}

// PUT /api/master-data/countries
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { id, ...data } = updateCountrySchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { message: "Country ID is required" },
        { status: 400 }
      );
    }

    const country = await prisma.country.update({
      where: { id },
      data,
    });

    return NextResponse.json(country);
  } catch (error) {
    console.error('Countries PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update country" },
      { status: 500 }
    );
  }
}

// DELETE /api/master-data/countries
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "Country ID is required" },
        { status: 400 }
      );
    }

    await prisma.country.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Country deleted successfully" });
  } catch (error) {
    console.error('Countries DELETE error:', error);
    return NextResponse.json(
      { message: "Failed to delete country" },
      { status: 500 }
    );
  }
}
