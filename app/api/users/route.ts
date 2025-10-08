import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roles = searchParams.getAll('roles');
    const departments = searchParams.getAll('departments');

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (roles.length > 0) {
      where.role = { in: roles };
    }

    if (departments.length > 0) {
      where.department = {
        name: { in: departments },
      };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        department: {
          select: {
            name: true,
          },
        },
        workPosition: {
          select: {
            title: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
        { email: 'asc' },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
