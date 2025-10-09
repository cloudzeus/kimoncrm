import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
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
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate pricing for each product
    const productsWithPricing = await Promise.all(
      products.map(async (product) => {
        // Get applicable markup rules
        const markupRules = await getApplicableMarkupRules(product);
        const activeRule = markupRules.find(rule => rule.isActive);
        
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

    return NextResponse.json(productsWithPricing);
  } catch (error) {
    console.error('Error fetching products pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products pricing' },
      { status: 500 }
    );
  }
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
