"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function getEmailConnectionStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized", hasToken: false };
    }

    // Check if user has a Microsoft account with access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: { contains: "microsoft" },
      },
      select: { 
        id: true,
        provider: true,
        access_token: true,
        expires_at: true,
      },
    });

    return {
      hasToken: !!account?.access_token,
      provider: account?.provider || null,
      expiresAt: account?.expires_at || null,
      error: null,
    };
  } catch (error) {
    console.error("Error checking email connection:", error);
    return { error: "Failed to check connection", hasToken: false };
  }
}

export async function getMicrosoftOAuthUrl() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Generate OAuth URL
    const clientId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
    const tenantId = process.env.TENANT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/microsoft-entra-id`;
    
    if (!clientId || !tenantId) {
      return { error: "Microsoft OAuth not configured" };
    }

    // Request Mail.Read and Mail.ReadWrite permissions
    const scopes = encodeURIComponent("https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite offline_access");
    
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${scopes}&` +
      `state=${session.user.id}`;

    return { authUrl, error: null };
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return { error: "Failed to generate OAuth URL" };
  }
}
