import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { VatCodesManager } from "@/components/vat-codes/vat-codes-manager";

export default async function VatCodesPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">VAT CODES</h1>
          <p className="text-muted-foreground">
            Manage VAT rates and synchronize with SoftOne ERP system.
          </p>
        </div>
        
        <VatCodesManager />
      </div>
    </div>
  );
}
