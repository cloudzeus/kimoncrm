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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Save, Loader2, SearchCheck, Sparkles, RefreshCw } from 'lucide-react';
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
  const [lookupLoading, setLookupLoading] = useState(false);
  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>([]);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [manufacturers, setManufacturers] = useState<Array<{ value: string; label: string }>>([]);
  const [mtrgroups, setMtrgroups] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>('');
  const [selectedMtrgroup, setSelectedMtrgroup] = useState<string>('');
  const [lookupCodes, setLookupCodes] = useState(false);
  const [lookupOnly, setLookupOnly] = useState(false);
  const [syncToSoftone, setSyncToSoftone] = useState(false);

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

      // Fetch manufacturers
      const manufacturersResponse = await fetch('/api/manufacturers');
      const manufacturersData = await manufacturersResponse.json();
      if (manufacturersData.success && manufacturersData.data) {
        setManufacturers(
          manufacturersData.data.map((m: any) => ({
            value: m.id,
            label: m.name,
          }))
        );
      }

      // Fetch mtrgroups
      const mtrgroupsResponse = await fetch('/api/master-data/mtrgroups?sodtype=51');
      const mtrgroupsData = await mtrgroupsResponse.json();
      if (mtrgroupsData.success && mtrgroupsData.data) {
        setMtrgroups(
          mtrgroupsData.data.map((m: any) => ({
            value: m.mtrgroup,
            label: `${m.name} (${m.mtrgroup})`,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleLookupCodes = async () => {
    setLookupLoading(true);
    setLoading(false);
    try {
      const response = await fetch('/api/products/lookup-codes-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProductIds,
          updateDatabase: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const { updated, found, errors } = data.summary;
        toast.success('Lookup Codes Complete', {
          description: `Updated: ${updated}, Found: ${found}${errors > 0 ? `, Errors: ${errors}` : ''}`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Failed to lookup codes');
      }
    } catch (error) {
      console.error('Error looking up codes:', error);
      toast.error('Failed to lookup codes');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSyncToSoftone = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/sync-codes-to-softone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProductIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const { synced, skipped, errors } = data.summary;
        toast.success('Synced to SoftOne', {
          description: `Synced: ${synced}, Skipped: ${skipped}${errors > 0 ? `, Errors: ${errors}` : ''}`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Failed to sync to SoftOne');
      }
    } catch (error) {
      console.error('Error syncing to SoftOne:', error);
      toast.error('Failed to sync to SoftOne');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    // Handle lookup codes first if selected
    if (lookupOnly || lookupCodes) {
      await handleLookupCodes();
    }

    // Handle sync to SoftOne if selected
    if (syncToSoftone) {
      await handleSyncToSoftone();
    }

    // If only lookup or sync was selected, we're done
    if (lookupOnly || syncToSoftone) {
      return;
    }

    if (!selectedBrandId && !selectedCategoryId && !selectedManufacturerId && !selectedMtrgroup && !lookupCodes) {
      toast.error('Please select at least one field to update or action to perform');
      return;
    }

    setLoading(true);
    setLookupLoading(false);
    try {
      const updateData: any = {};
      if (selectedBrandId) updateData.brandId = selectedBrandId;
      if (selectedCategoryId) updateData.categoryId = selectedCategoryId;
      if (selectedManufacturerId) updateData.manufacturerId = selectedManufacturerId;
      if (selectedMtrgroup) updateData.mtrgroup = selectedMtrgroup;

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

      // Handle code lookup if requested
      if (lookupCodes) {
        await handleLookupCodes();
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
          <DialogTitle>BULK ACTIONS</DialogTitle>
          <DialogDescription>
            Update brand/category or lookup EAN/manufacturer codes for {selectedProductIds.length} selected product(s)
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

          {/* Action Options */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="sync-softone"
                checked={syncToSoftone}
                onCheckedChange={(checked) => {
                  setSyncToSoftone(checked as boolean);
                }}
              />
              <div className="flex-1">
                <Label htmlFor="sync-softone" className="font-semibold cursor-pointer">
                  UPDATE SOFTONE
                </Label>
                <p className="text-xs text-muted-foreground">
                  Sync EAN codes (CODE1) and manufacturer codes (CODE2) to SoftOne ERP for all selected products
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="lookup-only"
                checked={lookupOnly}
                onCheckedChange={(checked) => {
                  setLookupOnly(checked as boolean);
                  if (checked) {
                    setLookupCodes(false);
                  }
                }}
              />
              <div className="flex-1">
                <Label htmlFor="lookup-only" className="font-semibold cursor-pointer">
                  AI LOOKUP CODES ONLY
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use AI to lookup and update EAN codes and manufacturer codes for all selected products
                </p>
              </div>
            </div>

            {!lookupOnly && (
              <div className="flex items-center space-x-3 pl-6">
                <Checkbox
                  id="lookup-codes"
                  checked={lookupCodes}
                  onCheckedChange={(checked) => setLookupCodes(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="lookup-codes" className="cursor-pointer">
                    Also lookup codes (in addition to updates above)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Generate EAN and manufacturer codes using AI in addition to other updates
                  </p>
                </div>
              </div>
            )}
          </div>

          {!lookupOnly && !syncToSoftone && (
            <>
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

              {/* Manufacturer Selection */}
              <div className="space-y-2">
                <Label>MANUFACTURER (OPTIONAL)</Label>
                <Combobox
                  options={manufacturers}
                  value={selectedManufacturerId}
                  onChange={setSelectedManufacturerId}
                  placeholder="Select manufacturer..."
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep existing manufacturer for each product
                </p>
              </div>

              {/* Group (MtrGroup) Selection */}
              <div className="space-y-2">
                <Label>GROUP (MTRGROUP) (OPTIONAL)</Label>
                <Combobox
                  options={mtrgroups}
                  value={selectedMtrgroup}
                  onChange={setSelectedMtrgroup}
                  placeholder="Select product group..."
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep existing group for each product
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" disabled={loading || lookupLoading}>
            CANCEL
          </Button>
          <Button onClick={handleBulkUpdate} disabled={loading || lookupLoading}>
            {loading || lookupLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {lookupOnly && syncToSoftone ? 'LOOKUP & SYNC...' : syncToSoftone ? 'SYNCING TO SOFTONE...' : lookupOnly ? 'LOOKING UP CODES...' : 'UPDATING...'}
              </>
            ) : lookupOnly && syncToSoftone ? (
              <>
                <SearchCheck className="mr-2 h-4 w-4" />
                LOOKUP & UPDATE SOFTONE
              </>
            ) : syncToSoftone ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                UPDATE SOFTONE
              </>
            ) : lookupOnly ? (
              <>
                <SearchCheck className="mr-2 h-4 w-4" />
                LOOKUP CODES
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

