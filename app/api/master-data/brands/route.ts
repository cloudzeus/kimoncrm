import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { updateMtrMark } from "@/lib/softone/client";
import { requireAuth } from "@/lib/auth/guards";

const createBrandSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  website: z.boolean().optional(),
  logoId: z.string().optional(),
  imageId: z.string().optional(),
  translations: z.array(z.object({
    languageCode: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

const updateBrandSchema = createBrandSchema.extend({
  id: z.string(),
});

// GET /api/master-data/brands
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search ? {
      name: { contains: search },
    } : {};

    const brands = await prisma.brand.findMany({
      where,
      include: {
        logo: true,
        image: true,
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

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

// POST /api/master-data/brands
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { translations, ...brandData } = createBrandSchema.parse(body);

    const brand = await prisma.brand.create({
      data: {
        ...brandData,
        translations: translations ? {
          create: translations.map(t => ({
            languageCode: t.languageCode,
            name: t.name,
            description: t.description,
          }))
        } : undefined,
      },
      include: {
        logo: true,
        image: true,
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
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error('Brands POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create brand" },
      { status: 500 }
    );
  }
}

// PUT /api/master-data/brands
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const { id, translations, ...brandData } = updateBrandSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { message: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Load existing to compute a minimal diff
    const existing = await prisma.brand.findUnique({
      where: { id },
      select: { id: true, name: true, logoId: true, imageId: true, erpId: true, code: true, softoneCode: true }
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Brand not found" },
        { status: 404 }
      );
    }

    // Handle translations update only when actual entries provided; otherwise preserve existing
    let translationUpdates;
    if (translations) {
      const creates = translations
        .map(t => ({ languageCode: t.languageCode, description: t.description }))
        .filter(t => t.languageCode);
      if (creates.length > 0) {
        await prisma.brandTranslation.deleteMany({ where: { brandId: id } });
        translationUpdates = { create: creates };
      }
    }

    // Build a safe update payload (avoid spreading unexpected large fields)
    const safeUpdate: any = {};
    const websiteRequested = typeof (brandData as any).website === 'boolean' ? (brandData as any).website : undefined;
    if (typeof brandData.name === 'string' && brandData.name !== existing.name) {
      safeUpdate.name = brandData.name;
    }
    if (typeof (brandData as any).logoId === 'string' && (brandData as any).logoId !== existing.logoId) {
      safeUpdate.logo = { connect: { id: (brandData as any).logoId } };
    }
    if (typeof (brandData as any).imageId === 'string' && (brandData as any).imageId !== existing.imageId) {
      safeUpdate.image = { connect: { id: (brandData as any).imageId } };
    }
    // Do not update master description via this route (translations handle long text)
    // Intentionally ignore incoming description to avoid DB size constraints

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        ...safeUpdate,
        ...(translationUpdates && { translations: translationUpdates }),
      },
      include: {
        logo: true,
        image: true,
        translations: { include: { language: true } },
        _count: { select: { products: true } },
      },
    });

    // Apply website in a separate safe attempt so missing column never blocks updates
    if (websiteRequested !== undefined) {
      try {
        await prisma.brand.update({ where: { id }, data: { website: websiteRequested } });
      } catch (_e) {
        // ignore if schema/client doesn't have the field yet
      }
    }

    // If name changed, update SoftOne ERP (company=1000, sodtype=51)
    try {
      if (safeUpdate.name && safeUpdate.name.trim().length > 0) {
        const erpId = existing.erpId || existing.code || existing.softoneCode || existing.id;
        await updateMtrMark({
          company: 1000,
          sodtype: 51,
          mtrmark: erpId,
          name: safeUpdate.name.trim(),
        });
      }
    } catch (erpError) {
      console.error('SoftOne updateMtrMark error:', erpError);
      // Do not fail the request if ERP call fails; continue
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error('Brands PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update brand" },
      { status: 500 }
    );
  }
}

// DELETE /api/master-data/brands
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "Brand ID is required" },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error('Brands DELETE error:', error);
    return NextResponse.json(
      { message: "Failed to delete brand" },
      { status: 500 }
    );
  }
}
