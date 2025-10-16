/**
 * Products Management Page
 * Server-side component that renders the products manager
 */

import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProductsManager from '@/components/products/products-manager';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'PRODUCTS - KIMON CRM',
  description: 'Manage products and sync with SoftOne ERP',
};

export default async function ProductsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Only allow certain roles to access products page
  if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight uppercase">PRODUCTS</h2>
          <p className="text-muted-foreground">
            Manage your products and sync with SoftOne ERP
          </p>
        </div>
      </div>
      <Suspense fallback={<ProductsManagerSkeleton />}>
        <ProductsManager />
      </Suspense>
    </div>
  );
}

function ProductsManagerSkeleton() {
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
