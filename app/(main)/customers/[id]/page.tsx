import { Suspense } from "react";
import { CustomerDetailView } from "@/components/customers/customer-detail-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "CUSTOMER DETAILS | AIC CRM",
  description: "View customer information",
};

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<CustomerDetailSkeleton />}>
        <CustomerDetailView customerId={id} />
      </Suspense>
    </div>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

