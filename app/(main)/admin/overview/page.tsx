import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  Settings, 
  Package, 
  LayoutDashboard,
  TrendingUp,
  MapPin,
  FileText,
  ListTodo,
  Mail,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const adminSections = [
    {
      title: "DASHBOARD",
      description: "Comprehensive view of all activities",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      color: "text-blue-500",
    },
    {
      title: "USERS",
      description: "Manage users and permissions",
      icon: Users,
      href: "/admin/users",
      color: "text-purple-500",
    },
    {
      title: "DEPARTMENTS",
      description: "Manage departments",
      icon: Building2,
      href: "/admin/departments",
      color: "text-green-500",
    },
    {
      title: "POSITIONS",
      description: "Manage work positions",
      icon: Package,
      href: "/admin/positions",
      color: "text-orange-500",
    },
    {
      title: "MENU CONFIGURATION",
      description: "Configure navigation menu",
      icon: Settings,
      href: "/settings/menu",
      color: "text-gray-500",
    },
    {
      title: "LEADS",
      description: "View and manage all leads",
      icon: TrendingUp,
      href: "/leads",
      color: "text-yellow-500",
    },
    {
      title: "CUSTOMERS",
      description: "Manage customer database",
      icon: Briefcase,
      href: "/customers",
      color: "text-pink-500",
    },
    {
      title: "SITE SURVEYS",
      description: "View all site surveys",
      icon: MapPin,
      href: "/site-surveys",
      color: "text-red-500",
    },
    {
      title: "PROJECTS",
      description: "Manage all projects",
      icon: ListTodo,
      href: "/projects",
      color: "text-indigo-500",
    },
    {
      title: "PRODUCTS",
      description: "Manage product catalog",
      icon: ShoppingCart,
      href: "/products",
      color: "text-teal-500",
    },
    {
      title: "EMAIL SETTINGS",
      description: "Configure email integration",
      icon: Mail,
      href: "/settings/email",
      color: "text-cyan-500",
    },
    {
      title: "NOTES & DOCUMENTS",
      description: "View all communications",
      icon: FileText,
      href: "/admin/dashboard?tab=notes",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ADMIN CONTROL PANEL</h1>
        <p className="text-muted-foreground">
          Manage your system, users, and view comprehensive analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {section.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${section.color}`} />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="shadow-lg border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-blue-500" />
            QUICK ACCESS
          </CardTitle>
          <CardDescription>
            Most frequently used admin features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <Link href="/admin/dashboard">
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">ADMIN DASHBOARD</h3>
                      <p className="text-xs text-muted-foreground">
                        View all activities, tasks, leads, and surveys
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/users">
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="font-semibold">USER MANAGEMENT</h3>
                      <p className="text-xs text-muted-foreground">
                        Add, edit, and manage user accounts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

