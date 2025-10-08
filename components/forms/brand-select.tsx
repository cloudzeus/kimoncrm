"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Tag, Package } from "lucide-react";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  softoneCode?: string;
  logo?: {
    id: string;
    name: string;
    url?: string;
  };
  _count?: {
    products: number;
  };
}

interface BrandSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  showStats?: boolean;
}

export function BrandSelect({
  value,
  onValueChange,
  placeholder = "Select brand",
  required = false,
  label = "Brand",
  disabled = false,
  showStats = false,
}: BrandSelectProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadBrands = async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/master-data/brands?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands);
      } else {
        toast.error("Failed to load brands");
      }
    } catch (error) {
      toast.error("Error loading brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    loadBrands(searchTerm);
  };

  const selectedBrand = brands.find(b => b.id === value);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading brands...
              </div>
            ) : brands.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No brands found
              </div>
            ) : (
              brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {brand.logo?.url && (
                        <img 
                          src={brand.logo.url} 
                          alt={brand.name}
                          className="h-4 w-4 rounded object-cover"
                        />
                      )}
                      <span>{brand.name}</span>
                    </div>
                    {showStats && brand._count && brand._count.products > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                        <Package className="h-3 w-3" />
                        <span>{brand._count.products}</span>
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <CreateBrandDialog onBrandCreated={loadBrands} />
      </div>
      
      {selectedBrand && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {selectedBrand.logo?.url && (
              <img 
                src={selectedBrand.logo.url} 
                alt={selectedBrand.name}
                className="h-4 w-4 rounded object-cover"
              />
            )}
            <span>Selected: {selectedBrand.name}</span>
            {selectedBrand._count && selectedBrand._count.products > 0 && (
              <span className="ml-2">
                ({selectedBrand._count.products} products)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateBrandDialog({ onBrandCreated }: { onBrandCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [softoneCode, setSoftoneCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/master-data/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          softoneCode: softoneCode || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Brand created successfully");
        setOpen(false);
        setName("");
        setSoftoneCode("");
        onBrandCreated();
      } else {
        toast.error("Failed to create brand");
      }
    } catch (error) {
      toast.error("Error creating brand");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" disabled={loading}>
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Brand</DialogTitle>
          <DialogDescription>
            Add a new brand to the system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Brand Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple"
            />
          </div>
          
          <div>
            <Label htmlFor="softoneCode">SoftOne Code</Label>
            <Input
              id="softoneCode"
              value={softoneCode}
              onChange={(e) => setSoftoneCode(e.target.value)}
              placeholder="Optional SoftOne code"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Brand"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
