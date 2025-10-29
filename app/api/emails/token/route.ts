import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/emails/token - Get user's email OAuth token
 * Returns the user's Microsoft or Google OAuth access token for email access
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    console.log("Fetching email token for user:", session.user.email);

    // Try to find Microsoft account first
    let account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: {
          in: ['microsoft-entra-id', 'microsoft', 'azure-ad']
        },
      },
      select: {
        id: true,
        provider: true,
        access_token: true,
        refresh_token: true,
        expires_at: true,
      },
      orderBy: {
        expires_at: 'desc', // Get the most recent token
      },
    });

    // If no Microsoft account, try Google
    if (!account) {
      account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: 'google',
        },
        select: {
          id: true,
          provider: true,
          access_token: true,
          refresh_token: true,
          expires_at: true,
        },
        orderBy: {
          expires_at: 'desc',
        },
      });
    }

    if (!account || !account.access_token) {
      console.log("No email account found for user");
      return NextResponse.json({
        success: false,
        error: 'No connected email account found. Please sign in with Microsoft or Google.',
      }, { status: 404 });
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const isExpired = account.expires_at && account.expires_at < now;

    if (isExpired) {
      console.log("Access token expired, needs refresh");
      
      // TODO: Implement token refresh logic here
      // For now, return error asking user to reconnect
      return NextResponse.json({
        success: false,
        error: 'Access token expired. Please reconnect your email account.',
        expired: true,
      }, { status: 401 });
    }

    console.log("Found valid token for provider:", account.provider);

    return NextResponse.json({
      success: true,
      accessToken: account.access_token,
      provider: account.provider,
      expiresAt: account.expires_at,
    });
  } catch (error: any) {
    console.error('Error fetching email token:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch email token',
    }, { status: 500 });
  }
}

