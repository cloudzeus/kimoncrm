import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProductsTable } from "@/components/products/products-table";

export default async function ProductsPage() {
  const session = await auth();

  if (!session || !['ADMIN', 'MANAGER', 'USER'].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog with advanced filtering, sorting, and export capabilities.
          </p>
        </div>
        
        <ProductsTable />
      </div>
    </div>
  );
}
