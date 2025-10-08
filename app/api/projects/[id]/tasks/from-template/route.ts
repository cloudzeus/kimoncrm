import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createFromTemplateSchema = z.object({
  templateId: z.string(),
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
    const { templateId } = createFromTemplateSchema.parse(body);

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        assignedUsers: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify template exists and is active
    const template = await prisma.projectTemplate.findUnique({
      where: { id: templateId, isActive: true },
      include: {
        tasks: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found or inactive' }, { status: 404 });
    }

    // Get the current highest order number for the project
    const lastTask = await prisma.task.findFirst({
      where: { projectId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    let nextOrder = (lastTask?.order || 0) + 1;

    // Create tasks from template
    const tasks = await prisma.$transaction(
      template.tasks.map(task => 
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            projectId: params.id,
            createdBy: session.user.id,
            templateId: template.id,
            order: nextOrder++,
          },
          include: {
            assignee: {
              select: {
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: `Successfully created ${tasks.length} tasks from template`,
      tasks,
    });
  } catch (error) {
    console.error('Error creating tasks from template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create tasks from template' },
      { status: 500 }
    );
  }
}

