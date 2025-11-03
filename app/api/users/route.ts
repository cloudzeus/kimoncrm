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
    
    // Handle comma-separated values for roles
    const parsedRoles: string[] = [];
    roles.forEach(role => {
      if (role.includes(',')) {
        parsedRoles.push(...role.split(',').map(r => r.trim()));
      } else {
        parsedRoles.push(role);
      }
    });
    
    // Handle comma-separated values for departments
    const parsedDepartments: string[] = [];
    departments.forEach(dept => {
      if (dept.includes(',')) {
        parsedDepartments.push(...dept.split(',').map(d => d.trim()));
      } else {
        parsedDepartments.push(dept);
      }
    });

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (parsedRoles.length > 0) {
      where.role = { in: parsedRoles };
    }

    if (parsedDepartments.length > 0) {
      console.log("Fetching users from departments:", parsedDepartments);
      // Include child departments (e.g., Presales is a child of Sales)
      const departmentRecords = await prisma.department.findMany({
        where: {
          OR: [
            { name: { in: parsedDepartments } },
            { parent: { name: { in: parsedDepartments } } },
          ],
        },
        select: { id: true },
      });
      
      const departmentIds = departmentRecords.map(d => d.id);
      console.log("Department IDs found:", departmentIds);
      
      where.departmentId = { in: departmentIds };
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
