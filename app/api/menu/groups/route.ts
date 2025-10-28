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
    const session = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const includeItems = searchParams.get('includeItems') === 'true';
    const role = searchParams.get('role') || session.user.role;
    const departmentId = searchParams.get('departmentId');

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

    // Filter menu items based on permissions
    if (includeItems && menuGroups) {
      const filteredGroups = menuGroups.map((group: any) => ({
        ...group,
        items: group.items
          .filter((item: any) => {
            // ADMIN users can see everything
            if (role === 'ADMIN') return true;
            
            // Check if user has permission to view this item
            const permission = item.permissions.find((p: any) => {
              // For this permission entry:
              // - If p.role exists, it must match user's role
              // - If p.departmentId exists, user must be in that department
              // - If both null, this is a universal permission
              
              // Check role match
              const roleMatch = !p.role || p.role === role;
              
              // Check department match
              // If permission specifies a department, user must be in that department
              // If no department in permission, it applies to all departments
              const departmentMatch = !p.departmentId || p.departmentId === departmentId;
              
              return p.canView && roleMatch && departmentMatch;
            });
            
            // If no specific permission set, default to allowed
            if (item.permissions.length === 0) return true;
            
            // Must have a matching permission
            return !!permission;
          })
          .map((item: any) => ({
            ...item,
            children: item.children
              .filter((child: any) => {
                // ADMIN users can see everything
                if (role === 'ADMIN') return true;
                
                const childPermission = child.permissions.find((p: any) => {
                  const roleMatch = !p.role || p.role === role;
                  const departmentMatch = !p.departmentId || p.departmentId === departmentId;
                  return p.canView && roleMatch && departmentMatch;
                });
                if (child.permissions.length === 0) return true;
                return !!childPermission;
              })
          }))
      })).filter((group: any) => group.items.length > 0); // Remove groups with no visible items

      return NextResponse.json({ menuGroups: filteredGroups });
    }

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
        { message: "Invalid data", errors: error.issues },
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
      console.error('[MenuGroups PUT] Zod validation failed:', error.issues);
    } else {
      console.error('Menu Groups PUT error:', error);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
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

