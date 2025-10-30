"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2, Edit, FileDown, Loader2 } from "lucide-react";
import { EquipmentItem, SelectedElement, getElementDisplayName } from "@/types/equipment-selection";
import { EquipmentSelection } from "../equipment-selection";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EquipmentStepProps {
  equipment: EquipmentItem[];
  buildings: any[];
  onUpdate: (equipment: EquipmentItem[]) => void;
  siteSurveyId: string;
}

export function EquipmentStep({
  equipment,
  buildings,
  onUpdate,
  siteSurveyId,
}: EquipmentStepProps) {
  const [localEquipment, setLocalEquipment] = useState<EquipmentItem[]>(equipment);
  const [equipmentSelectionOpen, setEquipmentSelectionOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [generatingBOM, setGeneratingBOM] = useState(false);

  // Sync equipment prop with local state and deduplicate by ID
  useEffect(() => {
    // Deduplicate equipment items by ID (keep the first occurrence)
    const seenIds = new Set<string>();
    const deduplicated = equipment.filter(item => {
      if (seenIds.has(item.id)) {
        console.warn(`Duplicate equipment ID found: ${item.id}`);
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
    setLocalEquipment(deduplicated);
  }, [equipment]);

  const updateEquipment = (newEquipment: EquipmentItem[]) => {
    // Deduplicate before updating
    const seenIds = new Set<string>();
    const deduplicated = newEquipment.filter(item => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
    setLocalEquipment(deduplicated);
    onUpdate(deduplicated);
  };

  const handleAddEquipment = () => {
    setSelectedElement(null);
    setEquipmentSelectionOpen(true);
  };

  const handleEquipmentSave = (newItems: EquipmentItem[]) => {
    const updatedEquipment = [...localEquipment, ...newItems];
    updateEquipment(updatedEquipment);
    setEquipmentSelectionOpen(false);
    toast.success(`Added ${newItems.length} item(s) to equipment list`);
  };

  const removeEquipment = (id: string) => {
    if (confirm("Are you sure you want to remove this equipment?")) {
      const updatedEquipment = localEquipment.filter(item => item.id !== id);
      updateEquipment(updatedEquipment);
      toast.success("Equipment removed");
    }
  };

  const products = localEquipment.filter(item => item.type === 'product');
  const services = localEquipment.filter(item => item.type === 'service');

  const totalValue = localEquipment.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQuantity = localEquipment.reduce((sum, item) => sum + item.quantity, 0);

  // Generate BOM File
  const handleGenerateBOMFile = async () => {
    if (localEquipment.length === 0) {
      toast.error("Please add at least one product or service before generating the BOM file");
      return;
    }

    setGeneratingBOM(true);
    try {
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-bom-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment: localEquipment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate BOM file');
      }

      if (data.success) {
        toast.success(
          data.message || 'Successfully generated BOM file',
          {
            description: `${data.file.filename} (v${data.file.version}) - ${data.file.productsCount} products, ${data.file.servicesCount} services`,
            duration: 5000,
          }
        );
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Error generating BOM file:', error);
      toast.error(
        'Failed to generate BOM file',
        {
          description: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } finally {
      setGeneratingBOM(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">EQUIPMENT SELECTION</h3>
          <p className="text-sm text-muted-foreground">
            Select products and services required for this site survey
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateBOMFile}
            disabled={localEquipment.length === 0 || generatingBOM}
            variant="default"
          >
            {generatingBOM ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Generate BOM File
              </>
            )}
          </Button>
          <Button onClick={handleAddEquipment}>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localEquipment.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {localEquipment.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Equipment Selected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding products and services from your catalog
            </p>
            <Button onClick={handleAddEquipment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Products Table */}
          {products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.brand || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">€{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          €{item.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.infrastructureElement ? (
                            <span className="text-xs text-muted-foreground">
                              {getElementDisplayName(item.infrastructureElement)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">General</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeEquipment(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Services Table */}
          {services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Services ({services.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">€{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          €{item.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.infrastructureElement ? (
                            <span className="text-xs text-muted-foreground">
                              {getElementDisplayName(item.infrastructureElement)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">General</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeEquipment(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Equipment Selection Dialog */}
      <EquipmentSelection
        open={equipmentSelectionOpen}
        onClose={() => setEquipmentSelectionOpen(false)}
        onSave={handleEquipmentSave}
        existingEquipment={localEquipment}
        selectedElement={selectedElement}
      />
    </div>
  );
}

