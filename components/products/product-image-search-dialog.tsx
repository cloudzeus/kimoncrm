"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Loader2, 
  ImageIcon, 
  CheckCircle2, 
  XCircle,
  Upload,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  searchImagesAction,
  processAndSaveImagesAction,
} from "@/app/actions/image-search";

interface ProductImageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    code?: string;
    nameEn?: string;
  };
  onSuccess?: () => void;
}

interface SearchImage {
  thumbnailUrl: string;
  contentUrl: string;
  name: string;
  width: number;
  height: number;
  thumbnail: {
    width: number;
    height: number;
  };
  hostPageUrl: string;
  encodingFormat: string;
  selected?: boolean;
  uploaded?: boolean;
  uploadedUrl?: string;
  error?: string;
}

export function ProductImageSearchDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductImageSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [images, setImages] = useState<SearchImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [defaultImageIndex, setDefaultImageIndex] = useState<number | null>(null);

  // Initialize search query with product name
  React.useEffect(() => {
    if (open && !searchQuery) {
      const query = product.nameEn || product.name || product.code || "";
      setSearchQuery(query);
    }
  }, [open, product, searchQuery]);

  // Handle image search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setImages([]);
    setSelectedImages(new Set());
    setDefaultImageIndex(null);

    try {
      const result = await searchImagesAction(searchQuery, 100);

      if (!result.success) {
        toast.error(result.error || "Failed to search images");
        return;
      }

      setImages(result.images || []);
      toast.success(`Found ${result.images?.length || 0} images`);
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Failed to search images");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Toggle image selection
  const toggleImageSelection = useCallback((index: number) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        // If this was the default, clear it
        if (defaultImageIndex === index) {
          setDefaultImageIndex(null);
        }
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, [defaultImageIndex]);

  // Select all images
  const selectAll = useCallback(() => {
    setSelectedImages(new Set(images.map((_, idx) => idx)));
  }, [images]);

  // Deselect all images
  const deselectAll = useCallback(() => {
    setSelectedImages(new Set());
    setDefaultImageIndex(null);
  }, []);

  // Set default image
  const setAsDefault = useCallback((index: number) => {
    if (selectedImages.has(index)) {
      setDefaultImageIndex(index);
      toast.success("Default image set");
    } else {
      toast.error("Please select the image first");
    }
  }, [selectedImages]);

  // Handle upload and save (all processing done server-side)
  const handleUploadAndSave = useCallback(async () => {
    if (selectedImages.size === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const selectedIndexes = Array.from(selectedImages);
    const imagesToProcess = selectedIndexes.map((index, i) => ({
      contentUrl: images[index].contentUrl,
      name: images[index].name,
      isDefault: defaultImageIndex === index,
      order: i,
    }));

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      // Process everything server-side
      const result = await processAndSaveImagesAction(
        product.id,
        imagesToProcess
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        toast.success(result.message || "Images saved successfully");
        onSuccess?.();
        
        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
          // Reset state
          setImages([]);
          setSelectedImages(new Set());
          setDefaultImageIndex(null);
          setUploadProgress(0);
        }, 1500);
      } else {
        toast.error(result.error || "Failed to process images");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  }, [
    selectedImages,
    images,
    product,
    defaultImageIndex,
    onSuccess,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>SEARCH PRODUCT IMAGES</DialogTitle>
          <DialogDescription>
            Search for images for{" "}
            <span className="font-semibold">{product.name}</span>, select the
            ones you want, and upload them to the product.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-query">SEARCH QUERY</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="search-query"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search query..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSearching) {
                      handleSearch();
                    }
                  }}
                  disabled={isSearching || isUploading}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || isUploading}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      SEARCHING...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      SEARCH
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {images.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={isUploading}
                >
                  SELECT ALL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  disabled={isUploading}
                >
                  DESELECT ALL
                </Button>
                <Badge variant="secondary">
                  {selectedImages.size} / {images.length} SELECTED
                </Badge>
              </div>
              <Button
                onClick={handleUploadAndSave}
                disabled={selectedImages.size === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    UPLOADING...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    UPLOAD {selectedImages.size} IMAGE(S)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading and converting to WebP...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        {/* Images Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4" />
              <p>No images found. Try searching for something.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`relative group border rounded-lg overflow-hidden transition-all ${
                    selectedImages.has(index)
                      ? "ring-2 ring-primary shadow-lg"
                      : "hover:shadow-md"
                  } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                >
                  {/* Image */}
                  <div
                    className="relative aspect-square bg-muted cursor-pointer"
                    onClick={() => toggleImageSelection(index)}
                  >
                    <img
                      src={image.thumbnailUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Selection Overlay */}
                    {selectedImages.has(index) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-primary" />
                      </div>
                    )}

                    {/* Upload Status */}
                    {image.uploaded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                      </div>
                    )}

                    {/* Error Status */}
                    {image.error && (
                      <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                        <XCircle className="h-12 w-12 text-destructive" />
                      </div>
                    )}

                    {/* Default Badge */}
                    {defaultImageIndex === index && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          DEFAULT
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="p-2 space-y-2">
                    <p className="text-xs truncate" title={image.name}>
                      {image.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {image.width} × {image.height}
                      </span>
                    </div>
                    {/* Default Image Checkbox */}
                    {selectedImages.has(index) && !image.uploaded && (
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <Checkbox
                          id={`default-${index}`}
                          checked={defaultImageIndex === index}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAsDefault(index);
                            } else if (defaultImageIndex === index) {
                              setDefaultImageIndex(null);
                            }
                          }}
                          disabled={isUploading}
                        />
                        <Label
                          htmlFor={`default-${index}`}
                          className="text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Star className={`h-3 w-3 ${defaultImageIndex === index ? "fill-current text-yellow-500" : ""}`} />
                          SET AS DEFAULT
                        </Label>
                      </div>
                    )}
                    {image.error && (
                      <p className="text-xs text-destructive" title={image.error}>
                        {image.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

