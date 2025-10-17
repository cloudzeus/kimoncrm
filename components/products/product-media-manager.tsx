"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableGrid } from "@/components/drag-drop/sortable-grid";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  File, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface ProductMedia {
  id: string;
  name: string;
  url?: string;
  fileType: "image" | "video" | "document";
  order: number;
  size?: number;
  mimeType?: string;
  createdAt: string;
}

interface ProductMediaManagerProps {
  productId: string;
  media: ProductMedia[];
  onMediaUpdate: (media: ProductMedia[]) => Promise<void>;
  onMediaUpload: (files: File[], productId: string) => Promise<void>;
  onMediaDelete: (mediaId: string) => Promise<void>;
  loading?: boolean;
}

export function ProductMediaManager({
  productId,
  media,
  onMediaUpdate,
  onMediaUpload,
  onMediaDelete,
  loading = false,
}: ProductMediaManagerProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [editingMedia, setEditingMedia] = useState<ProductMedia | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      await onMediaUpload(acceptedFiles, productId);
      setUploadDialogOpen(false);
      toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    }
  }, [onMediaUpload, productId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  // Handle reordering
  const handleReorder = useCallback(async (reorderedMedia: ProductMedia[]) => {
    try {
      await onMediaUpdate(reorderedMedia);
      toast.success("Media order updated");
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Failed to update media order");
    }
  }, [onMediaUpdate]);

  // Handle media edit
  const handleEdit = useCallback((mediaItem: ProductMedia) => {
    setEditingMedia(mediaItem);
    setEditDialogOpen(true);
  }, []);

  // Handle media delete
  const handleDelete = useCallback(async (mediaItem: ProductMedia) => {
    if (confirm(`Are you sure you want to delete "${mediaItem.name}"?`)) {
      try {
        await onMediaDelete(mediaItem.id);
        toast.success("Media deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete media");
      }
    }
  }, [onMediaDelete]);

  // Handle media view
  const handleView = useCallback((mediaItem: ProductMedia) => {
    if (mediaItem.url) {
      window.open(mediaItem.url, '_blank');
    }
  }, []);

  // Render media item for grid view
  const renderMediaItem = useCallback((mediaItem: ProductMedia, index: number) => (
    <div className="space-y-2">
      <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
        {mediaItem.fileType === "image" && mediaItem.url ? (
          <Image
            src={mediaItem.url}
            alt={mediaItem.name}
            fill
            className="object-cover"
          />
        ) : mediaItem.fileType === "video" ? (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <File className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h4 className="font-medium text-sm truncate" title={mediaItem.name}>
          {mediaItem.name}
        </h4>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {mediaItem.fileType}
          </Badge>
          <span>#{index + 1}</span>
        </div>
        
        {mediaItem.size && (
          <div className="text-xs text-muted-foreground">
            {(mediaItem.size / 1024 / 1024).toFixed(1)} MB
          </div>
        )}
      </div>
    </div>
  ), []);

  // Define columns for table view
  const columns: Column<ProductMedia>[] = [
    {
      key: "order",
      label: "Order",
      sortable: true,
      width: 80,
      render: (_, __, index) => (
        <Badge variant="outline">#{index + 1}</Badge>
      ),
    },
    {
      key: "preview",
      label: "Preview",
      width: 100,
      render: (_, item) => (
        <div className="w-16 h-16 bg-muted rounded-md overflow-hidden relative">
          {item.fileType === "image" && item.url ? (
            <Image
              src={item.url}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : item.fileType === "video" ? (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <File className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value) => (
        <div className="font-medium">{value}</div>
      ),
    },
    {
      key: "fileType",
      label: "Type",
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">
          {value}
        </Badge>
      ),
    },
    {
      key: "size",
      label: "Size",
      sortable: true,
      render: (value) => value ? `${(value / 1024 / 1024).toFixed(1)} MB` : "-",
    },
    {
      key: "createdAt",
      label: "Uploaded",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      width: 120,
      render: (_, item) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(item)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Media</h3>
          <p className="text-sm text-muted-foreground">
            Manage images, videos, and documents for this product
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Media</DialogTitle>
                <DialogDescription>
                  Upload images, videos, or documents for this product
                </DialogDescription>
              </DialogHeader>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed p-8 text-center cursor-pointer rounded-md ${
                  isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-lg mb-2">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports images, videos, and documents
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Media Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading media...</div>
        </div>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No media uploaded</h3>
            <p className="text-muted-foreground mb-4">
              Upload images, videos, or documents to showcase this product
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <SortableGrid
          items={media}
          onReorder={handleReorder}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          renderItem={renderMediaItem}
          columns={4}
        />
      ) : (
        <DataTable
          data={media}
          columns={columns}
          searchable={true}
          exportable={true}
          sortable={true}
          resizable={true}
          onRowClick={handleView}
        />
      )}

      {/* Edit Media Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>
              Update media information and settings
            </DialogDescription>
          </DialogHeader>
          
          {editingMedia && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="mediaName">Name</Label>
                <Input
                  id="mediaName"
                  defaultValue={editingMedia.name}
                  placeholder="Media name"
                />
              </div>
              
              <div>
                <Label htmlFor="mediaType">Type</Label>
                <Select defaultValue={editingMedia.fileType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {editingMedia.url && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="w-full h-48 bg-muted rounded-md overflow-hidden relative">
                    {editingMedia.fileType === "image" ? (
                      <Image
                        src={editingMedia.url}
                        alt={editingMedia.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
