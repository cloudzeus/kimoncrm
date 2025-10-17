import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const saveAsTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
});

export async function POST(
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
    const { name, description } = saveAsTemplateSchema.parse(body);

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: id },
      include: {
        tasks: {
          where: {
            templateId: null, // Only include tasks that weren't created from a template
          },
        },
        assignedUsers: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create template from project
    // Note: Template tasks metadata should be stored separately as JSON,
    // actual Task records will be created when template is applied to a project
    const template = await prisma.projectTemplate.create({
      data: {
        name,
        description: description || `Template created from project: ${project.name}. Tasks: ${project.tasks.map(t => t.title).join(', ')}`,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: `Successfully created template "${name}" from project with ${project.tasks.length} tasks`,
      template,
    });
  } catch (error) {
    console.error('Error saving project as template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save project as template' },
      { status: 500 }
    );
  }
}

