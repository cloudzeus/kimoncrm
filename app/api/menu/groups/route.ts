import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

const createMenuGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "Key is required"),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  order: z.number().default(0),
  isCollapsible: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

// For updates we need to accept partial fields BUT require id
const updateMenuGroupSchema = createMenuGroupSchema
  .extend({ id: z.string() })
  .partial()
  .extend({ id: z.string() });

// GET /api/menu/groups
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const includeItems = searchParams.get('includeItems') === 'true';

    const menuGroups = await prisma.menuGroup.findMany({
      where: { isActive: true },
      include: includeItems ? {
        items: {
          where: { isActive: true },
          include: {
            permissions: true,
            children: {
              where: { isActive: true },
              include: { permissions: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      } : undefined,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ menuGroups });
  } catch (error) {
    console.error('Menu Groups GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch menu groups" },
      { status: 500 }
    );
  }
}

// POST /api/menu/groups
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const data = createMenuGroupSchema.parse(body);

    const menuGroup = await prisma.menuGroup.create({
      data,
    });

    return NextResponse.json(menuGroup, { status: 201 });
  } catch (error) {
    console.error('Menu Groups POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create menu group" },
      { status: 500 }
    );
  }
}

// PUT /api/menu/groups
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    console.debug('[MenuGroups PUT] Incoming body:', body);
    const { id, ...data } = updateMenuGroupSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { message: "Menu Group ID is required" },
        { status: 400 }
      );
    }

    const menuGroup = await prisma.menuGroup.update({
      where: { id },
      data,
    });

    return NextResponse.json(menuGroup);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[MenuGroups PUT] Zod validation failed:', error.errors);
    } else {
      console.error('Menu Groups PUT error:', error);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update menu group" },
      { status: 500 }
    );
  }
}

// DELETE /api/menu/groups
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "Menu Group ID is required" },
        { status: 400 }
      );
    }

    await prisma.menuGroup.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Menu group deleted successfully" });
  } catch (error) {
    console.error('Menu Groups DELETE error:', error);
    return NextResponse.json(
      { message: "Failed to delete menu group" },
      { status: 500 }
    );
  }
}

