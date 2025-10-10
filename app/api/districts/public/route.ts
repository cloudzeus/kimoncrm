import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Public endpoint to fetch districts for forms
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const districts = await prisma.district.findMany({
      select: {
        name: true,
        code: true,
        countrySoftone: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      districts,
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch districts",
      },
      { status: 500 }
    );
  }
}

