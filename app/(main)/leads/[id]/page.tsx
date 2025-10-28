import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { LeadDetailView } from "@/components/leads/lead-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch lead data
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      customer: true,
      contact: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      department: true,
      siteSurvey: {
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
        },
      },
      assignedCompany: true,
      quotes: {
        include: {
          contact: true,
        },
      },
      rfps: {
        include: {
          contact: true,
        },
      },
      projects: {
        select: {
          id: true,
          name: true,
          status: true,
          startAt: true,
          endAt: true,
        },
      },
      opportunities: true,
      statusChanges: {
        include: {
          changedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      emails: {
        include: {
          messages: {
            orderBy: { receivedAt: "desc" },
            take: 5,
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 10,
      },
    },
  });

  if (!lead) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Not Found</CardTitle>
            <CardDescription>The lead you're looking for doesn't exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <LeadDetailView lead={lead} currentUserId={session.user.id} />;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LeadDetailSkeleton />}>
      <LeadDetailPage params={params} />
    </Suspense>
  );
}

function LeadDetailSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

