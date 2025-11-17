"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadButtonProps {
  entityType: "building" | "floor" | "rack" | "room";
  entityId: string;
  onUploadSuccess: (url: string) => void;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  allowCamera?: boolean; // Enable camera capture on mobile
}

export function ImageUploadButton({
  entityType,
  entityId,
  onUploadSuccess,
  label = "Upload Image",
  variant = "outline",
  size = "sm",
  className = "",
  allowCamera = false,
}: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only images and PDFs are allowed.");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum 10MB allowed.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);

      const response = await fetch("/api/upload/cabling-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        onUploadSuccess(data.url);
        toast.success("Image uploaded successfully!");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        capture={allowCamera ? "environment" : undefined}
        className="hidden"
      />
      <Button
        variant={variant}
        size={size}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`${className} min-h-[44px] sm:min-h-[36px]`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1 animate-spin" />
            <span className="text-sm sm:text-xs">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
            <span className="text-sm sm:text-xs">{label}</span>
          </>
        )}
      </Button>
    </>
  );
}

