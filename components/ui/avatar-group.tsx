"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { FileText } from "lucide-react";

interface AvatarGroupProps {
  images?: string[];
  fallbackIcon: React.ReactNode;
  maxDisplay?: number;
  size?: string;
  previewSize?: number;
  position?: "left" | "right";
}

export function AvatarGroup({
  images = [],
  fallbackIcon,
  maxDisplay = 4,
  size = "h-8 w-8",
  previewSize = 500,
  position = "left",
}: AvatarGroupProps) {
  if (!images || images.length === 0) {
    return (
      <Avatar className={size}>
        <AvatarFallback>{fallbackIcon}</AvatarFallback>
      </Avatar>
    );
  }

  // Filter out undefined/null values
  const validImages = images.filter(img => img && typeof img === 'string');
  const displayImages = validImages.slice(0, maxDisplay);
  const remainingCount = validImages.length - maxDisplay;

  return (
    <div className="flex -space-x-2">
      {displayImages.map((url, idx) => {
        const isPDF = url?.toLowerCase().endsWith('.pdf') || false;
        
        return (
          <HoverCard key={idx} openDelay={200}>
            <HoverCardTrigger asChild>
              <Avatar className={`${size} border-2 border-white cursor-pointer`}>
                <AvatarImage src={url} />
                <AvatarFallback>{fallbackIcon}</AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent 
              className="w-auto p-2" 
              side="right" 
              align="start"
              style={{ maxWidth: `${previewSize}px` }}
            >
              {isPDF ? (
                <div className="flex flex-col items-center gap-2 p-8">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Click to view
                  </a>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden" style={{ maxWidth: `${previewSize}px`, maxHeight: `${previewSize}px` }}>
                  <Image
                    src={url}
                    alt="Preview"
                    width={previewSize}
                    height={previewSize}
                    className="object-contain"
                  />
                </div>
              )}
            </HoverCardContent>
          </HoverCard>
        );
      })}
      
      {remainingCount > 0 && (
        <Avatar className={`${size} border-2 border-white bg-gray-200`}>
          <AvatarFallback className="bg-gray-300 text-gray-700 text-xs font-bold">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

