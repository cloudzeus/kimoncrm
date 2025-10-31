'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Image as ImageIcon, FileText, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ProposalProduct {
  id: string;
  productId?: string;
  name: string;
  brand?: string;
  category?: string;
  quantity: number;
  hasImages?: boolean;
  hasSpecs?: boolean;
  hasDescription?: boolean;
  product?: any;
}

interface ProposalProductsEnhancementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
}

export function ProposalProductsEnhancementModal({
  open,
  onOpenChange,
  proposalId,
}: ProposalProductsEnhancementModalProps) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProposalProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProposalProduct | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingSpecs, setGeneratingSpecs] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchProposalProducts();
    }
  }, [open, proposalId]);

  const fetchProposalProducts = async () => {
    try {
      setLoading(true);
      // Fetch proposal with RFP equipment data
      const response = await fetch(`/api/proposals/${proposalId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch proposal');
      }

      const proposal = data.proposal;
      const requirements = (proposal.rfp?.requirements as any) || {};
      const equipment = requirements.equipment || [];

      // Filter for products only and fetch their details
      const productItems = equipment
        .filter((item: any) => item.type === 'product' || item.itemType === 'product' || item.productId)
        .map((item: any) => ({
          id: item.id || `product-${Math.random()}`,
          productId: item.productId,
          name: item.name || 'Unnamed Product',
          brand: typeof item.brand === 'object' ? item.brand?.name : item.brand,
          category: typeof item.category === 'object' ? item.category?.name : item.category,
          quantity: item.quantity || 1,
          hasImages: false,
          hasSpecs: false,
          hasDescription: false,
        }));

      // Fetch product details to check for images, specs, and descriptions
      const enrichedProducts = await Promise.all(
        productItems.map(async (item: ProposalProduct) => {
          if (item.productId) {
            try {
              const productResponse = await fetch(`/api/products?id=${item.productId}`);
              const productData = await productResponse.json();
              
              if (productData.success && productData.data && productData.data.length > 0) {
                const product = productData.data[0];
                return {
                  ...item,
                  hasImages: product.images && product.images.length > 0,
                  hasSpecs: product.specifications && product.specifications.length > 0,
                  hasDescription: product.translations && product.translations.some((t: any) => t.description),
                  product: product,
                };
              }
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
            }
          }
          return item;
        })
      );

      setProducts(enrichedProducts);
    } catch (error) {
      console.error('Error fetching proposal products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch proposal products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedProduct?.productId) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('order', '0');
      formData.append('isDefault', 'true');

      const response = await fetch(`/api/products/${selectedProduct.productId}/images`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
        fetchProposalProducts(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerateSpecs = async (productId: string) => {
    setGeneratingSpecs(true);
    try {
      const response = await fetch(`/api/products/${productId}/generate-specs`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Specifications generated successfully',
        });
        fetchProposalProducts(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to generate specifications');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate specifications',
        variant: 'destructive',
      });
    } finally {
      setGeneratingSpecs(false);
    }
  };

  const handleGenerateDescription = async (productId: string) => {
    setGeneratingDescription(true);
    try {
      const response = await fetch(`/api/products/${productId}/generate-description`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Description generated successfully',
        });
        fetchProposalProducts(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to generate description');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate description',
        variant: 'destructive',
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const missingImagesCount = products.filter(p => !p.hasImages).length;
  const missingSpecsCount = products.filter(p => !p.hasSpecs).length;
  const missingDescriptionCount = products.filter(p => !p.hasDescription).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Enhancement</DialogTitle>
          <DialogDescription>
            Check and enhance product images, specifications, and descriptions for your proposal
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className={missingImagesCount > 0 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Missing Images</p>
                      <p className="text-2xl font-bold">{missingImagesCount}</p>
                    </div>
                    <ImageIcon className={`h-8 w-8 ${missingImagesCount > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className={missingSpecsCount > 0 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Missing Specs</p>
                      <p className="text-2xl font-bold">{missingSpecsCount}</p>
                    </div>
                    <FileText className={`h-8 w-8 ${missingSpecsCount > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className={missingDescriptionCount > 0 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Missing Descriptions</p>
                      <p className="text-2xl font-bold">{missingDescriptionCount}</p>
                    </div>
                    <FileText className={`h-8 w-8 ${missingDescriptionCount > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products List */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({products.length})</TabsTrigger>
                <TabsTrigger value="images">Missing Images ({missingImagesCount})</TabsTrigger>
                <TabsTrigger value="specs">Missing Specs ({missingSpecsCount})</TabsTrigger>
                <TabsTrigger value="descriptions">Missing Descriptions ({missingDescriptionCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-4">
                {products.map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{product.name}</h3>
                          <Badge variant="outline">Qty: {product.quantity}</Badge>
                        </div>
                        {product.brand && <p className="text-sm text-muted-foreground">{product.brand} {product.category && `• ${product.category}`}</p>}
                        
                        <div className="flex gap-2 mt-3">
                          {product.hasImages ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Has Images
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              No Images
                            </Badge>
                          )}
                          
                          {product.hasSpecs ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Has Specs
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              No Specs
                            </Badge>
                          )}
                          
                          {product.hasDescription ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Has Description
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              No Description
                            </Badge>
                          )}
                        </div>
                      </div>

                      {product.productId && (
                        <div className="flex gap-2 ml-4">
                          {!product.hasImages && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product);
                                document.getElementById('image-upload')?.click();
                              }}
                              disabled={uploadingImage}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload Image
                            </Button>
                          )}
                          
                          {!product.hasSpecs && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateSpecs(product.productId!)}
                              disabled={generatingSpecs}
                            >
                              {generatingSpecs ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4 mr-1" />
                              )}
                              Generate Specs
                            </Button>
                          )}
                          
                          {!product.hasDescription && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateDescription(product.productId!)}
                              disabled={generatingDescription}
                            >
                              {generatingDescription ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4 mr-1" />
                              )}
                              Generate Description
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="images" className="space-y-3 mt-4">
                {products.filter(p => !p.hasImages).map((product) => (
                  <Card key={product.id} className="p-4 border-orange-300 bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{product.name}</h3>
                          <Badge variant="outline">Qty: {product.quantity}</Badge>
                        </div>
                        {product.brand && <p className="text-sm text-muted-foreground">{product.brand} {product.category && `• ${product.category}`}</p>}
                      </div>

                      {product.productId && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            document.getElementById('image-upload')?.click();
                          }}
                          disabled={uploadingImage}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Image
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="specs" className="space-y-3 mt-4">
                {products.filter(p => !p.hasSpecs).map((product) => (
                  <Card key={product.id} className="p-4 border-orange-300 bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{product.name}</h3>
                          <Badge variant="outline">Qty: {product.quantity}</Badge>
                        </div>
                        {product.brand && <p className="text-sm text-muted-foreground">{product.brand} {product.category && `• ${product.category}`}</p>}
                      </div>

                      {product.productId && (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateSpecs(product.productId!)}
                          disabled={generatingSpecs}
                        >
                          {generatingSpecs ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-1" />
                          )}
                          Generate Specs
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="descriptions" className="space-y-3 mt-4">
                {products.filter(p => !p.hasDescription).map((product) => (
                  <Card key={product.id} className="p-4 border-orange-300 bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{product.name}</h3>
                          <Badge variant="outline">Qty: {product.quantity}</Badge>
                        </div>
                        {product.brand && <p className="text-sm text-muted-foreground">{product.brand} {product.category && `• ${product.category}`}</p>}
                      </div>

                      {product.productId && (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateDescription(product.productId!)}
                          disabled={generatingDescription}
                        >
                          {generatingDescription ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-1" />
                          )}
                          Generate Description
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            {/* Hidden file input for image upload */}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
                e.target.value = ''; // Reset input
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

