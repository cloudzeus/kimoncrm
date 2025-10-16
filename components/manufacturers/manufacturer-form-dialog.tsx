'use client';

/**
 * Manufacturer Form Dialog Component
 * Form for creating and editing manufacturers
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface Manufacturer {
  id: string;
  mtrmanfctr: string | null;
  code: string | null;
  name: string;
  isActive: boolean;
}

interface ManufacturerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manufacturer: Manufacturer | null;
  onSuccess: () => void;
}

export default function ManufacturerFormDialog({
  open,
  onOpenChange,
  manufacturer,
  onSuccess,
}: ManufacturerFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    isActive: true,
  });

  const { toast } = useToast();

  // Populate form when editing
  useEffect(() => {
    if (manufacturer) {
      setFormData({
        code: manufacturer.code || '',
        name: manufacturer.name || '',
        isActive: manufacturer.isActive,
      });
    } else {
      // Reset form for new manufacturer
      setFormData({
        code: '',
        name: '',
        isActive: true,
      });
    }
  }, [manufacturer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Code and Name are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const url = manufacturer ? `/api/manufacturers/${manufacturer.id}` : '/api/manufacturers';
      const method = manufacturer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: manufacturer
            ? 'Manufacturer updated successfully'
            : 'Manufacturer created successfully',
        });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save manufacturer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving manufacturer:', error);
      toast({
        title: 'Error',
        description: 'Failed to save manufacturer',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {manufacturer ? 'EDIT MANUFACTURER' : 'ADD NEW MANUFACTURER'}
          </DialogTitle>
          <DialogDescription>
            {manufacturer
              ? 'Update manufacturer information'
              : 'Create a new manufacturer'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">CODE *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="Manufacturer code"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">NAME *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value.toUpperCase() })
              }
              placeholder="Manufacturer name"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked as boolean })
              }
            />
            <Label htmlFor="isActive">ACTIVE</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : manufacturer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

