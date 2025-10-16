import { Suspense } from "react";
import { SupplierDetailView } from "@/components/suppliers/supplier-detail-view";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "SUPPLIER DETAILS | AIC CRM",
  description: "View and edit supplier details",
};

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          SUPPLIER DETAILS
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage supplier information
        </p>
      </div>

      <Suspense fallback={<SupplierDetailSkeleton />}>
        <SupplierDetailView supplierId={id} />
      </Suspense>
    </div>
  );
}

function SupplierDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
