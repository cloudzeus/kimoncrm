import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

/**
 * GET /api/admin/users - Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const role = searchParams.get('role') as UserRole | null;
    const departmentId = searchParams.get('departmentId');
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (isActive !== null) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: true,
          workPosition: true,
          branch: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Remove sensitive data
    const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);

    return NextResponse.json({
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users/[id] - Update user (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      role, 
      departmentId, 
      workPositionId, 
      branchId, 
      isActive,
      name,
      phone,
      workPhone,
      mobile 
    } = body;

    // Normalize empty/sentinel values to null for optional relations
    const normalizedDepartmentId = departmentId && departmentId !== '' && departmentId !== 'none' ? departmentId : null;
    const normalizedWorkPositionId = workPositionId && workPositionId !== '' && workPositionId !== 'none' ? workPositionId : null;
    const normalizedBranchId = branchId && branchId !== '' && branchId !== 'none' ? branchId : null;

    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate department exists if provided
    if (normalizedDepartmentId) {
      const department = await prisma.department.findUnique({
        where: { id: normalizedDepartmentId },
      });
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 400 });
      }
    }

    // Validate work position exists if provided
    if (normalizedWorkPositionId) {
      const workPosition = await prisma.workPosition.findUnique({
        where: { id: normalizedWorkPositionId },
      });
      if (!workPosition) {
        return NextResponse.json({ error: 'Work position not found' }, { status: 400 });
      }
    }

    // Validate branch exists if provided
    if (normalizedBranchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: normalizedBranchId },
      });
      if (!branch) {
        return NextResponse.json({ error: 'Branch not found' }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        departmentId: normalizedDepartmentId,
        workPositionId: normalizedWorkPositionId,
        branchId: normalizedBranchId,
        isActive,
        name,
        phone,
        workPhone,
        mobile,
        updatedAt: new Date(),
      },
      include: {
        department: true,
        workPosition: true,
        branch: true,
      },
    });

    // Remove sensitive data
    const { passwordHash, ...userProfile } = updatedUser;

    return NextResponse.json({ 
      user: userProfile,
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id] - Deactivate user (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Soft delete - just deactivate the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: 'User deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
