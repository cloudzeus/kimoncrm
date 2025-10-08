import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// PUT - Update a work position
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
    const { title, departmentId } = body;

    const position = await prisma.workPosition.update({
      where: { id: params.id },
      data: {
        title,
        departmentId
      }
    });

    return NextResponse.json({ position });
  } catch (error) {
    console.error("Error updating position:", error);
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a work position
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if position has assigned users
    const position = await prisma.workPosition.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    if (position._count.users > 0) {
      return NextResponse.json(
        { error: "Cannot delete position with assigned users" },
        { status: 400 }
      );
    }

    await prisma.workPosition.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting position:", error);
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 }
    );
  }
}
