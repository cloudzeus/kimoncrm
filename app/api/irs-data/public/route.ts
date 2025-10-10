import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Public endpoint to fetch IRS data for forms
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const irsData = await prisma.irsData.findMany({
      select: {
        name: true,
        code: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      irsData,
    });
  } catch (error) {
    console.error("Error fetching IRS data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch IRS data",
      },
      { status: 500 }
    );
  }
}

