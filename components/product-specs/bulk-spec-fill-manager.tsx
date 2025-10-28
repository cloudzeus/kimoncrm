"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayCircle, Loader2, Edit, Trash2, Save, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button as UIButton } from "@/components/ui/button";

interface Specification {
  id: string;
  specKey: string;
  order: number;
  translations?: Array<{
    languageCode: string;
    specName: string;
    specValue: string;
  }>;
}

interface Product {
  id: string;
  name: string;
  code: string | null;
  code1: string | null; // EAN code
  code2: string | null; // Manufacturer code
  mtrgroup: string | null;
  brand: {
    name: string;
  } | null;
  category: {
    name: string;
  } | null;
  specifications?: Specification[];
  _count?: {
    specifications: number;
  };
}

interface MtrGroup {
  mtrgroup: string;
  name: string;
}

export function BulkSpecFillManager() {
  const [selectedMtrgroup, setSelectedMtrgroup] = useState<string>("");
  const [mtrgroups, setMtrgroups] = useState<MtrGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editingSpec, setEditingSpec] = useState<{ productId: string; specId: string } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // Helper function to count specs with valid values (not N/A)
  const countValidSpecs = (specs: Specification[] | undefined): number => {
    if (!specs || specs.length === 0) return 0;
    return specs.filter(spec => {
      const enTrans = spec.translations?.find(t => t.languageCode === 'en');
      const value = enTrans?.specValue?.toUpperCase() || '';
      return value !== '' && value !== 'N/A' && value !== 'NA' && value !== 'N/A';
    }).length;
  };

  // Load mtrgroups on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await fetch('/api/master-data/mtrgroups?sodtype=51');
        const data = await res.json();
        if (data.success) {
          setMtrgroups(data.data.map((g: any) => ({
            mtrgroup: g.mtrgroup,
            name: `${g.name} (${g.mtrgroup})`,
          })));
        }
      } catch (error) {
        console.error('Error loading mtrgroups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, []);

  // Load products when mtrgroup changes
  useEffect(() => {
    if (!selectedMtrgroup) {
      setProducts([]);
      return;
    }

    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?mtrgroupCodes=${selectedMtrgroup}&includeSpecs=true`);
        const data = await res.json();
        
        if (data.success) {
          setProducts(data.data || []);
          toast.success(`Found ${data.data.length} products in this group`);
        } else {
          toast.error(data.error || "Failed to load products");
        }
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedMtrgroup]);



  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Select all
  const selectAll = () => {
    setSelectedProducts(new Set(products.map(p => p.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  // Delete a specification
  const deleteSpec = async (productId: string, specId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/specifications/${specId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Specification deleted');
        // Refresh products
        if (selectedMtrgroup) {
          const refreshRes = await fetch(`/api/products?mtrgroupCodes=${selectedMtrgroup}&includeSpecs=true`);
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            setProducts(refreshData.data || []);
          }
        }
      } else {
        toast.error(data.error || 'Failed to delete specification');
      }
    } catch (error) {
      console.error('Error deleting spec:', error);
      toast.error('Failed to delete specification');
    }
  };

  // Update a specification
  const updateSpec = async (productId: string, specId: string, updates: any) => {
    try {
      const res = await fetch(`/api/products/${productId}/specifications/${specId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Specification updated');
        // Refresh products
        if (selectedMtrgroup) {
          const refreshRes = await fetch(`/api/products?mtrgroupCodes=${selectedMtrgroup}&includeSpecs=true`);
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            setProducts(refreshData.data || []);
          }
        }
      } else {
        toast.error(data.error || 'Failed to update specification');
      }
    } catch (error) {
      console.error('Error updating spec:', error);
      toast.error('Failed to update specification');
    }
  };

  // Generate specs for selected products
  const generateSpecs = async (force: boolean = false) => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setProcessing(true);
    try {
      const productIds = Array.from(selectedProducts);
      const res = await fetch("/api/products/generate-specs-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, force }),
      });

      const data = await res.json();
      if (data.success) {
        const action = force ? 'Regenerated' : 'Generated';
        toast.success(`${action} specifications for ${data.processedCount} products`);
        // Refresh products by reloading from mtrgroup
        if (selectedMtrgroup) {
          const refreshRes = await fetch(`/api/products?mtrgroupCodes=${selectedMtrgroup}&includeSpecs=true`);
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            setProducts(refreshData.data || []);
          }
        }
        setSelectedProducts(new Set());
      } else {
        toast.error(data.error || "Failed to generate specifications");
      }
    } catch (error) {
      console.error("Error generating specs:", error);
      toast.error("Failed to generate specifications");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Select Product Group */}
      <Card>
        <CardHeader>
          <CardTitle>SELECT PRODUCT GROUP</CardTitle>
          <CardDescription>
            Select a product group to generate specifications for all products in that group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select 
              value={selectedMtrgroup} 
              onValueChange={setSelectedMtrgroup}
              disabled={loadingGroups}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select a product group..."} />
              </SelectTrigger>
              <SelectContent>
                {mtrgroups.map((group) => (
                  <SelectItem key={group.mtrgroup} value={group.mtrgroup}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>SEARCH RESULTS</CardTitle>
                <CardDescription>
                  {products.length} products found • {selectedProducts.size} selected
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                >
                  SELECT ALL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                >
                  DESELECT ALL
                </Button>
                <Button
                  onClick={() => {
                    setSelectedProducts(new Set(products.map(p => p.id)));
                    setTimeout(() => generateSpecs(), 100);
                  }}
                  disabled={processing || products.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESSING ALL...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      GENERATE SPECS FOR ALL ({products.length})
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => generateSpecs(false)}
                  disabled={processing || selectedProducts.size === 0}
                  variant="outline"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      GENERATE SPECS ({selectedProducts.size})
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => generateSpecs(true)}
                  disabled={processing || selectedProducts.size === 0}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      REGENERATE SPECS ({selectedProducts.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {products.map((product) => (
                <AccordionItem key={product.id} value={product.id} className="border rounded-lg px-4">
                  <div className="flex items-center gap-4 py-3">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <div className="flex-1">
                      <AccordionTrigger className="hover:no-underline py-0">
                        <div className="flex items-center gap-4 flex-1 mr-4">
                          <div className="flex-1 text-left">
                            <div className="font-medium text-[11px]">{product.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono space-x-2">
                              {product.code && <span>Code: {product.code}</span>}
                              {product.code1 && <span>• EAN: {product.code1}</span>}
                              {product.code2 && <span>• MFR: {product.code2}</span>}
                              {product.mtrgroup && <span>• Group: {product.mtrgroup}</span>}
                            </div>
                          </div>
                          {(() => {
                            const validCount = countValidSpecs(product.specifications);
                            const totalCount = product.specifications?.length || product._count?.specifications || 0;
                            return (
                              <Badge variant={validCount > 0 ? 'default' : 'secondary'}>
                                {validCount}/{totalCount} valid
                              </Badge>
                            );
                          })()}
                        </div>
                      </AccordionTrigger>
                    </div>
                  </div>
                  <AccordionContent>
                    <div className="space-y-3 pt-2 pb-4">
                      {product.specifications && product.specifications.length > 0 ? (
                        product.specifications.map((spec) => {
                          const isEditing = editingSpec?.productId === product.id && editingSpec?.specId === spec.id;
                          
                          return (
                            <div key={spec.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                              <div className="flex-1 space-y-2">
                                <div className="font-mono text-xs text-muted-foreground">{spec.specKey}</div>
                                {spec.translations && spec.translations.map((translation) => (
                                  <div key={translation.languageCode} className="flex gap-2">
                                    <span className="text-xs font-semibold w-12 uppercase">{translation.languageCode}:</span>
                                    <div className="flex-1">
                                      {isEditing ? (
                                        <div className="space-y-1">
                                          <Input
                                            className="h-8 text-sm"
                                            placeholder="Spec name"
                                            defaultValue={translation.specName}
                                            onChange={(e) => setEditValues({
                                              ...editValues,
                                              [`${translation.languageCode}_name`]: e.target.value
                                            })}
                                          />
                                          <Input
                                            className="h-8 text-sm"
                                            placeholder="Spec value"
                                            defaultValue={translation.specValue}
                                            onChange={(e) => setEditValues({
                                              ...editValues,
                                              [`${translation.languageCode}_value`]: e.target.value
                                            })}
                                          />
                                        </div>
                                      ) : (
                                        <>
                                          <div className="font-medium text-sm">{translation.specName}</div>
                                          <div className="text-sm text-muted-foreground">{translation.specValue || <em>No value</em>}</div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-1">
                                {isEditing ? (
                                  <>
                                    <UIButton
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        try {
            const translations: any[] = [];
                                            Object.keys(editValues).forEach((key: string) => {
                                              const parts = key.split('_');
                                              const langCode = parts[0];
                                              const field = parts[1];
                                            const existing = translations.find(t => t.languageCode === langCode);
                                            if (existing) {
                                              existing[field] = editValues[key];
                                            } else {
                                              translations.push({
                                                languageCode: langCode,
                                                [field]: editValues[key]
                                              });
                                            }
                                          });
                                          
                                          await updateSpec(product.id, spec.id, { translations });
                                          setEditingSpec(null);
                                          setEditValues({});
                                        } catch (error) {
                                          console.error('Error saving spec:', error);
                                        }
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Save className="h-4 w-4 text-green-500" />
                                    </UIButton>
                                    <UIButton
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingSpec(null);
                                        setEditValues({});
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4 text-muted-foreground" />
                                    </UIButton>
                                  </>
                                ) : (
                                  <>
                                    <UIButton
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingSpec({ productId: product.id, specId: spec.id });
                                        // Initialize edit values from current translations
                                        const values: Record<string, string> = {};
                                        if (spec.translations && spec.translations.length > 0) {
                                          spec.translations.forEach(t => {
                                            values[`${t.languageCode}_name`] = t.specName;
                                            values[`${t.languageCode}_value`] = t.specValue;
                                          });
                                        }
                                        setEditValues(values);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4 text-blue-500" />
                                    </UIButton>
                                    <UIButton
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteSpec(product.id, spec.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </UIButton>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No specifications yet. Generate specs using the buttons above.
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
