"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Package } from "lucide-react";
import { toast } from "sonner";

interface Unit {
  id: string;
  code: string;
  name: string;
  softoneCode?: string;
}

interface UnitSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
}

export function UnitSelect({
  value,
  onValueChange,
  placeholder = "Select unit",
  required = false,
  label = "Unit",
  disabled = false,
}: UnitSelectProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadUnits = async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/master-data/units?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUnits(data.units);
      } else {
        toast.error("Failed to load units");
      }
    } catch (error) {
      toast.error("Error loading units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    loadUnits(searchTerm);
  };

  const selectedUnit = units.find(u => u.id === value);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Package className="h-4 w-4" />
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
                  placeholder="Search units..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading units...
              </div>
            ) : units.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No units found
              </div>
            ) : (
              units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1 rounded">
                      {unit.code}
                    </span>
                    <span>{unit.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <CreateUnitDialog onUnitCreated={loadUnits} />
      </div>
      
      {selectedUnit && (
        <div className="text-sm text-muted-foreground">
          Selected: {selectedUnit.name} ({selectedUnit.code})
        </div>
      )}
    </div>
  );
}

function CreateUnitDialog({ onUnitCreated }: { onUnitCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [softoneCode, setSoftoneCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!code || !name) {
      toast.error("Code and name are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/master-data/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase(),
          name,
          softoneCode: softoneCode || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Unit created successfully");
        setOpen(false);
        setCode("");
        setName("");
        setSoftoneCode("");
        onUnitCreated();
      } else {
        toast.error("Failed to create unit");
      }
    } catch (error) {
      toast.error("Error creating unit");
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
          <DialogTitle>Create Unit</DialogTitle>
          <DialogDescription>
            Add a new unit to the system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="code">Unit Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., PCS"
            />
          </div>
          
          <div>
            <Label htmlFor="name">Unit Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pieces"
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
            {loading ? "Creating..." : "Create Unit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
