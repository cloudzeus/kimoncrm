import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// GET - Fetch all supported languages
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const languages = await prisma.supportedLanguage.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" }
      ]
    });

    return NextResponse.json({ languages });
  } catch (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json(
      { error: "Failed to fetch languages" },
      { status: 500 }
    );
  }
}

// POST - Create a new supported language
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, nativeName, flag, isActive, isDefault, sortOrder } = body;

    // If this is being set as default, unset any existing default
    if (isDefault) {
      await prisma.supportedLanguage.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const language = await prisma.supportedLanguage.create({
      data: {
        code,
        name,
        nativeName,
        flag,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        sortOrder: sortOrder ?? 0
      }
    });

    return NextResponse.json({ language }, { status: 201 });
  } catch (error) {
    console.error("Error creating language:", error);
    return NextResponse.json(
      { error: "Failed to create language" },
      { status: 500 }
    );
  }
}
