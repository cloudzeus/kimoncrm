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

  const addEquipment = (item: Product | Service, type: 'product' | 'service', qty: number = 1) => {
    const equipmentItem: EquipmentItem = {
      id: `${type}-${item.id}-${Date.now()}`,
      type,
      itemId: item.id,
      name: item.name,
      brand: 'brand' in item ? item.brand?.name : undefined,
      category: item.category?.name || 'Uncategorized',
      unit: item.unit?.name || 'Each',
      quantity: qty,
      price: item.price || 0,
      totalPrice: (item.price || 0) * qty,
    };

    setEquipment([...equipment, equipmentItem]);
    toast.success(`${type === 'product' ? 'Product' : 'Service'} added to BOM`);
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'services')} className="flex-1 flex flex-col overflow-hidden">
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

          <TabsContent value="products" className="flex-1 overflow-auto p-4 mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center w-[120px]">Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const existingItem = equipment.find(eq => eq.itemId === product.id && eq.type === 'product');
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{product.code || '-'}</TableCell>
                      <TableCell className="text-sm">{product.brand?.name || '-'}</TableCell>
                      <TableCell className="text-sm">{product.category?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => existingItem && updateQuantity(existingItem.id, existingItem.quantity - 1)}
                            className="h-7 w-7 p-0"
                            disabled={!existingItem}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={existingItem?.quantity || 0}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0;
                              if (qty === 0 && existingItem) {
                                removeEquipment(existingItem.id);
                              } else if (qty > 0) {
                                if (existingItem) {
                                  updateQuantity(existingItem.id, qty);
                                } else {
                                  addEquipment(product, 'product', qty);
                                }
                              }
                            }}
                            className="h-7 w-14 text-center text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (existingItem) {
                                updateQuantity(existingItem.id, existingItem.quantity + 1);
                              } else {
                                addEquipment(product, 'product');
                              }
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Add notes..."
                          value={existingItem?.notes || ''}
                          onChange={(e) => existingItem && updateNotes(existingItem.id, e.target.value)}
                          disabled={!existingItem}
                          className="h-7 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        {existingItem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEquipment(existingItem.id)}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {products.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found matching your criteria.
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="flex-1 overflow-auto p-4 mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center w-[120px]">Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const existingItem = equipment.find(eq => eq.itemId === service.id && eq.type === 'service');
                  return (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="text-sm">{service.category?.name || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{service.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => existingItem && updateQuantity(existingItem.id, existingItem.quantity - 1)}
                            className="h-7 w-7 p-0"
                            disabled={!existingItem}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={existingItem?.quantity || 0}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0;
                              if (qty === 0 && existingItem) {
                                removeEquipment(existingItem.id);
                              } else if (qty > 0) {
                                if (existingItem) {
                                  updateQuantity(existingItem.id, qty);
                                } else {
                                  addEquipment(service, 'service', qty);
                                }
                              }
                            }}
                            className="h-7 w-14 text-center text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (existingItem) {
                                updateQuantity(existingItem.id, existingItem.quantity + 1);
                              } else {
                                addEquipment(service, 'service');
                              }
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Add notes..."
                          value={existingItem?.notes || ''}
                          onChange={(e) => existingItem && updateNotes(existingItem.id, e.target.value)}
                          disabled={!existingItem}
                          className="h-7 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        {existingItem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEquipment(existingItem.id)}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {services.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No services found matching your criteria.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer with summary and actions */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{equipment.length} items selected</span>
              <span className="mx-2">•</span>
              <span>Total Quantity: {getTotalQuantity()}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={equipment.length === 0}>
                <FileText className="h-4 w-4 mr-2" />
                Save BOM ({equipment.length} items)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
