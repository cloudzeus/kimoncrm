"use client";

import { useState, useEffect } from "react";
import { FileIcon, Download, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

type EntityType = "CUSTOMER" | "SUPPLIER" | "PROJECT" | "TASK" | "USER" | "SITESURVEY";

interface File {
  id: string;
  name: string;
  title: string | null;
  filetype: string;
  url: string;
  description: string | null;
  size: number | null;
  createdAt: string;
}

interface FilesListProps {
  entityId: string;
  entityType: EntityType;
  refreshTrigger?: number;
  onFileDeleted?: () => void;
}

export function FilesList({
  entityId,
  entityType,
  refreshTrigger,
  onFileDeleted,
}: FilesListProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/files/${entityType}/${entityId}`
      );
      const data = await response.json();

      if (response.ok) {
        setFiles(data.files || []);
      } else {
        throw new Error(data.error || "Failed to fetch files");
      }
    } catch (error: any) {
      console.error("Error fetching files:", error);
      toast({
        title: "ERROR",
        description: error.message || "Failed to load files.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [entityId, entityType, refreshTrigger]);

  const handleDelete = async (fileId: string) => {
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/files/${entityType}/${entityId}?fileId=${fileId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file");
      }

      toast({
        title: "FILE DELETED",
        description: "File has been deleted successfully.",
      });

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      onFileDeleted?.();
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({
        title: "DELETE FAILED",
        description: error.message || "Failed to delete file.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteFileId(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (filetype: string) => {
    if (filetype.startsWith("image/")) {
      return "🖼️";
    } else if (filetype.startsWith("video/")) {
      return "🎥";
    } else if (filetype.includes("pdf")) {
      return "📄";
    } else if (
      filetype.includes("word") ||
      filetype.includes("document")
    ) {
      return "📝";
    } else if (
      filetype.includes("excel") ||
      filetype.includes("spreadsheet")
    ) {
      return "📊";
    } else if (filetype.includes("zip") || filetype.includes("rar")) {
      return "📦";
    }
    return "📎";
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          NO FILES UPLOADED YET
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => (
          <Card key={file.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0 mt-1">
                {getFileIcon(file.filetype)}
              </div>
              <div className="flex-1 min-w-0">
                {file.title && (
                  <p className="text-sm font-semibold truncate">{file.title}</p>
                )}
                <p className={`text-sm ${file.title ? "text-muted-foreground" : "font-medium"} truncate`}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                </p>
                {file.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {file.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, "_blank")}
                  title="View file"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = file.url;
                    link.download = file.name;
                    link.click();
                  }}
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteFileId(file.id)}
                  title="Delete file"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteFileId !== null}
        onOpenChange={(open) => !open && setDeleteFileId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>DELETE FILE</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFileId && handleDelete(deleteFileId)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "DELETING..." : "DELETE"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

