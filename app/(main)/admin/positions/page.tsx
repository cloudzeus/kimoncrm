import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/guards';
import { PositionsManager } from '@/components/admin/positions-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase } from 'lucide-react';

export default async function AdminPositionsPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            WORK POSITIONS MANAGEMENT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[600px]" />}>
            <PositionsManager />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

