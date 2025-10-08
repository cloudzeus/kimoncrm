"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface BrandFileUploadProps {
  type: 'logo' | 'image';
  currentFile?: {
    id: string;
    name: string;
    url?: string;
  } | null;
  onFileChange: (fileId: string | null, fileUrl?: string) => void;
  disabled?: boolean;
}

export function BrandFileUpload({ 
  type, 
  currentFile, 
  onFileChange, 
  disabled = false 
}: BrandFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentFile?.url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/brands/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onFileChange(data.fileId, data.url);
        setPreviewUrl(data.url);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentFile) return;

    try {
      const response = await fetch(`/api/brands/upload?fileId=${currentFile.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onFileChange(null);
        setPreviewUrl(undefined);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} removed successfully`);
      } else {
        toast.error('Failed to remove file');
      }
    } catch (error) {
      toast.error('Failed to remove file');
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${type}-upload`}>
        {type.toUpperCase()} {type === 'logo' ? '(RECOMMENDED: SQUARE IMAGE)' : ''}
      </Label>
      
      {previewUrl || currentFile ? (
        <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/50">
          { (previewUrl || currentFile?.url) ? (
            <img
              src={previewUrl || currentFile?.url}
              alt={type}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center hover:border-muted-foreground/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            id={`${type}-upload`}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : `Click to upload ${type}`}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
