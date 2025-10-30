import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { ProposalEditor } from '@/components/proposals/proposal-editor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ProposalEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProposalEditPage({ params }: ProposalEditPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Await params as per Next.js 15+ requirements
  const { id } = await params;

  // Fetch proposal with all relations
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      rfp: {
        include: {
          customer: true,
          contact: true,
        },
      },
      customer: true,
      contact: true,
      lead: true,
      siteSurvey: true,
      generatedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!proposal) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">ΠΡΟΤΑΣΗ ΔΕΝ ΒΡΕΘΗΚΕ</h1>
          <p className="text-muted-foreground">
            Η πρόταση που ζητήσατε δεν υπάρχει ή δεν έχετε πρόσβαση.
          </p>
          <Link href="/leads">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ΠΙΣΩ ΣΤΑ LEADS
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Serialize the proposal data to convert Decimal and Date objects
  const serializedProposal = {
    ...proposal,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    projectStartDate: proposal.projectStartDate?.toISOString() || null,
    projectEndDate: proposal.projectEndDate?.toISOString() || null,
    submittedDate: proposal.submittedDate?.toISOString() || null,
    approvedDate: proposal.approvedDate?.toISOString() || null,
    rejectedDate: proposal.rejectedDate?.toISOString() || null,
    wonDate: proposal.wonDate?.toISOString() || null,
    lastSentDate: proposal.lastSentDate?.toISOString() || null,
    lead: proposal.lead ? {
      ...proposal.lead,
      estimatedValue: proposal.lead.estimatedValue ? Number(proposal.lead.estimatedValue) : null,
      createdAt: proposal.lead.createdAt.toISOString(),
      updatedAt: proposal.lead.updatedAt.toISOString(),
    } : null,
    rfp: proposal.rfp ? {
      ...proposal.rfp,
      totalAmount: proposal.rfp.totalAmount ? Number(proposal.rfp.totalAmount) : null,
      createdAt: proposal.rfp.createdAt.toISOString(),
      updatedAt: proposal.rfp.updatedAt.toISOString(),
      dueDate: proposal.rfp.dueDate?.toISOString() || null,
      receivedDate: proposal.rfp.receivedDate?.toISOString() || null,
      submittedDate: proposal.rfp.submittedDate?.toISOString() || null,
    } : null,
    customer: proposal.customer ? {
      ...proposal.customer,
      createdAt: proposal.customer.createdAt?.toISOString() || new Date().toISOString(),
      update: proposal.customer.update?.toISOString() || new Date().toISOString(),
    } : null,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/leads" className="text-muted-foreground hover:text-foreground">
          LEADS
        </Link>
        <span className="text-muted-foreground">/</span>
        {proposal.leadId && (
          <>
            <Link
              href={`/leads/${proposal.leadId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {proposal.lead?.leadNumber || proposal.leadId}
            </Link>
            <span className="text-muted-foreground">/</span>
          </>
        )}
        <span className="font-semibold">ΕΠΕΞΕΡΓΑΣΙΑ ΠΡΟΤΑΣΗΣ</span>
      </div>

      {/* Editor */}
      <ProposalEditor proposal={serializedProposal} />
    </div>
  );
}

