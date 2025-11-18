// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { ProductForm } from "@/components/forms/product-form";
import { XLSXImport } from "@/components/forms";
import { 
  Plus, 
  Package, 
  Eye, 
  Edit, 
  Trash2,
  Upload,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  sku: string;
  ean?: string;
  manufacturerCode?: string;
  name: string;
  nameEn?: string;
  descriptionEl?: string;
  descriptionEn?: string;
  brand?: {
    id: string;
    name: string;
  };
  manufacturer?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
    code: string;
  };
  countryOfOrigin?: {
    id: string;
    name: string;
    iso2: string;
  };
  vatRate?: {
    id: string;
    name: string;
    rate: number;
  };
  price?: number;
  cost?: number;
  weightGr?: number;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    inventory: number;
    media: number;
  };
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      console.error("Load products error:", error);
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle product creation
  const handleCreateProduct = useCallback(async (productData: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success("Product created successfully");
        setCreateDialogOpen(false);
        loadProducts();
      } else {
        toast.error("Failed to create product");
      }
    } catch (error) {
      console.error("Create product error:", error);
      toast.error("Error creating product");
    }
  }, [loadProducts]);

  // Handle product update
  const handleUpdateProduct = useCallback(async (productData: any) => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success("Product updated successfully");
        setEditDialogOpen(false);
        setEditingProduct(null);
        loadProducts();
      } else {
        toast.error("Failed to update product");
      }
    } catch (error) {
      console.error("Update product error:", error);
      toast.error("Error updating product");
    }
  }, [editingProduct, loadProducts]);

  // Handle product deletion
  const handleDeleteProduct = useCallback(async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success("Product deleted successfully");
          loadProducts();
        } else {
          toast.error("Failed to delete product");
        }
      } catch (error) {
        console.error("Delete product error:", error);
        toast.error("Error deleting product");
      }
    }
  }, [loadProducts]);

  // Handle product view
  const handleViewProduct = useCallback((product: Product) => {
    // Navigate to product details page
    window.location.href = `/products/${product.id}`;
  }, []);

  // Handle product edit
  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0) {
      toast.error("No products selected");
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      try {
        const promises = selectedProducts.map(product =>
          fetch(`/api/products/${product.id}`, { method: 'DELETE' })
        );
        
        await Promise.all(promises);
        toast.success(`${selectedProducts.length} products deleted successfully`);
        setSelectedProducts([]);
        loadProducts();
      } catch (error) {
        console.error("Bulk delete error:", error);
        toast.error("Error deleting products");
      }
    }
  }, [selectedProducts, loadProducts]);

  // Handle XLSX import
  const handleXLSXImport = useCallback(async (data: any[], mapping: Record<string, string>) => {
    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, mapping }),
      });

      if (response.ok) {
        toast.success(`${data.length} products imported successfully`);
        setImportDialogOpen(false);
        loadProducts();
      } else {
        toast.error("Failed to import products");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Error importing products");
    }
  }, [loadProducts]);

  // Define columns for the data table
  const columns: Column<Product>[] = [
    {
      key: "sku",
      label: "SKU",
      sortable: true,
      width: 120,
      render: (value, product) => (
        <div className="font-mono text-sm">{value}</div>
      ),
    },
    {
      key: "name",
      label: "Product Name",
      sortable: true,
      width: 200,
      render: (value, product) => (
        <div>
          <div className="font-medium">{value}</div>
          {product.nameEn && (
            <div className="text-sm text-muted-foreground">{product.nameEn}</div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      width: 150,
      render: (value) => value ? (
        <Badge variant="secondary">{value.name}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: "brand",
      label: "Brand",
      sortable: true,
      width: 120,
      render: (value) => value ? (
        <Badge variant="outline">{value.name}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      width: 100,
      render: (value) => value ? (
        <div className="font-mono">€{value.toFixed(2)}</div>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: "vatRate",
      label: "VAT",
      sortable: true,
      width: 80,
      render: (value) => value ? (
        <Badge variant="secondary">{value.rate}%</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: "unit",
      label: "Unit",
      sortable: true,
      width: 80,
      render: (value) => value ? (
        <div className="text-sm">
          <div>{value.name}</div>
          <div className="text-muted-foreground text-xs">{value.code}</div>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      width: 80,
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "_count",
      label: "Counts",
      width: 120,
      render: (value) => (
        <div className="flex items-center space-x-2 text-sm">
          {value?.inventory !== undefined && (
            <Badge variant="outline">
              {value.inventory} stock
            </Badge>
          )}
          {value?.media !== undefined && (
            <Badge variant="outline">
              {value.media} media
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      width: 100,
      render: (value) => (
        <div className="text-sm">
          {new Date(value).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: 120,
      render: (_, product) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewProduct(product)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditProduct(product)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProduct(product)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const productFields = [
    { key: "sku", label: "SKU" },
    { key: "ean", label: "EAN Code" },
    { key: "manufacturerCode", label: "Manufacturer Code" },
    { key: "name", label: "Product Name" },
    { key: "nameEn", label: "Product Name (EN)" },
    { key: "descriptionEl", label: "Description (Greek)" },
    { key: "descriptionEn", label: "Description (English)" },
    { key: "price", label: "Price" },
    { key: "cost", label: "Cost" },
    { key: "weightGr", label: "Weight (grams)" },
    { key: "widthMm", label: "Width (mm)" },
    { key: "heightMm", label: "Height (mm)" },
    { key: "depthMm", label: "Depth (mm)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            Products ({products.length})
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedProducts.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import XLSX
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Import Products from XLSX</DialogTitle>
                <DialogDescription>
                  Upload an Excel file and map columns to product fields
                </DialogDescription>
              </DialogHeader>
              
              <XLSXImport
                onImport={handleXLSXImport}
                targetFields={productFields}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your catalog
                </DialogDescription>
              </DialogHeader>
              
              <ProductForm
                onSave={handleCreateProduct}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        searchable={true}
        exportable={true}
        sortable={true}
        filterable={true}
        selectable={true}
        resizable={true}
        onRowClick={handleViewProduct}
        onSelectionChange={setSelectedProducts}
        onExport={(data, columns) => {
          toast.success(`Exported ${data.length} products to Excel`);
        }}
      />

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSave={handleUpdateProduct}
              onCancel={() => {
                setEditDialogOpen(false);
                setEditingProduct(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
