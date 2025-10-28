// @ts-nocheck
'use client';

/**
 * Product Form Dialog Component
 * Form for creating and editing products
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Combobox } from '@/components/shared/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, X, ExternalLink, Sparkles } from 'lucide-react';

interface Product {
  id: string;
  mtrl: string | null;
  code: string | null;
  code1: string | null;
  code2: string | null;
  name: string;
  mtrmark: string | null;
  mtrmanfctr: string | null;
  mtrcategory: string | null;
  mtrgroup: string | null;
  isActive: boolean;
  brandId: string | null;
  manufacturerId: string | null;
  categoryId: string | null;
  unitId: string | null;
  width: number | null;
  length: number | null;
  height: number | null;
  weight: number | null;
  productDataSheet: string | null;
  translations?: Array<{
    languageCode: string;
    name: string | null;
    description: string | null;
  }>;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>([]);
  const [manufacturers, setManufacturers] = useState<Array<{ value: string; label: string }>>([]);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [mtrgroups, setMtrgroups] = useState<Array<{ value: string; label: string }>>([]);
  const [units, setUnits] = useState<Array<{ value: string; label: string }>>([]);
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [currentDatasheet, setCurrentDatasheet] = useState<string | null>(null);
  const [uploadingDatasheet, setUploadingDatasheet] = useState(false);
  const [aiResearching, setAiResearching] = useState(false);
  const [aiResearchResult, setAiResearchResult] = useState<any>(null);
  const [showAiResults, setShowAiResults] = useState(false);
  const [insertToERP, setInsertToERP] = useState(true); // Default to true since it's recommended
  const [creatingWithAI, setCreatingWithAI] = useState(false);
  const [syncToERP, setSyncToERP] = useState(true); // For edit mode - sync changes to ERP

  const [formData, setFormData] = useState({
    code: '',
    code1: '',
    code2: '',
    name: '',
    brandId: '',
    manufacturerCode: '', // Using code instead of ID
    categoryId: '',
    mtrgroupCode: '', // MtrGroup code
    unitId: '',
    width: '',
    length: '',
    height: '',
    weight: '',
    isActive: true,
  });

  const handleAiResearch = async () => {
    if (!formData.name) {
      toast.error('Missing Information', {
        description: 'Product name is required for AI research.',
      });
      return;
    }

    const selectedBrand = brands.find(b => b.value === formData.brandId);

    setAiResearching(true);
    try {
      const response = await fetch('/api/products/ai-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          eanCode: formData.code1,
          brand: selectedBrand?.label || '',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiResearchResult(data.data);
        setShowAiResults(true);
        
        toast.success('AI Research Complete', {
          description: 'Product information has been researched successfully. Review the results below.',
        });
      } else {
        toast.error('AI Research Failed', {
          description: data.error || 'Failed to research product information',
        });
      }
    } catch (error) {
      console.error('Error in AI research:', error);
      toast.error('Error', {
        description: 'Failed to research product information',
      });
    } finally {
      setAiResearching(false);
    }
  };

  const createProductWithAI = async () => {
    if (!aiResearchResult) return;

    setCreatingWithAI(true);
    try {
      const response = await fetch('/api/products/create-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productData: {
            name: formData.name,
            code1: aiResearchResult.eanCode || '',
            code2: aiResearchResult.manufacturerCode || '',
            brandId: aiResearchResult.suggestedBrandId || formData.brandId,
            categoryId: aiResearchResult.suggestedCategoryId || formData.categoryId,
            manufacturerId: aiResearchResult.suggestedManufacturerId || formData.manufacturerId,
            unitId: formData.unitId,
            width: aiResearchResult.width,
            length: aiResearchResult.length,
            height: aiResearchResult.height,
            weight: aiResearchResult.weight,
            isActive: formData.isActive,
          },
          aiData: {
            specifications: aiResearchResult.specifications,
            translations: aiResearchResult.translations,
          },
          insertToERP: insertToERP,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.erpInserted) {
          toast.success('Product Created & Added to ERP', {
            description: `Code: ${data.generatedCode}, MTRL: ${data.mtrl}`,
          });
        } else if (insertToERP && data.erpError) {
          toast.warning('Product Created (ERP Failed)', {
            description: `Product saved to database, but ERP insertion failed: ${data.erpError}`,
          });
        } else {
          toast.success('Product Created', {
            description: 'Product created successfully in database',
          });
        }
        setShowAiResults(false);
        onSuccess();
        onClose();
      } else {
        toast.error('Creation Failed', {
          description: data.error || 'Failed to create product',
        });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error', {
        description: 'Failed to create product',
      });
    } finally {
      setCreatingWithAI(false);
    }
  };

  const applyAiResults = async () => {
    if (!aiResearchResult) return;

    // Check for duplicates before applying
    if (aiResearchResult.eanCode || aiResearchResult.manufacturerCode) {
      try {
        const duplicateResponse = await fetch('/api/products/check-duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eanCode: aiResearchResult.eanCode,
            manufacturerCode: aiResearchResult.manufacturerCode,
          }),
        });

        const duplicateData = await duplicateResponse.json();

        if (duplicateData.isDuplicate && duplicateData.existingProduct) {
          const existing = duplicateData.existingProduct;
          toast.error('Duplicate Product Found', {
            description: `This product already exists: ${existing.name} (EAN: ${existing.code1}, Mfr Code: ${existing.code2})`,
          });
          return;
        }
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    }

    // Apply AI research results to form
    setFormData(prev => ({
      ...prev,
      name: aiResearchResult.name || prev.name,
      code: aiResearchResult.eanCode || prev.code,
      code1: aiResearchResult.eanCode || prev.code1,
      code2: aiResearchResult.manufacturerCode || prev.code2,
      width: aiResearchResult.width?.toString() || prev.width,
      length: aiResearchResult.length?.toString() || prev.length,
      height: aiResearchResult.height?.toString() || prev.height,
      weight: aiResearchResult.weight?.toString() || prev.weight,
      brandId: aiResearchResult.suggestedBrandId || prev.brandId,
      categoryId: aiResearchResult.suggestedCategoryId || prev.categoryId,
      manufacturerId: aiResearchResult.suggestedManufacturerId || prev.manufacturerId,
    }));

    setShowAiResults(false);
    toast.success('AI Results Applied', {
      description: 'Product information has been updated with AI research results. You can now save the product.',
    });
  };

  // Load master data
  useEffect(() => {
    if (open) {
      loadMasterData();
      // Reload master data when product changes to get updated manufacturers
      if (product) {
        loadMasterData();
      }
    }
  }, [open, product]);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      console.log('Product data for form:', {
        categoryId: product.categoryId,
        mtrcategory: product.mtrcategory,
        brandId: product.brandId,
        manufacturerCode: product.mtrmanfctr
      });
      setFormData({
        code: product.code || '',
        code1: product.code1 || '',
        code2: product.code2 || '',
        name: product.name || '',
        brandId: product.brandId || '',
        manufacturerCode: product.mtrmanfctr || '', // Use mtrmanfctr (manufacturer code)
        categoryId: product.categoryId || '',
        mtrgroupCode: product.mtrgroup || '', // Use mtrgroup
        unitId: product.unitId || '',
        width: product.width?.toString() || '',
        length: product.length?.toString() || '',
        height: product.height?.toString() || '',
        weight: product.weight?.toString() || '',
        isActive: product.isActive,
      });
      setCurrentDatasheet(product.productDataSheet);
      setDatasheetFile(null);
    } else {
      // Reset form for new product
      setFormData({
        code: '',
        code1: '',
        code2: '',
        name: '',
        brandId: '',
        manufacturerCode: '',
        categoryId: '',
        mtrgroupCode: '',
        unitId: '',
        width: '',
        length: '',
        height: '',
        weight: '',
        isActive: true,
      });
    }
  }, [product]);

  const loadMasterData = async () => {
    try {
      // Load brands
      const brandsRes = await fetch('/api/brands');
      const brandsData = await brandsRes.json();
      if (brandsData.success) {
        setBrands(
          brandsData.data.map((b: any) => ({
            value: b.id,
            label: b.name,
          }))
        );
      }

      // Load manufacturers (using code as value, name as label)
      const manufacturersRes = await fetch('/api/manufacturers?limit=1000');
      const manufacturersData = await manufacturersRes.json();
      if (manufacturersData.success) {
        const manufacturerOptions = manufacturersData.data.map((m: any) => ({
          value: m.code, // Use code as value
          label: `${m.name} (${m.code})`, // Show name and code for clarity
        }));
        console.log('Loaded manufacturers:', manufacturerOptions.length);
        setManufacturers(manufacturerOptions);
      }

      // Load categories
      console.log('Fetching categories...');
      const categoriesRes = await fetch('/api/master-data/categories');
      const categoriesData = await categoriesRes.json();
      console.log('Categories API response:', categoriesData);
      if (categoriesData.success) {
        const categoryOptions = categoriesData.categories.map((c: any) => ({
          value: c.id,
          label: c.name,
        }));
        console.log('Loaded categories:', categoryOptions.length, categoryOptions.slice(0, 3));
        setCategories(categoryOptions);
      } else {
        console.error('Failed to load categories:', categoriesData);
      }

      // Load mtrgroups (products - sodtype 51)
      const mtrgroupsRes = await fetch('/api/mtrgroups?sodtype=51');
      const mtrgroupsData = await mtrgroupsRes.json();
      if (mtrgroupsData.success) {
        setMtrgroups(
          mtrgroupsData.data.map((g: any) => ({
            value: g.mtrgroup, // Use mtrgroup code as value
            label: `${g.name} (${g.mtrgroup})`, // Show name and code
          }))
        );
      }

      // Load units
      const unitsRes = await fetch('/api/master-data/units');
      const unitsData = await unitsRes.json();
      if (unitsData.success) {
        setUnits(
          unitsData.units.map((u: any) => ({
            value: u.id,
            label: u.name,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleDatasheetUpload = async (file: File) => {
    if (!product?.id) {
      toast.error('Error', {
        description: 'Please save the product first before uploading a datasheet',
      });
      return;
    }

    setUploadingDatasheet(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/products/${product.id}/datasheet`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Success', {
          description: 'Datasheet uploaded successfully',
        });
        setCurrentDatasheet(data.data.productDataSheet);
        setDatasheetFile(null);
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to upload datasheet',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to upload datasheet',
      });
    } finally {
      setUploadingDatasheet(false);
    }
  };

  const handleDatasheetDelete = async () => {
    if (!product?.id || !currentDatasheet) return;

    if (!confirm('Are you sure you want to delete this datasheet?')) return;

    setUploadingDatasheet(true);
    try {
      const response = await fetch(`/api/products/${product.id}/datasheet`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Success', {
          description: 'Datasheet deleted successfully',
        });
        setCurrentDatasheet(null);
        setDatasheetFile(null);
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to delete datasheet',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete datasheet',
      });
    } finally {
      setUploadingDatasheet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Code is required only if NOT inserting to ERP (for new products)
    if (!product && !insertToERP && !formData.code) {
      toast.error('ERP Code is required when not inserting to ERP');
      return;
    }

    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }

    // Additional validation for ERP insertion
    if (!product && insertToERP) {
      if (!formData.brandId || !formData.categoryId || !formData.manufacturerId || !formData.unitId) {
        toast.error('Brand, Category, Manufacturer, and Unit are required for ERP insertion');
        return;
      }
    }

    try {
      setLoading(true);

      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          syncToERP: product ? syncToERP : undefined, // Only send for updates
          insertToERP: !product ? insertToERP : undefined, // Only send for creates
        }),
      });

      const data = await response.json();

      if (data.success) {
        const productName = data.data?.name || 'Product';
        
        if (product) {
          // Editing existing product - check ERP sync status
          if (data.erpSync) {
            if (data.erpSync.success) {
              toast.success(`${productName} saved to ERP`, {
                description: 'Product updated in database and synced to SoftOne ERP',
              });
            } else {
              toast.warning(`${productName} - ERP sync failed`, {
                description: 'Product updated in database but ERP sync failed',
              });
            }
          } else if (product.mtrl && !syncToERP) {
            // User chose not to sync to ERP
            toast.success(`${productName} updated`, {
              description: 'Product updated in database only (ERP sync disabled)',
            });
          } else {
            // No ERP sync attempted (no mtrl ID)
            toast.info(`${productName} updated`, {
              description: 'Product updated in database (no ERP ID for sync)',
            });
          }
        } else {
          // Creating new product
          if (data.erpInserted) {
            toast.success(`${productName} created & added to ERP`, {
              description: `Code: ${data.data.code}, MTRL: ${data.data.mtrl}`,
            });
          } else if (insertToERP && data.erpError) {
            toast.warning(`${productName} created (ERP failed)`, {
              description: `Product saved to database, but ERP insertion failed: ${data.erpError}`,
            });
          } else {
            toast.success(`${productName} created successfully`, {
              description: 'New product added to database',
            });
          }
        }
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {product ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
          </DialogTitle>
          <DialogDescription>
            {product
              ? 'Update product information'
              : 'Create a new product'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">BASIC</TabsTrigger>
              <TabsTrigger value="dimensions">DIMENSIONS</TabsTrigger>
              <TabsTrigger value="relations">RELATIONS</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    ERP CODE {!product && !insertToERP ? '*' : '(AUTO-GENERATED)'}
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder={!product && insertToERP ? "Will be auto-generated" : "ERP code"}
                    required={!product && !insertToERP}
                    disabled={!product && insertToERP}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code1">EAN CODE</Label>
                  <Input
                    id="code1"
                    value={formData.code1}
                    onChange={(e) =>
                      setFormData({ ...formData, code1: e.target.value.toUpperCase() })
                    }
                    placeholder="EAN code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code2">MANUFACTURER CODE</Label>
                  <Input
                    id="code2"
                    value={formData.code2}
                    onChange={(e) =>
                      setFormData({ ...formData, code2: e.target.value.toUpperCase() })
                    }
                    placeholder="Manufacturer code"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked as boolean })
                    }
                  />
                  <Label htmlFor="isActive">ACTIVE</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">NAME *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value.toUpperCase() })
                  }
                  placeholder="Product name"
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="dimensions" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">WIDTH (CM)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={(e) =>
                      setFormData({ ...formData, width: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">LENGTH (CM)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.01"
                    value={formData.length}
                    onChange={(e) =>
                      setFormData({ ...formData, length: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">HEIGHT (CM)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">WEIGHT (KG)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Datasheet Upload */}
              <div className="space-y-2 pt-4 border-t">
                <Label>PRODUCT DATASHEET (PDF/WORD)</Label>
                {currentDatasheet ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-sm truncate">
                      {currentDatasheet.split('/').pop()}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(currentDatasheet, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDatasheetDelete}
                      disabled={uploadingDatasheet}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : product?.id ? (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleDatasheetUpload(file);
                        }
                      }}
                      disabled={uploadingDatasheet}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload PDF or Word document (max 10MB)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Save the product first to upload a datasheet
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="relations" className="space-y-4">
              <div className="space-y-2">
                <Label>BRAND</Label>
                <Select
                  value={formData.brandId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, brandId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.value} value={brand.value}>
                        {brand.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>MANUFACTURER</Label>
                <Select
                  value={formData.manufacturerCode}
                  onValueChange={(value) =>
                    setFormData({ ...formData, manufacturerCode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manufacturer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer.value} value={manufacturer.value}>
                        {manufacturer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>CATEGORY</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => {
                    console.log('Category selection changed:', { from: formData.categoryId, to: value });
                    setFormData({ ...formData, categoryId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Current value: {formData.categoryId || 'none'} | Options: {categories.length}
                </div>
              </div>

              <div className="space-y-2">
                <Label>MTRGROUP</Label>
                <Select
                  value={formData.mtrgroupCode}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mtrgroupCode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mtrgroup..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mtrgroups.map((mtrgroup) => (
                      <SelectItem key={mtrgroup.value} value={mtrgroup.value}>
                        {mtrgroup.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>UNIT</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unitId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          {/* ERP Sync Checkbox for Edit Mode */}
          {product && product.mtrl && (
            <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Checkbox
                id="syncToERP"
                checked={syncToERP}
                onCheckedChange={(checked) => setSyncToERP(checked as boolean)}
                className="h-5 w-5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="syncToERP"
                  className="text-sm font-semibold cursor-pointer"
                >
                  SYNC CHANGES TO SOFTONE ERP
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Update product in SoftOne ERP (MTRL: {product.mtrl})
                </p>
              </div>
            </div>
          )}

          {/* ERP Insert Checkbox for Create Mode */}
          {!product && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="insertToERPManual"
                checked={insertToERP}
                onCheckedChange={(checked) => setInsertToERP(checked as boolean)}
                className="h-5 w-5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="insertToERPManual"
                  className="text-sm font-semibold cursor-pointer"
                >
                  INSERT TO SOFTONE ERP (RECOMMENDED)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically generates product code: CATEGORY.MANUFACTURER.XXXXX (e.g., 7.124.00001)
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAiResearch}
              disabled={aiResearching || !formData.name}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {aiResearching ? 'Researching...' : 'Get Info from AI'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : product ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* AI Research Results Dialog */}
      {showAiResults && aiResearchResult && (
        <Dialog open={showAiResults} onOpenChange={setShowAiResults}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI RESEARCH RESULTS</DialogTitle>
              <DialogDescription>
                Review the AI-generated product information and apply it to your form
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase">BASIC INFORMATION</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">PRODUCT NAME</Label>
                    <p className="text-sm font-medium">{aiResearchResult.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">EAN CODE</Label>
                    <p className="text-sm font-medium">{aiResearchResult.eanCode || 'Not found'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">MANUFACTURER CODE</Label>
                    <p className="text-sm font-medium">{aiResearchResult.manufacturerCode || 'Not found'}</p>
                  </div>
                </div>
              </div>

              {/* AI Suggested Matches */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase">AI SUGGESTED MATCHES</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3 bg-blue-50">
                    <Label className="text-xs text-muted-foreground">BRAND</Label>
                    <p className="text-sm font-medium">{aiResearchResult.suggestedBrandName || 'Not matched'}</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-green-50">
                    <Label className="text-xs text-muted-foreground">MANUFACTURER</Label>
                    <p className="text-sm font-medium">{aiResearchResult.suggestedManufacturerName || 'Not matched'}</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-purple-50">
                    <Label className="text-xs text-muted-foreground">CATEGORY</Label>
                    <p className="text-sm font-medium">{aiResearchResult.suggestedCategoryName || 'Not matched'}</p>
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              {(aiResearchResult.width || aiResearchResult.length || aiResearchResult.height || aiResearchResult.weight) && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase">DIMENSIONS & WEIGHT</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {aiResearchResult.width && (
                      <div>
                        <Label className="text-xs text-muted-foreground">WIDTH (cm)</Label>
                        <p className="text-sm font-medium">{aiResearchResult.width}</p>
                      </div>
                    )}
                    {aiResearchResult.length && (
                      <div>
                        <Label className="text-xs text-muted-foreground">LENGTH (cm)</Label>
                        <p className="text-sm font-medium">{aiResearchResult.length}</p>
                      </div>
                    )}
                    {aiResearchResult.height && (
                      <div>
                        <Label className="text-xs text-muted-foreground">HEIGHT (cm)</Label>
                        <p className="text-sm font-medium">{aiResearchResult.height}</p>
                      </div>
                    )}
                    {aiResearchResult.weight && (
                      <div>
                        <Label className="text-xs text-muted-foreground">WEIGHT (kg)</Label>
                        <p className="text-sm font-medium">{aiResearchResult.weight}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {aiResearchResult.specifications && aiResearchResult.specifications.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase">SPECIFICATIONS ({aiResearchResult.specifications.length})</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {aiResearchResult.specifications.map((spec: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <Label className="text-xs text-muted-foreground">{spec.specName}</Label>
                        <p className="text-sm">{spec.specValue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Translations */}
              {aiResearchResult.translations && aiResearchResult.translations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase">TRANSLATIONS</h3>
                  <div className="space-y-3">
                    {aiResearchResult.translations.map((trans: any, index: number) => (
                      <div key={index} className="border rounded p-4">
                        <h4 className="font-medium mb-2">{trans.languageCode.toUpperCase()}</h4>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">NAME</Label>
                            <p className="text-sm">{trans.name}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">SHORT DESCRIPTION</Label>
                            <p className="text-sm">{trans.shortDescription}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">DESCRIPTION</Label>
                            <p className="text-sm">{trans.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-4">
              {/* ERP Insertion Option */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="insertToERP"
                  checked={insertToERP}
                  onCheckedChange={(checked) => setInsertToERP(checked as boolean)}
                  className="h-5 w-5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="insertToERP"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    INSERT TO ERP (RECOMMENDED)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically generates product code: CATEGORY.MANUFACTURER.XXXXX (e.g., 7.124.00001)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAiResults(false)} disabled={creatingWithAI}>
                  DISCARD
                </Button>
                <Button variant="secondary" onClick={applyAiResults} disabled={creatingWithAI}>
                  APPLY TO FORM
                </Button>
                <Button 
                  onClick={createProductWithAI} 
                  disabled={creatingWithAI || (!aiResearchResult.suggestedBrandId && !formData.brandId) || (!aiResearchResult.suggestedCategoryId && !formData.categoryId)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creatingWithAI ? 'CREATING...' : 'CREATE PRODUCT NOW'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
