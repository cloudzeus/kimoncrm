"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CountrySelect, 
  UnitSelect, 
  VatRateSelect, 
  CategorySelect, 
  BrandSelect, 
  ManufacturerSelect 
} from "./index";
import { Package, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id?: string;
  sku: string;
  ean?: string;
  manufacturerCode?: string;
  name: string;
  nameEn?: string;
  descriptionEl?: string;
  descriptionEn?: string;
  brandId?: string;
  manufacturerId?: string;
  categoryId?: string;
  unitId?: string;
  countryOfOriginId?: string;
  vatRateId?: string;
  price?: number;
  cost?: number;
  weightGr?: number;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  isActive: boolean;
}

interface ProductFormProps {
  product?: Product;
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({ product, onSave, onCancel, loading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    sku: product?.sku || "",
    ean: product?.ean || "",
    manufacturerCode: product?.manufacturerCode || "",
    name: product?.name || "",
    nameEn: product?.nameEn || "",
    descriptionEl: product?.descriptionEl || "",
    descriptionEn: product?.descriptionEn || "",
    brandId: product?.brandId || "",
    manufacturerId: product?.manufacturerId || "",
    categoryId: product?.categoryId || "",
    unitId: product?.unitId || "",
    countryOfOriginId: product?.countryOfOriginId || "",
    vatRateId: product?.vatRateId || "",
    price: product?.price || undefined,
    cost: product?.cost || undefined,
    weightGr: product?.weightGr || undefined,
    widthMm: product?.widthMm || undefined,
    heightMm: product?.heightMm || undefined,
    depthMm: product?.depthMm || undefined,
    isActive: product?.isActive ?? true,
  });

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.name) {
      toast.error("SKU and name are required");
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Information
          </CardTitle>
          <CardDescription>
            Basic product details and identification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Product SKU"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="ean">EAN Code</Label>
              <Input
                id="ean"
                value={formData.ean || ""}
                onChange={(e) => handleInputChange("ean", e.target.value)}
                placeholder="EAN barcode"
              />
            </div>
            
            <div>
              <Label htmlFor="manufacturerCode">Manufacturer Code</Label>
              <Input
                id="manufacturerCode"
                value={formData.manufacturerCode || ""}
                onChange={(e) => handleInputChange("manufacturerCode", e.target.value)}
                placeholder="Manufacturer's product code"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Active Product</Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Product name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="nameEn">Product Name (English)</Label>
            <Input
              id="nameEn"
              value={formData.nameEn || ""}
              onChange={(e) => handleInputChange("nameEn", e.target.value)}
              placeholder="Product name in English"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="descriptionEl">Description (Greek)</Label>
              <Textarea
                id="descriptionEl"
                value={formData.descriptionEl || ""}
                onChange={(e) => handleInputChange("descriptionEl", e.target.value)}
                placeholder="Product description in Greek"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="descriptionEn">Description (English)</Label>
              <Textarea
                id="descriptionEn"
                value={formData.descriptionEn || ""}
                onChange={(e) => handleInputChange("descriptionEn", e.target.value)}
                placeholder="Product description in English"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classification & Relationships</CardTitle>
          <CardDescription>
            Product categorization and brand information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategorySelect
              value={formData.categoryId}
              onValueChange={(value) => handleInputChange("categoryId", value)}
              label="Category"
            />
            
            <BrandSelect
              value={formData.brandId}
              onValueChange={(value) => handleInputChange("brandId", value)}
              label="Brand"
              showStats={true}
            />
            
            <ManufacturerSelect
              value={formData.manufacturerId}
              onValueChange={(value) => handleInputChange("manufacturerId", value)}
              label="Manufacturer"
              showStats={true}
            />
            
            <CountrySelect
              value={formData.countryOfOriginId}
              onValueChange={(value) => handleInputChange("countryOfOriginId", value)}
              label="Country of Origin"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Measurements</CardTitle>
          <CardDescription>
            Product pricing, VAT, and physical dimensions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UnitSelect
              value={formData.unitId}
              onValueChange={(value) => handleInputChange("unitId", value)}
              label="Unit"
              required={true}
            />
            
            <VatRateSelect
              value={formData.vatRateId}
              onValueChange={(value) => handleInputChange("vatRateId", value)}
              label="VAT Rate"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (EUR)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ""}
                onChange={(e) => handleInputChange("price", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="cost">Cost (EUR)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost || ""}
                onChange={(e) => handleInputChange("cost", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="weightGr">Weight (grams)</Label>
              <Input
                id="weightGr"
                type="number"
                min="0"
                value={formData.weightGr || ""}
                onChange={(e) => handleInputChange("weightGr", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="widthMm">Width (mm)</Label>
              <Input
                id="widthMm"
                type="number"
                min="0"
                value={formData.widthMm || ""}
                onChange={(e) => handleInputChange("widthMm", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="heightMm">Height (mm)</Label>
              <Input
                id="heightMm"
                type="number"
                min="0"
                value={formData.heightMm || ""}
                onChange={(e) => handleInputChange("heightMm", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="depthMm">Depth (mm)</Label>
              <Input
                id="depthMm"
                type="number"
                min="0"
                value={formData.depthMm || ""}
                onChange={(e) => handleInputChange("depthMm", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Product"}
        </Button>
      </div>
    </form>
  );
}
