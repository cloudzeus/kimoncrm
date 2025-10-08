import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  createdBy: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.projectTemplate.findMany({
      where: { isActive: true },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            estimatedHours: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching project templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const templateData = createTemplateSchema.parse({
      ...body,
      createdBy: session.user.id,
    });

    const template = await prisma.projectTemplate.create({
      data: templateData,
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        tasks: true,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating project template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project template' },
      { status: 500 }
    );
  }
}

