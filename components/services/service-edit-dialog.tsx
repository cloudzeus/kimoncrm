'use client';

/**
 * Service Edit Dialog Component
 * Dialog for editing service details including brand assignment
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  code: string | null;
}

interface Service {
  id: string;
  name: string;
  brandId: string | null;
  isActive: boolean;
  brand: Brand | null;
}

interface ServiceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSuccess: () => void;
}

export default function ServiceEditDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    brandId: '',
    isActive: true,
  });

  // Fetch brands
  useEffect(() => {
    if (open) {
      fetchBrands();
    }
  }, [open]);

  // Update form when service changes
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        brandId: service.brandId || '',
        isActive: service.isActive,
      });
    }
  }, [service]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service) return;
    
    try {
      setLoading(true);

      const response = await fetch(`/api/services/${service.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          brandId: formData.brandId || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'SUCCESS',
          description: 'Service updated successfully',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'ERROR',
        description: error instanceof Error ? error.message : 'Failed to update service',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="uppercase">EDIT SERVICE</DialogTitle>
          <DialogDescription>
            Update service details and assign a brand
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="uppercase">NAME *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Service name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand" className="uppercase">BRAND</Label>
              {loadingBrands ? (
                <div className="flex items-center justify-center h-10 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <Select
                  value={formData.brandId || 'no-brand'}
                  onValueChange={(value) => setFormData({ ...formData, brandId: value === 'no-brand' ? '' : value })}
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
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="uppercase">ACTIVE</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              CANCEL
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              SAVE CHANGES
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

