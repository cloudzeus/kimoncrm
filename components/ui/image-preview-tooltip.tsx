"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { FileText } from "lucide-react";

interface ImagePreviewTooltipProps {
  src?: string;
  fallback: React.ReactNode;
  className?: string;
  previewSize?: number;
}

export function ImagePreviewTooltip({
  src,
  fallback,
  className = "h-10 w-10",
  previewSize = 500,
}: ImagePreviewTooltipProps) {
  const [imageError, setImageError] = useState(false);
  const isPDF = src?.toLowerCase().endsWith('.pdf');

  if (!src || imageError) {
    return (
      <Avatar className={className}>
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <Avatar className={`${className} cursor-pointer`}>
          <AvatarImage 
            src={src} 
            onError={() => setImageError(true)}
          />
          <AvatarFallback>{fallback}</AvatarFallback>
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
              href={src} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Click to view
            </a>
          </div>
        ) : (
          <img
            src={src}
            alt="Preview"
            className="rounded-lg object-contain"
            style={{ 
              maxWidth: `${previewSize}px`, 
              maxHeight: `${previewSize}px` 
            }}
            onError={() => setImageError(true)}
          />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

