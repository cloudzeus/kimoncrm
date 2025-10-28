import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/guards';
import { UserManager } from '@/components/admin/user-manager';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

export default async function AdminUsersPage() {
  await requireAdmin();

  // Fetch initial data
  const [rawUsers, departments, workPositions, branches] = await Promise.all([
    prisma.user.findMany({
      include: {
        department: { select: { id: true, name: true } },
        workPosition: { select: { id: true, title: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.workPosition.findMany({
      select: { id: true, title: true, departmentId: true },
      orderBy: { title: 'asc' },
    }),
    prisma.branch.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Serialize dates to strings for client component
  const users = rawUsers.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    emailVerified: user.emailVerified?.toISOString() || null,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            USER MANAGEMENT
          </h1>
          <p className="text-muted-foreground">
            Manage users, their roles, departments, and positions
          </p>
        </div>
      </div>

      <Suspense fallback={<UserManagementSkeleton />}>
        <UserManager 
          initialUsers={users}
          departments={departments}
          workPositions={workPositions}
          branches={branches}
        />
      </Suspense>
    </div>
  );
}

function UserManagementSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
