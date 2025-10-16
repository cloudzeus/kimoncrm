"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Factory, Package } from "lucide-react";
import { toast } from "sonner";

interface Manufacturer {
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

interface ManufacturerSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  showStats?: boolean;
}

export function ManufacturerSelect({
  value,
  onValueChange,
  placeholder = "Select manufacturer",
  required = false,
  label = "Manufacturer",
  disabled = false,
  showStats = false,
}: ManufacturerSelectProps) {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadManufacturers = async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/master-data/manufacturers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setManufacturers(data.manufacturers);
      } else {
        toast.error("Failed to load manufacturers");
      }
    } catch (error) {
      toast.error("Error loading manufacturers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManufacturers();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    loadManufacturers(searchTerm);
  };

  const selectedManufacturer = manufacturers.find(m => m.id === value);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Factory className="h-4 w-4" />
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
                  placeholder="Search manufacturers..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading manufacturers...
              </div>
            ) : manufacturers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No manufacturers found
              </div>
            ) : (
              manufacturers.map((manufacturer) => (
                <SelectItem key={manufacturer.id} value={manufacturer.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {manufacturer.logo?.url && (
                        <div className="h-4 w-4 rounded overflow-hidden relative">
                          <Image 
                            src={manufacturer.logo.url} 
                            alt={manufacturer.name}
                            width={16}
                            height={16}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <span>{manufacturer.name}</span>
                    </div>
                    {showStats && manufacturer._count && manufacturer._count.products > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                        <Package className="h-3 w-3" />
                        <span>{manufacturer._count.products}</span>
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <CreateManufacturerDialog onManufacturerCreated={loadManufacturers} />
      </div>
      
      {selectedManufacturer && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {selectedManufacturer.logo?.url && (
              <div className="h-4 w-4 rounded overflow-hidden relative">
                <Image 
                  src={selectedManufacturer.logo.url} 
                  alt={selectedManufacturer.name}
                  width={16}
                  height={16}
                  className="object-cover"
                />
              </div>
            )}
            <span>Selected: {selectedManufacturer.name}</span>
            {selectedManufacturer._count && selectedManufacturer._count.products > 0 && (
              <span className="ml-2">
                ({selectedManufacturer._count.products} products)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateManufacturerDialog({ onManufacturerCreated }: { onManufacturerCreated: () => void }) {
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
      const response = await fetch("/api/master-data/manufacturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          softoneCode: softoneCode || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Manufacturer created successfully");
        setOpen(false);
        setName("");
        setSoftoneCode("");
        onManufacturerCreated();
      } else {
        toast.error("Failed to create manufacturer");
      }
    } catch (error) {
      toast.error("Error creating manufacturer");
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
          <DialogTitle>Create Manufacturer</DialogTitle>
          <DialogDescription>
            Add a new manufacturer to the system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Manufacturer Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Samsung Electronics"
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
            {loading ? "Creating..." : "Create Manufacturer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
