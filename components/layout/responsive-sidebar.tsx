"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  Menu, 
  X,
  Home,
  Settings,
  Users,
  Package,
  FileText,
  Calendar,
  Mail,
  Phone,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as FaIcons from "react-icons/fa";
import * as Fa6Icons from "react-icons/fa6";
import * as MdIcons from "react-icons/md";
import * as IoIcons from "react-icons/io5";
import * as HiIcons from "react-icons/hi2";
import * as BsIcons from "react-icons/bs";
import * as AiIcons from "react-icons/ai";
import * as BiIcons from "react-icons/bi";
import * as CiIcons from "react-icons/ci";
import * as DiIcons from "react-icons/di";
import * as FiIcons from "react-icons/fi";
import * as GiIcons from "react-icons/gi";
import * as GoIcons from "react-icons/go";
import * as GrIcons from "react-icons/gr";
import * as ImIcons from "react-icons/im";
import * as LuIcons from "react-icons/lu";
import * as PiIcons from "react-icons/pi";
import * as RiIcons from "react-icons/ri";
import * as RxIcons from "react-icons/rx";
import * as SiIcons from "react-icons/si";
import * as SlIcons from "react-icons/sl";
import * as TbIcons from "react-icons/tb";
import * as VscIcons from "react-icons/vsc";
import * as WiIcons from "react-icons/wi";
import { toast } from "sonner";

// Combine all icon collections for rendering
const ALL_ICON_COLLECTIONS = [
  FaIcons,
  Fa6Icons,
  MdIcons,
  IoIcons,
  HiIcons,
  BsIcons,
  AiIcons,
  BiIcons,
  CiIcons,
  DiIcons,
  FiIcons,
  GiIcons,
  GoIcons,
  GrIcons,
  ImIcons,
  LuIcons,
  PiIcons,
  RiIcons,
  RxIcons,
  SiIcons,
  SlIcons,
  TbIcons,
  VscIcons,
  WiIcons,
];

interface MenuGroup {
  id: string;
  name: string;
  key: string;
  icon?: string;
  iconColor?: string;
  order: number;
  isCollapsible: boolean;
  isActive: boolean;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  key: string;
  path?: string;
  icon?: string;
  iconColor?: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  parentId?: string;
  children?: MenuItem[];
  permissions?: MenuPermission[];
}

interface MenuPermission {
  id: string;
  role: string;
  canView: boolean;
  canEdit: boolean;
}

interface ResponsiveSidebarProps {
  userRole: string;
  className?: string;
}

export function ResponsiveSidebar({ userRole, className }: ResponsiveSidebarProps) {
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  // Load menu data
  useEffect(() => {
    loadMenuData();
  }, [userRole]);

  // Avoid hydration mismatch for Radix Sheet IDs by rendering Sheet after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/menu/groups?includeItems=true&role=${userRole}`);
      if (response.ok) {
        const data = await response.json();
        setMenuGroups(data.menuGroups);
        
        // Auto-expand groups with few items
        const autoExpanded = new Set<string>();
        data.menuGroups.forEach((group: MenuGroup) => {
          if (group.items.length <= 3) {
            autoExpanded.add(group.id);
          }
        });
        setExpandedGroups(autoExpanded);
      } else {
        toast.error("Failed to load menu");
      }
    } catch (error) {
      console.error("Load menu error:", error);
      toast.error("Error loading menu");
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation
  const handleNavigation = (item: MenuItem) => {
    if (item.isExternal && item.path) {
      window.open(item.path, '_blank');
    } else if (item.path) {
      router.push(item.path);
      setIsMobileOpen(false); // Close mobile menu
    }
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Toggle item expansion (for sub-items)
  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Render icon component
  const renderIcon = (iconName?: string, iconColor?: string, fallback?: React.ReactNode) => {
    if (!iconName) return fallback;
    
    try {
      // Search through all icon collections to find the icon
      for (const collection of ALL_ICON_COLLECTIONS) {
        const IconComponent = (collection as any)[iconName];
        if (IconComponent) {
          return <IconComponent className="h-4 w-4" style={{ color: iconColor }} />;
        }
      }
    } catch (error) {
      console.warn(`Icon ${iconName} not found`);
    }
    
    return fallback;
  };

  // Check if user has permission
  const hasPermission = (item: MenuItem, action: 'view' | 'edit' = 'view') => {
    if (!item.permissions) return true; // Default to true if no permissions set
    
    const permission = item.permissions.find(p => p.role === userRole);
    if (!permission) return true; // Default to true if no specific permission
    
    return action === 'view' ? permission.canView : permission.canEdit;
  };

  // Render menu item
  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasPermission(item, 'view')) return null;

    const isActive = pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id} className="space-y-1">
        <div
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground",
            level > 0 && "ml-4"
          )}
          onClick={() => hasChildren ? toggleItem(item.id) : handleNavigation(item)}
        >
          {hasChildren ? (
            <Button variant="ghost" size="sm" className="h-auto p-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-4 h-4 flex items-center justify-center">
              {renderIcon(item.icon, item.iconColor)}
            </div>
          )}
          
          <span className="flex-1 text-[10px]">{item.name}</span>
          
          {item.isExternal && (
            <Badge variant="secondary" className="text-xs">
              External
            </Badge>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render sidebar content
  const renderSidebarContent = () => (
    <ScrollArea className="flex-1 px-3 py-4">
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-10 bg-muted rounded-md mb-2" />
                <div className="space-y-1 ml-4">
                  <div className="h-8 bg-muted rounded-md" />
                  <div className="h-8 bg-muted rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : menuGroups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm">
              No menu items available
            </div>
          </div>
        ) : (
          menuGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const shouldShowItems = !group.isCollapsible || isExpanded || group.items.length <= 3;

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header */}
                <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.id)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start space-x-3 px-3 py-2 h-auto",
                        "hover:bg-accent hover:text-accent-foreground"
                      )}
                      disabled={!group.isCollapsible}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        {renderIcon(group.icon, group.iconColor, <Home className="h-4 w-4" />)}
                      </div>
                      <span className="flex-1 text-left font-medium text-[12px]">{group.name}</span>
                      {group.isCollapsible && group.items.length > 3 && (
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-1">
                    {group.items.map(item => renderMenuItem(item))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-50",
        "border-r bg-background",
        className
      )}>
        {renderSidebarContent()}
      </div>

      {/* Mobile Sidebar (client-only to prevent hydration ID mismatch) */}
      {isMounted && (
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden fixed top-4 left-4 z-50"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Mobile Content */}
              {renderSidebarContent()}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Spacer */}
      <div className="hidden md:block md:w-64 flex-shrink-0" />
    </>
  );
}

