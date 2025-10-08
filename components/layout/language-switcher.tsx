"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/translation-context";
import { useState, useEffect } from "react";

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage, languages } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-9 px-3 gap-2 text-sm font-medium",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-colors duration-200",
          "border border-transparent hover:border-border/50",
          "rounded-lg"
        )}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">🌐</span>
        <span className="hidden md:inline text-xs text-muted-foreground">
          EN
        </span>
      </Button>
    );
  }

  const handleLanguageChange = (language: typeof currentLanguage) => {
    setLanguage(language);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 text-sm font-medium",
            "hover:bg-accent hover:text-accent-foreground",
            "transition-colors duration-200",
            "border border-transparent hover:border-border/50",
            "rounded-lg"
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag}</span>
          <span className="hidden md:inline text-xs text-muted-foreground">
            {currentLanguage.code.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-2"
        sideOffset={8}
      >
        <div className="space-y-1">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md",
                "hover:bg-accent hover:text-accent-foreground",
                "cursor-pointer transition-colors duration-150",
                currentLanguage.code === language.code && "bg-accent"
              )}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {language.nativeName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {language.name}
                  </span>
                </div>
              </div>
              {currentLanguage.code === language.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
