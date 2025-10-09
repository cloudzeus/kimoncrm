import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// PUT - Update a supported language
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 15 dynamic API routes require awaiting params
    const { id } = await params;

    const body = await request.json();
    const { code, name, nativeName, flag, isActive, isDefault, sortOrder } = body;

    // If this is being set as default, unset any existing default
    if (isDefault) {
      await prisma.supportedLanguage.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const language = await prisma.supportedLanguage.update({
      where: { id },
      data: {
        code,
        name,
        nativeName,
        flag,
        isActive,
        isDefault,
        sortOrder
      }
    });

    return NextResponse.json({ language });
  } catch (error) {
    console.error("Error updating language:", error);
    return NextResponse.json(
      { error: "Failed to update language" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a supported language
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 15 dynamic API routes require awaiting params
    const { id } = await params;

    // Check if this is the default language
    const language = await prisma.supportedLanguage.findUnique({
      where: { id }
    });

    if (language?.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default language" },
        { status: 400 }
      );
    }

    await prisma.supportedLanguage.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting language:", error);
    return NextResponse.json(
      { error: "Failed to delete language" },
      { status: 500 }
    );
  }
}
