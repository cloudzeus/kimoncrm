import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  assigneeId: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  estimatedHours: z.number().min(0).nullable().optional(),
  createdBy: z.string(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        assignedUsers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is assigned to project or is manager/admin
    const isAssigned = project.assignedUsers.some(
      assignment => assignment.userId === session.user.id
    );
    const isManager = ['ADMIN', 'MANAGER'].includes(session.user.role);

    if (!isAssigned && !isManager) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: params.id },
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
      orderBy: [
        { status: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

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

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        assignedUsers: true,
        company: true,
        contact: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const taskData = createTaskSchema.parse(body);

    // Verify assignee is part of project team (if assigned)
    if (taskData.assigneeId) {
      const isAssigneeInProject = project.assignedUsers.some(
        assignment => assignment.userId === taskData.assigneeId
      );
      
      if (!isAssigneeInProject) {
        return NextResponse.json(
          { error: 'Assignee must be part of the project team' },
          { status: 400 }
        );
      }
    }

    // Get the next order number for the project
    const lastTask = await prisma.task.findFirst({
      where: { projectId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (lastTask?.order || 0) + 1;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        projectId: params.id,
        order: nextOrder,
        dueAt: taskData.dueAt ? new Date(taskData.dueAt) : null,
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

    // Send email notification to assignee if assigned
    if (task.assigneeId) {
      try {
        await sendTaskNotification({
          type: 'task_assigned',
          task,
          project,
          recipientEmail: task.assignee.email,
        });
      } catch (emailError) {
        console.error('Failed to send task assignment email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

async function sendTaskNotification({
  type,
  task,
  project,
  recipientEmail,
}: {
  type: 'task_assigned' | 'task_status_changed';
  task: any;
  project: any;
  recipientEmail: string;
}) {
  // This would integrate with your email service
  // For now, we'll just log the notification
  console.log(`Email notification: ${type}`, {
    recipientEmail,
    taskTitle: task.title,
    projectName: project.name,
  });
  
  // TODO: Implement actual email sending
  // await sendEmail({
  //   to: recipientEmail,
  //   subject: `Task ${type === 'task_assigned' ? 'Assigned' : 'Status Changed'}: ${task.title}`,
  //   template: type,
  //   data: { task, project }
  // });
}

