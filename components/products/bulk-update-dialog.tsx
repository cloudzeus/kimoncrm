'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { Combobox } from '@/components/shared/combobox';

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds: string[];
  selectedProducts: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

const BulkUpdateDialog: React.FC<BulkUpdateDialogProps> = ({
  open,
  onOpenChange,
  selectedProductIds,
  selectedProducts,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>([]);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadMasterData();
    }
  }, [open]);

  const loadMasterData = async () => {
    try {
      // Fetch brands
      const brandsResponse = await fetch('/api/brands');
      const brandsData = await brandsResponse.json();
      if (brandsData.success && brandsData.data) {
        setBrands(
          brandsData.data.map((b: any) => ({
            value: b.id,
            label: b.name,
          }))
        );
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/master-data/categories');
      const categoriesData = await categoriesResponse.json();
      if (categoriesData.success && categoriesData.categories) {
        setCategories(
          categoriesData.categories.map((c: any) => ({
            value: c.id,
            label: c.name,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedBrandId && !selectedCategoryId) {
      toast.error('Please select at least a brand or category to update');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {};
      if (selectedBrandId) updateData.brandId = selectedBrandId;
      if (selectedCategoryId) updateData.categoryId = selectedCategoryId;

      // Update each product
      const updatePromises = selectedProductIds.map((productId) =>
        fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })
      );

      const results = await Promise.all(updatePromises);
      const successfulResults = results.filter((r) => r.ok);
      const successCount = successfulResults.length;
      const failCount = results.length - successCount;

      // Check ERP sync status and show individual product toasts
      let erpSyncCount = 0;
      let erpSyncFailCount = 0;
      
      for (const result of successfulResults) {
        const data = await result.json();
        const productName = data.data?.name || 'Unknown Product';
        
        if (data.erpSync) {
          if (data.erpSync.success) {
            erpSyncCount++;
            // Show individual success toast for each product synced to ERP
            toast.success(`${productName} saved to ERP`, {
              description: 'Product updated in database and synced to SoftOne ERP',
            });
          } else {
            erpSyncFailCount++;
            // Show individual warning toast for ERP sync failures
            toast.warning(`${productName} - ERP sync failed`, {
              description: 'Product updated in database but ERP sync failed',
            });
          }
        } else {
          // Product doesn't have ERP ID (mtrl)
          toast.info(`${productName} - Database only`, {
            description: 'Product updated in database (no ERP ID for sync)',
            duration: 3000,
          });
        }
      }

      if (successCount > 0) {
        // Show summary toast
        let summaryDescription = `Updated ${successCount} product(s) in database`;
        if (erpSyncCount > 0) {
          summaryDescription += `, synced ${erpSyncCount} to ERP`;
        }
        if (erpSyncFailCount > 0) {
          summaryDescription += `, ${erpSyncFailCount} ERP sync failed`;
        }
        if (failCount > 0) {
          summaryDescription += `, ${failCount} database updates failed`;
        }

        toast.success('Bulk Update Complete', {
          description: summaryDescription,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Failed to update products');
      }
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Failed to update products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>BULK UPDATE PRODUCTS</DialogTitle>
          <DialogDescription>
            Update brand and/or category for {selectedProductIds.length} selected product(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Products List */}
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-muted">
            <Label className="text-xs font-semibold mb-2 block">SELECTED PRODUCTS:</Label>
            <div className="space-y-1">
              {selectedProducts.map((product) => (
                <div key={product.id} className="text-sm">
                  • {product.name}
                </div>
              ))}
            </div>
          </div>

          {/* Brand Selection */}
          <div className="space-y-2">
            <Label>BRAND (OPTIONAL)</Label>
            <Combobox
              options={brands}
              value={selectedBrandId}
              onChange={setSelectedBrandId}
              placeholder="Select brand..."
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to keep existing brand for each product
            </p>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>CATEGORY (OPTIONAL)</Label>
            <Combobox
              options={categories}
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
              placeholder="Select category..."
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to keep existing category for each product
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" disabled={loading}>
            CANCEL
          </Button>
          <Button onClick={handleBulkUpdate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                UPDATING...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                UPDATE {selectedProductIds.length} PRODUCT(S)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUpdateDialog;

