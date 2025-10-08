import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['Todo', 'InProgress', 'Review', 'Done']),
  fromStatus: z.string().optional(),
  note: z.string().optional(),
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
            assignedUsers: {
              include: {
                user: true,
              },
            },
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

    // Check permissions - manager, assignee, or creator can change status
    const isManager = ['ADMIN', 'MANAGER'].includes(session.user.role);
    const isAssignee = task.assigneeId === session.user.id;
    const isCreator = task.createdBy === session.user.id;
    const canChangeStatus = isManager || isAssignee || isCreator;

    if (!canChangeStatus) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status, fromStatus, note } = updateStatusSchema.parse(body);

    // Don't update if status hasn't changed
    if (task.status === status) {
      return NextResponse.json(task);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update task status
      const updatedTask = await tx.task.update({
        where: { id: params.taskId },
        data: { status },
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

      // Record status change
      await tx.taskStatusChange.create({
        data: {
          taskId: params.taskId,
          fromStatus: fromStatus || task.status,
          toStatus: status,
          changedBy: session.user.id,
          note,
        },
      });

      return updatedTask;
    });

    // Send email notifications
    try {
      await sendStatusChangeNotifications({
        task: result,
        project: task.project,
        fromStatus: fromStatus || task.status,
        toStatus: status,
        changedBy: session.user,
      });
    } catch (emailError) {
      console.error('Failed to send status change notifications:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating task status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    );
  }
}

async function sendStatusChangeNotifications({
  task,
  project,
  fromStatus,
  toStatus,
  changedBy,
}: {
  task: any;
  project: any;
  fromStatus: string;
  toStatus: string;
  changedBy: any;
}) {
  const notifications = [];

  // Notify project manager
  const projectManagers = project.assignedUsers
    .filter((assignment: any) => assignment.role === 'Manager')
    .map((assignment: any) => assignment.user.email);

  for (const email of projectManagers) {
    notifications.push({
      to: email,
      subject: `Task Status Changed: ${task.title}`,
      type: 'task_status_changed',
      data: {
        task,
        project,
        fromStatus,
        toStatus,
        changedBy: changedBy.name || changedBy.email,
      },
    });
  }

  // Notify company contact (if B2B project)
  if (project.contact?.email) {
    notifications.push({
      to: project.contact.email,
      subject: `Project Update: ${task.title}`,
      type: 'task_status_changed',
      data: {
        task,
        project,
        fromStatus,
        toStatus,
        changedBy: changedBy.name || changedBy.email,
      },
    });
  }

  // Notify assignee (if different from person who changed status)
  if (task.assignee?.email && task.assignee.email !== changedBy.email) {
    notifications.push({
      to: task.assignee.email,
      subject: `Your Task Status Changed: ${task.title}`,
      type: 'task_status_changed',
      data: {
        task,
        project,
        fromStatus,
        toStatus,
        changedBy: changedBy.name || changedBy.email,
      },
    });
  }

  // Send all notifications
  for (const notification of notifications) {
    try {
      console.log(`Email notification: ${notification.type}`, {
        to: notification.to,
        subject: notification.subject,
        taskTitle: task.title,
        projectName: project.name,
      });
      
      // TODO: Implement actual email sending
      // await sendEmail(notification);
    } catch (error) {
      console.error(`Failed to send notification to ${notification.to}:`, error);
    }
  }
}

