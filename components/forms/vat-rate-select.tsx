"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Percent } from "lucide-react";
import { toast } from "sonner";

interface VatRate {
  id: string;
  name: string;
  rate: number;
  softoneCode?: string;
}

interface VatRateSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
}

export function VatRateSelect({
  value,
  onValueChange,
  placeholder = "Select VAT rate",
  required = false,
  label = "VAT Rate",
  disabled = false,
}: VatRateSelectProps) {
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadVatRates = async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/master-data/vat-rates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVatRates(data.vatRates);
      } else {
        toast.error("Failed to load VAT rates");
      }
    } catch (error) {
      toast.error("Error loading VAT rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVatRates();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    loadVatRates(searchTerm);
  };

  const selectedVatRate = vatRates.find(v => v.id === value);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Percent className="h-4 w-4" />
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
                  placeholder="Search VAT rates..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading VAT rates...
              </div>
            ) : vatRates.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No VAT rates found
              </div>
            ) : (
              vatRates.map((vatRate) => (
                <SelectItem key={vatRate.id} value={vatRate.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{vatRate.name}</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded ml-2">
                      {vatRate.rate}%
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <CreateVatRateDialog onVatRateCreated={loadVatRates} />
      </div>
      
      {selectedVatRate && (
        <div className="text-sm text-muted-foreground">
          Selected: {selectedVatRate.name} ({selectedVatRate.rate}%)
        </div>
      )}
    </div>
  );
}

function CreateVatRateDialog({ onVatRateCreated }: { onVatRateCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [softoneCode, setSoftoneCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !rate) {
      toast.error("Name and rate are required");
      return;
    }

    const rateNumber = parseFloat(rate);
    if (isNaN(rateNumber) || rateNumber < 0 || rateNumber > 100) {
      toast.error("Rate must be a number between 0 and 100");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/master-data/vat-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rate: rateNumber,
          softoneCode: softoneCode || undefined,
        }),
      });

      if (response.ok) {
        toast.success("VAT rate created successfully");
        setOpen(false);
        setName("");
        setRate("");
        setSoftoneCode("");
        onVatRateCreated();
      } else {
        toast.error("Failed to create VAT rate");
      }
    } catch (error) {
      toast.error("Error creating VAT rate");
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
          <DialogTitle>Create VAT Rate</DialogTitle>
          <DialogDescription>
            Add a new VAT rate to the system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">VAT Rate Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard VAT Rate"
            />
          </div>
          
          <div>
            <Label htmlFor="rate">Rate (%) *</Label>
            <Input
              id="rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g., 24"
              min="0"
              max="100"
              step="0.01"
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
            {loading ? "Creating..." : "Create VAT Rate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
