import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const { id } = await params;
const template = await prisma.projectTemplate.findUnique({
      where: { id: id },
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
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching project template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project template' },
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
// Verify template exists
    const existingTemplate = await prisma.projectTemplate.findUnique({
      where: { id: id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData = updateTemplateSchema.parse(body);

    const template = await prisma.projectTemplate.update({
      where: { id: id },
      data: updateData,
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
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating project template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update project template' },
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
// Verify template exists
    const existingTemplate = await prisma.projectTemplate.findUnique({
      where: { id: id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.projectTemplate.update({
      where: { id: id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting project template:', error);
    return NextResponse.json(
      { error: 'Failed to delete project template' },
      { status: 500 }
    );
  }
}

