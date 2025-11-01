/**
 * API Route: Products CRUD
 * GET /api/products - List all products with filters
 * POST /api/products - Create a new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { createProductInErp } from '@/lib/softone/products';
import { insertProductToSoftOne } from '@/lib/softone/insert-product';

/**
 * GET /api/products
 * List all products with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Disable caching for fresh data every time
    const responseHeaders = new Headers();
    responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    responseHeaders.set('Pragma', 'no-cache');
    responseHeaders.set('Expires', '0');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const searchField = searchParams.get('searchField') || 'all';
    const isActive = searchParams.get('isActive');
    const brandId = searchParams.get('brandId');
    const manufacturerId = searchParams.get('manufacturerId');
    const categoryId = searchParams.get('categoryId');
    const brandIds = searchParams.getAll('brandIds');
    const categoryIds = searchParams.getAll('categoryIds');
    const mtrgroupCodes = searchParams.getAll('mtrgroupCodes');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeSpecs = searchParams.get('includeSpecs') === 'true';

    // Build where clause
    const where: any = {};
    const andConditions: any[] = [];

    // Handle search with case-insensitive matching
    if (search) {
      const searchLower = search.toLowerCase();
      
      console.log('🔍 Search params:', { search, searchLower, searchField });
      
      // Add wildcards to search term for proper LIKE matching
      const searchTerm = `%${search}%`;
      
      if (searchField === 'all') {
        andConditions.push({
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { code1: { contains: search } },
            { code2: { contains: search } },
            { mtrl: { contains: search } },
          ],
        });
      } else if (searchField === 'name') {
        andConditions.push({ name: { contains: search } });
      } else if (searchField === 'brand') {
        andConditions.push({ brand: { name: { contains: search } } });
      } else if (searchField === 'category') {
        andConditions.push({ category: { name: { contains: search } } });
      } else if (searchField === 'ean') {
        andConditions.push({ code1: { contains: search } });
      } else if (searchField === 'mfrcode') {
        andConditions.push({ code2: { contains: search } });
      } else if (searchField === 'code') {
        andConditions.push({ code: { contains: search } });
      }
      
      console.log('🔍 Search added to conditions, total conditions:', andConditions.length);
    }

    // Handle isActive filter
    if (isActive !== null && isActive !== undefined) {
      andConditions.push({ isActive: isActive === 'true' });
    }

    // Debug: Log filter parameters
    console.log('🔍 Filter params:', { brandId, brandIds, manufacturerId, categoryId, categoryIds, mtrgroupCodes });

    // Handle single brand filter
    if (brandId) {
      console.log('🔍 Adding single brand filter:', brandId);
      andConditions.push({ brandId: brandId });
    }

    // Handle single manufacturer filter
    if (manufacturerId) {
      andConditions.push({ manufacturerId: manufacturerId });
    }

    // Handle single category filter
    if (categoryId) {
      andConditions.push({ categoryId: categoryId });
    }

    // Multi-select filters (these override single filters)
    if (brandIds.length > 0) {
      console.log('🔍 Adding multi-select brand filter:', brandIds);
      // Remove single brandId condition if exists
      const brandIdIndex = andConditions.findIndex(c => c.brandId && typeof c.brandId === 'string');
      if (brandIdIndex !== -1) {
        console.log('🔍 Removing single brand filter at index:', brandIdIndex);
        andConditions.splice(brandIdIndex, 1);
      }
      andConditions.push({ brandId: { in: brandIds } });
    }

    if (categoryIds.length > 0) {
      // Remove single categoryId condition if exists
      const categoryIdIndex = andConditions.findIndex(c => c.categoryId && typeof c.categoryId === 'string');
      if (categoryIdIndex !== -1) {
        andConditions.splice(categoryIdIndex, 1);
      }
      andConditions.push({ categoryId: { in: categoryIds } });
    }

    if (mtrgroupCodes.length > 0) {
      console.log('Filtering by mtrgroups:', mtrgroupCodes);
      andConditions.push({ mtrgroup: { in: mtrgroupCodes } });
    }

    // Combine all AND conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Debug logging
    console.log('🔍 Product filters:', JSON.stringify(where, null, 2));
    console.log('🔍 Sort by:', sortBy, sortOrder);

    // Get total count
    const total = await prisma.product.count({ where });

    // Build orderBy
    let orderBy: any = {};
    if (sortBy === 'brand') {
      orderBy = { brand: { name: sortOrder } };
    } else if (sortBy === 'manufacturer') {
      orderBy = { manufacturer: { name: sortOrder } };
    } else if (sortBy === 'category') {
      orderBy = { category: { name: sortOrder } };
    } else {
      // For nullable fields like code1, handle null sorting properly
      orderBy = { [sortBy]: sortOrder };
    }

    console.log('🔍 Order by:', JSON.stringify(orderBy, null, 2));

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        mtrl: true,
        code: true,
        code1: true,
        code2: true,
        name: true,
        mtrmark: true,
        mtrmanfctr: true,
        mtrcategory: true,
        mtrgroup: true,
        isActive: true,
        brandId: true,
        manufacturerId: true,
        categoryId: true,
        unitId: true,
        width: true,
        length: true,
        height: true,
        weight: true,
        createdAt: true,
        updatedAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manufacturer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            shortcut: true,
          },
        },
        translations: {
          select: {
            id: true,
            languageCode: true,
            name: true,
            description: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            isDefault: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        specifications: includeSpecs ? {
          select: {
            id: true,
            specKey: true,
            order: true,
            translations: {
              select: {
                languageCode: true,
                specName: true,
                specValue: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        } : true,
        stock: {
          select: {
            id: true,
            warehouse: true,
            qty: true,
            updatedAt: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
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
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow ADMIN, MANAGER, and EMPLOYEE roles
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const {
      code,
      code1,
      code2,
      name,
      brandId,
      manufacturerId,
      manufacturerCode, // Using code instead of ID
      categoryId,
      mtrgroupCode, // MtrGroup code
      unitId,
      width,
      length,
      height,
      weight,
      isActive,
      insertToERP,
    } = body;

    // If inserting to ERP, we don't need code (it will be generated)
    // If not inserting to ERP, code is required
    if (!insertToERP && !code) {
      return NextResponse.json(
        { error: 'Code is required when not inserting to ERP' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate products based on code, code1 (EAN), or code2 (Manufacturer Code)
    const duplicateChecks = [];
    
    if (code) {
      duplicateChecks.push({ code });
    }
    if (code1) {
      duplicateChecks.push({ code1 });
    }
    if (code2) {
      duplicateChecks.push({ code2 });
    }

    if (duplicateChecks.length > 0) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          OR: duplicateChecks
        },
        select: {
          id: true,
          name: true,
          code: true,
          code1: true,
          code2: true,
        }
      });

      if (existingProduct) {
        const duplicateFields = [];
        if (code && existingProduct.code === code) duplicateFields.push(`ERP Code: ${code}`);
        if (code1 && existingProduct.code1 === code1) duplicateFields.push(`EAN Code: ${code1}`);
        if (code2 && existingProduct.code2 === code2) duplicateFields.push(`Manufacturer Code: ${code2}`);
        
        return NextResponse.json(
          { 
            error: `Product already exists with: ${duplicateFields.join(', ')}\n\nExisting Product:\nID: ${existingProduct.id}\nName: ${existingProduct.name}\nERP Code: ${existingProduct.code || 'N/A'}\nEAN: ${existingProduct.code1 || 'N/A'}\nManufacturer Code: ${existingProduct.code2 || 'N/A'}`,
            isDuplicate: true,
            duplicateProduct: {
              id: existingProduct.id,
              name: existingProduct.name,
              code: existingProduct.code,
              code1: existingProduct.code1,
              code2: existingProduct.code2,
            }
          },
          { status: 400 }
        );
      }
    }

    // Get brand code for mtrmark
    let mtrmark = null;
    if (brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: { code: true },
      });
      mtrmark = brand?.code;
    }

    // Get manufacturer ID and code from manufacturerCode (if not already provided)
    let finalManufacturerId = manufacturerId;
    let mtrmanfctr = null;
    if (manufacturerCode && !finalManufacturerId) {
      const manufacturer = await prisma.manufacturer.findUnique({
        where: { code: manufacturerCode },
        select: { id: true, code: true },
      });
      finalManufacturerId = manufacturer?.id || null;
      mtrmanfctr = manufacturer?.code || null;
    } else if (finalManufacturerId) {
      const manufacturer = await prisma.manufacturer.findUnique({
        where: { id: finalManufacturerId },
        select: { code: true },
      });
      mtrmanfctr = manufacturer?.code || null;
    }

    // Find default unit if not provided
    let finalUnitId = unitId;
    if (!finalUnitId) {
      const defaultUnit = await prisma.unit.findFirst({
        where: { softoneCode: '101' }
      });
      finalUnitId = defaultUnit?.id || null;
    }

    // If insertToERP is true, use ERP insertion flow
    if (insertToERP) {
      // Validate required fields for ERP insertion
      if (!brandId || !categoryId || !finalManufacturerId || !finalUnitId) {
        return NextResponse.json(
          { error: 'Brand, Category, Manufacturer, and Unit are required for ERP insertion' },
          { status: 400 }
        );
      }

      // Step 1: Create product in database first (without mtrl and code)
      const product = await prisma.product.create({
        data: {
          code: code || null, // Will be updated after ERP insertion
          code1: code1 || null,
          code2: code2 || null,
          name,
          mtrmark,
          mtrmanfctr,
          mtrgroup: mtrgroupCode || null, // Add mtrgroup
          brandId,
          manufacturerId: finalManufacturerId,
          categoryId,
          unitId: finalUnitId,
          width: width ? parseFloat(width) : null,
          length: length ? parseFloat(length) : null,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          isActive: isActive !== undefined ? isActive : true,
        },
        include: {
          brand: true,
          manufacturer: true,
          category: true,
          unit: true,
        },
      });

      // Step 2: Insert to ERP
      const erpResult = await insertProductToSoftOne({
        name,
        code1: code1 || '',
        code2: code2 || '',
        brandId,
        categoryId,
        manufacturerId: finalManufacturerId,
        unitId: finalUnitId,
        width: width ? parseFloat(width) : undefined,
        length: length ? parseFloat(length) : undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        isActive: isActive !== undefined ? isActive : true,
      });

      if (erpResult.success) {
        // Step 3: Update product with MTRL and generated code from ERP
        const updatedProduct = await prisma.product.update({
          where: { id: product.id },
          data: {
            mtrl: erpResult.mtrl?.toString() || null,
            code: erpResult.generatedCode || code || null,
          },
          include: {
            brand: true,
            manufacturer: true,
            category: true,
            unit: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: updatedProduct,
          erpInserted: true,
          message: 'Product created and inserted to ERP successfully'
        });
      } else {
        // ERP insertion failed, but product is still saved in DB
        return NextResponse.json({
          success: true,
          data: product,
          erpInserted: false,
          erpError: erpResult.error,
          message: 'Product created in database, but ERP insertion failed: ' + erpResult.error
        });
      }
    }

    // Regular database-only creation (no ERP)
    const product = await prisma.product.create({
      data: {
        code,
        code1,
        code2,
        name,
        mtrmark,
        mtrmanfctr,
        mtrgroup: mtrgroupCode || null, // Add mtrgroup
        brandId,
        manufacturerId: finalManufacturerId,
        categoryId,
        unitId: finalUnitId,
        width: width ? parseFloat(width) : null,
        length: length ? parseFloat(length) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        brand: true,
        manufacturer: true,
        category: true,
        unit: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
      erpInserted: false,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

