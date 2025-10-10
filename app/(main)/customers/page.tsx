import { Suspense } from "react";
import { CustomersManager } from "@/components/customers/customers-manager";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "CUSTOMERS | AIC CRM",
  description: "Manage customers and sync with SoftOne ERP",
};

export default function CustomersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          CUSTOMERS
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage customer database and sync with SoftOne ERP
        </p>
      </div>

      <Suspense fallback={<CustomersManagerSkeleton />}>
        <CustomersManager />
      </Suspense>
    </div>
  );
}

function CustomersManagerSkeleton() {
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

