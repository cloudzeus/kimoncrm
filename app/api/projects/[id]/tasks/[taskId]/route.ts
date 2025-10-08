import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  estimatedHours: z.number().min(0).nullable().optional(),
  actualHours: z.number().min(0).nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify task exists and get project info
    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        project: {
          include: {
            assignedUsers: true,
            company: true,
            contact: true,
          },
        },
        assignee: true,
        creator: true,
      },
    });

    if (!task || task.projectId !== params.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check permissions
    const isManager = ['ADMIN', 'MANAGER'].includes(session.user.role);
    const isAssignee = task.assigneeId === session.user.id;
    const isCreator = task.createdBy === session.user.id;
    const canEdit = isManager || isAssignee || isCreator;

    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = updateTaskSchema.parse(body);

    // Verify assignee is part of project team (if changing assignee)
    if (updateData.assigneeId && isManager) {
      const isAssigneeInProject = task.project.assignedUsers.some(
        assignment => assignment.userId === updateData.assigneeId
      );
      
      if (!isAssigneeInProject) {
        return NextResponse.json(
          { error: 'Assignee must be part of the project team' },
          { status: 400 }
        );
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        ...updateData,
        dueAt: updateData.dueAt ? new Date(updateData.dueAt) : null,
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
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
    });

    if (!task || task.projectId !== params.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: params.taskId },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

