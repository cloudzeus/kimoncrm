"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserPlus, 
  Target, 
  Package, 
  ShoppingCart, 
  FileText, 
  Ticket, 
  FolderOpen, 
  Mail, 
  Calendar,
  ClipboardList,
  Settings,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard },
  { name: "COMPANIES", href: "/companies", icon: Building2 },
  { name: "CONTACTS", href: "/contacts", icon: Users },
  { name: "LEADS", href: "/leads", icon: UserPlus },
  { name: "OPPORTUNITIES", href: "/opportunities", icon: Target },
  { name: "PRODUCTS", href: "/products", icon: Package },
  { name: "ORDERS", href: "/orders", icon: ShoppingCart },
  { name: "QUOTES", href: "/quotes", icon: FileText },
  { name: "TICKETS", href: "/tickets", icon: Ticket },
  { name: "PROJECTS", href: "/projects", icon: FolderOpen },
  { name: "EMAIL", href: "/emails", icon: Mail },
  { name: "CALENDAR", href: "/calendar", icon: Calendar },
  { name: "SURVEYS", href: "/surveys", icon: ClipboardList },
  { name: "SETTINGS", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-brand">AIC CRM</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-brand text-brand-foreground"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start">
          <LogOut className="mr-3 h-4 w-4" />
          SIGN OUT
        </Button>
      </div>
    </div>
  );
}
