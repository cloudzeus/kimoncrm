import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateMarkupRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  type: z.enum(['brand', 'manufacturer', 'category', 'global']).optional(),
  targetId: z.string().nullable().optional(),
  priority: z.number().optional(),
  b2bMarkupPercent: z.number().min(0).max(1000).optional(),
  retailMarkupPercent: z.number().min(0).max(1000).optional(),
  minB2BPrice: z.number().min(0).nullable().optional(),
  maxB2BPrice: z.number().min(0).nullable().optional(),
  minRetailPrice: z.number().min(0).nullable().optional(),
  maxRetailPrice: z.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const { id } = await params;
const rule = await prisma.markupRule.findUnique({
      where: { id: id },
      include: {
        brand: {
          select: { name: true },
        },
        manufacturer: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Markup rule not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...rule,
      targetName: rule.brand?.name || rule.manufacturer?.name || rule.category?.name || 'All Products',
    });
  } catch (error) {
    console.error('Error fetching markup rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markup rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const { id } = await params;
const body = await request.json();
    const ruleData = updateMarkupRuleSchema.parse(body);

    // Verify rule exists
    const existingRule = await prisma.markupRule.findUnique({
      where: { id: id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Markup rule not found' }, { status: 404 });
    }

    // Validate targetId for non-global rules
    if (ruleData.type && ruleData.type !== 'global' && !ruleData.targetId) {
      return NextResponse.json(
        { error: 'Target ID is required for non-global rules' },
        { status: 400 }
      );
    }

    // Verify target exists for non-global rules
    if (ruleData.type && ruleData.type !== 'global' && ruleData.targetId) {
      let targetExists = false;
      
      switch (ruleData.type) {
        case 'brand':
          targetExists = await prisma.brand.findUnique({
            where: { id: ruleData.targetId },
          }) !== null;
          break;
        case 'manufacturer':
          targetExists = await prisma.manufacturer.findUnique({
            where: { id: ruleData.targetId },
          }) !== null;
          break;
        case 'category':
          targetExists = await prisma.category.findUnique({
            where: { id: ruleData.targetId },
          }) !== null;
          break;
      }

      if (!targetExists) {
        return NextResponse.json(
          { error: 'Target not found' },
          { status: 404 }
        );
      }
    }

    const updatedRule = await prisma.markupRule.update({
      where: { id: id },
      data: {
        ...ruleData,
        targetId: ruleData.type === 'global' ? null : ruleData.targetId,
      },
      include: {
        brand: {
          select: { name: true },
        },
        manufacturer: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      ...updatedRule,
      targetName: updatedRule.brand?.name || updatedRule.manufacturer?.name || updatedRule.category?.name || 'All Products',
    });
  } catch (error) {
    console.error('Error updating markup rule:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update markup rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const { id } = await params;
// Verify rule exists
    const existingRule = await prisma.markupRule.findUnique({
      where: { id: id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Markup rule not found' }, { status: 404 });
    }

    await prisma.markupRule.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Markup rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting markup rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete markup rule' },
      { status: 500 }
    );
  }
}
