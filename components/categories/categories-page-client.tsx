"use client";

import { useEffect, useState, useCallback } from "react";
import { CategoryManager } from "@/components/categories/category-manager";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  parentId?: string;
  softoneCode?: string;
  order: number;
  _count?: { products: number };
  translations?: Array<{ languageCode: string; name?: string; description?: string; language?: { code: string; flag: string; nativeName: string } }>;
}

export default function CategoriesPageClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master-data/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const onCategoryCreate = useCallback(async (cat: Omit<Category, "id" | "order">) => {
    const res = await fetch('/api/master-data/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    if (!res.ok) throw new Error('Create failed');
    await reload();
  }, [reload]);

  const onCategoryUpdate = useCallback(async (cats: Category[]) => {
    // Optimistic update for instant UI feedback
    setCategories(cats);
    try {
      const items = cats.map((c, idx) => ({ id: c.id, order: c.order ?? idx, parentId: c.parentId ?? null }));
      const res = await fetch('/api/master-data/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Reorder failed');
    } catch (e) {
      toast.error('Failed to persist order; reloading');
      await reload();
    }
  }, [reload]);

  const onCategoryDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/master-data/categories?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    await reload();
  }, [reload]);

  const syncFromERP = useCallback(async () => {
    try {
      const res = await fetch('/api/master-data/categories/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`ERP sync: ${data.inserted} created, ${data.updated} updated, ${data.skipped} skipped`);
        await reload();
      } else {
        const err = await res.json();
        toast.error(err.message || 'ERP sync failed');
      }
    } catch {
      toast.error('ERP sync failed');
    }
  }, [reload]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={syncFromERP}>SYNC FROM ERP</Button>
      </div>
      <CategoryManager
        categories={categories}
        onCategoryCreate={onCategoryCreate}
        onCategoryUpdate={onCategoryUpdate}
        onCategoryDelete={onCategoryDelete}
        loading={loading}
      />
    </div>
  );
}
