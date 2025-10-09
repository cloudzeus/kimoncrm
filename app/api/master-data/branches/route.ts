import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

const createBranchSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

const updateBranchSchema = createBranchSchema.partial();

// GET /api/master-data/branches
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { code: { contains: search } },
        { address: { contains: search } },
      ],
    } : {};

    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            stock: true,
            orders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('Branches GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

// POST /api/master-data/branches
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const data = createBranchSchema.parse(body);

    const branch = await prisma.branch.create({
      data: {
        ...data,
        email: data.email || undefined,
      },
      include: {
        _count: {
          select: {
            users: true,
            stock: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('Branches POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create branch" },
      { status: 500 }
    );
  }
}

// PUT /api/master-data/branches
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { id, ...data } = updateBranchSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { message: "Branch ID is required" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...data,
        email: data.email || undefined,
      },
      include: {
        _count: {
          select: {
            users: true,
            stock: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Branches PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update branch" },
      { status: 500 }
    );
  }
}

// DELETE /api/master-data/branches
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "Branch ID is required" },
        { status: 400 }
      );
    }

    await prisma.branch.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error('Branches DELETE error:', error);
    return NextResponse.json(
      { message: "Failed to delete branch" },
      { status: 500 }
    );
  }
}
