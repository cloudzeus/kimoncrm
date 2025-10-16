/**
 * Manufacturers Management Page
 * Server-side component that renders the manufacturers manager
 */

import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ManufacturersManager from '@/components/manufacturers/manufacturers-manager';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'MANUFACTURERS - KIMON CRM',
  description: 'Manage manufacturers and sync with SoftOne ERP',
};

export default async function ManufacturersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Only allow certain roles
  if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight uppercase">MANUFACTURERS</h2>
          <p className="text-muted-foreground">
            Manage manufacturers and sync with SoftOne ERP
          </p>
        </div>
      </div>
      <Suspense fallback={<ManufacturersManagerSkeleton />}>
        <ManufacturersManager />
      </Suspense>
    </div>
  );
}

function ManufacturersManagerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}

