"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Brand {
  id: string;
  name: string;
  code: string | null;
}

interface SupplierBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  existingBrandIds: string[];
  onSuccess: () => void;
}

export function SupplierBrandDialog({
  open,
  onOpenChange,
  supplierId,
  existingBrandIds,
  onSuccess,
}: SupplierBrandDialogProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadBrands();
      setSelectedBrandIds(new Set());
      setSearch("");
    }
  }, [open]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/master-data/brands");
      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands);
      } else {
        toast.error("Failed to load brands");
      }
    } catch (error) {
      console.error("Error loading brands:", error);
      toast.error("Error loading brands");
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = (brandId: string) => {
    const newSelection = new Set(selectedBrandIds);
    if (newSelection.has(brandId)) {
      newSelection.delete(brandId);
    } else {
      newSelection.add(brandId);
    }
    setSelectedBrandIds(newSelection);
  };

  const handleSubmit = async () => {
    if (selectedBrandIds.size === 0) {
      toast.error("Please select at least one brand");
      return;
    }

    setSubmitting(true);
    try {
      // Create all associations
      const promises = Array.from(selectedBrandIds).map(brandId =>
        fetch("/api/brands/suppliers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brandId,
            supplierId,
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      
      const errors = results.filter(r => r.status === 'rejected' || !r.value.ok);
      
      if (errors.length > 0) {
        console.error("Some brands failed to add:", errors);
      }

      const successCount = results.length - errors.length;
      
      if (successCount > 0) {
        toast.success(`${successCount} brand(s) added successfully${errors.length > 0 ? ` (${errors.length} failed)` : ''}`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error("Failed to add brands");
      }
    } catch (error) {
      console.error("Error adding brands:", error);
      toast.error("Failed to add brands");
    } finally {
      setSubmitting(false);
    }
  };

  const availableBrands = brands
    .filter(brand => !existingBrandIds.includes(brand.id))
    .filter(brand => 
      search === "" || 
      brand.name.toLowerCase().includes(search.toLowerCase()) ||
      brand.code?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>ADD BRANDS</DialogTitle>
          <DialogDescription>
            Select one or more brands to associate with this supplier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="search">Search Brands</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-4 space-y-3">
                {availableBrands.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {search ? "No brands found" : "No available brands"}
                  </div>
                ) : (
                  availableBrands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleBrand(brand.id)}
                    >
                      <Checkbox
                        checked={selectedBrandIds.has(brand.id)}
                        onCheckedChange={() => toggleBrand(brand.id)}
                        className="pointer-events-none"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-xs">{brand.name}</div>
                        {brand.code && (
                          <div className="text-xs text-muted-foreground">
                            Code: {brand.code}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {selectedBrandIds.size > 0 && (
            <div className="text-sm text-muted-foreground pt-2 border-t">
              {selectedBrandIds.size} brand{selectedBrandIds.size !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || selectedBrandIds.size === 0}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${selectedBrandIds.size} Brand${selectedBrandIds.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
