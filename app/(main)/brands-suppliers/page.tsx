import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth/guards';
import { BrandSupplierManager } from '@/components/brands/brand-supplier-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2 } from 'lucide-react';

export default async function BrandsSuppliersPage() {
  await requireAuth();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            BRANDS & SUPPLIERS RELATIONS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[600px]" />}>
            <BrandSupplierManager />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
