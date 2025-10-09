import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

const createMenuItemSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  parentId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "Key is required"),
  path: z.string().optional(),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
  isExternal: z.boolean().default(false),
  permissions: z.array(z.object({
    role: z.string(),
    canView: z.boolean().default(true),
    canEdit: z.boolean().default(false),
  })).optional(),
});

const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  id: z.string().min(1, "ID is required"),
});

// GET /api/menu/items
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const role = searchParams.get('role');

    const where: any = { isActive: true };
    if (groupId) where.groupId = groupId;

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        group: true,
        parent: true,
        children: {
          where: { isActive: true },
          include: { permissions: true },
          orderBy: { order: 'asc' },
        },
        permissions: true,
      },
      orderBy: { order: 'asc' },
    });

    // Filter by role if provided
    let filteredItems = menuItems;
    if (role) {
      filteredItems = menuItems.filter(item => {
        const permission = item.permissions.find(p => p.role === role);
        return permission?.canView ?? true; // Default to true if no permission set
      });
    }

    return NextResponse.json({ menuItems: filteredItems });
  } catch (error) {
    console.error('Menu Items GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

// POST /api/menu/items
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { permissions, ...data } = createMenuItemSchema.parse(body);

    const menuItem = await prisma.menuItem.create({
      data: {
        ...data,
        permissions: permissions ? {
          create: permissions.map(p => ({
            role: p.role,
            canView: p.canView,
            canEdit: p.canEdit,
          })),
        } : undefined,
      },
      include: {
        group: true,
        parent: true,
        children: true,
        permissions: true,
      },
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error('Menu Items POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

// PUT /api/menu/items
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    console.debug('[MenuItems PUT] Incoming body:', body);
    const { id, permissions, ...data } = updateMenuItemSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { message: "Menu Item ID is required" },
        { status: 400 }
      );
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        permissions: permissions ? {
          deleteMany: {},
          create: permissions.map(p => ({
            role: p.role,
            canView: p.canView,
            canEdit: p.canEdit,
          })),
        } : undefined,
      },
      include: {
        group: true,
        parent: true,
        children: true,
        permissions: true,
      },
    });

    return NextResponse.json(menuItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[MenuItems PUT] Zod validation failed:', error.issues);
      console.error('[MenuItems PUT] Validation schema:', updateMenuItemSchema.shape);
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    } else {
      console.error('Menu Items PUT error:', error);
      return NextResponse.json(
        { message: "Failed to update menu item", error: error.message },
        { status: 500 }
      );
    }
  }
}

// DELETE /api/menu/items
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "Menu Item ID is required" },
        { status: 400 }
      );
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error('Menu Items DELETE error:', error);
    return NextResponse.json(
      { message: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}

