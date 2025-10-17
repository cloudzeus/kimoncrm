"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Edit,
  Trash2,
  Plus,
  Minus,
  Package,
  Calculator,
  Euro,
  Hash,
} from 'lucide-react';

interface EquipmentItem {
  id: string;
  type: 'product' | 'service';
  itemId: string;
  name: string;
  brand?: string;
  category: string;
  unit: string;
  quantity: number;
  price: number;
  totalPrice: number;
  notes?: string;
}

interface BOMManagerProps {
  equipment: EquipmentItem[];
  onUpdateEquipment: (equipment: EquipmentItem[]) => void;
  siteSurveyData?: any;
  buildings?: any[];
  files?: any[];
  onGenerateBOM?: () => void;
}

export function BOMManager({
  equipment,
  onUpdateEquipment,
  siteSurveyData,
  buildings,
  files,
  onGenerateBOM
}: BOMManagerProps) {
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState('');

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

  const updateNotes = (id: string, notes: string) => {
    const updatedEquipment = equipment.map(item => {
      if (item.id === id) {
        return { ...item, notes };
      }
      return item;
    });
    onUpdateEquipment(updatedEquipment);
  };

  const openEditDialog = (item: EquipmentItem) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
    setEditNotes(item.notes || '');
  };

  const saveEdit = () => {
    if (!editingItem) return;

    const updatedEquipment = equipment.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          quantity: editQuantity,
          totalPrice: item.price * editQuantity,
          notes: editNotes
        };
      }
      return item;
    });

    onUpdateEquipment(updatedEquipment);
    setEditingItem(null);
    toast.success('Item updated successfully');
  };

  const getTotalPrice = () => {
    return equipment.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalQuantity = () => {
    return equipment.reduce((total, item) => total + item.quantity, 0);
  };

  const getProductsCount = () => {
    return equipment.filter(item => item.type === 'product').length;
  };

  const getServicesCount = () => {
    return equipment.filter(item => item.type === 'service').length;
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

  return (
    <div className="space-y-6">
      {/* BOM Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
            <p className="text-xs text-muted-foreground">
              {getProductsCount()} products, {getServicesCount()} services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalQuantity()}</div>
            <p className="text-xs text-muted-foreground">
              Units across all items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Price</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{getTotalPrice().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Before taxes and discounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateBOMExcel}
              className="w-full"
              disabled={equipment.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export BOM
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* BOM Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            BILL OF MATERIALS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No equipment in BOM</p>
              <p className="text-sm">Add equipment from the equipment selection dialog</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.brand || '-'}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>€{item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        €{item.totalPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {item.notes || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* BOM Totals */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">BOM TOTAL</div>
                  <div className="text-2xl font-bold">€{getTotalPrice().toFixed(2)}</div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {getTotalQuantity()} total units across {equipment.length} items
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Equipment Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Input value={editingItem?.name || ''} disabled />
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
              <Label>Notes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes for this item"
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
    </div>
  );
}
