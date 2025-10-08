import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MenuManager } from "@/components/admin/menu-manager";

export default async function MenuManagementPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Configure navigation menu items and permissions for different user roles.
          </p>
        </div>
        
        <MenuManager />
      </div>
    </div>
  );
}

