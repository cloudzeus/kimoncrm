import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createMarkupRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['brand', 'manufacturer', 'category', 'global']),
  targetId: z.string().nullable().optional(),
  priority: z.number().default(0),
  b2bMarkupPercent: z.number().min(0).max(1000),
  retailMarkupPercent: z.number().min(0).max(1000),
  minB2BPrice: z.number().min(0).nullable().optional(),
  maxB2BPrice: z.number().min(0).nullable().optional(),
  minRetailPrice: z.number().min(0).nullable().optional(),
  maxRetailPrice: z.number().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.markupRule.findMany({
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
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform rules to include target name
    const rulesWithTargetName = rules.map(rule => ({
      ...rule,
      targetName: rule.brand?.name || rule.manufacturer?.name || rule.category?.name || 'All Products',
    }));

    return NextResponse.json(rulesWithTargetName);
  } catch (error) {
    console.error('Error fetching markup rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markup rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ruleData = createMarkupRuleSchema.parse(body);

    // Validate targetId for non-global rules
    if (ruleData.type !== 'global' && !ruleData.targetId) {
      return NextResponse.json(
        { error: 'Target ID is required for non-global rules' },
        { status: 400 }
      );
    }

    // Verify target exists for non-global rules
    if (ruleData.type !== 'global' && ruleData.targetId) {
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

    const rule = await prisma.markupRule.create({
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
      ...rule,
      targetName: rule.brand?.name || rule.manufacturer?.name || rule.category?.name || 'All Products',
    });
  } catch (error) {
    console.error('Error creating markup rule:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create markup rule' },
      { status: 500 }
    );
  }
}
