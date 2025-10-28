import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const contactId = resolvedParams.id;
    const emailThreadId = resolvedParams.threadId;
    const body = await request.json();
    const { content, messageId } = body;

    if (!content || !messageId) {
      return NextResponse.json(
        { error: "Content and messageId are required" },
        { status: 400 }
      );
    }

    // Get the user's email for the API call
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get application-level access token
    const clientId = process.env.GRAPH_CLIENT_ID;
    const clientSecret = process.env.GRAPH_CLIENT_SECRET;
    const tenantId = process.env.TENANT_ID || process.env.GRAPH_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      return NextResponse.json(
        { error: "Microsoft Graph credentials not configured" },
        { status: 500 }
      );
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      scope: "https://graph.microsoft.com/.default",
      client_secret: clientSecret,
      grant_type: "client_credentials",
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Send the reply using Microsoft Graph API
    const replyUrl = `https://graph.microsoft.com/v1.0/users/${user.email}/messages/${messageId}/reply`;
    
    const replyBody = {
      message: {
        body: {
          contentType: "HTML",
          content: content,
        },
      },
    };

    const replyResponse = await fetch(replyUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(replyBody),
    });

    if (!replyResponse.ok) {
      const errorText = await replyResponse.text();
      console.error("Failed to send reply:", errorText);
      return NextResponse.json(
        { error: "Failed to send reply" },
        { status: replyResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: "Failed to send reply", details: error.message },
      { status: 500 }
    );
  }
}

