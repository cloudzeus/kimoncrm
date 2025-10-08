import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { uploadUserAvatar, deleteUserAvatar } from '@/lib/avatar/upload';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const file = formData.get('file') as File | null;

    if (!userId || !file) {
      return NextResponse.json({ error: 'userId and file are required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadUserAvatar(userId, buffer, {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 400 });
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error('Avatar upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const result = await deleteUserAvatar(userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Deletion failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


