import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { uploadUserAvatar, deleteUserAvatar, syncProviderAvatar } from '@/lib/avatar/upload';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import bcrypt from 'bcryptjs';

/**
 * GET /api/users/profile - Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        department: true,
        workPosition: true,
        branch: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive data
    const { passwordHash, ...userProfile } = user;

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/users/profile - Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { name, phone, workPhone, mobile, currentPassword, newPassword } = body;

    // If password change is requested
    if (currentPassword && newPassword) {
      // Get current user with password hash
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true }
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: 'User not found or no password set' }, { status: 404 });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update user with new password
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          passwordHash: hashedNewPassword,
          updatedAt: new Date(),
        },
        include: {
          department: true,
          workPosition: true,
          branch: true,
        },
      });

      // Remove sensitive data
      const { passwordHash, ...userProfile } = updatedUser;

      return NextResponse.json({ 
        user: userProfile,
        message: 'Password changed successfully' 
      });
    }

    // Regular profile update
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        workPhone,
        mobile,
        updatedAt: new Date(),
      },
      include: {
        department: true,
        workPosition: true,
        branch: true,
      },
    });

    // Remove sensitive data
    const { passwordHash, ...userProfile } = updatedUser;

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/users/profile/avatar - Upload user avatar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    };

    const result = await uploadUserAvatar(session.user.id, buffer, metadata);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      url: result.url,
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/users/profile/avatar - Delete user avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();

    const result = await deleteUserAvatar(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
