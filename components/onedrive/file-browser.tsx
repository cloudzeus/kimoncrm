"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, File, ArrowLeft, Loader2, Upload, Download, FolderPlus } from "lucide-react";
import { toast } from "sonner";

interface FileItem {
  name: string;
  path: string;
  size?: number;
  modified?: string;
  isFolder: boolean;
  folderId?: string;
}

interface FileBrowserProps {
  type: "tenant" | "user";
}

export function FileBrowser({ type }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>(["/"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/microsoft/onedrive/files?type=${type}&path=${encodeURIComponent(path)}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files || []);
      } else {
        setError(data.message || "Failed to load files");
      }
    } catch (err) {
      setError("Failed to load files");
      console.error("Error loading files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath[currentPath.length - 1]);
  }, [type]);

  const handleFolderClick = (folder: FileItem) => {
    // Use the folder ID or name for navigation
    const newPath = folder.folderId || folder.path || folder.name;
    setCurrentPath([...currentPath, newPath]);
    loadFiles(newPath);
  };

  const handleBack = () => {
    if (currentPath.length > 1) {
      const newPath = [...currentPath];
      newPath.pop();
      setCurrentPath(newPath);
      loadFiles(newPath[newPath.length - 1]);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      toast.success(`Uploading ${files.length} file(s)...`);
      
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      formData.append("parentPath", currentPath[currentPath.length - 1]);

      const response = await fetch("/api/microsoft/onedrive/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Files uploaded successfully!");
        // Reload files after upload
        await loadFiles(currentPath[currentPath.length - 1]);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      // TODO: Implement file download from OneDrive
      console.log("Downloading file:", file);
      toast.success(`Downloading ${file.name}...`);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download file");
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;

    try {
      toast.success(`Creating folder ${folderName}...`);
      
      const response = await fetch("/api/microsoft/onedrive/create-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderName,
          parentPath: currentPath[currentPath.length - 1],
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Folder created successfully!");
        // Reload files after creating folder
        await loadFiles(currentPath[currentPath.length - 1]);
      } else {
        throw new Error(data.message || "Failed to create folder");
      }
    } catch (err) {
      console.error("Create folder error:", err);
      toast.error("Failed to create folder");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <CardTitle className="text-lg">{type === "tenant" ? "Tenant OneDrive" : "My OneDrive"}</CardTitle>
            <CardDescription className="text-xs">Browse your files and folders</CardDescription>
          </div>
          {currentPath.length > 1 && (
            <Button onClick={handleBack} variant="outline" size="sm" className="h-7 px-2">
              <ArrowLeft className="h-3 w-3 mr-1" />
              <span className="text-xs">Back</span>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
            <Button variant="outline" size="sm" className="h-7 px-2" asChild>
              <span>
                <Upload className="h-3 w-3 mr-1" />
                <span className="text-xs">Upload</span>
              </span>
            </Button>
          </label>
          <Button onClick={handleCreateFolder} variant="outline" size="sm" className="h-7 px-2">
            <FolderPlus className="h-3 w-3 mr-1" />
            <span className="text-xs">New Folder</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No files or folders found
          </div>
        )}

        {!loading && !error && files.length > 0 && (
          <div className="space-y-1">
            {files
              .filter(item => item.isFolder)
              .map((folder) => (
                <div
                  key={folder.path}
                  onClick={() => handleFolderClick(folder)}
                  className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                >
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{folder.name}</div>
                    {folder.modified && (
                      <div className="text-xs text-muted-foreground">
                        Modified: {formatDate(folder.modified)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {files
              .filter(item => !item.isFolder)
              .map((file) => (
                <div
                  key={file.path}
                  className="flex items-center p-2 rounded-md hover:bg-muted transition-colors group"
                >
                  <File className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {file.size && `${formatFileSize(file.size)} • `}
                      {file.modified && `Modified: ${formatDate(file.modified)}`}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(file)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
