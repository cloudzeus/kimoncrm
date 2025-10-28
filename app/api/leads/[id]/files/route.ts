import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { uploadToBunnyCDN } from "@/lib/bunny/upload";

// GET - Fetch files for a specific lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: leadId } = await params;

    const files = await prisma.file.findMany({
      where: {
        entityId: leadId,
        type: "LEAD",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Error fetching lead files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// POST - Upload a file for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: leadId } = await params;

    // Get the lead to fetch customer and leadNumber for file naming
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        customer: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create file name with lead number prefix: "LL001 - original-filename.jpg"
    const fileExtension = file.name.split(".").pop();
    const sanitizedLeadNumber = lead.leadNumber || "LL000";
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${sanitizedLeadNumber} - ${sanitizedOriginalName}`;

    // Upload to BunnyCDN
    const uploadedFile = await uploadToBunnyCDN(
      file,
      `leads/${leadId}/${fileName}`
    );

    // Save file reference to database
    const fileRecord = await prisma.file.create({
      data: {
        entityId: leadId,
        type: "LEAD",
        name: fileName,
        filetype: fileExtension || "",
        url: uploadedFile.url,
        description: description || null,
        size: file.size,
      },
    });

    // Also create a file reference for the customer if exists
    if (lead.customerId) {
      await prisma.file.create({
        data: {
          entityId: lead.customerId,
          type: "CUSTOMER",
          name: fileName,
          filetype: fileExtension || "",
          url: uploadedFile.url,
          description: `From Lead: ${sanitizedLeadNumber} - ${description || "No description"}`,
          size: file.size,
        },
      });
    }

    return NextResponse.json({ file: fileRecord }, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error.message },
      { status: 500 }
    );
  }
}

