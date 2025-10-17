"use client";

import { useState } from "react";
import CategoriesPageClient from "@/components/categories/categories-page-client";
import { ServiceCategoriesManager } from "@/components/categories/service-categories-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CATEGORIES</h1>
        <p className="text-muted-foreground">Manage product and service categories with ERP sync.</p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">PRODUCT CATEGORIES</TabsTrigger>
          <TabsTrigger value="services">SERVICE CATEGORIES</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-6">
          <CategoriesPageClient initialCategories={[]} />
        </TabsContent>
        
        <TabsContent value="services" className="space-y-6">
          <ServiceCategoriesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}


