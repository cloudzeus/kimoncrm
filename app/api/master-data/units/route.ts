import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { updateMtrUnit } from "@/lib/softone/client";

const createUnitSchema = z.object({
  name: z.string().min(1),
  shortcut: z.string().optional(),
  qdecimals: z.number().int().min(0).max(6).optional(),
  softoneCode: z.string().optional(),
  translations: z.array(z.object({
    languageCode: z.string(),
    name: z.string().nullable().optional(),
  })).optional(),
});

const updateUnitSchema = createUnitSchema.extend({ id: z.string() }).partial().extend({ id: z.string() });

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const units = await prisma.unit.findMany({
      where: search ? { OR: [ { name: { contains: search } }, { shortcut: { contains: search } } ] } : undefined,
      include: {
        translations: { include: { language: true } },
        _count: { select: { products: true, quotes: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ units });
  } catch (error) {
    console.error('Units GET error:', error);
    return NextResponse.json({ message: 'Failed to fetch units' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { translations, ...data } = createUnitSchema.parse(body);

    const unit = await prisma.unit.create({
      data: {
        ...data,
        translations: translations ? {
          create: translations.map(t => ({ languageCode: t.languageCode, name: t.name ?? undefined }))
        } : undefined,
      },
      include: { translations: true },
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error('Units POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create unit' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { id, translations, ...data } = updateUnitSchema.parse(body);
    if (!id) return NextResponse.json({ message: 'Unit ID is required' }, { status: 400 });

    let translationUpdates;
    if (translations && translations.length > 0) {
      await prisma.unitTranslation.deleteMany({ where: { unitId: id } });
      translationUpdates = { create: translations.map(t => ({ languageCode: t.languageCode, name: t.name ?? undefined })) };
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: { ...data, ...(translationUpdates && { translations: translationUpdates }) },
      include: { translations: true },
    });

    try {
      if (typeof data.name === 'string' && unit.softoneCode) {
        await updateMtrUnit({ mtrunit: unit.softoneCode, name: data.name });
      }
    } catch (e) {
      console.error('SoftOne updateMtrUnit error:', e);
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Units PUT error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid data', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update unit' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'Unit ID is required' }, { status: 400 });
    await prisma.unit.delete({ where: { id } });
    return NextResponse.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Units DELETE error:', error);
    return NextResponse.json({ message: 'Failed to delete unit' }, { status: 500 });
  }
}
