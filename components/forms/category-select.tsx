"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, FolderTree, Package } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  parentId?: string;
  softoneCode?: string;
  parent?: Category;
  children?: Category[];
  _count?: {
    products: number;
  };
}

interface CategorySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  showHierarchy?: boolean;
}

export function CategorySelect({
  value,
  onValueChange,
  placeholder = "Select category",
  required = false,
  label = "Category",
  disabled = false,
  showHierarchy = true,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadCategories = async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/master-data/categories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      toast.error("Error loading categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    loadCategories(searchTerm);
  };

  const selectedCategory = categories.find(c => c.id === value);

  const getCategoryDisplayName = (category: Category) => {
    if (!showHierarchy || !category.parent) {
      return category.name;
    }
    return `${category.parent.name} > ${category.name}`;
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <FolderTree className="h-4 w-4" />
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
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No categories found
              </div>
            ) : (
              categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-muted-foreground" />
                      <span>{getCategoryDisplayName(category)}</span>
                    </div>
                    {category._count && category._count.products > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                        <Package className="h-3 w-3" />
                        <span>{category._count.products}</span>
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <CreateCategoryDialog onCategoryCreated={loadCategories} categories={categories} />
      </div>
      
      {selectedCategory && (
        <div className="text-sm text-muted-foreground">
          Selected: {getCategoryDisplayName(selectedCategory)}
          {selectedCategory._count && selectedCategory._count.products > 0 && (
            <span className="ml-2">
              ({selectedCategory._count.products} products)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function CreateCategoryDialog({ 
  onCategoryCreated, 
  categories 
}: { 
  onCategoryCreated: () => void;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [softoneCode, setSoftoneCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/master-data/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parentId: parentId || undefined,
          softoneCode: softoneCode || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Category created successfully");
        setOpen(false);
        setName("");
        setParentId("");
        setSoftoneCode("");
        onCategoryCreated();
      } else {
        toast.error("Failed to create category");
      }
    } catch (error) {
      toast.error("Error creating category");
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
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Add a new category to the system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Electronics"
            />
          </div>
          
          <div>
            <Label htmlFor="parentId">Parent Category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No parent (root category)</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {loading ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
