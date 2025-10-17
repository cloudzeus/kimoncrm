// @ts-nocheck
"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableList } from "@/components/drag-drop/sortable-list";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FolderTree,
  Package,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { CategoryTranslationForm, CategoryTranslation } from "./category-translation-form";

interface Category {
  id: string;
  name: string;
  parentId?: string;
  softoneCode?: string;
  order: number;
  parent?: Category;
  children?: Category[];
  translations?: Array<{ languageCode: string; name?: string; description?: string }>;
  _count?: {
    products: number;
  };
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoryUpdate: (categories: Category[]) => Promise<void>;
  onCategoryCreate: (category: Omit<Category, "id" | "order">) => Promise<void>;
  onCategoryDelete: (categoryId: string) => Promise<void>;
  loading?: boolean;
}

export function CategoryManager({
  categories,
  onCategoryUpdate,
  onCategoryCreate,
  onCategoryDelete,
  loading = false,
}: CategoryManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<"hierarchy" | "flat">("hierarchy");

  // Handle reordering
  const handleReorder = useCallback(async (reorderedCategories: Category[]) => {
    try {
      await onCategoryUpdate(reorderedCategories);
      toast.success("Category order updated");
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Failed to update category order");
    }
  }, [onCategoryUpdate]);

  // Handle category edit
  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  }, []);

  // Handle category delete
  const handleDelete = useCallback(async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"? This will also delete all subcategories.`)) {
      try {
        await onCategoryDelete(category.id);
        toast.success("Category deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete category");
      }
    }
  }, [onCategoryDelete]);

  // Handle category view
  const handleView = useCallback((category: Category) => {
    // Navigate to category details or products
    console.log("View category:", category);
  }, []);

  // Render category item for list view
  const renderCategoryItem = useCallback((category: Category, index: number) => {
    const enName = category.translations?.find(t => t.languageCode === 'en')?.name;
    const displayName = enName?.trim() ? enName : category.name;
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <FolderTree className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{displayName}</h4>
              {category.translations && category.translations.length > 0 && (
                <div className="flex items-center gap-1">
                  {category.translations.map(tr => (
                    <span key={tr.languageCode} className="text-xs text-muted-foreground" title={tr.name || ''}>
                      {tr.language?.flag || tr.languageCode.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {category.parent && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{category.parent.name}</span>
              </>
            )}
            {category._count && category._count.products > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Package className="h-3 w-3" />
                  <span>{category._count.products} products</span>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
        {category.softoneCode && (
          <Badge variant="outline" className="text-xs">
            {category.softoneCode}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          #{index + 1}
        </Badge>
        </div>
      </div>
    );
  }, []);

  // Get root categories (no parent)
  const rootCategories = categories.filter(cat => !cat.parentId);

  // Get categories by parent
  const getCategoriesByParent = useCallback((parentId: string | null) => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }, [categories]);

  // Render hierarchy view
  const renderHierarchy = useCallback((parentId: string | null = null, level = 0) => {
    const childCategories = getCategoriesByParent(parentId);
    
    return childCategories.map((category) => (
      <div key={category.id} className="space-y-2">
        <Card className={`ml-${level * 4}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FolderTree className="h-5 w-5 text-muted-foreground" />
                <div>
                  {(() => {
                    const enName = category.translations?.find(t => t.languageCode === 'en')?.name;
                    const displayName = enName?.trim() ? enName : category.name;
                    const flags = (category.translations || []).map(tr => tr.language?.flag || tr.languageCode.toUpperCase());
                    const hasGreek = !!(category.translations || []).find(t => t.languageCode === 'el');
                    const allFlags = hasGreek ? flags : ['🇬🇷', ...flags];
                    return (
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{displayName}</h4>
                        {allFlags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {(category.translations || []).map(tr => (
                              <span key={tr.languageCode} className="text-xs text-muted-foreground" title={tr.name || ''}>
                                {tr.language?.flag || tr.languageCode.toUpperCase()}
                              </span>
                            ))}
                            {!hasGreek && (
                              <span className="text-xs text-muted-foreground" title={category.name}>🇬🇷</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {category._count && category._count.products > 0 && (
                      <div className="flex items-center space-x-1">
                        <Package className="h-3 w-3" />
                        <span>{category._count.products} products</span>
                      </div>
                    )}
                    {category.softoneCode && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {category.softoneCode}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(category)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Render children */}
        {renderHierarchy(category.id, level + 1)}
      </div>
    ));
  }, [getCategoriesByParent, handleView, handleEdit, handleDelete]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Category Management</h3>
          <p className="text-sm text-muted-foreground">
            Organize products with hierarchical categories
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant={viewMode === "hierarchy" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("hierarchy")}
            >
              <FolderTree className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "flat" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("flat")}
            >
              <Package className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>
                  Provide the base (Greek) name, translations, and optional parent.
                </DialogDescription>
              </DialogHeader>
              <CreateCategoryDialog
                categories={categories}
                onCategoryCreate={onCategoryCreate}
                onClose={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading categories...</div>
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No categories created</h3>
            <p className="text-muted-foreground mb-4">
              Create categories to organize your products
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "hierarchy" ? (
        <div className="space-y-4">
          {renderHierarchy()}
        </div>
      ) : (
        <SortableList
          items={categories}
          onReorder={handleReorder}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          renderItem={renderCategoryItem}
          title="All Categories"
        />
      )}

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information and settings
            </DialogDescription>
          </DialogHeader>
          
          {editingCategory && (
            <EditCategoryDialog
              category={editingCategory}
              categories={categories}
              onCategoryUpdate={onCategoryUpdate}
              onClose={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Category Dialog Component
function CreateCategoryDialog({
  categories,
  onCategoryCreate,
  onClose,
}: {
  categories: Category[];
  onCategoryCreate: (category: Omit<Category, "id" | "order">) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [parentId, setParentId] = useState("");
  const [softoneCode, setSoftoneCode] = useState("");
  const [translations, setTranslations] = useState<CategoryTranslation[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    try {
      await onCategoryCreate({
        name: name.trim(),
        parentId: parentId || undefined,
        softoneCode: softoneCode || undefined,
        translations,
      } as any);
      
      toast.success("Category created successfully");
      onClose();
      
      // Reset form
      setName("");
      setParentId("");
      setNameEn("");
      setSoftoneCode("");
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="categoryName">Category Name *</Label>
        <Input
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Electronics"
        />
      </div>
      <CategoryTranslationForm
        translations={translations}
        onTranslationsChange={setTranslations}
        sourceLanguage="el"
        sourceName={name}
      />
      
      <div>
        <Label htmlFor="parentCategory">Parent Category</Label>
        <Select value={parentId || "__none__"} onValueChange={(v) => setParentId(v === "__none__" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select parent category (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No parent (root category)</SelectItem>
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
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? "Creating..." : "Create Category"}
        </Button>
      </div>
    </div>
  );
}

// Edit Category Dialog Component
function EditCategoryDialog({
  category,
  categories,
  onCategoryUpdate,
  onClose,
}: {
  category: Category;
  categories: Category[];
  onCategoryUpdate: (categories: Category[]) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [parentId, setParentId] = useState(category.parentId || "");
  const [softoneCode, setSoftoneCode] = useState(category.softoneCode || "");
  const [loading, setLoading] = useState(false);
  const [nameEn, setNameEn] = useState(
    category.translations?.find(t => t.languageCode === 'en')?.name || ""
  );
  const [translations, setTranslations] = useState<CategoryTranslation[]>(
    (category.translations || []).map(t => ({ languageCode: t.languageCode, name: t.name, description: t.description }))
  );
  const [aiLoading, setAiLoading] = useState(false);

  const runAITranslate = async (lang: string) => {
    if (!name.trim()) {
      toast.error("Greek name is required for AI translation");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/master-data/categories/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceLanguage: 'el', targetLanguage: lang, sourceName: name.trim() }),
      });
      if (!res.ok) throw new Error('AI translate failed');
      const data = await res.json();
      if (lang === 'en') setNameEn(data.name || '');
      toast.success(`Translated to ${lang.toUpperCase()}`);
    } catch (_e) {
      toast.error('AI translation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    try {
      // Persist edit via API directly, including translations
      const payload: any = {
        id: category.id,
        name: name.trim(),
        parentId: parentId || undefined,
        softoneCode: softoneCode || undefined,
      };
      if (translations.length > 0) (payload as any).translations = translations;

      const res = await fetch('/api/master-data/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');

      // Trigger a reload through parent
      await onCategoryUpdate(categories);
      toast.success("Category updated successfully");
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  // Filter out current category and its children from parent options
  const availableParents = categories.filter(cat => 
    cat.id !== category.id && 
    !isDescendant(cat, category, categories)
  );

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="editCategoryName">Category Name *</Label>
        <Input
          id="editCategoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Electronics"
        />
      </div>
      <CategoryTranslationForm
        translations={translations}
        onTranslationsChange={setTranslations}
        sourceLanguage="el"
        sourceName={name}
      />
      
      <div>
        <Label htmlFor="editParentCategory">Parent Category</Label>
        <Select value={parentId || "__none__"} onValueChange={(v) => setParentId(v === "__none__" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select parent category (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No parent (root category)</SelectItem>
            {availableParents.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="editSoftoneCode">SoftOne Code</Label>
        <Input
          id="editSoftoneCode"
          value={softoneCode}
          onChange={(e) => setSoftoneCode(e.target.value)}
          placeholder="Optional SoftOne code"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? "Updating..." : "Update Category"}
        </Button>
      </div>
    </div>
  );
}

// Helper function to check if a category is a descendant of another
function isDescendant(candidate: Category, ancestor: Category, allCategories: Category[]): boolean {
  if (candidate.parentId === ancestor.id) return true;
  if (!candidate.parentId) return false;
  
  const parent = allCategories.find(cat => cat.id === candidate.parentId);
  return parent ? isDescendant(parent, ancestor, allCategories) : false;
}
