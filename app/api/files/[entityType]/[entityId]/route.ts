import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bunnyDelete } from "@/lib/bunny/upload";

/**
 * GET /api/files/[entityType]/[entityId]
 * Retrieves all files for a specific entity
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    const { entityType, entityId } = await params;

    // Validate entity type
    const validTypes = ["CUSTOMER", "SUPPLIER", "PROJECT", "TASK", "USER", "SITESURVEY"];
    if (!validTypes.includes(entityType.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }

    // Fetch files from database
    const files = await prisma.file.findMany({
      where: {
        entityId,
        type: entityType.toUpperCase() as any,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[entityType]/[entityId]?fileId=xxx
 * Deletes a specific file
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    await params; // params not needed for DELETE but required for type
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId parameter" },
        { status: 400 }
      );
    }

    // Fetch file record
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Extract path from URL
    const cdnPull = process.env.BUNNY_CDN_PULL_ZONE!;
    const path = file.url.replace(`https://${cdnPull}/`, "");

    try {
      // Delete from BunnyCDN
      await bunnyDelete(path);
    } catch (error) {
      console.error("Error deleting from BunnyCDN:", error);
      // Continue to delete from database even if CDN delete fails
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

