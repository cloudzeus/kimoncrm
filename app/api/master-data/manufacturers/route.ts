import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

const createManufacturerSchema = z.object({
  name: z.string().min(1),
  softoneCode: z.string().optional(),
  logoId: z.string().optional(),
});

const updateManufacturerSchema = createManufacturerSchema.partial();

// GET /api/master-data/manufacturers
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search ? {
      name: { contains: search },
    } : {};

    const manufacturers = await prisma.manufacturer.findMany({
      where,
      include: {
        logo: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ manufacturers });
  } catch (error) {
    console.error('Manufacturers GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch manufacturers" },
      { status: 500 }
    );
  }
}

// POST /api/master-data/manufacturers
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const data = createManufacturerSchema.parse(body);

    const manufacturer = await prisma.manufacturer.create({
      data,
      include: {
        logo: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json(manufacturer, { status: 201 });
  } catch (error) {
    console.error('Manufacturers POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create manufacturer" },
      { status: 500 }
    );
  }
}

// PUT /api/master-data/manufacturers
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { id, ...data } = updateManufacturerSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { message: "Manufacturer ID is required" },
        { status: 400 }
      );
    }

    const manufacturer = await prisma.manufacturer.update({
      where: { id },
      data,
      include: {
        logo: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json(manufacturer);
  } catch (error) {
    console.error('Manufacturers PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update manufacturer" },
      { status: 500 }
    );
  }
}

// DELETE /api/master-data/manufacturers
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "Manufacturer ID is required" },
        { status: 400 }
      );
    }

    await prisma.manufacturer.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Manufacturer deleted successfully" });
  } catch (error) {
    console.error('Manufacturers DELETE error:', error);
    return NextResponse.json(
      { message: "Failed to delete manufacturer" },
      { status: 500 }
    );
  }
}
