import { Suspense } from "react";
import { SuppliersManager } from "@/components/suppliers/suppliers-manager";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "SUPPLIERS | AIC CRM",
  description: "Manage suppliers and sync with SoftOne ERP",
};

export default function SuppliersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          SUPPLIERS
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage supplier database and sync with SoftOne ERP
        </p>
      </div>

      <Suspense fallback={<SuppliersManagerSkeleton />}>
        <SuppliersManager />
      </Suspense>
    </div>
  );
}

function SuppliersManagerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

