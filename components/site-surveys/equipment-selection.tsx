"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelect } from '@/components/ui/multi-select';
import { toast } from 'sonner';
import { Package, Search, X, Plus, ShoppingCart, Minus, FileText, Settings } from 'lucide-react';
import { SelectedElement, EquipmentItem, Product, Service, getElementDisplayName, getElementContextPath } from "@/types/equipment-selection";

interface EquipmentSelectionProps {
  open: boolean;
  onClose: () => void;
  onSave: (equipment: EquipmentItem[]) => void;
  existingEquipment?: EquipmentItem[];
  selectedElement?: SelectedElement | null;
}

export function EquipmentSelection({
  open,
  onClose,
  onSave,
  existingEquipment = [],
  selectedElement = null
}: EquipmentSelectionProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableBrands, setAvailableBrands] = useState<{id: string, name: string}[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string}[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(existingEquipment);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');

  // Load products and services
  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchServices();
      fetchFilterOptions();
    }
  }, [open, searchTerm, selectedBrands, selectedCategories]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        searchField: 'all',
        isActive: 'true',
        limit: '100',
      });

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

      const response = await fetch(`/api/products?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 200));
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products: ' + (error as Error).message);
    }
  };

  const fetchServices = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        limit: '100',
      });

      if (selectedCategories.length > 0) {
        selectedCategories.forEach(categoryId => {
          params.append('categoryIds', categoryId);
        });
      }

      const response = await fetch(`/api/services?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 200));
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services: ' + (error as Error).message);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Fetch brands
      const brandsResponse = await fetch('/api/brands');
      if (!brandsResponse.ok) {
        throw new Error(`HTTP error! status: ${brandsResponse.status}`);
      }
      const brandsData = await brandsResponse.json();
      setAvailableBrands(
        brandsData.brands?.map((brand: any) => ({
          id: brand.id,
          name: brand.name
        })) || []
      );

      // Fetch categories
      const categoriesResponse = await fetch('/api/master-data/categories');
      if (!categoriesResponse.ok) {
        throw new Error(`HTTP error! status: ${categoriesResponse.status}`);
      }
      const categoriesData = await categoriesResponse.json();
      setAvailableCategories(
        categoriesData.categories?.map((category: any) => ({
          id: category.id,
          name: category.name
        })) || []
      );
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const addEquipment = (item: Product | Service, type: 'product' | 'service') => {
    const equipmentItem: EquipmentItem = {
      id: `${type}-${item.id}-${Date.now()}`,
      type,
      itemId: item.id,
      name: item.name,
      brand: 'brand' in item ? item.brand?.name : undefined,
      category: item.category?.name || 'Uncategorized',
      unit: item.unit?.name || 'Each',
      quantity: 1,
      price: item.price || 0,
      totalPrice: item.price || 0,
    };

    setEquipment([...equipment, equipmentItem]);
    toast.success(`${type === 'product' ? 'Product' : 'Service'} added to equipment list`);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeEquipment(id);
      return;
    }

    setEquipment(equipment.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity,
          totalPrice: item.price * quantity
        };
      }
      return item;
    }));
  };

  const removeEquipment = (id: string) => {
    setEquipment(equipment.filter(item => item.id !== id));
  };

  const updateNotes = (id: string, notes: string) => {
    setEquipment(equipment.map(item => {
      if (item.id === id) {
        return { ...item, notes };
      }
      return item;
    }));
  };

  const getTotalPrice = () => {
    return equipment.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalQuantity = () => {
    return equipment.reduce((total, item) => total + item.quantity, 0);
  };

  const handleSave = () => {
    onSave(equipment);
    toast.success(`Equipment list saved with ${equipment.length} items`);
    onClose();
  };

  return (
    <>
      {/* Custom overlay with higher z-index */}
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/50 animate-in fade-in-0" />
      )}
      
      <Dialog open={open} onOpenChange={onClose} modal={false}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col z-[10000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-blue-600" />
            EQUIPMENT & SERVICES SELECTION
          </DialogTitle>
          <DialogDescription>
            {selectedElement ? (
              <div className="mt-2">
                <div className="font-semibold text-blue-800">
                  Adding to: {getElementDisplayName(selectedElement)}
                </div>
                <div className="text-sm text-gray-600">
                  {getElementContextPath(selectedElement)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Select products and services for this infrastructure element.
                </div>
              </div>
            ) : (
              "Select products and services for your cabling survey. This will generate your Bill of Materials (BOM)."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
          {/* Left Panel - Search & Selection */}
          <div className="w-2/3 border-r flex flex-col">
            {/* Search and Filters */}
            <div className="p-4 border-b space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products and services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedBrands([]);
                    setSelectedCategories([]);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-[250px]">
                  <MultiSelect
                    options={availableBrands}
                    selected={selectedBrands}
                    onChange={setSelectedBrands}
                    placeholder="Filter by brands..."
                  />
                </div>
                <div className="w-[250px]">
                  <MultiSelect
                    options={availableCategories}
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                    placeholder="Filter by categories..."
                  />
                </div>
              </div>
            </div>

            {/* Products and Services Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'services')} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  PRODUCTS ({products.length})
                </TabsTrigger>
                <TabsTrigger value="services" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  SERVICES ({services.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                  {products.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{product.name}</h4>
                              {product.brand && (
                                <Badge variant="secondary">{product.brand.name}</Badge>
                              )}
                              {product.category && (
                                <Badge variant="outline">{product.category.name}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {product.code && <div>Code: {product.code}</div>}
                              {product.manufacturer && <div>Manufacturer: {product.manufacturer.name}</div>}
                              {product.price && <div>Price: €{product.price.toFixed(2)}</div>}
                              {product.stock !== null && <div>Stock: {product.stock}</div>}
                            </div>
                          </div>
                          <Button
                            onClick={() => addEquipment(product, 'product')}
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {products.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No products found matching your criteria.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="services" className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                  {services.map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{service.name}</h4>
                              {service.category && (
                                <Badge variant="outline">{service.category.name}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {service.description && <div>{service.description}</div>}
                              {service.price && <div>Price: €{service.price.toFixed(2)}</div>}
                            </div>
                          </div>
                          <Button
                            onClick={() => addEquipment(service, 'service')}
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {services.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No services found matching your criteria.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Equipment List */}
          <div className="w-1/3 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">EQUIPMENT LIST</h3>
                <Badge variant="secondary">{equipment.length} items</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Total Quantity: {getTotalQuantity()}</div>
                <div className="font-semibold text-foreground">
                  Total Price: €{getTotalPrice().toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {equipment.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No equipment selected</p>
                  <p className="text-xs">Add products and services from the left panel</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipment.map((item) => (
                    <Card key={item.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {item.type}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.brand && <span>{item.brand} • </span>}
                                {item.category}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEquipment(item.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="h-6 w-12 text-center text-xs"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs text-muted-foreground ml-2">
                              €{item.totalPrice.toFixed(2)}
                            </span>
                          </div>

                          <Input
                            placeholder="Notes (optional)"
                            value={item.notes || ''}
                            onChange={(e) => updateNotes(item.id, e.target.value)}
                            className="h-6 text-xs"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={equipment.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Save Equipment List
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
