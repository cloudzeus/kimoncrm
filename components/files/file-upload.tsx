"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EntityType = "CUSTOMER" | "SUPPLIER" | "PROJECT" | "TASK" | "USER" | "SITESURVEY";

interface FileUploadProps {
  entityId: string;
  entityType: EntityType;
  folderName: string; // AFM, email, projectId, etc.
  onUploadComplete?: () => void;
  onClose?: () => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

interface UploadingFile {
  file: File;
  title: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function FileUpload({
  entityId,
  entityType,
  folderName,
  onUploadComplete,
  onClose,
  maxFiles = 10,
  maxSizeMB = 100,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [files, maxFiles, maxSizeMB]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
      }
    },
    [files, maxFiles, maxSizeMB]
  );

  const addFiles = (newFiles: File[]) => {
    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "TOO MANY FILES",
        description: `You can only upload up to ${maxFiles} files at once.`,
        variant: "destructive",
      });
      return;
    }

    // Check file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = newFiles.filter((f) => f.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      toast({
        title: "FILES TOO LARGE",
        description: `Some files exceed the ${maxSizeMB}MB size limit.`,
        variant: "destructive",
      });
      return;
    }

    // Add files to state
    const uploadingFiles: UploadingFile[] = newFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension as default title
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...uploadingFiles]);
  };

  const updateFileTitle = (index: number, title: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, title } : f))
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("entityId", entityId);
      formData.append("entityType", entityType);
      formData.append("folderName", folderName);
      if (description) {
        formData.append("description", description);
      }

      // Add all files with titles
      files.forEach((uploadingFile, index) => {
        formData.append("files", uploadingFile.file);
        formData.append(`title_${index}`, uploadingFile.title || "");
      });

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "uploading", progress: 50 }))
      );

      // Upload
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      // Update file statuses
      setFiles((prev) =>
        prev.map((f, index) => {
          const hasError = result.errors?.some(
            (e: any) => e.filename === f.file.name
          );
          return {
            ...f,
            progress: 100,
            status: hasError ? "error" : "success",
            error: result.errors?.find((e: any) => e.filename === f.file.name)
              ?.error,
          };
        })
      );

      // Show success toast for each uploaded file
      result.uploaded?.forEach((file: any) => {
        toast({
          title: "FILE UPLOADED",
          description: `${file.name} uploaded successfully.`,
        });
      });

      // Show error toasts
      result.errors?.forEach((error: any) => {
        toast({
          title: "UPLOAD FAILED",
          description: `${error.filename}: ${error.error}`,
          variant: "destructive",
        });
      });

      // Call completion callback and close dialog after a short delay
      if (result.uploaded?.length > 0) {
        setTimeout(() => {
          onUploadComplete?.();
          // Close dialog after successful uploads (even if some files had errors)
          onClose?.();
        }, 1000);
      } else if (result.errors?.length > 0) {
        // If all files failed, don't close automatically - let user review errors
        // User can close manually
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "UPLOAD FAILED",
        description: error.message || "An error occurred during upload.",
        variant: "destructive",
      });

      // Mark all as error
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "error",
          error: error.message,
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">DESCRIPTION (OPTIONAL)</Label>
        <Textarea
          id="description"
          placeholder="Add a description for these files..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isUploading}
          className="resize-none"
          rows={2}
        />
      </div>

      {/* Drag and drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }
          ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">
          DRAG AND DROP FILES HERE
        </p>
        <p className="text-xs text-muted-foreground">
          or click to browse (max {maxFiles} files, {maxSizeMB}MB each)
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label>FILES ({files.length})</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((uploadingFile, index) => (
              <Card
                key={index}
                className="p-3 flex items-center gap-3"
              >
                <div className="flex-shrink-0">
                  {uploadingFile.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : uploadingFile.status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                  </div>
                  {uploadingFile.status === "pending" && (
                    <Input
                      placeholder="File title..."
                      value={uploadingFile.title}
                      onChange={(e) => updateFileTitle(index, e.target.value)}
                      className="h-8 text-sm"
                      disabled={isUploading}
                    />
                  )}
                  {uploadingFile.status === "uploading" && (
                    <Progress value={uploadingFile.progress} className="mt-1" />
                  )}
                  {uploadingFile.error && (
                    <p className="text-xs text-destructive mt-1">
                      {uploadingFile.error}
                    </p>
                  )}
                </div>
                {uploadingFile.status === "pending" && !isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isUploading}
        >
          CANCEL
        </Button>
        <Button
          onClick={uploadFiles}
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? "UPLOADING..." : `UPLOAD ${files.length} FILE${files.length !== 1 ? "S" : ""}`}
        </Button>
      </div>
    </div>
  );
}

