'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import ProductImagesDialog from '@/components/products/product-images-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Package, 
  Building2, 
  Tag, 
  Ruler, 
  Weight, 
  FileText, 
  Image as ImageIcon,
  Settings,
  Globe,
  Warehouse,
  ExternalLink,
  RefreshCw,
  Edit,
  Trash2,
  Upload
} from 'lucide-react';
import Image from 'next/image';

interface ProductDetailClientProps {
  product: {
    id: string;
    mtrl: string | null;
    code: string | null;
    code1: string | null;
    code2: string | null;
    name: string;
    mtrmark: string | null;
    mtrmanfctr: string | null;
    mtrcategory: string | null;
    isActive: boolean;
    width: number | null;
    length: number | null;
    height: number | null;
    weight: number | null;
    productDataSheet: string | null;
    brandId: string | null;
    categoryId: string | null;
    manufacturerId: string | null;
    unitId: string | null;
    brand: {
      id: string;
      name: string;
      code: string | null;
    } | null;
    manufacturer: {
      id: string;
      name: string;
      code: string | null;
    } | null;
    category: {
      id: string;
      name: string;
      softoneCode: string | null;
    } | null;
    unit: {
      id: string;
      name: string;
      shortcut: string | null;
    } | null;
    translations: Array<{
      id: string;
      languageCode: string;
      name: string | null;
      shortDescription: string | null;
      description: string | null;
    }>;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
      isDefault: boolean;
      order: number;
    }>;
    specifications: Array<{
      id: string;
      specKey: string;
      order: number;
      translations: Array<{
        id: string;
        languageCode: string;
        specName: string;
        specValue: string;
      }>;
    }>;
    stock: Array<{
      id: string;
      warehouse: string;
      qty: number;
      updatedAt: string;
    }>;
  };
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [extractingDimensions, setExtractingDimensions] = useState(false);
  const [editTranslationOpen, setEditTranslationOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<any>(null);
  const [translationForm, setTranslationForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
  });
  const [editSpecOpen, setEditSpecOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<any>(null);
  const [specForm, setSpecForm] = useState<{ [key: string]: { specName: string; specValue: string } }>({});
  const [addingToERP, setAddingToERP] = useState(false);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);

  const defaultImage = product.images.find(img => img.isDefault) || product.images[0];
  const otherImages = product.images.filter(img => !img.isDefault || product.images.length === 1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockByWarehouse = (warehouse: string) => {
    const stockItem = product.stock.find(s => s.warehouse === warehouse);
    return stockItem?.qty || 0;
  };

  const handleExtractDimensions = async () => {
    if (!product.specifications || product.specifications.length === 0) {
      toast({
        title: 'No Specifications',
        description: 'This product has no specifications to extract dimensions from.',
        variant: 'destructive',
      });
      return;
    }

    setExtractingDimensions(true);
    try {
      const response = await fetch(`/api/products/${product.id}/extract-dimensions`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Dimensions Updated',
          description: `Successfully extracted and updated: ${data.databaseUpdate.updated.join(', ')}. ${data.erpSync.success ? 'Synced to ERP.' : data.erpSync.message}`,
        });
        
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast({
          title: 'Extraction Failed',
          description: data.error || 'Failed to extract dimensions from specifications',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error extracting dimensions:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract dimensions from specifications',
        variant: 'destructive',
      });
    } finally {
      setExtractingDimensions(false);
    }
  };

  const handleEditTranslation = (translation: any) => {
    setEditingTranslation(translation);
    setTranslationForm({
      name: translation.name || '',
      shortDescription: translation.shortDescription || '',
      description: translation.description || '',
    });
    setEditTranslationOpen(true);
  };

  const handleSaveTranslation = async () => {
    if (!editingTranslation) return;

    try {
      const response = await fetch(`/api/products/${product.id}/translations/${editingTranslation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(translationForm),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Translation Updated',
          description: 'Translation has been updated successfully.',
        });
        setEditTranslationOpen(false);
        router.refresh();
      } else {
        toast({
          title: 'Update Failed',
          description: data.error || 'Failed to update translation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating translation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update translation',
        variant: 'destructive',
      });
    }
  };

  const handleEditSpec = (spec: any) => {
    setEditingSpec(spec);
    const formData: { [key: string]: { specName: string; specValue: string } } = {};
    
    spec.translations.forEach((trans: any) => {
      formData[trans.languageCode] = {
        specName: trans.specName,
        specValue: trans.specValue,
      };
    });
    
    setSpecForm(formData);
    setEditSpecOpen(true);
  };

  const handleSaveSpec = async () => {
    if (!editingSpec) return;

    try {
      const response = await fetch(`/api/products/${product.id}/specifications/${editingSpec.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations: specForm }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Specification Updated',
          description: 'Specification has been updated successfully.',
        });
        setEditSpecOpen(false);
        router.refresh();
      } else {
        toast({
          title: 'Update Failed',
          description: data.error || 'Failed to update specification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating specification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update specification',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSpec = async (specId: string) => {
    if (!confirm('Are you sure you want to delete this specification?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${product.id}/specifications/${specId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Specification Deleted',
          description: 'Specification has been deleted successfully.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Delete Failed',
          description: data.error || 'Failed to delete specification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting specification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete specification',
        variant: 'destructive',
      });
    }
  };

  const handleAddToERP = async () => {
    if (!confirm('Are you sure you want to add this product to ERP? This will generate a product code.')) {
      return;
    }

    setAddingToERP(true);
    try {
      const response = await fetch(`/api/products/${product.id}/add-to-erp`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Added to ERP',
          description: `Product added to ERP successfully. Code: ${data.generatedCode}, MTRL: ${data.mtrl}`,
        });
        router.refresh();
      } else {
        toast({
          title: 'ERP Addition Failed',
          description: data.error || 'Failed to add product to ERP',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding to ERP:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product to ERP',
        variant: 'destructive',
      });
    } finally {
      setAddingToERP(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            BACK
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              {product.code && `Code: ${product.code}`}
              {product.mtrl && ` • MTRL: ${product.mtrl}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={product.isActive ? 'default' : 'secondary'}>
            {product.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Badge>
          {!product.mtrl && (
            <Button
              onClick={handleAddToERP}
              disabled={addingToERP}
              size="sm"
              variant="secondary"
            >
              <Upload className="h-4 w-4 mr-2" />
              {addingToERP ? 'ADDING TO ERP...' : 'ADD TO ERP'}
            </Button>
          )}
          {product.specifications && product.specifications.length > 0 && (
            <Button
              onClick={handleExtractDimensions}
              disabled={extractingDimensions}
              size="sm"
              variant="outline"
            >
              {extractingDimensions ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ruler className="h-4 w-4 mr-2" />
              )}
              EXTRACT DIMENSIONS
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Images */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  PRODUCT IMAGES
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImageUploadOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  ADD IMAGES
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {defaultImage ? (
                <div className="space-y-4">
                  <div className="aspect-square relative overflow-hidden rounded-lg border">
                    <Image
                      src={defaultImage.url}
                      alt={defaultImage.alt || product.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {otherImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {otherImages.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImageIndex(index + 1)}
                          className="aspect-square relative overflow-hidden rounded border hover:border-primary transition-colors"
                        >
                          <Image
                            src={image.url}
                            alt={image.alt || product.name}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No images available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                STOCK LEVELS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {getStockByWarehouse('AIC')}
                  </div>
                  <div className="text-sm text-muted-foreground">AIC Warehouse</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {getStockByWarehouse('NETCORE')}
                  </div>
                  <div className="text-sm text-muted-foreground">NETCORE Warehouse</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Translations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                TRANSLATIONS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.translations.length > 0 ? (
                <div className="space-y-4">
                  {product.translations.map((translation) => (
                    <div key={translation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{translation.languageCode.toUpperCase()}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTranslation(translation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm text-muted-foreground">NAME</label>
                          <p className="text-sm">{translation.name || '-'}</p>
                        </div>
                        {translation.shortDescription && (
                          <div>
                            <label className="text-sm text-muted-foreground">SHORT DESCRIPTION</label>
                            <p className="text-sm">{translation.shortDescription}</p>
                          </div>
                        )}
                        {translation.description && (
                          <div>
                            <label className="text-sm text-muted-foreground">DESCRIPTION</label>
                            <p className="text-sm">{translation.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No translations available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Product Information */}
        <div className="space-y-6">
            <Tabs key={`product-tabs-${product.id}`} defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">BASIC</TabsTrigger>
              <TabsTrigger value="dimensions">DIMENSIONS</TabsTrigger>
              <TabsTrigger value="relations">RELATIONS</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    BASIC INFORMATION
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CODE</label>
                      <p className="text-sm">{product.code || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">MTRL</label>
                      <p className="text-sm">{product.mtrl || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">EAN CODE (CODE1)</label>
                      <p className="text-sm">{product.code1 || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">MANUFACTURER CODE (CODE2)</label>
                      <p className="text-sm">{product.code2 || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">PRODUCT NAME</label>
                    <p className="text-sm font-medium">{product.name}</p>
                  </div>
                  {product.productDataSheet && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">DATASHEET</label>
                      <div className="mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(product.productDataSheet!, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Datasheet
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dimensions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    DIMENSIONS & WEIGHT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">WIDTH</label>
                      <p className="text-sm">{product.width ? `${product.width} ${product.unit?.shortcut || 'cm'}` : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">LENGTH</label>
                      <p className="text-sm">{product.length ? `${product.length} ${product.unit?.shortcut || 'cm'}` : '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">HEIGHT</label>
                      <p className="text-sm">{product.height ? `${product.height} ${product.unit?.shortcut || 'cm'}` : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">WEIGHT</label>
                      <p className="text-sm">{product.weight ? `${product.weight} kg` : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="relations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    RELATIONS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">BRAND</label>
                    <p className="text-sm">{product.brand?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">MANUFACTURER</label>
                    <p className="text-sm">{product.manufacturer?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CATEGORY</label>
                    <p className="text-sm">{product.category?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">UNIT</label>
                    <p className="text-sm">{product.unit?.name || '-'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Specifications moved to separate card below */}
            {product.specifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    SPECIFICATIONS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {product.specifications.map((spec) => (
                      <div key={spec.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-[11px]">{spec.specKey.replace(/_/g, ' ').toUpperCase()}</h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSpec(spec)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSpec(spec.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {spec.translations.map((translation) => (
                            <div key={translation.id} className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                {translation.languageCode.toUpperCase()}
                              </span>
                              <div className="text-right">
                                <div className="text-sm font-medium">{translation.specName}</div>
                                <div className="text-xs text-muted-foreground">{translation.specValue}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </Tabs>
        </div>
      </div>

      {/* Edit Specification Modal */}
      <Dialog open={editSpecOpen} onOpenChange={setEditSpecOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>EDIT SPECIFICATION</DialogTitle>
            <DialogDescription>
              Edit specification: {editingSpec?.specKey?.replace(/_/g, ' ').toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {Object.entries(specForm).map(([langCode, fields]) => (
              <div key={langCode} className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">{langCode.toUpperCase()}</h4>
                
                <div className="space-y-2">
                  <Label htmlFor={`specName-${langCode}`}>SPECIFICATION NAME</Label>
                  <Input
                    id={`specName-${langCode}`}
                    value={fields.specName}
                    onChange={(e) => setSpecForm({
                      ...specForm,
                      [langCode]: { ...fields, specName: e.target.value }
                    })}
                    placeholder="Specification name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`specValue-${langCode}`}>SPECIFICATION VALUE</Label>
                  <Textarea
                    id={`specValue-${langCode}`}
                    value={fields.specValue}
                    onChange={(e) => setSpecForm({
                      ...specForm,
                      [langCode]: { ...fields, specValue: e.target.value }
                    })}
                    placeholder="Specification value"
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSpecOpen(false)}>
              CANCEL
            </Button>
            <Button onClick={handleSaveSpec}>
              SAVE SPECIFICATION
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Translation Modal */}
      <Dialog open={editTranslationOpen} onOpenChange={setEditTranslationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>EDIT TRANSLATION</DialogTitle>
            <DialogDescription>
              Edit translation for {editingTranslation?.languageCode?.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">NAME</Label>
              <Input
                id="name"
                value={translationForm.name}
                onChange={(e) => setTranslationForm({ ...translationForm, name: e.target.value })}
                placeholder="Product name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shortDescription">SHORT DESCRIPTION</Label>
              <Textarea
                id="shortDescription"
                value={translationForm.shortDescription}
                onChange={(e) => setTranslationForm({ ...translationForm, shortDescription: e.target.value })}
                placeholder="Short description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">DESCRIPTION</Label>
              <Textarea
                id="description"
                value={translationForm.description}
                onChange={(e) => setTranslationForm({ ...translationForm, description: e.target.value })}
                placeholder="Full description"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTranslationOpen(false)}>
              CANCEL
            </Button>
            <Button onClick={handleSaveTranslation}>
              SAVE TRANSLATION
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Upload Modal */}
      <ProductImagesDialog
        open={imageUploadOpen}
        onOpenChange={(open) => {
          setImageUploadOpen(open);
          if (!open) {
            router.refresh(); // Refresh when modal closes
          }
        }}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
