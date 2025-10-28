import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { SurveyType } from "@prisma/client";

// POST create a site survey for a lead
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
    const body = await request.json();

    // Fetch the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        customer: true,
        contact: true,
        assignee: true,
        owner: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Check if site survey already exists
    const existingSurvey = await prisma.siteSurvey.findUnique({
      where: { leadId },
    });

    if (existingSurvey) {
      return NextResponse.json({
        error: "Site survey already exists for this lead",
        siteSurveyId: existingSurvey.id,
      }, { status: 400 });
    }

    // Create the site survey
    const siteSurvey = await prisma.siteSurvey.create({
      data: {
        title: body.title || `Site Survey - ${lead.title}`,
        description: body.description || lead.description || undefined,
        type: (body.type as SurveyType) || SurveyType.COMPREHENSIVE,
        customerId: lead.customerId || lead.customer!.id,
        contactId: lead.contactId || undefined,
        assignFromId: lead.ownerId || undefined,
        assignToId: body.assignToId || lead.assigneeId || undefined,
        arrangedDate: body.arrangedDate ? new Date(body.arrangedDate) : null,
        address: body.address || undefined,
        city: body.city || undefined,
        phone: body.phone || lead.contact?.mobilePhone || undefined,
        email: body.email || lead.contact?.email || undefined,
        status: "Scheduled",
        leadId: leadId,
      },
      include: {
        customer: true,
        contact: true,
        assignTo: true,
        assignFrom: true,
      },
    });

    // Update lead to mark site survey as requested
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        requestedSiteSurvey: true,
      },
    });

    return NextResponse.json(siteSurvey, { status: 201 });
  } catch (error: any) {
    console.error("Error creating site survey for lead:", error);
    return NextResponse.json(
      { error: "Failed to create site survey", details: error.message },
      { status: 500 }
    );
  }
}

