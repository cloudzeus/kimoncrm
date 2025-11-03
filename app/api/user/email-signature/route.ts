import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's email signature
    const signature = await prisma.emailSignature.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!signature) {
      return NextResponse.json({ signature: null });
    }

    return NextResponse.json({
      signature: signature.content || "",
      isHtml: signature.isHtml,
    });
  } catch (error) {
    console.error("Error fetching email signature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
