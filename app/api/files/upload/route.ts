import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { bunnyPut } from "@/lib/bunny/upload";

// Define the entity types and their folder naming strategies
type EntityType = "CUSTOMER" | "SUPPLIER" | "PROJECT" | "TASK" | "USER" | "SITESURVEY";

interface UploadMetadata {
  entityId: string;
  entityType: EntityType;
  folderName: string; // AFM for customers/suppliers, email for users, etc.
  description?: string;
}

/**
 * POST /api/files/upload
 * Handles multi-file uploads to BunnyCDN
 * 
 * Form data:
 * - files: File[] (multiple files)
 * - entityId: string (ID of the entity)
 * - entityType: EntityType
 * - folderName: string (AFM for customers/suppliers, EMAIL for users, projectId, etc.)
 * - description: string (optional)
 * 
 * Folder structure:
 * - customers/{AFM}/{timestamp}_{filename}
 * - suppliers/{AFM}/{timestamp}_{filename}
 * - users/{email_at_domain.com}/{timestamp}_{filename}  <- Email sanitized
 * - projects/{projectId}/{timestamp}_{filename}
 * - tasks/{taskId}/{timestamp}_{filename}
 * - sitesurveys/{surveyId}/{timestamp}_{filename}
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Extract metadata
    const entityId = formData.get("entityId") as string;
    const entityType = formData.get("entityType") as EntityType;
    const folderName = formData.get("folderName") as string;
    const description = formData.get("description") as string | null;

    if (!entityId || !entityType || !folderName) {
      return NextResponse.json(
        { error: "Missing required fields: entityId, entityType, or folderName" },
        { status: 400 }
      );
    }

    // Validate entity type
    const validTypes: EntityType[] = ["CUSTOMER", "SUPPLIER", "PROJECT", "TASK", "USER", "SITESURVEY"];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Upload files and save to database
    const uploadedFiles = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Get the title for this file (if provided)
        const fileTitle = formData.get(`title_${i}`) as string | null;

        // Generate unique filename to prevent collisions
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${timestamp}_${sanitizedName}`;
        
        // Sanitize folder name (especially important for email addresses)
        // Replace @ with _at_ and other special chars with _
        const sanitizedFolderName = folderName
          .replace(/@/g, "_at_")
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        
        // Build BunnyCDN path based on entity type
        const basePath = getBasePath(entityType);
        const fullPath = `${basePath}/${sanitizedFolderName}/${filename}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to BunnyCDN
        const { url } = await bunnyPut(fullPath, buffer);

        // Save to database
        const fileRecord = await prisma.file.create({
          data: {
            entityId,
            type: entityType,
            name: file.name,
            title: fileTitle || undefined,
            filetype: file.type || "application/octet-stream",
            url,
            description: description || undefined,
            size: file.size,
          },
        });

        uploadedFiles.push(fileRecord);
      } catch (error: any) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({
          filename: file.name,
          error: error.message || "Upload failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedFiles.length} of ${files.length} files`,
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get the base path for BunnyCDN storage based on entity type
 */
function getBasePath(entityType: EntityType): string {
  const paths: Record<EntityType, string> = {
    CUSTOMER: "customers",
    SUPPLIER: "suppliers",
    PROJECT: "projects",
    TASK: "tasks",
    USER: "users",
    SITESURVEY: "sitesurveys",
  };
  return paths[entityType];
}
