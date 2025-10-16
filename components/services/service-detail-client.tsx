'use client';

/**
 * Service Detail Client Component
 * Displays detailed information about a service
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Languages } from 'lucide-react';

interface ServiceTranslation {
  id: string;
  languageCode: string;
  name: string | null;
  description: string | null;
}

interface Service {
  id: string;
  mtrl: string | null;
  code: string | null;
  mtrcategory: string | null;
  name: string;
  brandId: string | null;
  isActive: boolean;
  brand: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  translations: ServiceTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface ServiceDetailClientProps {
  service: Service;
}

export default function ServiceDetailClient({ service }: ServiceDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'details';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/services')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase">{service.name}</h1>
            <p className="text-muted-foreground">
              {service.code && `CODE: ${service.code}`}
              {service.mtrl && ` | MTRL: ${service.mtrl}`}
            </p>
          </div>
        </div>
        
        <Badge variant={service.isActive ? 'default' : 'secondary'}>
          {service.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      </div>

      {/* Content */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="details">DETAILS</TabsTrigger>
          <TabsTrigger value="translations">TRANSLATIONS</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="uppercase">SERVICE INFORMATION</CardTitle>
              <CardDescription>Basic service details from ERP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">MTRL</p>
                  <p className="text-lg font-mono">{service.mtrl || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">CODE</p>
                  <p className="text-lg font-mono">{service.code || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">BRAND</p>
                  <p className="text-lg">{service.brand?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">CATEGORY</p>
                  <p className="text-lg">{service.mtrcategory || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">STATUS</p>
                  <Badge variant={service.isActive ? 'default' : 'secondary'}>
                    {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">NAME</p>
                <p className="text-lg">{service.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">CREATED</p>
                  <p className="text-sm">{new Date(service.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">LAST UPDATED</p>
                  <p className="text-sm">{new Date(service.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="uppercase flex items-center gap-2">
                <Languages className="h-5 w-5" />
                TRANSLATIONS
              </CardTitle>
              <CardDescription>Multilingual names and descriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {service.translations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>NO TRANSLATIONS AVAILABLE</p>
                  <p className="text-sm">Add translations to support multiple languages</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {service.translations.map((translation) => (
                    <Card key={translation.id}>
                      <CardHeader>
                        <CardTitle className="text-lg uppercase">
                          {translation.languageCode.toUpperCase()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground uppercase">NAME</p>
                          <p className="text-base">{translation.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground uppercase">DESCRIPTION</p>
                          <p className="text-base whitespace-pre-wrap">
                            {translation.description || '-'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

