import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.surveyInvite.findUnique({
      where: { token },
      include: {
        siteSurvey: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      // Update status to expired
      await prisma.surveyInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "This invite link has expired" },
        { status: 410 }
      );
    }

    // Check if revoked
    if (invite.status === "REVOKED") {
      return NextResponse.json(
        { error: "This invite link has been revoked" },
        { status: 403 }
      );
    }

    // Return invite info (without sensitive data)
    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        invitedEmail: invite.invitedEmail,
        expiresAt: invite.expiresAt,
        siteSurvey: {
          id: invite.siteSurvey.id,
          title: invite.siteSurvey.title,
          description: invite.siteSurvey.description,
          customer: {
            name: invite.siteSurvey.customer.name,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { error: "Failed to validate invite" },
      { status: 500 }
    );
  }
}

