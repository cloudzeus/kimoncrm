/**
 * API Route: Product Images Management
 * GET /api/products/[id]/images - Get all images for a product
 * POST /api/products/[id]/images - Upload new image
 * DELETE /api/products/[id]/images - Delete image
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { bunnyPut, bunnyDelete } from '@/lib/bunny/upload';

/**
 * GET /api/products/[id]/images
 * Get all images for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const images = await prisma.productImage.findMany({
      where: {
        productId: id,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/images
 * Upload new product image
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get product to verify it exists and get alt text
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        translations: {
          where: {
            languageCode: 'el', // Use Greek short description for alt
          },
          select: {
            shortDescription: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isDefault = formData.get('isDefault') === 'true';
    const order = parseInt(formData.get('order') as string || '0');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedCode = product.code?.replace(/[^a-zA-Z0-9]/g, '_') || 'product';
    const filename = `${sanitizedCode}_${timestamp}.webp`;
    const bunnyPath = `products/${filename}`;

    // Upload to BunnyCDN
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await bunnyPut(bunnyPath, fileBuffer);

    // Get alt text from Greek translation short description
    let altText = product.translations[0]?.shortDescription || product.name;
    
    // Truncate alt text to max 255 characters to fit database column
    if (altText && altText.length > 255) {
      altText = altText.substring(0, 252) + '...';
    }

    // If this is set as default, unset all other defaults
    if (isDefault) {
      await prisma.productImage.updateMany({
        where: {
          productId: id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create image record
    const productImage = await prisma.productImage.create({
      data: {
        productId: id,
        url: uploadResult.url,
        alt: altText || null,
        isDefault,
        order,
      },
    });

    return NextResponse.json({
      success: true,
      data: productImage,
    });
  } catch (error) {
    console.error('Error uploading product image:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]/images
 * Delete product image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get image
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Verify image belongs to this product
    if (image.productId !== id) {
      return NextResponse.json(
        { error: 'Image does not belong to this product' },
        { status: 400 }
      );
    }

    // Extract filename from URL
    const urlParts = image.url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const bunnyPath = `products/${filename}`;

    // Delete from BunnyCDN
    try {
      await bunnyDelete(bunnyPath);
    } catch (error) {
      console.error('Error deleting from BunnyCDN:', error);
      // Continue with database deletion even if CDN delete fails
    }

    // Delete from database
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

