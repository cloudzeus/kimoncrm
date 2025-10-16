'use client';

/**
 * Products Manager Component
 * Advanced table with resizable columns, sorting, and filtering
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Upload,
  Trash2,
  Edit,
  Settings2,
  MoreVertical,
  Languages,
  Image as ImageIcon,
  FileText,
  Package,
  X,
  Eye,
} from 'lucide-react';
import ProductFormDialog from './product-form-dialog';
import ProductTranslationsDialog from './product-translations-dialog';
import ProductSpecificationsDialog from './product-specifications-dialog';
import ProductImagesDialog from './product-images-dialog';
import BulkUpdateDialog from './bulk-update-dialog';
import { ResizableTableHeader } from './resizable-table-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';

interface Product {
  id: string;
  mtrl: string | null;
  code: string | null;
  code1: string | null;
  code2: string | null;
  name: string;
  mtrmark: string | null;
  mtrmanfctr: string | null;
  isActive: boolean;
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
  } | null;
  unit: {
    id: string;
    name: string;
    shortcut: string | null;
  } | null;
  width: number | null;
  length: number | null;
  height: number | null;
  weight: number | null;
  stock?: Array<{
    id: string;
    warehouse: 'AIC' | 'NETCORE';
    qty: number;
    updatedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsManager() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingStock, setSyncingStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [translationsDialogOpen, setTranslationsDialogOpen] = useState(false);
  const [translatingProduct, setTranslatingProduct] = useState<Product | null>(null);
  const [imagesDialogOpen, setImagesDialogOpen] = useState(false);
  const [imagesProduct, setImagesProduct] = useState<Product | null>(null);
  const [specificationsDialogOpen, setSpecificationsDialogOpen] = useState(false);
  const [specificationsProduct, setSpecificationsProduct] = useState<Product | null>(null);
  const [availableBrands, setAvailableBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Default column widths
  const defaultColumnWidths = {
    checkbox: 50,
    images: 120,
    mtrl: 100,
    code: 120,
    code1: 150,
    code2: 150,
    name: 300,
    brand: 150,
    manufacturer: 150,
    category: 130,
    unit: 100,
    width: 100,
    length: 100,
    height: 100,
    weight: 100,
    aicQty: 100,
    netcoreQty: 100,
    status: 110,
    createdAt: 130,
    actions: 80,
  };

  // Default column visibility
  const defaultVisibleColumns = {
    checkbox: true,
    images: true,
    mtrl: false,
    code: true,
    code1: true,
    code2: true,
    name: true,
    brand: true,
    manufacturer: true,
    category: true,
    unit: false,
    width: false,
    length: false,
    height: false,
    weight: false,
    aicQty: true,
    netcoreQty: true,
    status: true,
    createdAt: false,
    actions: true,
  };

  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'createdAt',
    direction: 'desc',
  });

  // Load from localStorage after hydration
  useEffect(() => {
    const savedWidths = localStorage.getItem('products-column-widths');
    const savedVisibility = localStorage.getItem('products-visible-columns');

    if (savedWidths) {
      try {
        const parsedWidths = JSON.parse(savedWidths);
        setColumnWidths({ ...defaultColumnWidths, ...parsedWidths });
      } catch (e) {
        console.error('Failed to parse column widths:', e);
        setColumnWidths(defaultColumnWidths);
      }
    } else {
      setColumnWidths(defaultColumnWidths);
    }

    if (savedVisibility) {
      try {
        const parsedVisibility = JSON.parse(savedVisibility);
        setVisibleColumns({ ...defaultVisibleColumns, ...parsedVisibility });
      } catch (e) {
        console.error('Failed to parse visible columns:', e);
        setVisibleColumns(defaultVisibleColumns);
      }
    } else {
      setVisibleColumns(defaultVisibleColumns);
    }

    setIsHydrated(true);
  }, []);

  // Save column widths to localStorage
  const handleColumnResize = (column: string, newWidth: number) => {
    const updatedWidths = { ...columnWidths, [column]: newWidth };
    setColumnWidths(updatedWidths);
    localStorage.setItem('products-column-widths', JSON.stringify(updatedWidths));
  };

  // Save column visibility to localStorage
  const saveColumnVisibility = (newVisibility: typeof visibleColumns) => {
    setVisibleColumns(newVisibility);
    localStorage.setItem('products-visible-columns', JSON.stringify(newVisibility));
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    saveColumnVisibility({
      ...visibleColumns,
      [column]: !visibleColumns[column],
    });
  };

  const resetView = () => {
    setColumnWidths(defaultColumnWidths);
    saveColumnVisibility(defaultVisibleColumns);
    localStorage.setItem('products-column-widths', JSON.stringify(defaultColumnWidths));
    toast({
      title: 'View Reset',
      description: 'Column settings have been reset to default',
    });
  };

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Fetch available brands and categories for filters
  const fetchFilters = async () => {
    try {
      // Fetch brands
      const brandsResponse = await fetch('/api/brands');
      const brandsData = await brandsResponse.json();
      console.log('Brands API response:', brandsData);
      if (brandsData.success && brandsData.data) {
        const mappedBrands = brandsData.data.map((b: any) => ({ id: b.id, name: b.name }));
        console.log('Mapped brands:', mappedBrands);
        setAvailableBrands(mappedBrands);
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/master-data/categories');
      const categoriesData = await categoriesResponse.json();
      console.log('Categories API response:', categoriesData);
      if (categoriesData.success && categoriesData.categories) {
        const mappedCategories = categoriesData.categories.map((c: any) => ({ id: c.id, name: c.name }));
        console.log('Mapped categories:', mappedCategories);
        setAvailableCategories(mappedCategories);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        searchField,
      });

      if (isActiveFilter !== 'all') {
        params.append('isActive', isActiveFilter);
      }

      if (selectedBrands.length > 0) {
        selectedBrands.forEach(brandId => {
          params.append('brandIds', brandId);
        });
      }

      if (selectedCategories.length > 0) {
        selectedCategories.forEach(categoryId => {
          params.append('categoryIds', categoryId);
        });
      }

      if (sortConfig) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction);
      }

      console.log('Fetching products with params:', params.toString());
      console.log('Selected brands:', selectedBrands);
      console.log('Selected categories:', selectedCategories);

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      console.log('Products API response:', data);

      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch products',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Sync all products from ERP
  const syncAllProducts = async () => {
    try {
      setSyncing(true);
      toast({
        title: 'Syncing',
        description: 'Starting full product sync from SoftOne ERP...',
      });

      const response = await fetch('/api/products/sync-all', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Synced ${data.stats.total} products: ${data.stats.created} created, ${data.stats.updated} updated`,
        });
        fetchProducts();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to sync products',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync products',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Sync stock quantities on demand
  const syncStock = async () => {
    try {
      setSyncingStock(true);
      toast({
        title: 'Syncing Stock',
        description: 'Fetching stock quantities from AIC and NETCORE warehouses...',
      });

      const response = await fetch('/api/products/sync-stock', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Stock synced in ${data.duration}: AIC (${data.aic.created + data.aic.updated}), NETCORE (${data.netcore.created + data.netcore.updated})`,
        });
        fetchProducts();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to sync stock',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync stock',
        variant: 'destructive',
      });
    } finally {
      setSyncingStock(false);
    }
  };

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const toggleAllProducts = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  // Clear selection when products change
  useEffect(() => {
    setSelectedProductIds([]);
  }, [products]);

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
        });
        fetchProducts();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete product',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  // Load filters on mount
  useEffect(() => {
    fetchFilters();
  }, []);

  // Load products when filters change
  useEffect(() => {
    if (isHydrated) {
      fetchProducts();
    }
  }, [page, pageSize, searchTerm, searchField, isActiveFilter, selectedBrands, selectedCategories, sortConfig, isHydrated]);

  // Column labels
  const columnLabels: Record<string, string> = {
    mtrl: 'ERP ID (MTRL)',
    code: 'ERP CODE',
    code1: 'EAN CODE',
    code2: 'MFR CODE',
    name: 'NAME',
    brand: 'BRAND',
    manufacturer: 'MANUFACTURER',
    category: 'CATEGORY',
    unit: 'UNIT',
    width: 'WIDTH (CM)',
    length: 'LENGTH (CM)',
    height: 'HEIGHT (CM)',
    weight: 'WEIGHT (KG)',
    aicQty: 'AIC QTY',
    netcoreQty: 'NETCORE QTY',
    status: 'STATUS',
    createdAt: 'CREATED',
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={searchField} onValueChange={setSearchField}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Search by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="code">ERP Code</SelectItem>
              <SelectItem value="ean">EAN Code</SelectItem>
              <SelectItem value="mfrcode">Mfr Code</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
          <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {/* Column Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[11px] uppercase">Column Settings</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetView}
                    className="h-8 text-xs"
                  >
                    Reset View
                  </Button>
                </div>
                <div className="space-y-3">
                  {Object.entries(visibleColumns)
                    .filter(([col]) => col !== 'checkbox' && col !== 'actions')
                    .map(([column, visible]) => (
                      <div key={column} className="flex items-center space-x-2">
                        <Checkbox
                          id={column}
                          checked={visible}
                          onCheckedChange={() => toggleColumn(column as keyof typeof visibleColumns)}
                        />
                        <Label
                          htmlFor={column}
                          className="text-[11px] uppercase cursor-pointer"
                        >
                          {columnLabels[column] || column}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProducts()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={syncAllProducts}
            disabled={syncing || syncingStock}
          >
            {syncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                SYNCING...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                SYNC FROM ERP
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={syncStock}
            disabled={syncing || syncingStock}
          >
            {syncingStock ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                SYNCING...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                SYNC STOCK
              </>
            )}
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Results Info */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          Showing {products.length} of {total} products
        </div>
      )}

      {/* Multi-select Filters */}
      <div className="flex items-center gap-2">
        <div className="w-[300px]">
          <MultiSelect
            options={availableBrands}
            selected={selectedBrands}
            onChange={setSelectedBrands}
            placeholder="Filter by brands..."
          />
        </div>
        <div className="w-[300px]">
          <MultiSelect
            options={availableCategories}
            selected={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="Filter by categories..."
          />
        </div>
        {(selectedBrands.length > 0 || selectedCategories.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedBrands([]);
              setSelectedCategories([]);
            }}
          >
            <X className="mr-2 h-4 w-4" />
            CLEAR FILTERS
          </Button>
        )}
        {selectedProductIds.length > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setBulkUpdateDialogOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            BULK UPDATE ({selectedProductIds.length})
          </Button>
        )}
      </div>

      {/* Products Table */}
      <div className="rounded-md border shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.checkbox && (
                <TableHead 
                  className="w-[50px]"
                  style={{ width: `${columnWidths.checkbox}px`, minWidth: `${columnWidths.checkbox}px` }}
                >
                  <Checkbox
                    checked={products.length > 0 && selectedProductIds.length === products.length}
                    onCheckedChange={toggleAllProducts}
                  />
                </TableHead>
                  )}
                  {visibleColumns.images && (
                    <ResizableTableHeader
                      width={columnWidths.images}
                      onResize={(w) => handleColumnResize('images', w)}
                    >
                      IMAGES
                    </ResizableTableHeader>
                  )}
                  {visibleColumns.mtrl && (
                    <ResizableTableHeader
                      width={columnWidths.mtrl}
                      onResize={(w) => handleColumnResize('mtrl', w)}
                      sortable
                      sortKey="mtrl"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    >
                      ERP ID
                    </ResizableTableHeader>
                  )}
                  {visibleColumns.code && (
                <ResizableTableHeader
                  width={columnWidths.code}
                  onResize={(w) => handleColumnResize('code', w)}
                  sortable
                  sortKey="code"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  ERP CODE
                </ResizableTableHeader>
              )}
              {visibleColumns.code1 && (
                <ResizableTableHeader
                  width={columnWidths.code1}
                  onResize={(w) => handleColumnResize('code1', w)}
                  sortable
                  sortKey="code1"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  EAN
                </ResizableTableHeader>
              )}
              {visibleColumns.code2 && (
                <ResizableTableHeader
                  width={columnWidths.code2}
                  onResize={(w) => handleColumnResize('code2', w)}
                  sortable
                  sortKey="code2"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  MFR CODE
                </ResizableTableHeader>
              )}
              {visibleColumns.name && (
                <ResizableTableHeader
                  width={columnWidths.name}
                  onResize={(w) => handleColumnResize('name', w)}
                  sortable
                  sortKey="name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  NAME
                </ResizableTableHeader>
              )}
              {visibleColumns.brand && (
                <ResizableTableHeader
                  width={columnWidths.brand}
                  onResize={(w) => handleColumnResize('brand', w)}
                  sortable
                  sortKey="brand"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  BRAND
                </ResizableTableHeader>
              )}
              {visibleColumns.manufacturer && (
                <ResizableTableHeader
                  width={columnWidths.manufacturer}
                  onResize={(w) => handleColumnResize('manufacturer', w)}
                  sortable
                  sortKey="manufacturer"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  MANUFACTURER
                </ResizableTableHeader>
              )}
              {visibleColumns.category && (
                <ResizableTableHeader
                  width={columnWidths.category}
                  onResize={(w) => handleColumnResize('category', w)}
                  sortable
                  sortKey="category"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  CATEGORY
                </ResizableTableHeader>
              )}
              {visibleColumns.unit && (
                <ResizableTableHeader
                  width={columnWidths.unit}
                  onResize={(w) => handleColumnResize('unit', w)}
                >
                  UNIT
                </ResizableTableHeader>
              )}
              {visibleColumns.width && (
                <ResizableTableHeader
                  width={columnWidths.width}
                  onResize={(w) => handleColumnResize('width', w)}
                  sortable
                  sortKey="width"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  WIDTH
                </ResizableTableHeader>
              )}
              {visibleColumns.length && (
                <ResizableTableHeader
                  width={columnWidths.length}
                  onResize={(w) => handleColumnResize('length', w)}
                  sortable
                  sortKey="length"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  LENGTH
                </ResizableTableHeader>
              )}
              {visibleColumns.height && (
                <ResizableTableHeader
                  width={columnWidths.height}
                  onResize={(w) => handleColumnResize('height', w)}
                  sortable
                  sortKey="height"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  HEIGHT
                </ResizableTableHeader>
              )}
              {visibleColumns.weight && (
                <ResizableTableHeader
                  width={columnWidths.weight}
                  onResize={(w) => handleColumnResize('weight', w)}
                  sortable
                  sortKey="weight"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  WEIGHT
                </ResizableTableHeader>
              )}
              {visibleColumns.aicQty && (
                <ResizableTableHeader
                  width={columnWidths.aicQty}
                  onResize={(w) => handleColumnResize('aicQty', w)}
                >
                  AIC QTY
                </ResizableTableHeader>
              )}
              {visibleColumns.netcoreQty && (
                <ResizableTableHeader
                  width={columnWidths.netcoreQty}
                  onResize={(w) => handleColumnResize('netcoreQty', w)}
                >
                  NETCORE QTY
                </ResizableTableHeader>
              )}
              {visibleColumns.status && (
                <ResizableTableHeader
                  width={columnWidths.status}
                  onResize={(w) => handleColumnResize('status', w)}
                  sortable
                  sortKey="isActive"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  STATUS
                </ResizableTableHeader>
              )}
              {visibleColumns.createdAt && (
                <ResizableTableHeader
                  width={columnWidths.createdAt}
                  onResize={(w) => handleColumnResize('createdAt', w)}
                  sortable
                  sortKey="createdAt"
                  currentSort={sortConfig}
                  onSort={handleSort}
                >
                  CREATED
                </ResizableTableHeader>
              )}
              {visibleColumns.actions && (
                <TableHead 
                  className="text-right"
                  style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}
                >
                  ACTIONS
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={20} className="text-center py-8">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={20} className="text-center py-8">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  {visibleColumns.checkbox && (
                    <TableCell style={{ width: `${columnWidths.checkbox}px`, minWidth: `${columnWidths.checkbox}px` }}>
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.images && (
                    <TableCell style={{ width: `${columnWidths.images}px`, minWidth: `${columnWidths.images}px` }}>
                      {product.images && product.images.length > 0 ? (
                        <TooltipProvider delayDuration={300}>
                          <div className="flex space-x-1">
                            {product.images.slice(0, 2).map((image, index) => (
                              <Tooltip key={image.id}>
                                <TooltipTrigger asChild>
                                  <img
                                    src={image.url}
                                    alt={image.alt || product.name}
                                    className="w-10 h-10 rounded object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="p-0 border-0 shadow-2xl">
                                  <img
                                    src={image.url}
                                    alt={image.alt || product.name}
                                    className="w-[400px] h-[400px] object-contain bg-white rounded-lg"
                                  />
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {product.images.length > 2 && (
                              <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center text-xs font-medium">
                                +{product.images.length - 2}
                              </div>
                            )}
                          </div>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.mtrl && (
                    <TableCell style={{ width: `${columnWidths.mtrl}px`, minWidth: `${columnWidths.mtrl}px` }}>
                      {product.mtrl || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.code && (
                    <TableCell 
                      className="font-medium"
                      style={{ width: `${columnWidths.code}px`, minWidth: `${columnWidths.code}px` }}
                    >
                      {product.code || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.code1 && (
                    <TableCell style={{ width: `${columnWidths.code1}px`, minWidth: `${columnWidths.code1}px` }}>
                      {product.code1 || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.code2 && (
                    <TableCell style={{ width: `${columnWidths.code2}px`, minWidth: `${columnWidths.code2}px` }}>
                      {product.code2 || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.name && (
                    <TableCell style={{ width: `${columnWidths.name}px`, minWidth: `${columnWidths.name}px` }}>
                      {product.name}
                    </TableCell>
                  )}
                  {visibleColumns.brand && (
                    <TableCell style={{ width: `${columnWidths.brand}px`, minWidth: `${columnWidths.brand}px` }}>
                      {product.brand?.name || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.manufacturer && (
                    <TableCell style={{ width: `${columnWidths.manufacturer}px`, minWidth: `${columnWidths.manufacturer}px` }}>
                      {product.manufacturer?.name || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.category && (
                    <TableCell style={{ width: `${columnWidths.category}px`, minWidth: `${columnWidths.category}px` }}>
                      {product.category?.name || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.unit && (
                    <TableCell style={{ width: `${columnWidths.unit}px`, minWidth: `${columnWidths.unit}px` }}>
                      {product.unit?.name || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.width && (
                    <TableCell style={{ width: `${columnWidths.width}px`, minWidth: `${columnWidths.width}px` }}>
                      {product.width || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.length && (
                    <TableCell style={{ width: `${columnWidths.length}px`, minWidth: `${columnWidths.length}px` }}>
                      {product.length || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.height && (
                    <TableCell style={{ width: `${columnWidths.height}px`, minWidth: `${columnWidths.height}px` }}>
                      {product.height || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.weight && (
                    <TableCell style={{ width: `${columnWidths.weight}px`, minWidth: `${columnWidths.weight}px` }}>
                      {product.weight || '-'}
                    </TableCell>
                  )}
                  {visibleColumns.aicQty && (
                    <TableCell style={{ width: `${columnWidths.aicQty}px`, minWidth: `${columnWidths.aicQty}px` }}>
                      {(() => {
                        const aicStock = product.stock?.find(s => s.warehouse === 'AIC');
                        return aicStock ? (
                          <Badge variant={aicStock.qty > 0 ? 'default' : 'secondary'}>
                            {aicStock.qty}
                          </Badge>
                        ) : '-';
                      })()}
                    </TableCell>
                  )}
                  {visibleColumns.netcoreQty && (
                    <TableCell style={{ width: `${columnWidths.netcoreQty}px`, minWidth: `${columnWidths.netcoreQty}px` }}>
                      {(() => {
                        const netcoreStock = product.stock?.find(s => s.warehouse === 'NETCORE');
                        return netcoreStock ? (
                          <Badge variant={netcoreStock.qty > 0 ? 'default' : 'secondary'}>
                            {netcoreStock.qty}
                          </Badge>
                        ) : '-';
                      })()}
                    </TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell style={{ width: `${columnWidths.status}px`, minWidth: `${columnWidths.status}px` }}>
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.createdAt && (
                    <TableCell style={{ width: `${columnWidths.createdAt}px`, minWidth: `${columnWidths.createdAt}px` }}>
                      {new Date(product.createdAt).toLocaleDateString()}
                    </TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell 
                      className="text-right"
                      style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>ACTIONS</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setEditingProduct(product);
                            setIsFormOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            EDIT
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            router.push(`/products/${product.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            VIEW
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setImagesProduct(product);
                            setImagesDialogOpen(true);
                          }}>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            IMAGES
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSpecificationsProduct(product);
                            setSpecificationsDialogOpen(true);
                          }}>
                            <FileText className="h-4 w-4 mr-2" />
                            SPECIFICATIONS
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setTranslatingProduct(product);
                            setTranslationsDialogOpen(true);
                          }}>
                            <Languages className="h-4 w-4 mr-2" />
                            TRANSLATIONS
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setProductToDelete(product.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            DELETE
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={editingProduct}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
          fetchProducts();
        }}
      />

      {/* Translations Dialog */}
      {translatingProduct && (
        <ProductTranslationsDialog
          open={translationsDialogOpen}
          onOpenChange={setTranslationsDialogOpen}
          productId={translatingProduct.id}
          productName={translatingProduct.name}
          onSuccess={fetchProducts}
        />
      )}

      {/* Images Dialog */}
      {imagesProduct && (
        <ProductImagesDialog
          open={imagesDialogOpen}
          onOpenChange={setImagesDialogOpen}
          productId={imagesProduct.id}
          productName={imagesProduct.name}
        />
      )}

      {/* Product Specifications Dialog */}
      {specificationsProduct && (
        <ProductSpecificationsDialog
          open={specificationsDialogOpen}
          onOpenChange={setSpecificationsDialogOpen}
          productId={specificationsProduct.id}
          productName={specificationsProduct.name}
        />
      )}

      {/* Bulk Update Dialog */}
      <BulkUpdateDialog
        open={bulkUpdateDialogOpen}
        onOpenChange={setBulkUpdateDialogOpen}
        selectedProductIds={selectedProductIds}
        selectedProducts={products
          .filter((p) => selectedProductIds.includes(p.id))
          .map((p) => ({ id: p.id, name: p.name }))}
        onSuccess={() => {
          setSelectedProductIds([]);
          fetchProducts();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ARE YOU SURE?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  deleteProduct(productToDelete);
                  setDeleteDialogOpen(false);
                  setProductToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
