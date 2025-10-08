import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// GET - Fetch all departments
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        _count: {
          select: {
            users: true,
            children: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

// POST - Create a new department
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, emailGroup, parentId, managerId } = body;

    const department = await prisma.department.create({
      data: {
        name,
        emailGroup: emailGroup || null,
        parentId: parentId || null,
        managerId: managerId || null
      }
    });

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
