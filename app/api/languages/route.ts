import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET - Public endpoint to fetch active languages for the language switcher
export async function GET() {
  try {
    const languages = await prisma.supportedLanguage.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      select: {
        code: true,
        name: true,
        nativeName: true,
        flag: true,
        isDefault: true,
      },
    });

    return NextResponse.json({ languages });
  } catch (error) {
    console.error("Error fetching active languages:", error);
    return NextResponse.json(
      { error: "Failed to fetch languages" },
      { status: 500 }
    );
  }
}


