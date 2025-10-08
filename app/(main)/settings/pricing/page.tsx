import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PricingManager } from '@/components/admin/pricing-manager';
import { MarkupRulesManager } from '@/components/admin/markup-rules-manager';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Settings } from 'lucide-react';

export default async function PricingPage() {
  const session = await auth();

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PRICING MANAGEMENT</h1>
          <p className="text-muted-foreground">
            Manage product pricing, markup rules, and margins
          </p>
        </div>
      </div>

      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pricing" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span>PRODUCT PRICING</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>MARKUP RULES</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <Suspense fallback={<PricingManagerSkeleton />}>
            <PricingManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="rules">
          <Suspense fallback={<MarkupRulesSkeleton />}>
            <MarkupRulesManager />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PricingManagerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>PRICING MANAGEMENT</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MarkupRulesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>MARKUP RULES MANAGEMENT</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
