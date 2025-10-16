import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for PaymentType
const paymentTypeSchema = z.object({
  payment: z.string().min(1, "Payment code is required"),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  sodtype: z.string().min(1, "SOD type is required"),
});

// GET /api/payment-types - Get all payment types
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const paymentTypes = await prisma.paymentType.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      paymentTypes,
      total: paymentTypes.length
    });

  } catch (error) {
    console.error('Payment Types fetch error:', error);
    return NextResponse.json(
      { message: "Failed to fetch payment types", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/payment-types - Create new payment type
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
    const validatedData = paymentTypeSchema.parse(body);

    const paymentType = await prisma.paymentType.create({
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      paymentType
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Payment Type create error:', error);
    return NextResponse.json(
      { message: "Failed to create payment type", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/payment-types - Update payment type
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

    const validatedData = paymentTypeSchema.partial().parse(data);

    const paymentType = await prisma.paymentType.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      paymentType
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Payment Type update error:', error);
    return NextResponse.json(
      { message: "Failed to update payment type", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-types - Delete payment type
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

    await prisma.paymentType.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Payment type deleted successfully"
    });

  } catch (error) {
    console.error('Payment Type delete error:', error);
    return NextResponse.json(
      { message: "Failed to delete payment type", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}





