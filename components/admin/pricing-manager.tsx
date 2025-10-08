'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  Settings, 
  Package, 
  TrendingUp, 
  Plus, 
  Edit, 
  Eye,
  DollarSign,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  sku: string;
  name: string;
  cost: number | null;
  manualB2BPrice: number | null;
  manualRetailPrice: number | null;
  calculatedB2BPrice: number;
  calculatedRetailPrice: number;
  brand?: {
    name: string;
  } | null;
  manufacturer?: {
    name: string;
  } | null;
  category?: {
    name: string;
  } | null;
}

interface MarkupRule {
  id: string;
  name: string;
  type: string;
  targetName: string;
  b2bMarkupPercent: number;
  retailMarkupPercent: number;
  priority: number;
  isActive: boolean;
}

interface PricingManagerProps {
  className?: string;
}

export function PricingManager({ className }: PricingManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [markupRules, setMarkupRules] = useState<MarkupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, rulesRes] = await Promise.all([
        fetch('/api/admin/products/pricing'),
        fetch('/api/admin/markup-rules')
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setMarkupRules(rulesData);
      }
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const productsColumns = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }: { row: { original: Product } }) => (
        <span className="font-mono text-sm">{row.original.sku}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }: { row: { original: Product } }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {row.original.brand && (
              <Badge variant="outline" className="text-xs">
                {row.original.brand.name}
              </Badge>
            )}
            {row.original.category && (
              <Badge variant="secondary" className="text-xs">
                {row.original.category.name}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }: { row: { original: Product } }) => (
        <span className="font-medium">
          {row.original.cost ? `€${row.original.cost.toFixed(2)}` : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'calculatedB2BPrice',
      header: 'B2B Price',
      cell: ({ row }: { row: { original: Product } }) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">
            €{row.original.calculatedB2BPrice.toFixed(2)}
          </span>
          {row.original.manualB2BPrice && (
            <Badge variant="default" className="text-xs">
              Manual
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'calculatedRetailPrice',
      header: 'Retail Price',
      cell: ({ row }: { row: { original: Product } }) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">
            €{row.original.calculatedRetailPrice.toFixed(2)}
          </span>
          {row.original.manualRetailPrice && (
            <Badge variant="default" className="text-xs">
              Manual
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'margin',
      header: 'B2B Margin',
      cell: ({ row }: { row: { original: Product } }) => {
        const cost = row.original.cost || 0;
        const price = row.original.calculatedB2BPrice;
        const margin = cost > 0 ? ((price - cost) / price * 100) : 0;
        
        return (
          <Badge variant={margin > 20 ? 'default' : margin > 10 ? 'secondary' : 'destructive'}>
            {margin.toFixed(1)}%
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Product } }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProduct(row.original);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const rulesColumns = [
    {
      accessorKey: 'name',
      header: 'Rule Name',
      cell: ({ row }: { row: { original: MarkupRule } }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.type} • {row.original.targetName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'b2bMarkupPercent',
      header: 'B2B Markup',
      cell: ({ row }: { row: { original: MarkupRule } }) => (
        <div className="flex items-center space-x-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.b2bMarkupPercent}%</span>
        </div>
      ),
    },
    {
      accessorKey: 'retailMarkupPercent',
      header: 'Retail Markup',
      cell: ({ row }: { row: { original: MarkupRule } }) => (
        <div className="flex items-center space-x-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.retailMarkupPercent}%</span>
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }: { row: { original: MarkupRule } }) => (
        <Badge variant="outline">{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: { row: { original: MarkupRule } }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: MarkupRule } }) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>PRICING MANAGEMENT</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>PRICING MANAGEMENT</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                NEW RULE
              </Button>
              <Button size="sm" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                RECALCULATE ALL
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>PRODUCTS</span>
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>MARKUP RULES</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>ANALYTICS</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <DataTable columns={productsColumns} data={products} />
            </TabsContent>

            <TabsContent value="rules">
              <DataTable columns={rulesColumns} data={markupRules} />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">AVERAGE B2B MARGIN</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const avgMargin = products.reduce((acc, product) => {
                          const cost = product.cost || 0;
                          const price = product.calculatedB2BPrice;
                          const margin = cost > 0 ? ((price - cost) / price * 100) : 0;
                          return acc + margin;
                        }, 0) / products.length;
                        return `${avgMargin.toFixed(1)}%`;
                      })()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">TOTAL PRODUCTS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{products.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">ACTIVE RULES</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {markupRules.filter(rule => rule.isActive).length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Product Pricing Edit Dialog */}
      {selectedProduct && (
        <ProductPricingDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSave={(updatedProduct) => {
            setProducts(prev => prev.map(p => 
              p.id === updatedProduct.id ? updatedProduct : p
            ));
            setIsEditDialogOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Product Pricing Edit Dialog Component
interface ProductPricingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSave: (product: Product) => void;
}

function ProductPricingDialog({ isOpen, onClose, product, onSave }: ProductPricingDialogProps) {
  const [formData, setFormData] = useState({
    cost: product.cost || 0,
    manualB2BPrice: product.manualB2BPrice || 0,
    manualRetailPrice: product.manualRetailPrice || 0,
    useManualB2B: !!product.manualB2BPrice,
    useManualRetail: !!product.manualRetailPrice,
  });
  const [loading, setLoading] = useState(false);

  const calculatedB2BPrice = formData.cost * 1.25; // 25% markup
  const calculatedRetailPrice = formData.cost * 1.50; // 50% markup

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${product.id}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cost: formData.cost,
          manualB2BPrice: formData.useManualB2B ? formData.manualB2BPrice : null,
          manualRetailPrice: formData.useManualRetail ? formData.manualRetailPrice : null,
        }),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        onSave(updatedProduct);
        toast.success('Product pricing updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update pricing');
      }
    } catch (error) {
      console.error('Error updating product pricing:', error);
      toast.error('Failed to update pricing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>EDIT PRODUCT PRICING</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>

          {/* Pricing Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost Price (Purchase Price) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manualB2BPrice">Manual B2B Price</Label>
                <Input
                  id="manualB2BPrice"
                  type="number"
                  step="0.01"
                  value={formData.manualB2BPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, manualB2BPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  disabled={!formData.useManualB2B}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useManualB2B"
                    checked={formData.useManualB2B}
                    onChange={(e) => setFormData(prev => ({ ...prev, useManualB2B: e.target.checked }))}
                  />
                  <Label htmlFor="useManualB2B" className="text-sm">
                    Override calculated price (€{calculatedB2BPrice.toFixed(2)})
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualRetailPrice">Manual Retail Price</Label>
                <Input
                  id="manualRetailPrice"
                  type="number"
                  step="0.01"
                  value={formData.manualRetailPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, manualRetailPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  disabled={!formData.useManualRetail}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useManualRetail"
                    checked={formData.useManualRetail}
                    onChange={(e) => setFormData(prev => ({ ...prev, useManualRetail: e.target.checked }))}
                  />
                  <Label htmlFor="useManualRetail" className="text-sm">
                    Override calculated price (€{calculatedRetailPrice.toFixed(2)})
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
