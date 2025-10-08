import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { bunnyPut, bunnyDelete } from "@/lib/bunny/upload";
import { createHash } from "crypto";

// POST /api/brands/upload
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'image'

    if (!file || !type) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB for brand assets)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    const hash = createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `brands/${type}s/${timestamp}-${hash}.${extension}`;

    // Upload to BunnyCDN
    const result = await bunnyPut(filename, fileBuffer);

    // Create FileRef record
    const fileRef = await prisma.fileRef.create({
      data: {
        driveProv: 'bunny',
        driveId: filename,
        name: file.name,
        url: result.url,
        fileType: 'image',
      },
    });

    return NextResponse.json({ 
      success: true, 
      fileId: fileRef.id,
      url: result.url,
      filename: file.name
    });

  } catch (error) {
    console.error('Brand upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// DELETE /api/brands/upload
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get file reference
    const fileRef = await prisma.fileRef.findUnique({
      where: { id: fileId },
    });

    if (!fileRef) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from BunnyCDN
    try {
      await bunnyDelete(fileRef.driveId);
    } catch (error) {
      console.error('Failed to delete from BunnyCDN:', error);
      // Continue with database deletion even if CDN deletion fails
    }

    // Delete from database
    await prisma.fileRef.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Brand file deletion error:', error);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}

