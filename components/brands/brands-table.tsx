"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandTranslationForm } from "./brand-translation-form";
import { BrandFileUpload } from "./brand-file-upload";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

interface BrandTranslation {
  id: string;
  languageCode: string;
  name?: string;
  description?: string;
  language: {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
  };
}

interface Brand {
  id: string;
  erpId?: string;
  code?: string;
  name: string;
  description?: string;
  website?: boolean;
  logo?: {
    id: string;
    name: string;
    url?: string;
  };
  image?: {
    id: string;
    name: string;
    url?: string;
  };
  softoneCode?: string;
  translations?: BrandTranslation[];
  _count: {
    products: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface BrandTranslationData {
  languageCode: string;
  name?: string;
  description?: string;
}

interface BrandFormData {
  name: string;
  description: string;
  website?: boolean;
  logoId?: string;
  imageId?: string;
  translations: BrandTranslationData[];
}

export function BrandsTable() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({
    name: "",
    description: "",
    website: false,
    logoId: undefined,
    imageId: undefined,
    translations: [],
  });

  const loadBrands = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const response = await fetch(`/api/master-data/brands?${params}`, { cache: 'no-store' });
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
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = "/api/master-data/brands";
      const method = editingBrand ? "PUT" : "POST";
      const body = editingBrand 
        ? { id: editingBrand.id, ...formData, translations: formData.translations.map(t => ({ languageCode: t.languageCode, description: t.description })) }
        : { ...formData, translations: formData.translations.map(t => ({ languageCode: t.languageCode, description: t.description })) };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingBrand ? "Brand updated successfully" : "Brand created successfully");
        setIsDialogOpen(false);
        setEditingBrand(null);
        setFormData({
          name: "",
          description: "",
          website: false,
          logoId: undefined,
          imageId: undefined,
          translations: [],
        });
        loadBrands();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save brand");
      }
    } catch (error) {
      toast.error("Error saving brand");
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      website: brand.website ?? false,
      logoId: brand.logo?.id || undefined,
      imageId: brand.image?.id || undefined,
      translations: brand.translations?.map(t => ({
        languageCode: t.languageCode,
        name: t.name || "",
        description: t.description || "",
      })) || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const response = await fetch(`/api/master-data/brands?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Brand deleted successfully");
        loadBrands();
      } else {
        toast.error("Failed to delete brand");
      }
    } catch (error) {
      toast.error("Error deleting brand");
    }
  };

  const handleNewBrand = () => {
    setEditingBrand(null);
    setFormData({
      name: "",
      description: "",
      website: false,
      logoId: undefined,
      imageId: undefined,
      translations: [],
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>BRANDS</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch('/api/master-data/brands/sync', { method: 'POST' });
                  if (res.ok) {
                    const data = await res.json();
                    toast.success(`ERP sync completed: ${data.inserted} inserted, ${data.skipped} skipped`);
                    loadBrands();
                  } else {
                    const err = await res.json();
                    toast.error(err.message || 'ERP sync failed');
                  }
                } catch (_e) {
                  toast.error('ERP sync failed');
                }
              }}
            >
              SYNC FROM ERP
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>BRANDS</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch('/api/master-data/brands/sync', { method: 'POST' });
                  if (res.ok) {
                    const data = await res.json();
                    toast.success(`ERP sync completed: ${data.inserted} inserted, ${data.skipped} skipped`);
                    loadBrands();
                  } else {
                    const err = await res.json();
                    toast.error(err.message || 'ERP sync failed');
                  }
                } catch (_e) {
                  toast.error('ERP sync failed');
                }
              }}
            >
              SYNC FROM ERP
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewBrand}>
                  <Plus className="h-4 w-4 mr-2" />
                  NEW BRAND
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBrand ? "EDIT BRAND" : "NEW BRAND"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">NAME *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">DESCRIPTION</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="website"
                      checked={!!formData.website}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, website: !!checked })
                      }
                    />
                    <Label htmlFor="website">HAS WEBSITE</Label>
                  </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BrandFileUpload
                      type="logo"
                      currentFile={editingBrand?.logo || null}
                      onFileChange={(fileId) => setFormData({ ...formData, logoId: fileId || undefined })}
                    />
                    
                    <BrandFileUpload
                      type="image"
                      currentFile={editingBrand?.image || null}
                      onFileChange={(fileId) => setFormData({ ...formData, imageId: fileId || undefined })}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <BrandTranslationForm
                      translations={formData.translations}
                      onTranslationsChange={(translations) =>
                        setFormData({ ...formData, translations })
                      }
                      defaultLanguage="en"
                      sourceName={formData.name}
                      sourceDescription={formData.description}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      CANCEL
                    </Button>
                    <Button type="submit">
                      {editingBrand ? "UPDATE" : "CREATE"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME</TableHead>
                  <TableHead>CODE</TableHead>
                  <TableHead>ERP ID</TableHead>
                  <TableHead>WEBSITE</TableHead>
                  <TableHead>DESCRIPTION</TableHead>
                  <TableHead>LOGO</TableHead>
                  <TableHead>IMAGE</TableHead>
                  <TableHead>TRANSLATIONS</TableHead>
                  <TableHead>PRODUCTS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No brands found
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>
                        {brand.code ? (
                          <Badge variant="secondary">{brand.code}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {brand.erpId ? (
                          <Badge variant="outline">{brand.erpId}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    <TableCell>
                      {brand.website ? (
                        <Badge variant="secondary">YES</Badge>
                      ) : (
                        <span className="text-muted-foreground">NO</span>
                      )}
                    </TableCell>
                      <TableCell className="max-w-[240px]">
                        {brand.description ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate cursor-help">{brand.description}</div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[420px] whitespace-pre-wrap">
                                {brand.description}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {brand.logo?.url ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 cursor-help">
                                  <AvatarImage src={brand.logo.url} alt={brand.name} />
                                  <AvatarFallback>{brand.name?.slice(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent className="p-0">
                                <div className="h-[300px] w-[300px] flex items-center justify-center bg-background">
                                  {/* Centered image preview inside fixed frame */}
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={brand.logo.url}
                                    alt={brand.name}
                                    className="max-h-[280px] max-w-[280px] object-contain"
                                  />
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {brand.image ? (
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm">{brand.image.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {brand.translations && brand.translations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {brand.translations.map((translation) => (
                              <Badge key={translation.languageCode} variant="secondary" className="text-xs">
                                {translation.language.flag} {translation.language.code.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{brand._count.products}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(brand)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(brand.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
