import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { uploadUserAvatar, deleteUserAvatar } from '@/lib/avatar/upload';

/**
 * POST /api/users/profile/avatar - Upload user avatar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
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

    // Update user avatar in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatar: result.url,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      avatarUrl: result.url,
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
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await deleteUserAvatar(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update user avatar in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatar: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
