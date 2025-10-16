import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { bunnyPut, bunnyDelete } from '@/lib/bunny/upload';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/products/[id]/datasheet
 * Upload product datasheet (PDF/Word) to BunnyCDN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, productDataSheet: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type (PDF or Word documents)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only PDF and Word documents are allowed.',
        },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'pdf';

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const filename = `${uuidv4()}.${fileExtension}`;
    const path = `products/${productId}/${filename}`;

    // Upload to BunnyCDN
    const { url } = await bunnyPut(path, buffer);

    // Delete old datasheet if exists
    if (product.productDataSheet) {
      try {
        const oldPath = product.productDataSheet.split('.b-cdn.net/')[1];
        if (oldPath) {
          await bunnyDelete(oldPath);
        }
      } catch (error) {
        console.error('Failed to delete old datasheet:', error);
        // Continue anyway - new file is uploaded
      }
    }

    // Update product with new datasheet URL
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { productDataSheet: url },
      select: {
        id: true,
        name: true,
        productDataSheet: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Datasheet uploaded successfully',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Error uploading datasheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to upload datasheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]/datasheet
 * Delete product datasheet from BunnyCDN
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, productDataSheet: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.productDataSheet) {
      return NextResponse.json(
        { success: false, error: 'No datasheet to delete' },
        { status: 404 }
      );
    }

    // Delete from BunnyCDN
    try {
      const path = product.productDataSheet.split('.b-cdn.net/')[1];
      if (path) {
        await bunnyDelete(path);
      }
    } catch (error) {
      console.error('Failed to delete datasheet from CDN:', error);
      // Continue anyway to clear the database reference
    }

    // Update product to remove datasheet URL
    await prisma.product.update({
      where: { id: productId },
      data: { productDataSheet: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Datasheet deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting datasheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete datasheet',
      },
      { status: 500 }
    );
  }
}

