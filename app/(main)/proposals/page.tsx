import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { ProposalsPageClient } from '@/components/proposals/proposals-page-client';

export default async function ProposalsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Fetch all proposals
  const proposals = await prisma.proposal.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      lead: {
        select: {
          id: true,
          leadNumber: true,
        },
      },
      rfp: {
        select: {
          id: true,
          rfpNo: true,
        },
      },
      generatedByUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Serialize dates for client component
  const serializedProposals = proposals.map(proposal => ({
    ...proposal,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    projectStartDate: proposal.projectStartDate?.toISOString() || null,
    projectEndDate: proposal.projectEndDate?.toISOString() || null,
    submittedDate: proposal.submittedDate?.toISOString() || null,
    approvedDate: proposal.approvedDate?.toISOString() || null,
    lead: proposal.lead ? {
      id: proposal.lead.id,
      leadNumber: proposal.lead.leadNumber || '',
    } : null,
    rfp: proposal.rfp ? {
      id: proposal.rfp.id,
      rfpNo: proposal.rfp.rfpNo,
    } : null,
  }));

  return <ProposalsPageClient proposals={serializedProposals} />;
}

