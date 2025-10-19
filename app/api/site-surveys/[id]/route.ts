import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { SurveyType } from "@prisma/client";
import { z } from "zod";

const updateSiteSurveySchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["COMPREHENSIVE", "VOIP", "CABLING", "WIFI", "DIGITAL_SIGNAGE", "HOTEL_TV", "NETWORK", "CCTV", "IOT"]).optional(),
  customerId: z.string().optional(),
  contactId: z.string().optional().nullable(),
  arrangedDate: z.string().optional().nullable(),
  assignFromId: z.string().optional().nullable(),
  assignToId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  status: z.string().optional(),
});

// GET single site survey by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone01: true,
            address: true,
            city: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            workPhone: true,
          },
        },
        assignFrom: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Get associated files
    const files = await prisma.file.findMany({
      where: {
        entityId: id,
        type: "SITESURVEY",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ...siteSurvey,
      files,
    });
  } catch (error) {
    console.error("Error fetching site survey:", error);
    return NextResponse.json(
      { error: "Failed to fetch site survey" },
      { status: 500 }
    );
  }
}

// PATCH update site survey
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user has appropriate role
    if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateSiteSurveySchema.parse(body);

    // Verify site survey exists
    const existingSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
    });

    if (!existingSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.type !== undefined) updateData.type = validatedData.type as SurveyType;
    if (validatedData.customerId !== undefined) updateData.customerId = validatedData.customerId;
    if (validatedData.contactId !== undefined) updateData.contactId = validatedData.contactId || null;
    if (validatedData.arrangedDate !== undefined) {
      updateData.arrangedDate = validatedData.arrangedDate ? new Date(validatedData.arrangedDate) : null;
    }
    if (validatedData.assignFromId !== undefined) updateData.assignFromId = validatedData.assignFromId || null;
    if (validatedData.assignToId !== undefined) updateData.assignToId = validatedData.assignToId || null;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;
    if (validatedData.city !== undefined) updateData.city = validatedData.city;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    const siteSurvey = await prisma.siteSurvey.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignFrom: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(siteSurvey);
  } catch (error) {
    console.error("Error updating site survey:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update site survey" },
      { status: 500 }
    );
  }
}

// DELETE site survey
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can delete
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify site survey exists
    const existingSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
    });

    if (!existingSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Delete associated files first
    await prisma.file.deleteMany({
      where: {
        entityId: id,
        type: "SITESURVEY",
      },
    });

    // Delete the site survey
    await prisma.siteSurvey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Site survey deleted" });
  } catch (error) {
    console.error("Error deleting site survey:", error);
    return NextResponse.json(
      { error: "Failed to delete site survey" },
      { status: 500 }
    );
  }
}

