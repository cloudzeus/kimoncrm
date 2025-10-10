import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Public endpoint to fetch countries for forms
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const countries = await prisma.country.findMany({
      where: {
        isActive: true,
      },
      select: {
        softoneCode: true,
        name: true,
        iso2: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      countries,
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch countries",
      },
      { status: 500 }
    );
  }
}

