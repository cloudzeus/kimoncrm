import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/guards';
import { DepartmentsManager } from '@/components/admin/departments-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';

export default async function AdminDepartmentsPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            DEPARTMENTS MANAGEMENT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[600px]" />}>
            <DepartmentsManager />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

