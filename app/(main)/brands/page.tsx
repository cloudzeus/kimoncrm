import { BrandsTable } from "@/components/brands/brands-table";

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BRANDS</h1>
        <p className="text-muted-foreground">
          Manage your brand master data including logos, images, and descriptions.
        </p>
      </div>
      
      <BrandsTable />
    </div>
  );
}
