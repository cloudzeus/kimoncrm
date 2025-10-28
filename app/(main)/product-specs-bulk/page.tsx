import { BulkSpecFillManager } from "@/components/product-specs/bulk-spec-fill-manager";

export default async function BulkProductSpecsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BULK PRODUCT SPECIFICATIONS</h1>
        <p className="text-muted-foreground">
          Search for products and generate specifications based on their product group specifications.
        </p>
      </div>

      <BulkSpecFillManager />
    </div>
  );
}
