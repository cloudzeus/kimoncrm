import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  UserPlus, 
  Target, 
  Package, 
  ShoppingCart, 
  FileText, 
  Ticket, 
  TrendingUp,
  Activity
} from "lucide-react";

interface DashboardContentProps {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export function DashboardContent({ user }: DashboardContentProps) {
  const stats = [
    {
      title: "COMPANIES",
      value: "0",
      description: "Total companies",
      icon: Building2,
      href: "/companies",
    },
    {
      title: "CONTACTS",
      value: "0",
      description: "Total contacts",
      icon: Users,
      href: "/contacts",
    },
    {
      title: "LEADS",
      value: "0",
      description: "Active leads",
      icon: UserPlus,
      href: "/leads",
    },
    {
      title: "OPPORTUNITIES",
      value: "0",
      description: "Open opportunities",
      icon: Target,
      href: "/opportunities",
    },
    {
      title: "PRODUCTS",
      value: "0",
      description: "Total products",
      icon: Package,
      href: "/products",
    },
    {
      title: "ORDERS",
      value: "0",
      description: "Pending orders",
      icon: ShoppingCart,
      href: "/orders",
    },
    {
      title: "QUOTES",
      value: "0",
      description: "Draft quotes",
      icon: FileText,
      href: "/quotes",
    },
    {
      title: "TICKETS",
      value: "0",
      description: "Open tickets",
      icon: Ticket,
      href: "/tickets",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DASHBOARD</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto">
                <a href={stat.href} className="text-brand hover:underline">
                  View all →
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>RECENT ACTIVITY</CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm">No recent activity</p>
                <p className="text-xs text-muted-foreground">
                  Start by creating your first record
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PERFORMANCE</CardTitle>
            <CardDescription>
              Key metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm">No data available</p>
                <p className="text-xs text-muted-foreground">
                  Metrics will appear as you add data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
