"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { 
  Package, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calculator,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { EquipmentItem, getElementDisplayName } from "@/types/equipment-selection";
import { toast } from "sonner";

interface PricingStepProps {
  equipment: EquipmentItem[];
  buildings: any[];
  siteSurveyData?: any;
  onSubmit: (finalEquipment: EquipmentItem[]) => void;
  onBack: () => void;
  loading: boolean;
}

export function PricingStep({
  equipment,
  buildings,
  siteSurveyData,
  onSubmit,
  onBack,
  loading,
}: PricingStepProps) {
  const [localEquipment, setLocalEquipment] = useState<EquipmentItem[]>(equipment);
  const [generalNotes, setGeneralNotes] = useState("");

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

  // Separate products and services
  const products = useMemo(() => 
    localEquipment.filter(item => item.type === 'product'),
    [localEquipment]
  );

  const services = useMemo(() => 
    localEquipment.filter(item => item.type === 'service'),
    [localEquipment]
  );

  // Calculate totals
  const calculateTotals = (items: EquipmentItem[]) => {
    const subtotal = items.reduce((sum, item) => {
      const basePrice = item.price * item.quantity;
      return sum + basePrice;
    }, 0);

    const totalMargin = items.reduce((sum, item) => {
      const basePrice = item.price * item.quantity;
      const marginAmount = basePrice * ((item.margin || 0) / 100);
      return sum + marginAmount;
    }, 0);

    const total = subtotal + totalMargin;

    return { subtotal, totalMargin, total };
  };

  const productTotals = useMemo(() => calculateTotals(products), [products]);
  const serviceTotals = useMemo(() => calculateTotals(services), [services]);
  const grandTotal = productTotals.total + serviceTotals.total;

  // Update individual equipment item
  const updateEquipmentItem = (id: string, field: 'quantity' | 'price' | 'margin' | 'notes', value: any) => {
    setLocalEquipment(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Recalculate total price
        const basePrice = updated.price * updated.quantity;
        const marginAmount = basePrice * ((updated.margin || 0) / 100);
        updated.totalPrice = basePrice + marginAmount;
        
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (localEquipment.length === 0) {
      toast.error("Please add at least one equipment item");
      return;
    }

    // Validate all items have valid quantities and prices
    const invalidItems = localEquipment.filter(item => item.quantity <= 0 || item.price < 0);
    if (invalidItems.length > 0) {
      toast.error("All items must have valid quantities and prices");
      return;
    }

    onSubmit(localEquipment);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Pricing & Final Review</h3>
          <p className="text-sm text-muted-foreground">
            Review and adjust prices, quantities, and margins for all items
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Generate BOM & Document
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localEquipment.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {products.length} products, {services.length} services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Subtotal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{(productTotals.subtotal + serviceTotals.subtotal).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Before margins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{(productTotals.totalMargin + serviceTotals.totalMargin).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((productTotals.totalMargin + serviceTotals.totalMargin) / (productTotals.subtotal + serviceTotals.subtotal) * 100).toFixed(1)}% avg margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Grand Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              €{grandTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Final price
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right w-[100px]">Quantity</TableHead>
                    <TableHead className="text-right w-[120px]">Unit Price (€)</TableHead>
                    <TableHead className="text-right w-[100px]">Margin (%)</TableHead>
                    <TableHead className="text-right w-[120px]">Total (€)</TableHead>
                    <TableHead className="w-[200px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.brand && (
                            <div className="text-xs text-muted-foreground">{item.brand}</div>
                          )}
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {item.infrastructureElement 
                            ? getElementDisplayName(item.infrastructureElement)
                            : 'General'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateEquipmentItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateEquipmentItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.margin || 0}
                          onChange={(e) => updateEquipmentItem(item.id, 'margin', parseFloat(e.target.value) || 0)}
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{item.totalPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.notes || ''}
                          onChange={(e) => updateEquipmentItem(item.id, 'notes', e.target.value)}
                          placeholder="Notes..."
                          className="text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Products Subtotal:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      €{productTotals.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold text-green-600">
                      Products Margin:
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      €{productTotals.totalMargin.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Products Total:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      €{productTotals.total.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Section */}
      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Services ({services.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Service</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right w-[100px]">Quantity</TableHead>
                    <TableHead className="text-right w-[120px]">Unit Price (€)</TableHead>
                    <TableHead className="text-right w-[100px]">Margin (%)</TableHead>
                    <TableHead className="text-right w-[120px]">Total (€)</TableHead>
                    <TableHead className="w-[200px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {item.infrastructureElement 
                            ? getElementDisplayName(item.infrastructureElement)
                            : 'General'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateEquipmentItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateEquipmentItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.margin || 0}
                          onChange={(e) => updateEquipmentItem(item.id, 'margin', parseFloat(e.target.value) || 0)}
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{item.totalPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.notes || ''}
                          onChange={(e) => updateEquipmentItem(item.id, 'notes', e.target.value)}
                          placeholder="Notes..."
                          className="text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Services Subtotal:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      €{serviceTotals.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold text-green-600">
                      Services Margin:
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      €{serviceTotals.totalMargin.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Services Total:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      €{serviceTotals.total.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grand Total Card */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">Grand Total</h3>
              <p className="text-sm text-muted-foreground">
                {products.length} products + {services.length} services
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                €{grandTotal.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Including €{(productTotals.totalMargin + serviceTotals.totalMargin).toFixed(2)} margin
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Add any general notes or comments for this quote..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Project Info Summary */}
      {siteSurveyData && (
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Project Name</Label>
              <p className="font-medium">{siteSurveyData.title}</p>
            </div>
            {siteSurveyData.customer && (
              <div>
                <Label className="text-muted-foreground">Customer</Label>
                <p className="font-medium">{siteSurveyData.customer.name}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium">{siteSurveyData.type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge>{siteSurveyData.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

