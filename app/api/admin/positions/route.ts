import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// GET - Fetch all work positions
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const positions = await prisma.workPosition.findMany({
      include: {
        department: { select: { id: true, name: true } },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { title: "asc" }
    });

    return NextResponse.json({ positions });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

// POST - Create a new work position
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, departmentId } = body;

    const position = await prisma.workPosition.create({
      data: {
        title,
        departmentId
      }
    });

    return NextResponse.json({ position }, { status: 201 });
  } catch (error) {
    console.error("Error creating position:", error);
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
