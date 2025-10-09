import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { updateMtrCategory } from "@/lib/softone/client";
import { requireAuth } from "@/lib/auth/guards";

const createCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
  softoneCode: z.string().optional(),
  translations: z.array(z.object({
    languageCode: z.string(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })).optional(),
});

const updateCategorySchema = createCategorySchema.extend({ id: z.string() }).partial().extend({ id: z.string() });

// GET /api/master-data/categories
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const parentId = searchParams.get('parentId') || '';

    const where = {
      ...(search && { name: { contains: search } }),
      ...(parentId === 'null' && { parentId: null }),
      ...(parentId && parentId !== 'null' && { parentId }),
    };

    const categories = await prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
        translations: {
          include: {
            language: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/master-data/categories
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { translations, ...data } = createCategorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        ...data,
        translations: translations ? {
          create: translations.map(t => ({
            languageCode: t.languageCode,
            name: t.name ?? undefined,
            description: t.description ?? undefined,
          }))
        } : undefined,
      },
      include: {
        parent: true,
        children: true,
        translations: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT /api/master-data/categories
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { id, translations, ...data } = updateCategorySchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 }
      );
    }

    // Optional translations update
    let translationUpdates;
    if (translations && translations.length > 0) {
      await prisma.categoryTranslation.deleteMany({ where: { categoryId: id } });
      translationUpdates = {
        create: translations
          .map(t => ({ languageCode: t.languageCode, name: t.name ?? undefined, description: t.description ?? undefined }))
          .filter(t => (t.name && t.name.trim()) || (t.description && t.description.trim()))
      };
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        ...(translationUpdates && { translations: translationUpdates })
      },
      include: {
        parent: true,
        children: true,
        translations: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // ERP update only when name changed
    try {
      if (typeof data.name === 'string' && data.name.trim().length > 0) {
        const mtrmark = category.softoneCode || category.id;
        await updateMtrCategory({ mtrmark, name: data.name.trim() });
      }
    } catch (e) {
      console.error('SoftOne updateMtrCategory error:', e);
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Categories PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/master-data/categories
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
