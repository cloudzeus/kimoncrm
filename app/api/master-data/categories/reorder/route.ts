import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number(), parentId: z.string().optional().nullable() }))
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { items } = reorderSchema.parse(body);

    await prisma.$transaction(items.map(i => prisma.category.update({
      where: { id: i.id },
      data: { order: i.order, parentId: i.parentId || null },
    })));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categories reorder error:', error);
    return NextResponse.json({ message: 'Failed to reorder categories' }, { status: 500 });
  }
}


