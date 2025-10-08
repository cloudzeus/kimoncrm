"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Building2, Users, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  _count?: {
    users: number;
    stock: number;
    orders: number;
  };
}

interface BranchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  showStats?: boolean;
}

export function BranchSelect({
  value,
  onValueChange,
  placeholder = "Select branch",
  required = false,
  label = "Branch",
  disabled = false,
  showStats = false,
}: BranchSelectProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadBranches = async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/master-data/branches?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches);
      } else {
        toast.error("Failed to load branches");
      }
    } catch (error) {
      toast.error("Error loading branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    loadBranches(searchTerm);
  };

  const selectedBranch = branches.find(b => b.id === value);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
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
                  placeholder="Search branches..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading branches...
              </div>
            ) : branches.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No branches found
              </div>
            ) : (
              branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-1 rounded">
                        {branch.code}
                      </span>
                      <span>{branch.name}</span>
                    </div>
                    {showStats && branch._count && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                        <Users className="h-3 w-3" />
                        <span>{branch._count.users}</span>
                        <Package className="h-3 w-3" />
                        <span>{branch._count.stock}</span>
                        <ShoppingCart className="h-3 w-3" />
                        <span>{branch._count.orders}</span>
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <CreateBranchDialog onBranchCreated={loadBranches} />
      </div>
      
      {selectedBranch && (
        <div className="text-sm text-muted-foreground">
          <div>Selected: {selectedBranch.name} ({selectedBranch.code})</div>
          {selectedBranch.address && (
            <div>Address: {selectedBranch.address}</div>
          )}
          {selectedBranch.phone && (
            <div>Phone: {selectedBranch.phone}</div>
          )}
          {selectedBranch.email && (
            <div>Email: {selectedBranch.email}</div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateBranchDialog({ onBranchCreated }: { onBranchCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!code || !name) {
      toast.error("Code and name are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/master-data/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase(),
          name,
          address: address || undefined,
          phone: phone || undefined,
          email: email || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Branch created successfully");
        setOpen(false);
        setCode("");
        setName("");
        setAddress("");
        setPhone("");
        setEmail("");
        onBranchCreated();
      } else {
        toast.error("Failed to create branch");
      }
    } catch (error) {
      toast.error("Error creating branch");
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
          <DialogTitle>Create Branch</DialogTitle>
          <DialogDescription>
            Add a new branch to the system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="code">Branch Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., MAIN"
            />
          </div>
          
          <div>
            <Label htmlFor="name">Branch Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Branch"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 123 Main Street, Athens, Greece"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +30 210 1234567"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., info@branch.com"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Branch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
