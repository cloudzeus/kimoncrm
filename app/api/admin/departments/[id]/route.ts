import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// PUT - Update a department
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, emailGroup, parentId, managerId } = body;

    const department = await prisma.department.update({
      where: { id: params.id },
      data: {
        name,
        emailGroup: emailGroup || null,
        parentId: parentId || null,
        managerId: managerId || null
      }
    });

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a department
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if department has users or children
    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            children: true
          }
        }
      }
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    if (department._count.users > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with assigned users" },
        { status: 400 }
      );
    }

    if (department._count.children > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with sub-departments" },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
