import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const sodtype = searchParams.get('sodtype');

    const where = sodtype ? { sodtype: parseInt(sodtype, 10) } : {};

    const mtrgroups = await prisma.mtrGroup.findMany({
      where,
      orderBy: [
        { sodtype: 'asc' },
        { name: 'asc' },
      ],
      include: {
        translations: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: mtrgroups,
    });
  } catch (error) {
    console.error("Error fetching mtrgroups:", error);
    return NextResponse.json(
      { error: "Failed to fetch mtrgroups" },
      { status: 500 }
    );
  }
}
