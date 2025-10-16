import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import ProductDetailClient from '@/components/products/product-detail-client';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getProductDetails(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manufacturer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            softoneCode: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            shortcut: true,
          },
        },
        translations: {
          select: {
            id: true,
            languageCode: true,
            name: true,
            shortDescription: true,
            description: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            isDefault: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        specifications: {
          select: {
            id: true,
            specKey: true,
            order: true,
            translations: {
              select: {
                id: true,
                languageCode: true,
                specName: true,
                specValue: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        stock: {
          select: {
            id: true,
            warehouse: true,
            qty: true,
            updatedAt: true,
          },
        },
      },
    });

    return product;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const { id } = await params;
  const product = await getProductDetails(id);

  if (!product) {
    notFound();
  }

  // Convert Decimal objects to numbers for client component serialization
  const serializedProduct = {
    ...product,
    width: product.width ? Number(product.width) : null,
    length: product.length ? Number(product.length) : null,
    height: product.height ? Number(product.height) : null,
    weight: product.weight ? Number(product.weight) : null,
    stock: product.stock.map(s => ({
      id: s.id,
      warehouse: s.warehouse,
      qty: s.qty,
      updatedAt: s.updatedAt.toISOString(),
    })),
  };

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailClient product={serializedProduct} />
    </Suspense>
  );
}
