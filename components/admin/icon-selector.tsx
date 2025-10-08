"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Check } from "lucide-react";
import * as ReactIcons from "react-icons";
import { cn } from "@/lib/utils";

interface IconSelectorProps {
  value?: string;
  onChange: (icon: string) => void;
  placeholder?: string;
  className?: string;
}

// Popular icon categories
const ICON_CATEGORIES = {
  "General": [
    "FaHome", "FaUser", "FaUsers", "FaCog", "FaSearch", "FaPlus", "FaEdit", "FaTrash",
    "FaEye", "FaDownload", "FaUpload", "FaSave", "FaFile", "FaFolder", "FaCalendar"
  ],
  "Navigation": [
    "FaArrowLeft", "FaArrowRight", "FaArrowUp", "FaArrowDown", "FaChevronLeft", 
    "FaChevronRight", "FaChevronUp", "FaChevronDown", "FaBars", "FaTimes"
  ],
  "Business": [
    "FaBuilding", "FaBriefcase", "FaChartLine", "FaChartBar", "FaChartPie", 
    "FaDollarSign", "FaCreditCard", "FaShoppingCart", "FaBox", "FaTruck"
  ],
  "Communication": [
    "FaEnvelope", "FaPhone", "FaComment", "FaComments", "FaBell", "FaMailBulk",
    "FaWhatsapp", "FaTelegram", "FaFacebook", "FaTwitter", "FaLinkedin"
  ],
  "Media": [
    "FaImage", "FaVideo", "FaMusic", "FaPlay", "FaPause", "FaStop", "FaCamera",
    "FaMicrophone", "FaHeadphones", "FaFilm", "FaPhotoVideo"
  ],
  "Technology": [
    "FaDesktop", "FaLaptop", "FaMobile", "FaTablet", "FaServer", "FaDatabase",
    "FaCode", "FaTerminal", "FaWifi", "FaBluetooth", "FaUsb"
  ],
  "Interface": [
    "FaHeart", "FaStar", "FaThumbsUp", "FaThumbsDown", "FaFlag", "FaBookmark",
    "FaShare", "FaCopy", "FaPaste", "FaCut", "FaUndo", "FaRedo"
  ],
  "Security": [
    "FaLock", "FaUnlock", "FaShield", "FaKey", "FaFingerprint", "FaUserSecret",
    "FaEyeSlash", "FaExclamationTriangle", "FaCheckCircle", "FaTimesCircle"
  ]
};

export function IconSelector({ value, onChange, placeholder = "Select an icon", className }: IconSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("General");

  // Get all available icons
  const allIcons = useMemo(() => {
    const icons: string[] = [];
    Object.values(ICON_CATEGORIES).forEach(categoryIcons => {
      icons.push(...categoryIcons);
    });
    return icons;
  }, []);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!searchTerm) return ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES] || [];
    
    return allIcons.filter(iconName =>
      iconName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedCategory, allIcons]);

  // Get selected icon component
  const SelectedIcon = value ? (ReactIcons as any)[value] : null;

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start", className)}
        >
          <div className="flex items-center space-x-2">
            {SelectedIcon ? (
              <SelectedIcon className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{value || placeholder}</span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
          <DialogDescription>
            Choose an icon from the available collection
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Categories */}
          {!searchTerm && (
            <div className="flex flex-wrap gap-2">
              {Object.keys(ICON_CATEGORIES).map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Icons Grid */}
          <ScrollArea className="h-96">
            <div className="grid grid-cols-8 gap-2 p-2">
              {filteredIcons.map(iconName => {
                const IconComponent = (ReactIcons as any)[iconName];
                const isSelected = value === iconName;
                
                return (
                  <Button
                    key={iconName}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-12 w-12 p-0 flex items-center justify-center",
                      isSelected && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleIconSelect(iconName)}
                    title={iconName}
                  >
                    {IconComponent ? (
                      <IconComponent className="h-5 w-5" />
                    ) : (
                      <span className="text-xs">?</span>
                    )}
                    {isSelected && (
                      <Check className="absolute top-1 right-1 h-3 w-3" />
                    )}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
          
          {filteredIcons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No icons found matching "{searchTerm}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

