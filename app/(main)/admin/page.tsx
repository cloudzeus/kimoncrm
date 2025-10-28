import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Settings, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ADMIN DASHBOARD</h1>
        <p className="text-muted-foreground">
          Manage your system and users
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">USERS</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Manage users and permissions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/departments">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DEPARTMENTS</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Manage departments
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/positions">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">POSITIONS</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Manage work positions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/menu">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MENU</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Configure navigation menu
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

