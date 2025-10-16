"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileIcon,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Users,
  Building2,
  User,
  FolderKanban,
  CheckSquare,
  MapPin,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

type EntityType = "CUSTOMER" | "SUPPLIER" | "PROJECT" | "TASK" | "USER" | "SITESURVEY";

interface File {
  id: string;
  entityId: string;
  type: EntityType;
  name: string;
  filetype: string;
  url: string;
  description: string | null;
  size: number | null;
  createdAt: string;
  entityName?: string;
}

interface TabConfig {
  value: EntityType;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { value: "CUSTOMER", label: "CUSTOMERS", icon: <Building2 className="h-4 w-4 mr-2" /> },
  { value: "SUPPLIER", label: "SUPPLIERS", icon: <Users className="h-4 w-4 mr-2" /> },
  { value: "USER", label: "USERS", icon: <User className="h-4 w-4 mr-2" /> },
  { value: "PROJECT", label: "PROJECTS", icon: <FolderKanban className="h-4 w-4 mr-2" /> },
  { value: "TASK", label: "TASKS", icon: <CheckSquare className="h-4 w-4 mr-2" /> },
  { value: "SITESURVEY", label: "SITE SURVEYS", icon: <MapPin className="h-4 w-4 mr-2" /> },
];

export function FilesManager() {
  const [activeTab, setActiveTab] = useState<EntityType>("CUSTOMER");
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchAllFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/files/all");
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
    fetchAllFiles();
  }, []);

  useEffect(() => {
    // Filter files by active tab and search term
    let filtered = files.filter((file) => file.type === activeTab);

    if (searchTerm) {
      filtered = filtered.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFiles(filtered);
  }, [files, activeTab, searchTerm]);

  const handleDelete = async (file: File) => {
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/files/${file.type}/${file.entityId}?fileId=${file.id}`,
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
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
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
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
    } else if (filetype.includes("word") || filetype.includes("document")) {
      return "📝";
    } else if (filetype.includes("excel") || filetype.includes("spreadsheet")) {
      return "📊";
    } else if (filetype.includes("zip") || filetype.includes("rar")) {
      return "📦";
    }
    return "📎";
  };

  const getEntityTypeBadgeColor = (type: EntityType) => {
    const colors: Record<EntityType, string> = {
      CUSTOMER: "bg-blue-500",
      SUPPLIER: "bg-green-500",
      USER: "bg-purple-500",
      PROJECT: "bg-orange-500",
      TASK: "bg-pink-500",
      SITESURVEY: "bg-cyan-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const fileToDelete = files.find((f) => f.id === deleteFileId);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EntityType)}>
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="uppercase">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${tab.label.toLowerCase()} files...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="outline" className="text-sm">
                {filteredFiles.length} {filteredFiles.length === 1 ? "file" : "files"}
              </Badge>
            </div>

            {/* Files Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <Card className="p-12 text-center">
                <FileIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 uppercase">NO FILES FOUND</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? `No files match your search "${searchTerm}"`
                    : `No files uploaded for ${tab.label.toLowerCase()} yet`}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl flex-shrink-0">{getFileIcon(file.filetype)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate mb-1">{file.name}</p>
                          {file.entityName && (
                            <p className="text-xs font-semibold text-primary mb-1 truncate">
                              {file.entityName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={`${getEntityTypeBadgeColor(file.type)} text-white text-xs`}
                            >
                              {file.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {formatDate(file.createdAt)}
                          </p>
                          {file.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {file.description}
                            </p>
                          )}
                          <div className="flex gap-1">
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteFileId !== null} onOpenChange={(open) => !open && setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>DELETE FILE</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDelete(fileToDelete)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "DELETING..." : "DELETE"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

