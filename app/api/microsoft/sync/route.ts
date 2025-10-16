import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { createMicrosoftGraphClient } from '@/lib/microsoft/graph';
import { syncProviderAvatar, validateMicrosoftAvatarResponse } from '@/lib/avatar/upload';
import { validateMicrosoftAccessToken, MicrosoftGraphError } from '@/lib/microsoft/validation';

/**
 * POST /api/microsoft/sync - Sync Microsoft user data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    // Validate access token
    const tokenValidation = validateMicrosoftAccessToken(accessToken);
    if (!tokenValidation.isValid) {
      return NextResponse.json({ 
        error: `Invalid access token: ${tokenValidation.error}` 
      }, { status: 400 });
    }

    // Create Microsoft Graph client
    const graphClient = await createMicrosoftGraphClient(accessToken);
    
    // Get user profile from Microsoft Graph
    const microsoftProfile = await graphClient.getUserProfile();
    
    if (!microsoftProfile) {
      return NextResponse.json({ error: 'Failed to fetch Microsoft profile' }, { status: 400 });
    }

    // Update user with Microsoft data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        microsoftId: microsoftProfile.id,
        name: microsoftProfile.displayName || session.user.name,
        email: microsoftProfile.mail || microsoftProfile.userPrincipalName || session.user.email,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Handle avatar sync
    let avatarResult = null;
    try {
      const avatarBuffer = await graphClient.getUserPhoto();
      if (avatarBuffer) {
        const metadata = {
          originalName: 'microsoft-avatar',
          mimeType: 'image/jpeg', // Microsoft Graph typically returns JPEG
          size: avatarBuffer.length,
        };
        
        avatarResult = await syncProviderAvatar(
          session.user.id,
          'data:image/jpeg;base64,' + avatarBuffer.toString('base64'),
          'microsoft'
        );
      }
    } catch (avatarError) {
      console.warn('Avatar sync failed:', avatarError);
      // Continue without failing the entire sync
    }

    // Remove sensitive data
    const { passwordHash, ...userProfile } = updatedUser;

    return NextResponse.json({
      user: userProfile,
      microsoftProfile: {
        id: microsoftProfile.id,
        displayName: microsoftProfile.displayName,
        mail: microsoftProfile.mail,
        userPrincipalName: microsoftProfile.userPrincipalName,
        jobTitle: microsoftProfile.jobTitle,
        department: microsoftProfile.department,
        officeLocation: microsoftProfile.officeLocation,
      },
      avatarSync: avatarResult,
      message: 'Microsoft profile synced successfully',
    });
  } catch (error) {
    console.error('Error syncing Microsoft profile:', error);
    
    if (error instanceof MicrosoftGraphError) {
      return NextResponse.json({ 
        error: `Microsoft Graph API error: ${error.message}`,
        code: error.code,
        statusCode: error.statusCode,
      }, { status: error.statusCode || 500 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/microsoft/sync - Get Microsoft profile data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('accessToken');

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    // Create Microsoft Graph client
    const graphClient = await createMicrosoftGraphClient(accessToken);
    
    // Get user profile from Microsoft Graph
    const microsoftProfile = await graphClient.getUserProfile();
    
    if (!microsoftProfile) {
      return NextResponse.json({ error: 'Failed to fetch Microsoft profile' }, { status: 400 });
    }

    // Get photo metadata
    const photoMetadata = await graphClient.getUserPhotoMetadata();

    return NextResponse.json({
      profile: {
        id: microsoftProfile.id,
        displayName: microsoftProfile.displayName,
        mail: microsoftProfile.mail,
        userPrincipalName: microsoftProfile.userPrincipalName,
        jobTitle: microsoftProfile.jobTitle,
        department: microsoftProfile.department,
        officeLocation: microsoftProfile.officeLocation,
        businessPhones: microsoftProfile.businessPhones,
        mobilePhone: microsoftProfile.mobilePhone,
      },
      photo: photoMetadata,
    });
  } catch (error) {
    console.error('Error fetching Microsoft profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
