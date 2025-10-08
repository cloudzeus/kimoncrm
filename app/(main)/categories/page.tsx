"use client";

import CategoriesPageClient from "@/components/categories/categories-page-client";

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CATEGORIES</h1>
        <p className="text-muted-foreground">Organize products with hierarchical categories, ordering, and ERP sync.</p>
      </div>

      <CategoriesPageClient initialCategories={[]} />
    </div>
  );
}


