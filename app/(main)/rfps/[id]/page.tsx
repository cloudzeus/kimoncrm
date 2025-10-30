import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { RFPDetailView } from "@/components/rfps/rfp-detail-view";

async function getRFP(id: string) {
  const rfp = await prisma.rFP.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone01: true,
        },
      },
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          mobilePhone: true,
        },
      },
      lead: {
        select: {
          id: true,
          leadNumber: true,
          title: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      quotes: {
        select: {
          id: true,
          quoteNo: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return rfp;
}

async function getRFPFiles(leadId: string) {
  const files = await prisma.file.findMany({
    where: {
      entityId: leadId,
      type: 'LEAD',
      name: {
        contains: 'RFP Pricing',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return files;
}

export default async function RFPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const rfp = await getRFP(id);

  if (!rfp) {
    notFound();
  }

  const files = rfp.leadId ? await getRFPFiles(rfp.leadId) : [];

  return (
    <div className="container mx-auto py-6">
      <RFPDetailView rfp={rfp} files={files} />
    </div>
  );
}

