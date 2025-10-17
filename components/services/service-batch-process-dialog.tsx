'use client';

/**
 * Service Batch Process Dialog Component
 * Dialog for batch processing multiple services (category, brand, translate)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Languages } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface ServiceCategory {
  code: string;
  name: string;
  mtrcategory: string;
}

interface ServiceBatchProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedServiceIds: string[];
  onSuccess: () => void;
}

export default function ServiceBatchProcessDialog({
  open,
  onOpenChange,
  selectedServiceIds,
  onSuccess,
}: ServiceBatchProcessDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('');

  // Fetch brands, languages, and categories
  useEffect(() => {
    if (open) {
      fetchBrands();
      fetchLanguages();
      fetchServiceCategories();
    }
  }, [open]);

  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await fetch('/api/brands');
      const data = await response.json();
      
      if (data.success) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast({
        title: 'ERROR',
        description: 'Failed to fetch brands',
        variant: 'destructive',
      });
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      setLoadingLanguages(true);
      const response = await fetch('/api/languages');
      const data = await response.json();
      
      if (data.success) {
        // Filter out Greek (el) as it's the source language
        const availableLanguages = data.data.filter((lang: Language) => lang.code !== 'el');
        setLanguages(availableLanguages);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast({
        title: 'ERROR',
        description: 'Failed to fetch languages',
        variant: 'destructive',
      });
    } finally {
      setLoadingLanguages(false);
    }
  };

  const fetchServiceCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/services/categories');
      const data = await response.json();
      
      if (data.success) {
        setServiceCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching service categories:', error);
      toast({
        title: 'ERROR',
        description: 'Failed to fetch service categories',
        variant: 'destructive',
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      setSelectedLanguages(selectedLanguages.filter((c) => c !== code));
    } else {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const handleUpdateBrand = async () => {
    if (!selectedBrandId) {
      toast({
        title: 'ERROR',
        description: 'Please select a brand',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      toast({
        title: 'UPDATING',
        description: `Updating brand for ${selectedServiceIds.length} service(s)...`,
      });

      // Convert "no-brand" to null for the API
      const brandIdToSend = selectedBrandId === 'no-brand' ? null : selectedBrandId;

      // Update each service
      let successCount = 0;
      let errorCount = 0;

      for (const serviceId of selectedServiceIds) {
        try {
          const response = await fetch(`/api/services/${serviceId}/update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              brandId: brandIdToSend,
            }),
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: 'BATCH UPDATE COMPLETE',
        description: `Updated: ${successCount}, Failed: ${errorCount}`,
      });

      if (successCount > 0) {
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      toast({
        title: 'ERROR',
        description: 'Failed to update brand',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (selectedLanguages.length === 0) {
      toast({
        title: 'ERROR',
        description: 'Please select at least one language',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      toast({
        title: 'TRANSLATING',
        description: `Translating ${selectedServiceIds.length} service(s) to ${selectedLanguages.length} language(s)...`,
      });

      // Translate each service
      let successCount = 0;
      let errorCount = 0;

      for (const serviceId of selectedServiceIds) {
        try {
          const response = await fetch(`/api/services/${serviceId}/translate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              targetLanguages: selectedLanguages,
            }),
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: 'BATCH TRANSLATION COMPLETE',
        description: `Translated: ${successCount}, Failed: ${errorCount}`,
      });

      if (successCount > 0) {
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error('Error translating services:', error);
      toast({
        title: 'ERROR',
        description: 'Failed to translate services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      setLoading(true);

      toast({
        title: 'UPDATING',
        description: `Updating category for ${selectedServiceIds.length} service(s)...`,
      });

      const response = await fetch('/api/services/bulk-assign-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceIds: selectedServiceIds,
          serviceCategoryCode: selectedCategoryCode || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'BATCH UPDATE COMPLETE',
          description: data.message || `Updated ${data.count} service(s)`,
        });
        onSuccess();
        handleClose();
      } else {
        throw new Error(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'ERROR',
        description: error instanceof Error ? error.message : 'Failed to update category',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedBrandId('');
    setSelectedLanguages([]);
    setSelectedCategoryCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="uppercase flex items-center gap-2">
            <Edit className="h-5 w-5" />
            BATCH PROCESS SERVICES
          </DialogTitle>
          <DialogDescription>
            Update {selectedServiceIds.length} selected service(s)
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="category" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="category">UPDATE CATEGORY</TabsTrigger>
            <TabsTrigger value="brand">UPDATE BRAND</TabsTrigger>
            <TabsTrigger value="translate">TRANSLATE</TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="uppercase">SELECT SERVICE CATEGORY</Label>
              {loadingCategories ? (
                <div className="flex items-center justify-center h-10 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <Select
                  value={selectedCategoryCode}
                  onValueChange={setSelectedCategoryCode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="SELECT CATEGORY" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-category">NO CATEGORY</SelectItem>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.code} value={category.code}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-muted-foreground">
                This will update the service category for all {selectedServiceIds.length} selected service(s)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                CANCEL
              </Button>
              <Button
                onClick={handleUpdateCategory}
                disabled={loading || !selectedCategoryCode}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                UPDATE CATEGORY
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="brand" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brand" className="uppercase">SELECT BRAND</Label>
              {loadingBrands ? (
                <div className="flex items-center justify-center h-10 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <Select
                  value={selectedBrandId}
                  onValueChange={setSelectedBrandId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="SELECT BRAND" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-brand">NO BRAND</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-muted-foreground">
                This will update the brand for all {selectedServiceIds.length} selected service(s)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                CANCEL
              </Button>
              <Button
                onClick={handleUpdateBrand}
                disabled={loading || !selectedBrandId}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                UPDATE BRAND
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="translate" className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="uppercase">SELECT TARGET LANGUAGES</Label>
              
              {loadingLanguages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : languages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No languages available
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-4 border rounded-md">
                  {languages.map((language) => (
                    <div key={language.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`batch-${language.code}`}
                        checked={selectedLanguages.includes(language.code)}
                        onCheckedChange={() => toggleLanguage(language.code)}
                      />
                      <label
                        htmlFor={`batch-${language.code}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {language.name} ({language.nativeName})
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                This will translate all {selectedServiceIds.length} selected service(s) to the selected language(s) using DeepSeek AI
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                CANCEL
              </Button>
              <Button
                onClick={handleTranslate}
                disabled={loading || selectedLanguages.length === 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Languages className="mr-2 h-4 w-4" />
                TRANSLATE ({selectedLanguages.length})
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

