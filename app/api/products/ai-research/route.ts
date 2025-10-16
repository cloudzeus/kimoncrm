import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { researchProductInformation, insertProductToERP } from '@/lib/ai/product-research';

/**
 * POST /api/products/ai-research
 * Research product information using AI
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, eanCode, brand, insertToERP, brandId, categoryId, manufacturerId, unitId } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Product name is required'
      }, { status: 400 });
    }

    // Research product information using AI
    const researchResult = await researchProductInformation({
      name,
      eanCode,
      brand: brand || '', // Brand is optional, AI will try to detect it
    });

    let erpInsertResult = null;
    
    // Insert to ERP if requested and all required data is provided
    if (insertToERP && brandId && categoryId && manufacturerId && unitId) {
      erpInsertResult = await insertProductToERP(researchResult, {
        brandId,
        categoryId,
        manufacturerId,
        unitId,
      });
    }

    return NextResponse.json({
      success: true,
      data: researchResult,
      erpInsert: erpInsertResult,
      message: 'Product information researched successfully'
    });

  } catch (error) {
    console.error('Error in AI product research:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to research product information'
    }, { status: 500 });
  }
}
