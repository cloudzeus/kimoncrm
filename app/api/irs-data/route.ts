import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for IrsData
const irsDataSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
});

// GET /api/irs-data - Get all IRS data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const irsData = await prisma.irsData.findMany({
      orderBy: { code: 'asc' }
    });

    return NextResponse.json({
      success: true,
      irsData,
      total: irsData.length
    });

  } catch (error) {
    console.error('IRS Data fetch error:', error);
    return NextResponse.json(
      { message: "Failed to fetch IRS data", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/irs-data - Create new IRS data
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
    const validatedData = irsDataSchema.parse(body);

    const irsData = await prisma.irsData.create({
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      irsData
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('IRS Data create error:', error);
    return NextResponse.json(
      { message: "Failed to create IRS data", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/irs-data - Update IRS data
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

    const validatedData = irsDataSchema.partial().parse(data);

    const irsData = await prisma.irsData.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      irsData
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('IRS Data update error:', error);
    return NextResponse.json(
      { message: "Failed to update IRS data", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/irs-data - Delete IRS data
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

    await prisma.irsData.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "IRS data deleted successfully"
    });

  } catch (error) {
    console.error('IRS Data delete error:', error);
    return NextResponse.json(
      { message: "Failed to delete IRS data", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
