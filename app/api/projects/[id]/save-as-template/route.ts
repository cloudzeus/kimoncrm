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
    const { name, description } = saveAsTemplateSchema.parse(body);

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: params.id },
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
    const result = await prisma.$transaction(async (tx) => {
      // Create the template
      const template = await tx.projectTemplate.create({
        data: {
          name,
          description: description || `Template created from project: ${project.name}`,
          createdBy: session.user.id,
        },
      });

      // Create template tasks
      const templateTasks = await Promise.all(
        project.tasks.map(task =>
          tx.task.create({
            data: {
              title: task.title,
              description: task.description,
              priority: task.priority,
              estimatedHours: task.estimatedHours,
              projectId: null, // Template tasks don't belong to a project
              createdBy: session.user.id,
              templateId: template.id,
              order: task.order,
            },
          })
        )
      );

      return { template, tasks: templateTasks };
    });

    return NextResponse.json({
      message: `Successfully created template "${name}" with ${result.tasks.length} tasks`,
      template: result.template,
    });
  } catch (error) {
    console.error('Error saving project as template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save project as template' },
      { status: 500 }
    );
  }
}

