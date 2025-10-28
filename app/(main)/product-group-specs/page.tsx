import { GroupSpecsManager } from "@/components/product-specs/group-specs-manager";

export default async function ProductGroupSpecsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PRODUCT GROUP SPECIFICATIONS</h1>
        <p className="text-muted-foreground">
          Manage specifications for each product group. Use AI to automatically detect relevant specs from your products.
        </p>
      </div>

      <GroupSpecsManager />
    </div>
  );
}
