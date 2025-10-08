import { bunnyPut, bunnyDelete } from '@/lib/bunny/upload';
import { prisma } from '@/lib/db/prisma';
import { createHash } from 'crypto';

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface AvatarMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

/**
 * Upload user avatar to BunnyCDN
 */
export async function uploadUserAvatar(
  userId: string,
  file: Buffer,
  metadata: AvatarMetadata
): Promise<AvatarUploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(metadata.mimeType)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (metadata.size > maxSize) {
      return {
        success: false,
        error: 'File size too large. Maximum size is 5MB.',
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const hash = createHash('md5').update(file).digest('hex').substring(0, 8);
    const extension = metadata.mimeType.split('/')[1];
    const filename = `avatars/${userId}/${timestamp}-${hash}.${extension}`;

    // Upload to BunnyCDN
    const result = await bunnyPut(filename, file);

    // Update user record in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: result.url,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      url: result.url,
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete user avatar from BunnyCDN and database
 */
export async function deleteUserAvatar(userId: string): Promise<AvatarUploadResult> {
  try {
    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user?.avatar) {
      return {
        success: false,
        error: 'No avatar found for user',
      };
    }

    // Extract filename from URL
    const url = new URL(user.avatar);
    const filename = url.pathname.substring(1); // Remove leading slash

    // Delete from BunnyCDN
    await bunnyDelete(filename);

    // Update user record in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: null,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Avatar deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deletion failed',
    };
  }
}

/**
 * Sync Microsoft/Google avatar to BunnyCDN
 */
export async function syncProviderAvatar(
  userId: string,
  providerAvatarUrl: string,
  provider: 'microsoft' | 'google'
): Promise<AvatarUploadResult> {
  try {
    // Fetch avatar from provider
    const response = await fetch(providerAvatarUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch avatar from ${provider}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Upload to BunnyCDN
    const metadata: AvatarMetadata = {
      originalName: `${provider}-avatar`,
      mimeType: contentType,
      size: buffer.length,
    };

    return await uploadUserAvatar(userId, buffer, metadata);
  } catch (error) {
    console.error(`Avatar sync error for ${provider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

/**
 * Get user avatar URL (prioritizes custom avatar over provider avatar)
 */
export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true, image: true },
    });

    if (!user) return null;

    // Return custom avatar if available, otherwise provider avatar
    return user.avatar || user.image || null;
  } catch (error) {
    console.error('Error getting user avatar URL:', error);
    return null;
  }
}

/**
 * Validate and process Microsoft avatar response
 */
export function validateMicrosoftAvatarResponse(profile: any): string | null {
  try {
    // Microsoft Graph can return avatar in different formats
    if (profile.photos && Array.isArray(profile.photos) && profile.photos.length > 0) {
      // Photos array format
      const photo = profile.photos[0];
      if (photo.value && typeof photo.value === 'string') {
        return photo.value;
      }
    }

    if (profile.picture && typeof profile.picture === 'string') {
      // Direct picture URL
      return profile.picture;
    }

    if (profile['@odata.mediaContentType'] && profile.id) {
      // Microsoft Graph photo metadata format
      return `https://graph.microsoft.com/v1.0/me/photo/$value`;
    }

    return null;
  } catch (error) {
    console.error('Error validating Microsoft avatar response:', error);
    return null;
  }
}

/**
 * Validate and process Google avatar response
 */
export function validateGoogleAvatarResponse(profile: any): string | null {
  try {
    if (profile.picture && typeof profile.picture === 'string') {
      return profile.picture;
    }

    if (profile.photos && Array.isArray(profile.photos) && profile.photos.length > 0) {
      const photo = profile.photos[0];
      if (photo.value && typeof photo.value === 'string') {
        return photo.value;
      }
    }

    return null;
  } catch (error) {
    console.error('Error validating Google avatar response:', error);
    return null;
  }
}
