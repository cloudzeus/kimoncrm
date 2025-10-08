import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";

const createCompanySchema = z.object({
  name: z.string().min(1),
  vatId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

const updateCompanySchema = createCompanySchema.partial();

// GET /api/companies
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { vatId: { contains: search } },
        { email: { contains: search } },
      ],
    } : {};

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: {
            select: {
              contacts: true,
              leads: true,
              opportunities: true,
              tickets: true,
              orders: true,
              quotes: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Companies GET error:', error);
    return NextResponse.json(
      { message: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST /api/companies
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const data = createCompanySchema.parse(body);

    const company = await prisma.company.create({
      data: {
        ...data,
        email: data.email || undefined,
        website: data.website || undefined,
      },
      include: {
        _count: {
          select: {
            contacts: true,
            leads: true,
            opportunities: true,
            tickets: true,
            orders: true,
            quotes: true,
          },
        },
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Companies POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create company" },
      { status: 500 }
    );
  }
}

// Bulk POST /api/companies
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    
    const body = await request.json();
    const companies = z.array(createCompanySchema).parse(body);

    const results = await Promise.allSettled(
      companies.map(async (companyData) => {
        return await prisma.company.create({
          data: {
            ...companyData,
            email: companyData.email || undefined,
            website: companyData.website || undefined,
          },
        });
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      message: `Imported ${successful} companies, ${failed} failed`,
      successful,
      failed,
    });
  } catch (error) {
    console.error('Companies bulk POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to import companies" },
      { status: 500 }
    );
  }
}
