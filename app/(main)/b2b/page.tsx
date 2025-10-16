import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { B2BDashboard } from '@/components/b2b/b2b-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default async function B2BPage() {
  const session = await auth();

  if (!session || session.user.role !== 'B2B') {
    redirect('/sign-in');
  }

  // Fetch B2B user with contact and company data
  const rawB2bUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      contact: {
        include: {
          company: {
            include: {
              supportContracts: {
                include: {
                  sla: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!rawB2bUser?.contact?.company) {
    redirect('/dashboard');
  }

  // Serialize dates for client component
  const b2bUser = {
    ...rawB2bUser,
    contact: {
      id: rawB2bUser.contact.id,
      firstName: rawB2bUser.contact.name?.split(' ')[0] || null,
      lastName: rawB2bUser.contact.name?.split(' ').slice(1).join(' ') || null,
      email: rawB2bUser.contact.email,
      phone: rawB2bUser.contact.workPhone || rawB2bUser.contact.homePhone || null,
      mobile: rawB2bUser.contact.mobilePhone || null,
      jobTitle: rawB2bUser.contact.title || null,
      department: null,
      company: {
        ...rawB2bUser.contact.company,
        supportContracts: rawB2bUser.contact.company.supportContracts.map(contract => ({
          ...contract,
          startDate: contract.startDate.toISOString(),
          endDate: contract.endDate ? contract.endDate.toISOString() : null,
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
          sla: {
            ...contract.sla,
            createdAt: contract.sla.createdAt.toISOString(),
            updatedAt: contract.sla.updatedAt.toISOString(),
          },
        })),
      },
    },
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">B2B PORTAL</h1>
          <p className="text-muted-foreground">
            Welcome back, {b2bUser.contact.firstName} {b2bUser.contact.lastName}
          </p>
        </div>
      </div>

      <Suspense fallback={<B2BDashboardSkeleton />}>
        <B2BDashboard 
          userId={session.user.id}
          company={b2bUser.contact.company}
          contact={b2bUser.contact}
        />
      </Suspense>
    </div>
  );
}

function B2BDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-16 mt-2" />
            <Skeleton className="h-3 w-24 mt-1" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
