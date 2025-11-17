import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const validated = authSchema.parse(body);

    const invite = await prisma.surveyInvite.findUnique({
      where: { token },
      include: {
        siteSurvey: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    // Validate email matches
    if (invite.invitedEmail.toLowerCase() !== validated.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match the invited email" },
        { status: 403 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
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

    // Create a session token for the collaborator
    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days session

    // Store session in database (we'll use a simple approach with cookies)
    // In production, you might want to use a proper session store
    const cookieStore = await cookies();
    cookieStore.set("collaborator_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    // Update invite status and access time
    await prisma.surveyInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        accessedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      siteSurveyId: invite.siteSurveyId,
      redirectUrl: `/survey/collaborator/${invite.siteSurveyId}?token=${token}`,
    });
  } catch (error) {
    console.error("Error authenticating collaborator:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    );
  }
}

