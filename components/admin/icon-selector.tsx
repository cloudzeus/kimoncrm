"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

// Import React Icons collections
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

interface IconSelectorProps {
  value?: string;
  onChange: (icon: string) => void;
  placeholder?: string;
  className?: string;
}

// Combine all icon collections
const ALL_ICON_COLLECTIONS = {
  "FontAwesome 5": FaIcons,
  "FontAwesome 6": Fa6Icons,
  "Material Design": MdIcons,
  "Ionicons 5": IoIcons,
  "Heroicons 2": HiIcons,
  "Bootstrap": BsIcons,
  "Ant Design": AiIcons,
  "BoxIcons": BiIcons,
  "Circum Icons": CiIcons,
  "Devicons": DiIcons,
  "Feather": FiIcons,
  "Game Icons": GiIcons,
  "Github Octicons": GoIcons,
  "Grommet": GrIcons,
  "IcoMoon": ImIcons,
  "Lucide": LuIcons,
  "Phosphor Icons": PiIcons,
  "Remix Icons": RiIcons,
  "Radix Icons": RxIcons,
  "Simple Icons": SiIcons,
  "Simple Line Icons": SlIcons,
  "Tabler Icons": TbIcons,
  "VS Code Icons": VscIcons,
  "Weather Icons": WiIcons,
};

