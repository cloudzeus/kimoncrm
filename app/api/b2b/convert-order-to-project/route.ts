import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const convertOrderToProjectSchema = z.object({
  orderId: z.string(),
  projectData: z.object({
    name: z.string(),
    description: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }),
  assignedUserIds: z.array(z.string()).min(1, 'At least one user must be assigned'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, projectData, assignedUserIds } = convertOrderToProjectSchema.parse(body);

    // Verify the order exists and get its details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        company: true,
        contact: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify assigned users exist and have appropriate roles
    const assignedUsers = await prisma.user.findMany({
      where: {
        id: { in: assignedUserIds },
        role: { in: ['USER', 'MANAGER'] },
        isActive: true,
      },
    });

    if (assignedUsers.length !== assignedUserIds.length) {
      return NextResponse.json(
        { error: 'Some assigned users are invalid or inactive' },
        { status: 400 }
      );
    }

    // Create the project with assigned users in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the project
      const project = await tx.project.create({
        data: {
          companyId: order.companyId,
          contactId: order.contactId,
          orderId: order.id,
          name: projectData.name,
          description: projectData.description || `Project for order ${order.orderNo || order.id.slice(-8)}`,
          startAt: projectData.startDate,
          endAt: projectData.endDate,
          status: 'Active',
        },
      });

      // Create project assignments for each user
      const projectAssignments = await Promise.all(
        assignedUserIds.map((userId) =>
          tx.projectAssignment.create({
            data: {
              projectId: project.id,
              userId,
              role: 'Member',
            },
          })
        )
      );

      // Create initial tasks based on order items (optional)
      const tasks = await Promise.all(
        order.items.map((item) =>
          tx.task.create({
            data: {
              projectId: project.id,
              title: `Install ${item.product.name}`,
              description: `Installation task for ${item.product.name} (SKU: ${item.product.sku})`,
              status: 'Todo',
            },
          })
        )
      );

      // Update order status to indicate it's been converted
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'In Installation',
        },
      });

      // Add order event
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          status: 'In Installation',
          note: `Order converted to project: ${project.name}`,
        },
      });

      return {
        project,
        projectAssignments,
        tasks,
      };
    });

    return NextResponse.json(result.project);
  } catch (error) {
    console.error('Error converting order to project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to convert order to project' },
      { status: 500 }
    );
  }
}
