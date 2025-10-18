"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Edit,
  Trash2,
  Plus,
  Package,
  Settings,
  Euro,
  Hash,
  MapPin,
  Save,
  FileDown,
} from 'lucide-react';
import { DataTable, Column } from '@/components/ui/data-table';
import { SelectedElement, EquipmentItem } from '@/types/equipment-selection';

interface Building {
  id?: string;
  name: string;
  floors: Floor[];
  centralRack?: any;
}

interface Floor {
  id?: string;
  name: string;
  floorRacks?: any[];
  rooms: Room[];
}

interface Room {
  id?: string;
  name: string;
}

interface BOMManagerEnhancedProps {
  equipment: EquipmentItem[];
  onUpdateEquipment: (equipment: EquipmentItem[]) => void;
  siteSurveyData?: any;
  buildings?: Building[];
  files?: any[];
  onSave?: () => void;
}

export function BOMManagerEnhanced({
  equipment,
  onUpdateEquipment,
  siteSurveyData,
  buildings = [],
  files = [],
  onSave
}: BOMManagerEnhancedProps) {
  console.log('BOMManagerEnhanced received equipment:', equipment);
  console.log('Equipment count:', equipment.length);
  
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState('');
  const [editLocation, setEditLocation] = useState<SelectedElement | undefined>();
  
  // Add Item Dialog State
  const [addItemDialog, setAddItemDialog] = useState(false);
  const [addItemType, setAddItemType] = useState<'product' | 'service'>('product');
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    brand: '',
    category: '',
    unit: 'Each',
    quantity: 1,
    price: 0,
    margin: 0,
    notes: '',
  });
  const [selectedLocation, setSelectedLocation] = useState<SelectedElement | undefined>();

  // Separate products and services
  const products = useMemo(() => {
    const filtered = equipment.filter(item => item.type === 'product');
    console.log('Products in BOM:', filtered);
    return filtered;
  }, [equipment]);

  const services = useMemo(() => {
    const filtered = equipment.filter(item => item.type === 'service');
    console.log('Services in BOM:', filtered);
    return filtered;
  }, [equipment]);

  // Generate location options from buildings
  const locationOptions = useMemo(() => {
    const options: Array<{ value: string; label: string; element: SelectedElement }> = [];
    
    buildings.forEach((building, bIdx) => {
      // Building level
      options.push({
        value: `building-${bIdx}`,
        label: `${building.name}`,
        element: {
          type: 'building',
          buildingIndex: bIdx,
        }
      });

      // Central Rack
      if (building.centralRack) {
        options.push({
          value: `central-${bIdx}`,
          label: `${building.name} → Central Rack`,
          element: {
            type: 'centralRack',
            buildingIndex: bIdx,
          }
        });
      }

      // Floors and Rooms
      building.floors?.forEach((floor, fIdx) => {
        options.push({
          value: `floor-${bIdx}-${fIdx}`,
          label: `${building.name} → ${floor.name}`,
          element: {
            type: 'floor',
            buildingIndex: bIdx,
            floorIndex: fIdx,
          }
        });

        // Floor Racks
        floor.floorRacks?.forEach((rack, rIdx) => {
          options.push({
            value: `rack-${bIdx}-${fIdx}-${rIdx}`,
            label: `${building.name} → ${floor.name} → Floor Rack`,
            element: {
              type: 'floorRack',
              buildingIndex: bIdx,
              floorIndex: fIdx,
              rackIndex: rIdx,
            }
          });
        });

        // Rooms
        floor.rooms?.forEach((room, roomIdx) => {
          options.push({
            value: `room-${bIdx}-${fIdx}-${roomIdx}`,
            label: `${building.name} → ${floor.name} → ${room.name}`,
            element: {
              type: 'room',
              buildingIndex: bIdx,
              floorIndex: fIdx,
              roomIndex: roomIdx,
            }
          });
        });
      });
    });

    return options;
  }, [buildings]);

  const getLocationLabel = (element?: SelectedElement) => {
    if (!element) return 'Not assigned';
    
    const option = locationOptions.find(opt => 
      opt.element.type === element.type &&
      opt.element.buildingIndex === element.buildingIndex &&
      opt.element.floorIndex === element.floorIndex &&
      opt.element.rackIndex === element.rackIndex &&
      opt.element.roomIndex === element.roomIndex
    );
    
    return option?.label || 'Unknown location';
  };

  // Product columns
  const productColumns: Column<EquipmentItem>[] = [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <div className="font-medium">{row.name}</div>
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      sortable: true,
      render: (value, row) => row.brand || '-',
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'quantity',
      label: 'Qty',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateQuantity(row.id, row.quantity - 1)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3 rotate-45" />
          </Button>
          <span className="w-8 text-center font-medium text-xs">{row.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateQuantity(row.id, row.quantity + 1)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Unit Price',
      render: (value, row) => (
        <Input
          type="number"
          min="0"
          step="0.01"
          value={row.price}
          onChange={(e) => {
            const newPrice = parseFloat(e.target.value) || 0;
            const updated = equipment.map(item => 
              item.id === row.id 
                ? { ...item, price: newPrice, totalPrice: newPrice * item.quantity * (1 + (item.margin || 0) / 100) }
                : item
            );
            onUpdateEquipment(updated);
          }}
          className="h-7 w-20 text-xs"
        />
      ),
    },
    {
      key: 'margin',
      label: 'Margin %',
      render: (value, row) => (
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={row.margin || 0}
          onChange={(e) => {
            const newMargin = parseFloat(e.target.value) || 0;
            const updated = equipment.map(item => 
              item.id === row.id 
                ? { ...item, margin: newMargin, totalPrice: item.price * item.quantity * (1 + newMargin / 100) }
                : item
            );
            onUpdateEquipment(updated);
          }}
          className="h-7 w-16 text-xs"
        />
      ),
    },
    {
      key: 'totalPrice',
      label: 'Total',
      render: (value, row) => (
        <span className="font-semibold text-sm">€{row.totalPrice.toFixed(2)}</span>
      ),
    },
    {
      key: 'infrastructureElement',
      label: 'Location',
      render: (value, row) => (
        <div className="flex items-center gap-1 text-xs">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="max-w-[150px] truncate">
            {getLocationLabel(row.infrastructureElement)}
          </span>
        </div>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value, row) => (
        <Input
          type="text"
          value={row.notes || ''}
          onChange={(e) => {
            const updated = equipment.map(item => 
              item.id === row.id 
                ? { ...item, notes: e.target.value }
                : item
            );
            onUpdateEquipment(updated);
          }}
          placeholder="Add notes..."
          className="h-7 w-32 text-xs"
        />
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row)}
            className="h-6 w-6 p-0"
            title="Edit"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeItem(row.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  // Service columns
  const serviceColumns: Column<EquipmentItem>[] = [
    {
      accessorKey: 'name',
      header: 'Service Name',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateQuantity(row.original.id, row.original.quantity - 1)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3 rotate-45" />
          </Button>
          <span className="w-8 text-center font-medium text-xs">{row.original.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateQuantity(row.original.id, row.original.quantity + 1)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => <span className="text-xs">{row.original.unit}</span>,
    },
    {
      accessorKey: 'price',
      header: 'Unit Price',
      cell: ({ row }) => (
        <Input
          type="number"
          min="0"
          step="0.01"
          value={row.original.price}
          onChange={(e) => {
            const newPrice = parseFloat(e.target.value) || 0;
            const updated = equipment.map(item => 
              item.id === row.original.id 
                ? { ...item, price: newPrice, totalPrice: newPrice * item.quantity * (1 + (item.margin || 0) / 100) }
                : item
            );
            onUpdateEquipment(updated);
          }}
          className="h-7 w-20 text-xs"
        />
      ),
    },
    {
      accessorKey: 'margin',
      header: 'Margin %',
      cell: ({ row }) => (
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={row.original.margin || 0}
          onChange={(e) => {
            const newMargin = parseFloat(e.target.value) || 0;
            const updated = equipment.map(item => 
              item.id === row.original.id 
                ? { ...item, margin: newMargin, totalPrice: item.price * item.quantity * (1 + newMargin / 100) }
                : item
            );
            onUpdateEquipment(updated);
          }}
          className="h-7 w-16 text-xs"
        />
      ),
    },
    {
      accessorKey: 'totalPrice',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-semibold text-sm">€{row.original.totalPrice.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="max-w-[150px] truncate">
            {getLocationLabel(row.original.infrastructureElement)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <Input
          type="text"
          value={row.original.notes || ''}
          onChange={(e) => {
            const updated = equipment.map(item => 
              item.id === row.original.id 
                ? { ...item, notes: e.target.value }
                : item
            );
            onUpdateEquipment(updated);
          }}
          placeholder="Add notes..."
          className="h-7 w-32 text-xs"
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row.original)}
            className="h-6 w-6 p-0"
            title="Edit"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeItem(row.original.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    const updatedEquipment = equipment.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity,
          totalPrice: item.price * quantity
        };
      }
      return item;
    });

    onUpdateEquipment(updatedEquipment);
  };

  const removeItem = (id: string) => {
    const updatedEquipment = equipment.filter(item => item.id !== id);
    onUpdateEquipment(updatedEquipment);
    toast.success('Item removed from BOM');
  };

  const openEditDialog = (item: EquipmentItem) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
    setEditNotes(item.notes || '');
    setEditLocation(item.infrastructureElement);
  };

  const saveEdit = () => {
    if (!editingItem) return;

    const updatedEquipment = equipment.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          quantity: editQuantity,
          totalPrice: item.price * editQuantity,
          notes: editNotes,
          infrastructureElement: editLocation,
        };
      }
      return item;
    });

    onUpdateEquipment(updatedEquipment);
    setEditingItem(null);
    toast.success('Item updated successfully');
  };

  const openAddItemDialog = (type: 'product' | 'service') => {
    setAddItemType(type);
    setNewItemForm({
      name: '',
      brand: '',
      category: '',
      unit: 'Each',
      quantity: 1,
      price: 0,
      margin: 0,
      notes: '',
    });
    setSelectedLocation(undefined);
    setAddItemDialog(true);
  };

  const addNewItem = () => {
    if (!newItemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    const baseTotal = newItemForm.price * newItemForm.quantity;
    const totalWithMargin = baseTotal * (1 + (newItemForm.margin || 0) / 100);

    const newItem: EquipmentItem = {
      id: `manual-${addItemType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: addItemType,
      itemId: `manual-${Date.now()}`,
      name: newItemForm.name,
      brand: newItemForm.brand || undefined,
      category: newItemForm.category || 'Uncategorized',
      unit: newItemForm.unit,
      quantity: newItemForm.quantity,
      price: newItemForm.price,
      margin: newItemForm.margin,
      totalPrice: totalWithMargin,
      notes: newItemForm.notes || undefined,
      infrastructureElement: selectedLocation,
    };

    onUpdateEquipment([...equipment, newItem]);
    setAddItemDialog(false);
    toast.success(`${addItemType === 'product' ? 'Product' : 'Service'} added successfully`);
  };

  const getTotalPrice = () => {
    return equipment.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalQuantity = () => {
    return equipment.reduce((total, item) => total + item.quantity, 0);
  };

  const generateBOMExcel = async () => {
    try {
      const response = await fetch('/api/site-surveys/generate-bom-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment,
          siteSurveyData: {
            ...siteSurveyData,
            files: files || []
          },
          buildings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate BOM Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOM_${siteSurveyData?.title || 'Survey'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('BOM Excel file generated successfully');
    } catch (error) {
      console.error('Error generating BOM Excel:', error);
      toast.error('Failed to generate BOM Excel file');
    }
  };

  const generateWordDocument = async () => {
    try {
      if (!siteSurveyData?.id) {
        toast.error('Site survey ID is required');
        return;
      }

      const response = await fetch(`/api/site-surveys/${siteSurveyData.id}/generate-word`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate Word document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Site-Survey-${siteSurveyData.title?.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Site Survey Word document generated successfully');
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast.error('Failed to generate Word document');
    }
  };

  return (
    <div className="space-y-6">
      {/* BOM Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.reduce((sum, p) => sum + p.quantity, 0)} total units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Settings className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">
              {services.reduce((sum, s) => sum + s.quantity, 0)} total units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{getTotalPrice().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Before taxes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={onSave}
              variant="default"
              size="sm"
              className="w-full"
            >
              <Save className="h-3 w-3 mr-2" />
              Save BOM
            </Button>
            <Button
              onClick={generateWordDocument}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={equipment.length === 0}
            >
              <FileText className="h-3 w-3 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* BOM Tables with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              BILL OF MATERIALS
            </CardTitle>
            <Button
              onClick={generateBOMExcel}
              variant="outline"
              size="sm"
              disabled={equipment.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Services ({services.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {products.length} product{products.length !== 1 ? 's' : ''} in BOM
                </p>
                <Button
                  onClick={() => openAddItemDialog('product')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No products in BOM</p>
                  <p className="text-sm">Click "Add Product" to add products manually</p>
                </div>
              ) : (
                <DataTable
                  columns={productColumns}
                  data={products}
                  searchKey="name"
                  searchPlaceholder="Search products..."
                />
              )}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-blue-900">PRODUCTS SUBTOTAL</div>
                  <div className="text-xl font-bold text-blue-900">
                    €{products.reduce((sum, p) => sum + p.totalPrice, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {services.length} service{services.length !== 1 ? 's' : ''} in BOM
                </p>
                <Button
                  onClick={() => openAddItemDialog('service')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
              {services.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No services in BOM</p>
                  <p className="text-sm">Click "Add Service" to add services manually</p>
                </div>
              ) : (
                <DataTable
                  columns={serviceColumns}
                  data={services}
                  searchKey="name"
                  searchPlaceholder="Search services..."
                />
              )}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-green-900">SERVICES SUBTOTAL</div>
                  <div className="text-xl font-bold text-green-900">
                    €{services.reduce((sum, s) => sum + s.totalPrice, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Grand Total */}
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold">GRAND TOTAL</div>
                <div className="text-sm opacity-90">
                  {getTotalQuantity()} items • {products.length} products • {services.length} services
                </div>
              </div>
              <div className="text-3xl font-bold">
                €{getTotalPrice().toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Equipment Item</DialogTitle>
            <DialogDescription>
              Update quantity, notes, and location for this item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Input value={editingItem?.name || ''} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Location Assignment</Label>
              <Select
                value={locationOptions.find(opt => 
                  opt.element.type === editLocation?.type &&
                  opt.element.buildingIndex === editLocation?.buildingIndex &&
                  opt.element.floorIndex === editLocation?.floorIndex &&
                  opt.element.rackIndex === editLocation?.rackIndex &&
                  opt.element.roomIndex === editLocation?.roomIndex
                )?.value || ''}
                onValueChange={(value) => {
                  const option = locationOptions.find(opt => opt.value === value);
                  setEditLocation(option?.element);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes for this item"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={saveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialog} onOpenChange={setAddItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {addItemType === 'product' ? 'Product' : 'Service'}
            </DialogTitle>
            <DialogDescription>
              Manually add a {addItemType} to the Bill of Materials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newItemForm.name}
                onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                placeholder={`Enter ${addItemType} name`}
              />
            </div>
            {addItemType === 'product' && (
              <div>
                <Label>Brand</Label>
                <Input
                  value={newItemForm.brand}
                  onChange={(e) => setNewItemForm({ ...newItemForm, brand: e.target.value })}
                  placeholder="Enter brand name"
                />
              </div>
            )}
            <div>
              <Label>Category</Label>
              <Input
                value={newItemForm.category}
                onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                placeholder="Enter category"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItemForm.quantity}
                  onChange={(e) => setNewItemForm({ ...newItemForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={newItemForm.unit}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                  placeholder="Each, Hours, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit Price (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItemForm.price}
                  onChange={(e) => setNewItemForm({ ...newItemForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Margin %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newItemForm.margin}
                  onChange={(e) => setNewItemForm({ ...newItemForm, margin: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Location Assignment</Label>
              <Select
                value={locationOptions.find(opt => 
                  opt.element.type === selectedLocation?.type &&
                  opt.element.buildingIndex === selectedLocation?.buildingIndex &&
                  opt.element.floorIndex === selectedLocation?.floorIndex &&
                  opt.element.rackIndex === selectedLocation?.rackIndex &&
                  opt.element.roomIndex === selectedLocation?.roomIndex
                )?.value || ''}
                onValueChange={(value) => {
                  const option = locationOptions.find(opt => opt.value === value);
                  setSelectedLocation(option?.element);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newItemForm.notes}
                onChange={(e) => setNewItemForm({ ...newItemForm, notes: e.target.value })}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
            <div className="p-3 bg-muted rounded space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Base Total:</span>
                <span>€{(newItemForm.price * newItemForm.quantity).toFixed(2)}</span>
              </div>
              {newItemForm.margin > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Margin ({newItemForm.margin}%):</span>
                  <span>€{((newItemForm.price * newItemForm.quantity * newItemForm.margin) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t pt-1">
                <span>Total Price:</span>
                <span>€{(newItemForm.price * newItemForm.quantity * (1 + (newItemForm.margin || 0) / 100)).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddItemDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addNewItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add {addItemType === 'product' ? 'Product' : 'Service'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