// Popular icon categories with a mix of the most useful icons
const ICON_CATEGORIES = {
  "General": [
    "FaHome", "FaUser", "FaUsers", "FaCog", "FaSearch", "FaPlus", "FaEdit", "FaTrash",
    "FaEye", "FaDownload", "FaUpload", "FaSave", "FaFile", "FaFolder", "FaCalendar",
    "MdHome", "MdPerson", "MdPeople", "MdSettings", "MdSearch", "MdAdd", "MdEdit", "MdDelete",
    "HiHome", "HiUser", "HiUsers", "HiCog", "HiMagnifyingGlass", "HiPlus", "HiPencil", "HiTrash",
    "LuHome", "LuUser", "LuUsers", "LuSettings", "LuSearch", "LuPlus", "LuEdit", "LuTrash2"
  ],
  "Navigation": [
    "FaArrowLeft", "FaArrowRight", "FaArrowUp", "FaArrowDown", "FaChevronLeft", 
    "FaChevronRight", "FaChevronUp", "FaChevronDown", "FaBars", "FaTimes",
    "MdArrowBack", "MdArrowForward", "MdArrowUpward", "MdArrowDownward", "MdMenu", "MdClose",
    "HiArrowLeft", "HiArrowRight", "HiArrowUp", "HiArrowDown", "HiBars3", "HiXMark",
    "LuArrowLeft", "LuArrowRight", "LuArrowUp", "LuArrowDown", "LuMenu", "LuX"
  ],
  "Business": [
    "FaBuilding", "FaBriefcase", "FaChartLine", "FaChartBar", "FaChartPie", 
    "FaDollarSign", "FaCreditCard", "FaShoppingCart", "FaBox", "FaTruck",
    "MdBusiness", "MdWork", "MdTrendingUp", "MdBarChart", "MdPieChart",
    "HiBuildingOffice", "HiBriefcase", "HiChartBar", "HiShoppingCart", "HiTruck",
    "LuBuilding", "LuBriefcase", "LuTrendingUp", "LuBarChart", "LuShoppingCart"
  ],
  "Communication": [
    "FaEnvelope", "FaPhone", "FaComment", "FaComments", "FaBell", "FaMailBulk",
    "FaWhatsapp", "FaTelegram", "FaFacebook", "FaTwitter", "FaLinkedin",
    "MdEmail", "MdPhone", "MdMessage", "MdNotifications", "MdChat",
    "HiEnvelope", "HiPhone", "HiChatBubbleLeft", "HiBell", "HiChatBubbleLeftRight",
    "LuMail", "LuPhone", "LuMessageSquare", "LuBell", "LuMessageCircle"
  ],
  "Media": [
    "FaImage", "FaVideo", "FaMusic", "FaPlay", "FaPause", "FaStop", "FaCamera",
    "FaMicrophone", "FaHeadphones", "FaFilm", "FaPhotoVideo",
    "MdImage", "MdVideoLibrary", "MdMusicNote", "MdPlayArrow", "MdPause", "MdStop",
    "HiPhoto", "HiVideoCamera", "HiMusicalNote", "HiPlay", "HiPause", "HiStop",
    "LuImage", "LuVideo", "LuMusic", "LuPlay", "LuPause", "LuSquare"
  ],
  "Technology": [
    "FaDesktop", "FaLaptop", "FaMobile", "FaTablet", "FaServer", "FaDatabase",
    "FaCode", "FaTerminal", "FaWifi", "FaBluetooth", "FaUsb",
    "MdComputer", "MdLaptop", "MdPhoneAndroid", "MdTablet", "MdStorage",
    "HiComputerDesktop", "HiDevicePhoneMobile", "HiServer", "HiCodeBracket",
    "LuMonitor", "LuLaptop", "LuSmartphone", "LuServer", "LuCode", "LuTerminal"
  ],
  "Interface": [
    "FaHeart", "FaStar", "FaThumbsUp", "FaThumbsDown", "FaFlag", "FaBookmark",
    "FaShare", "FaCopy", "FaPaste", "FaCut", "FaUndo", "FaRedo",
    "MdFavorite", "MdStar", "MdThumbUp", "MdThumbDown", "MdFlag", "MdBookmark",
    "HiHeart", "HiStar", "HiHandThumbUp", "HiHandThumbDown", "HiFlag", "HiBookmark",
    "LuHeart", "LuStar", "LuThumbsUp", "LuThumbsDown", "LuFlag", "LuBookmark"
  ],
  "Security": [
    "FaLock", "FaUnlock", "FaShield", "FaKey", "FaFingerprint", "FaUserSecret",
    "FaEyeSlash", "FaExclamationTriangle", "FaCheckCircle", "FaTimesCircle",
    "MdLock", "MdLockOpen", "MdSecurity", "MdVpnKey", "MdFingerprint",
    "HiLockClosed", "HiLockOpen", "HiShieldCheck", "HiKey", "HiFingerPrint",
    "LuLock", "LuUnlock", "LuShield", "LuKey", "LuFingerprint"
  ],
  "Files & Documents": [
    "FaFileText", "FaFileExcel", "FaFilePdf", "FaFileWord", "FaFilePowerpoint",
    "FaFolderOpen", "FaFolderPlus", "FaArchive", "FaPaperclip", "FaLink",
    "MdDescription", "MdFolder", "MdFolderOpen", "MdAttachFile", "MdLink",
    "HiDocumentText", "HiFolder", "HiFolderOpen", "HiPaperClip", "HiLink",
    "LuFileText", "LuFolder", "LuFolderOpen", "LuPaperclip", "LuLink"
  ],
  "Status & Actions": [
    "FaCheck", "FaCheckCircle", "FaCheckSquare", "FaCircle", "FaSquare", "FaMinus",
    "FaInfo", "FaInfoCircle", "FaExclamationCircle", "FaTimes", "FaBan",
    "MdCheck", "MdCheckCircle", "MdInfo", "MdWarning", "MdError",
    "HiCheck", "HiCheckCircle", "HiInformationCircle", "HiExclamationTriangle",
    "LuCheck", "LuCheckCircle", "LuInfo", "LuAlertTriangle", "LuXCircle"
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

  // Get all available icons from all collections for search
  const allAvailableIcons = useMemo(() => {
    const icons: string[] = [];
    Object.entries(ALL_ICON_COLLECTIONS).forEach(([collectionName, collection]) => {
      Object.keys(collection).forEach(iconName => {
        icons.push(iconName);
      });
    });
    return icons;
  }, []);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!searchTerm) {
      return ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES] || [];
    }
    
    // Search in all available icons
    return allAvailableIcons.filter(iconName =>
      iconName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedCategory, allAvailableIcons]);

  // Get selected icon component
  const SelectedIcon = useMemo(() => {
    if (!value) return null;
    
    // Search through all collections to find the icon
    for (const collection of Object.values(ALL_ICON_COLLECTIONS)) {
      if ((collection as any)[value]) {
        return (collection as any)[value];
      }
    }
    return null;
  }, [value]);

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start w-full", className)}
        >
          <div className="flex items-center space-x-2">
            {SelectedIcon ? (
              <SelectedIcon className="h-4 w-4" />
            ) : (
              <LucideIcons.Search className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">{value || placeholder}</span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>SELECT ICON</DialogTitle>
          <DialogDescription>
            Choose an icon from the available collection
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <LucideIcons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Categories */}
          {!searchTerm && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {Object.keys(ICON_CATEGORIES).map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {/* Icons Grid */}
          <ScrollArea className="h-[450px]">
            <div className="grid grid-cols-12 gap-2 p-2">
              {filteredIcons.map(iconName => {
                // Find the icon component in all collections
                let IconComponent = null;
                for (const collection of Object.values(ALL_ICON_COLLECTIONS)) {
                  if ((collection as any)[iconName]) {
                    IconComponent = (collection as any)[iconName];
                    break;
                  }
                }
                
                const isSelected = value === iconName;
                
                if (!IconComponent) return null;
                
                return (
                  <Button
                    key={iconName}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-12 w-full p-0 flex flex-col items-center justify-center gap-1 relative hover:bg-accent",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => handleIconSelect(iconName)}
                    title={iconName}
                  >
                    <IconComponent className="h-5 w-5" />
                    {isSelected && (
                      <Search className="absolute top-1 right-1 h-3 w-3" />
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
          
          {searchTerm && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              Showing {filteredIcons.length} icons from {Object.keys(ALL_ICON_COLLECTIONS).length} collections
            </div>
          )}
          
          {value && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {SelectedIcon && <SelectedIcon className="h-5 w-5" />}
                <span className="font-mono text-sm">{value}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

