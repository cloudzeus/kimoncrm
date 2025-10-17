"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  FolderTree,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ServiceCategory {
  mtrcategory: string;
  code: string;
  name: string;
  sodtype: string;
  isActive: boolean;
  unit: string;
  vat: string;
}

interface ServiceCategoriesManagerProps {
  loading?: boolean;
}

export function ServiceCategoriesManager({
  loading: externalLoading = false,
}: ServiceCategoriesManagerProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services/categories');
      if (!res.ok) throw new Error('Failed to fetch service categories');
      
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch service categories');
      }
    } catch (error) {
      console.error('Error fetching service categories:', error);
      toast.error('Failed to load service categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle category edit
  const handleEdit = useCallback((category: ServiceCategory) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SERVICE CATEGORIES MANAGEMENT</h3>
          <p className="text-sm text-muted-foreground">
            Manage service categories from SoftOne ERP
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </Button>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                ADD CATEGORY
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>CREATE SERVICE CATEGORY</DialogTitle>
                <DialogDescription>
                  Add a new service category to SoftOne ERP
                </DialogDescription>
              </DialogHeader>
              <CreateCategoryDialog
                onClose={() => setCreateDialogOpen(false)}
                onSuccess={fetchCategories}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Table */}
      {loading || externalLoading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading service categories...</div>
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">NO SERVICE CATEGORIES FOUND</h3>
            <p className="text-muted-foreground mb-4">
              Create service categories to organize your services
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              CREATE CATEGORY
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">CODE</TableHead>
                <TableHead className="font-semibold">NAME</TableHead>
                <TableHead className="font-semibold">MTRCATEGORY</TableHead>
                <TableHead className="font-semibold">UNIT</TableHead>
                <TableHead className="font-semibold">VAT</TableHead>
                <TableHead className="font-semibold">STATUS</TableHead>
                <TableHead className="text-right font-semibold">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.mtrcategory}>
                  <TableCell className="font-mono">{category.code}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{category.mtrcategory}</Badge>
                  </TableCell>
                  <TableCell>{category.unit}</TableCell>
                  <TableCell>{category.vat}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>EDIT SERVICE CATEGORY</DialogTitle>
            <DialogDescription>
              Update service category information
            </DialogDescription>
          </DialogHeader>
          
          {editingCategory && (
            <EditCategoryDialog
              category={editingCategory}
              onClose={() => setEditDialogOpen(false)}
              onSuccess={fetchCategories}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Category Dialog Component
function CreateCategoryDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Name and code are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/services/categories/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create category');
      }
      
      toast.success("Service category created successfully");
      onSuccess();
      onClose();
      
      // Reset form
      setName("");
      setCode("");
    } catch (error) {
      console.error("Create error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="categoryCode">CODE *</Label>
        <Input
          id="categoryCode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g., 000123"
        />
      </div>

      <div>
        <Label htmlFor="categoryName">NAME *</Label>
        <Input
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., New Service Category"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          CANCEL
        </Button>
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? "CREATING..." : "CREATE CATEGORY"}
        </Button>
      </div>
    </div>
  );
}

// Edit Category Dialog Component
function EditCategoryDialog({
  category,
  onClose,
  onSuccess,
}: {
  category: ServiceCategory;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/services/categories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mtrcategory: category.mtrcategory, 
          name: name.trim() 
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update category');
      }

      toast.success("Service category updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>CODE</Label>
        <Input value={category.code} disabled />
      </div>

      <div>
        <Label>MTRCATEGORY</Label>
        <Input value={category.mtrcategory} disabled />
      </div>

      <div>
        <Label htmlFor="editCategoryName">NAME *</Label>
        <Input
          id="editCategoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          CANCEL
        </Button>
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? "UPDATING..." : "UPDATE CATEGORY"}
        </Button>
      </div>
    </div>
  );
}

