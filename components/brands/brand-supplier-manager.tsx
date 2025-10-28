'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Brand {
  id: string;
  name: string;
  code: string | null;
}

interface Supplier {
  id: string;
  name: string;
  code: string | null;
  afm: string | null;
}

interface Association {
  id: string;
  brandId: string;
  supplierId: string;
  brand: Brand;
  supplier: Supplier;
  createdAt: string;
}

export function BrandSupplierManager() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filterBrand, filterSupplier]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [associationsRes, brandsRes, suppliersRes] = await Promise.all([
        fetch('/api/brands/suppliers'),
        fetch('/api/brands'),
        fetch('/api/suppliers'),
      ]);

      const associationsData = await associationsRes.json();
      const brandsData = await brandsRes.json();
      const suppliersData = await suppliersRes.json();

      if (associationsData.success) {
        setAssociations(associationsData.data);
      }
      if (brandsData.success) {
        setBrands(brandsData.data);
      }
      if (suppliersData.success) {
        setSuppliers(suppliersData.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedBrandId || !selectedSupplierId) {
      toast.error('Please select both brand and supplier');
      return;
    }

    try {
      const response = await fetch('/api/brands/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrandId,
          supplierId: selectedSupplierId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Association created');
        setDialogOpen(false);
        setSelectedBrandId('');
        setSelectedSupplierId('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create association');
      }
    } catch (error) {
      toast.error('Failed to create association');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const response = await fetch(`/api/brands/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Association deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete association');
    }
  };

  // Filter associations
  const filteredAssociations = associations.filter((assoc) => {
    if (filterBrand !== 'all' && assoc.brandId !== filterBrand) return false;
    if (filterSupplier !== 'all' && assoc.supplierId !== filterSupplier) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Brand-Supplier Associations</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Association
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Supplier Code</TableHead>
              <TableHead>Supplier AFM</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssociations.map((assoc) => (
              <TableRow key={assoc.id}>
                <TableCell className="font-medium">{assoc.brand.name}</TableCell>
                <TableCell>{assoc.supplier.name}</TableCell>
                <TableCell>{assoc.supplier.code || '-'}</TableCell>
                <TableCell>{assoc.supplier.afm || '-'}</TableCell>
                <TableCell>
                  {new Date(assoc.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(assoc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Brand-Supplier Association</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Brand</label>
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Supplier</label>
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

