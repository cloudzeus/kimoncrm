import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for Currency
const currencySchema = z.object({
  socurrency: z.string().min(1, "SoftOne Currency code is required"),
  shortcut: z.string().min(1, "Shortcut is required"),
  name: z.string().min(1, "Name is required"),
  intercode: z.string().min(1, "International code is required"),
  symbol: z.string().optional().nullable(),
});

// GET /api/currencies - Get all currencies
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const currencies = await prisma.currency.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      currencies,
      total: currencies.length
    });

  } catch (error) {
    console.error('Currencies fetch error:', error);
    return NextResponse.json(
      { message: "Failed to fetch currencies", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/currencies - Create new currency
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = currencySchema.parse(body);

    const currency = await prisma.currency.create({
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      currency
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Currency create error:', error);
    return NextResponse.json(
      { message: "Failed to create currency", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/currencies - Update currency
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    const validatedData = currencySchema.partial().parse(data);

    const currency = await prisma.currency.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      currency
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Currency update error:', error);
    return NextResponse.json(
      { message: "Failed to update currency", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/currencies - Delete currency
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    await prisma.currency.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Currency deleted successfully"
    });

  } catch (error) {
    console.error('Currency delete error:', error);
    return NextResponse.json(
      { message: "Failed to delete currency", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
