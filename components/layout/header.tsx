"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, User, Settings, LogOut } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/contexts/translation-context";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ProfileSettingsModal } from "@/components/profile/profile-settings-modal";

export function Header() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Get user data from session
  const user = session?.user || {
    name: "Guest",
    email: "guest@example.com",
    role: "USER",
    image: null,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "EMPLOYEE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "USER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "B2B":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/sign-in" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  // Prevent hydration mismatch by not rendering interactive elements until mounted
  if (!isMounted) {
    return (
      <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t("header.search")}
              className="pl-10 w-64"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>
          
          <Button variant="ghost" className="relative h-9 px-3 gap-3">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">U</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium">Loading...</span>
              <Badge variant="secondary" className="text-xs">
                USER
              </Badge>
            </div>
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("header.search")}
            className="pl-10 w-64"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <LanguageSwitcher />
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
            3
          </span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 px-3 gap-3">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image || ""} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user.name}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getRoleColor(user.role)}`}
                >
                  {user.role}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>{t("header.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("header.settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("header.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Profile Settings Modal */}
      <ProfileSettingsModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
}
