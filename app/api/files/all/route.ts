import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/files/all
 * Retrieves all files across all entity types with related entity names
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    // Build where clause
    const where = type ? { type: type.toUpperCase() as any } : {};

    // Fetch all files
    const files = await prisma.file.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch entity names for each file
    const filesWithNames = await Promise.all(
      files.map(async (file) => {
        let entityName = "Unknown";
        
        try {
          switch (file.type) {
            case "CUSTOMER":
              const customer = await prisma.customer.findUnique({
                where: { id: file.entityId },
                select: { name: true },
              });
              entityName = customer?.name || "Unknown Customer";
              break;
            
            case "SUPPLIER":
              const supplier = await prisma.supplier.findUnique({
                where: { id: file.entityId },
                select: { name: true },
              });
              entityName = supplier?.name || "Unknown Supplier";
              break;
            
            case "USER":
              const user = await prisma.user.findUnique({
                where: { id: file.entityId },
                select: { name: true, email: true },
              });
              entityName = user?.name || user?.email || "Unknown User";
              break;
            
            case "PROJECT":
              const project = await prisma.project.findUnique({
                where: { id: file.entityId },
                select: { name: true },
              });
              entityName = project?.name || "Unknown Project";
              break;
            
            case "TASK":
              const task = await prisma.task.findUnique({
                where: { id: file.entityId },
                select: { title: true },
              });
              entityName = task?.title || "Unknown Task";
              break;
            
            case "SITESURVEY":
              const survey = await prisma.siteSurvey.findUnique({
                where: { id: file.entityId },
                select: { id: true },
              });
              entityName = survey ? `Site Survey #${survey.id.slice(0, 8)}` : "Unknown Survey";
              break;
          }
        } catch (error) {
          console.error(`Error fetching entity name for ${file.type}:`, error);
        }

        return {
          ...file,
          entityName,
        };
      })
    );

    return NextResponse.json({ files: filesWithNames });
  } catch (error: any) {
    console.error("Error fetching all files:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

