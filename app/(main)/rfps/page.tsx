import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Eye, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getRFPs() {
  const rfps = await prisma.rFP.findMany({
    include: {
      customer: {
        select: {
          name: true,
        },
      },
      lead: {
        select: {
          leadNumber: true,
          title: true,
        },
      },
      assignee: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return rfps;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    SUBMITTED: 'bg-purple-500',
    AWARDED: 'bg-green-500',
    LOST: 'bg-red-500',
    CANCELLED: 'bg-gray-400',
  };
  return colors[status] || 'bg-gray-500';
}

function getStageLabel(stage: string) {
  const labels: Record<string, string> = {
    RFP_RECEIVED: 'Received',
    RFP_GO_NO_GO: 'Go/No-Go',
    RFP_DRAFTING: 'Drafting',
    RFP_INTERNAL_REVIEW: 'Internal Review',
    RFP_SUBMITTED: 'Submitted',
    RFP_CLARIFICATIONS: 'Clarifications',
    RFP_AWARDED: 'Awarded',
    RFP_LOST: 'Lost',
    RFP_CANCELLED: 'Cancelled',
  };
  return labels[stage] || stage;
}

export default async function RFPsPage() {
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }

  const rfps = await getRFPs();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RFPS (REQUESTS FOR PROPOSAL)</h1>
          <p className="text-muted-foreground">
            Manage and track all RFPs with pricing documents
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All RFPs ({rfps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rfps.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RFPs Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                RFPs are generated from site surveys in step 3 (Pricing & Review)
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFP Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfps.map((rfp) => (
                    <TableRow key={rfp.id}>
                      <TableCell className="font-mono font-semibold">
                        {rfp.rfpNo || 'Draft'}
                      </TableCell>
                      <TableCell>{rfp.title}</TableCell>
                      <TableCell>{rfp.customer.name}</TableCell>
                      <TableCell>
                        {rfp.lead ? (
                          <span className="text-sm">
                            {rfp.lead.leadNumber} - {rfp.lead.title}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rfp.status)}>
                          {rfp.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getStageLabel(rfp.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rfp.assignee?.name || <span className="text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell>
                        {new Date(rfp.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/rfps/${rfp.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

