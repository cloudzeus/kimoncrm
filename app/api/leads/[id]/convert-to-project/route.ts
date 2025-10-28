import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const convertToProjectSchema = z.object({
  quoteId: z.string().optional(),
  projectData: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  assignedUserIds: z.array(z.string()).min(1),
});

// POST convert a lead to a project when quote is accepted
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
    const { quoteId, projectData, assignedUserIds } = convertToProjectSchema.parse(body);

    // Get the lead with its customer info
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        customer: true,
        contact: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Verify assigned users exist
    const assignedUsers = await prisma.user.findMany({
      where: {
        id: { in: assignedUserIds },
        role: { in: ["USER", "MANAGER"] },
        isActive: true,
      },
    });

    if (assignedUsers.length !== assignedUserIds.length) {
      return NextResponse.json(
        { error: "Some assigned users are invalid or inactive" },
        { status: 400 }
      );
    }

    // Create the project in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the project
      const project = await tx.project.create({
        data: {
          leadId: leadId,
          name: projectData.name,
          description: projectData.description || `Project from lead ${lead.leadNumber || lead.title}`,
          startAt: projectData.startDate ? new Date(projectData.startDate) : null,
          endAt: projectData.endDate ? new Date(projectData.endDate) : null,
          status: "Active",
        },
      });

      // Create project assignments for each user
      await Promise.all(
        assignedUserIds.map((userId) =>
          tx.projectAssignment.create({
            data: {
              projectId: project.id,
              userId,
              role: "Member",
            },
          })
        )
      );

      // Update lead status to CLOSED
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: "CLOSED",
          stage: "OPP_CLOSED_WON",
        },
      });

      // Record status change
      await tx.leadStatusChange.create({
        data: {
          leadId: leadId,
          fromStatus: lead.status,
          toStatus: "CLOSED",
          changedBy: session.user.id,
          note: `Lead converted to project: ${project.name}`,
        },
      });

      // Update quote status if quoteId is provided
      if (quoteId) {
        await tx.quote.update({
          where: { id: quoteId },
          data: { status: "ACCEPTED" },
        });
      }

      return project;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error converting lead to project:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to convert lead to project", details: error.message },
      { status: 500 }
    );
  }
}

