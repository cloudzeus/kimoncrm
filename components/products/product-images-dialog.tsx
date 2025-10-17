// @ts-nocheck
'use client';

/**
 * Product Images Dialog Component
 * Upload, edit, and manage product images with canvas editor
 */

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  RefreshCw, 
  Image as ImageIcon,
  Trash2,
  Star,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  isDefault: boolean;
  order: number;
  createdAt: string;
}

interface ProductImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

export default function ProductImagesDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: ProductImagesDialogProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
  
  // Canvas editor state
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const { toast } = useToast();

  const CANVAS_SIZE = 1280;

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open, productId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}/images`);
      const data = await response.json();

      if (data.success) {
        setImages(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch images',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch images',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // For now, handle one file at a time
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setEditingImage(file);
    loadImageToCanvas(file);
  };

  const loadImageToCanvas = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        
        // Center the image and fit it to canvas
        const scale = Math.min(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
        setImageScale(scale);
        setImagePosition({
          x: (CANVAS_SIZE - img.width * scale) / 2,
          y: (CANVAS_SIZE - img.height * scale) / 2,
        });
        
        drawCanvas();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw checkerboard background for transparency
    drawCheckerboard(ctx);

    // Draw image
    ctx.save();
    ctx.drawImage(
      imageRef.current,
      imagePosition.x,
      imagePosition.y,
      imageRef.current.width * imageScale,
      imageRef.current.height * imageScale
    );
    ctx.restore();
  };

  const drawCheckerboard = (ctx: CanvasRenderingContext2D) => {
    const squareSize = 20;
    for (let x = 0; x < CANVAS_SIZE; x += squareSize) {
      for (let y = 0; y < CANVAS_SIZE; y += squareSize) {
        ctx.fillStyle = (x / squareSize + y / squareSize) % 2 === 0 ? '#f0f0f0' : '#ffffff';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  };

  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [imagePosition, imageScale]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editingImage) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setImageScale((s) => Math.min(s + 0.1, 3));
  };

  const handleZoomOut = () => {
    setImageScale((s) => Math.max(s - 0.1, 0.1));
  };

  const handleUpload = async () => {
    if (!canvasRef.current || !editingImage) return;

    try {
      setUploading(true);

      // Convert canvas to WebP blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/webp',
          0.95
        );
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, editingImage.name.replace(/\.[^.]+$/, '.webp'));
      formData.append('order', images.length.toString());
      formData.append('isDefault', images.length === 0 ? 'true' : 'false');

      // Upload
      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
        
        // Reset editor
        setEditingImage(null);
        imageRef.current = null;
        
        // Refresh images
        await fetchImages();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to upload image',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (image: ProductImage) => {
    try {
      const response = await fetch(`/api/products/${productId}/images?imageId=${image.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Image deleted successfully',
        });
        await fetchImages();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete image',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const cancelEditing = () => {
    setEditingImage(null);
    imageRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="uppercase flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                PRODUCT IMAGES
              </DialogTitle>
              <DialogDescription>
                {productName}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchImages}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || editingImage !== null}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Image Editor */}
          {editingImage && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold uppercase">IMAGE EDITOR</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="border rounded-lg inline-block bg-white">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                      className="cursor-move"
                      style={{ width: '400px', height: '400px' }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Drag to position • Scroll or use buttons to zoom
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    className="w-full"
                  >
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    className="w-full"
                  >
                    <ZoomOut className="h-4 w-4 mr-2" />
                    Zoom Out
                  </Button>
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    Scale: {(imageScale * 100).toFixed(0)}%
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Save & Upload'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Existing Images */}
          <div>
            <h3 className="font-semibold uppercase mb-4">EXISTING IMAGES</h3>
            
            {loading ? (
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 space-y-4 border rounded-lg">
                <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold">NO IMAGES YET</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Upload Image" to add product images
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="border rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      <Image
                        src={image.url}
                        alt={image.alt || 'Product image'}
                        fill
                        className="object-contain"
                      />
                      {image.isDefault && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          DEFAULT
                        </Badge>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => {
                          setImageToDelete(image);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2 bg-white">
                      <p className="text-xs text-muted-foreground truncate">
                        {image.alt || 'No description'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>DELETE IMAGE?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                image from BunnyCDN and the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (imageToDelete) {
                    handleDeleteImage(imageToDelete);
                    setDeleteDialogOpen(false);
                    setImageToDelete(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

