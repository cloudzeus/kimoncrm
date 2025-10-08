import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updatePricingSchema = z.object({
  cost: z.number().min(0).optional(),
  manualB2BPrice: z.number().min(0).nullable().optional(),
  manualRetailPrice: z.number().min(0).nullable().optional(),
  reason: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cost, manualB2BPrice, manualRetailPrice, reason } = updatePricingSchema.parse(body);

    // Verify product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        brand: { select: { name: true } },
        manufacturer: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product pricing
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(cost !== undefined && { cost }),
        ...(manualB2BPrice !== undefined && { manualB2BPrice }),
        ...(manualRetailPrice !== undefined && { manualRetailPrice }),
      },
    });

    // Record pricing history
    await prisma.productPricingHistory.create({
      data: {
        productId: params.id,
        cost: cost !== undefined ? cost : existingProduct.cost,
        b2bPrice: manualB2BPrice !== undefined ? manualB2BPrice : existingProduct.manualB2BPrice,
        retailPrice: manualRetailPrice !== undefined ? manualRetailPrice : existingProduct.manualRetailPrice,
        reason: reason || 'Manual price update',
        changedBy: session.user.id,
      },
    });

    // Calculate new pricing
    const productsWithPricing = await calculateProductPricing([updatedProduct]);

    return NextResponse.json(productsWithPricing[0]);
  } catch (error) {
    console.error('Error updating product pricing:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update product pricing' },
      { status: 500 }
    );
  }
}

async function calculateProductPricing(products: any[]) {
  return Promise.all(
    products.map(async (product) => {
      // Get applicable markup rules
      const markupRules = await getApplicableMarkupRules(product);
      const activeRule = markupRules.find((rule: any) => rule.isActive);
      
      let calculatedB2BPrice = 0;
      let calculatedRetailPrice = 0;
      
      if (product.cost && activeRule) {
        calculatedB2BPrice = product.cost * (1 + activeRule.b2bMarkupPercent / 100);
        calculatedRetailPrice = product.cost * (1 + activeRule.retailMarkupPercent / 100);
        
        // Apply min/max constraints
        if (activeRule.minB2BPrice && calculatedB2BPrice < activeRule.minB2BPrice) {
          calculatedB2BPrice = activeRule.minB2BPrice;
        }
        if (activeRule.maxB2BPrice && calculatedB2BPrice > activeRule.maxB2BPrice) {
          calculatedB2BPrice = activeRule.maxB2BPrice;
        }
        if (activeRule.minRetailPrice && calculatedRetailPrice < activeRule.minRetailPrice) {
          calculatedRetailPrice = activeRule.minRetailPrice;
        }
        if (activeRule.maxRetailPrice && calculatedRetailPrice > activeRule.maxRetailPrice) {
          calculatedRetailPrice = activeRule.maxRetailPrice;
        }
      }

      return {
        ...product,
        calculatedB2BPrice: product.manualB2BPrice || calculatedB2BPrice,
        calculatedRetailPrice: product.manualRetailPrice || calculatedRetailPrice,
      };
    })
  );
}

async function getApplicableMarkupRules(product: any) {
  const rules = [];

  // Get brand-specific rules
  if (product.brandId) {
    const brandRules = await prisma.markupRule.findMany({
      where: {
        type: 'brand',
        targetId: product.brandId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });
    rules.push(...brandRules);
  }

  // Get manufacturer-specific rules
  if (product.manufacturerId) {
    const manufacturerRules = await prisma.markupRule.findMany({
      where: {
        type: 'manufacturer',
        targetId: product.manufacturerId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });
    rules.push(...manufacturerRules);
  }

  // Get category-specific rules
  if (product.categoryId) {
    const categoryRules = await prisma.markupRule.findMany({
      where: {
        type: 'category',
        targetId: product.categoryId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });
    rules.push(...categoryRules);
  }

  // Get global rules
  const globalRules = await prisma.markupRule.findMany({
    where: {
      type: 'global',
      isActive: true,
    },
    orderBy: { priority: 'desc' },
  });
  rules.push(...globalRules);

  // Sort by priority (highest first)
  return rules.sort((a, b) => b.priority - a.priority);
}
