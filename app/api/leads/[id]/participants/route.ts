import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma as db } from "@/lib/db/prisma";

// GET /api/leads/[id]/participants - Get all participants for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Get the lead to check permissions
    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        assigneeId: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Only owner, assignee, admin, or manager can view participants
    if (
      lead.ownerId !== session.user.id && 
      lead.assigneeId !== session.user.id &&
      session.user.role !== 'ADMIN' && 
      session.user.role !== 'MANAGER'
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const participants = await db.leadParticipant.findMany({
      where: { leadId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
            role: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    return NextResponse.json({ participants });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id]/participants - Add a participant to a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const { userId, role = 'COLLABORATOR' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the lead to check permissions
    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        assigneeId: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Only owner, assignee, admin, or manager can add participants
    if (
      lead.ownerId !== session.user.id && 
      lead.assigneeId !== session.user.id &&
      session.user.role !== 'ADMIN' && 
      session.user.role !== 'MANAGER'
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Verify the user exists
    const userExists = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create or update participant
    const participant = await db.leadParticipant.upsert({
      where: {
        leadId_userId: {
          leadId: id,
          userId,
        },
      },
      create: {
        leadId: id,
        userId,
        role,
        addedById: session.user.id,
      },
      update: {
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
            role: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("Error adding participant:", error);
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id]/participants?userId=xxx - Remove a participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the lead to check permissions
    const lead = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        assigneeId: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Only owner, assignee, admin, or manager can remove participants
    if (
      lead.ownerId !== session.user.id && 
      lead.assigneeId !== session.user.id &&
      session.user.role !== 'ADMIN' && 
      session.user.role !== 'MANAGER'
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Cannot remove owner or assignee
    if (userId === lead.ownerId || userId === lead.assigneeId) {
      return NextResponse.json(
        { error: "Cannot remove lead owner or assignee" },
        { status: 400 }
      );
    }

    await db.leadParticipant.delete({
      where: {
        leadId_userId: {
          leadId: id,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}

