import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ServicesManager from '@/components/services/services-manager';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Services | KIMON CRM',
  description: 'Manage services and sync with SoftOne ERP',
};

export default async function ServicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Only allow certain roles to access services page
  if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
      <Suspense fallback={<ServicesManagerSkeleton />}>
        <ServicesManager />
      </Suspense>
    </div>
  );
}

function ServicesManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

