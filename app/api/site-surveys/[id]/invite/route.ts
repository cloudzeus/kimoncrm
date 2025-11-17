import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendEmailAsUser } from "@/lib/microsoft/app-auth";

const createInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  expiresAt: z.string().datetime("Invalid expiration date"),
  message: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = createInviteSchema.parse(body);

    // Verify site survey exists
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Create invite
    const invite = await prisma.surveyInvite.create({
      data: {
        token,
        siteSurveyId: id,
        invitedEmail: validated.email,
        expiresAt: new Date(validated.expiresAt),
        message: validated.message || null,
        status: "PENDING",
      },
    });

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/survey/invite/${token}`;

    // Send email
    try {
      const emailSubject = `Site Survey Invitation: ${siteSurvey.title}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Site Survey Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited to complete a site survey for <strong>${siteSurvey.customer.name}</strong>.</p>
          <p><strong>Survey Title:</strong> ${siteSurvey.title}</p>
          ${siteSurvey.description ? `<p><strong>Description:</strong> ${siteSurvey.description}</p>` : ""}
          ${validated.message ? `<p><strong>Message from inviter:</strong> ${validated.message}</p>` : ""}
          <p><strong>Link expires:</strong> ${new Date(validated.expiresAt).toLocaleString()}</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Access Survey
            </a>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteUrl}">${inviteUrl}</a>
          </p>
        </div>
      `;

      // Get the current user's email from session
      const userEmail = session.user.email;
      if (!userEmail) {
        throw new Error("User email not found in session");
      }

      await sendEmailAsUser(
        userEmail,
        emailSubject,
        emailBody,
        [validated.email]
      );
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        token: invite.token,
        invitedEmail: invite.invitedEmail,
        expiresAt: invite.expiresAt,
        inviteUrl,
      },
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

