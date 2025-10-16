import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import ServiceDetailClient from '@/components/services/service-detail-client';
import { Skeleton } from '@/components/ui/skeleton';

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getServiceDetails(id: string) {
  try {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        translations: {
          select: {
            id: true,
            languageCode: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return service;
  } catch (error) {
    console.error('Error fetching service details:', error);
    return null;
  }
}

function ServiceDetailSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const { id } = await params;
  const service = await getServiceDetails(id);

  if (!service) {
    notFound();
  }

  // Serialize dates for client component
  const serializedService = {
    ...service,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };

  return (
    <Suspense fallback={<ServiceDetailSkeleton />}>
      <ServiceDetailClient service={serializedService} />
    </Suspense>
  );
}

