import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { SurveyStage } from "@prisma/client";

const updateStageSchema = z.object({
  stage: z.enum([
    "INFRSTRUCTURE_PLANNING",
    "REQUIREMENTS_AND_PRODUCTS",
    "PRICING_COMPLETED",
    "DOCUMENTS_READY",
  ]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { stage } = updateStageSchema.parse(body);

    // Verify site survey exists
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      include: {
        lead: true,
        customer: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Update the site survey stage
    const updatedSurvey = await prisma.siteSurvey.update({
      where: { id },
      data: { stage: stage as SurveyStage },
      include: {
        lead: true,
        customer: true,
        contact: true,
        assignTo: true,
        assignFrom: true,
      },
    });

    // Update lead stage based on site survey stage
    if (siteSurvey.leadId) {
      let leadStage;
      
      switch (stage) {
        case "INFRSTRUCTURE_PLANNING":
          leadStage = "LEAD_WORKING";
          break;
        case "REQUIREMENTS_AND_PRODUCTS":
          leadStage = "OPP_DISCOVERY";
          break;
        case "PRICING_COMPLETED":
          leadStage = "OPP_PROPOSAL";
          break;
        case "DOCUMENTS_READY":
          leadStage = "QUOTE_DRAFT";
          break;
        default:
          leadStage = siteSurvey.lead?.stage || "LEAD_WORKING";
      }

      await prisma.lead.update({
        where: { id: siteSurvey.leadId },
        data: { stage: leadStage as any },
      });
    }

    return NextResponse.json(updatedSurvey);
  } catch (error: any) {
    console.error("Error updating site survey stage:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update site survey stage", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
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
      select: {
        id: true,
        stage: true,
        status: true,
        title: true,
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      stage: siteSurvey.stage,
      status: siteSurvey.status,
      id: siteSurvey.id,
      title: siteSurvey.title,
    });
  } catch (error: any) {
    console.error("Error fetching site survey stage:", error);
    return NextResponse.json(
      { error: "Failed to fetch site survey stage" },
      { status: 500 }
    );
  }
}

