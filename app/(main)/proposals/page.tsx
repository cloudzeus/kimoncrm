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
      siteSurvey: {
        select: {
          id: true,
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

  // Fetch complete proposal documents for each site survey
  const siteSurveyIds = proposals
    .map(p => p.siteSurvey?.id)
    .filter((id): id is string => id !== null && id !== undefined);

  const completeProposalFiles = await prisma.file.findMany({
    where: {
      type: 'SITESURVEY',
      entityId: {
        in: siteSurveyIds,
      },
      name: {
        contains: 'Complete-Proposal',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Create a map of siteSurveyId -> latest complete proposal file
  const completeProposalMap = new Map<string, typeof completeProposalFiles[0]>();
  completeProposalFiles.forEach(file => {
    if (!completeProposalMap.has(file.entityId)) {
      completeProposalMap.set(file.entityId, file);
    }
  });

  // Serialize dates for client component
  const serializedProposals = proposals.map(proposal => {
    const completeProposalFile = proposal.siteSurvey?.id 
      ? completeProposalMap.get(proposal.siteSurvey.id)
      : null;

    return {
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
      completeProposalUrl: completeProposalFile?.url || null,
      completeProposalName: completeProposalFile?.name || null,
    };
  });

  return <ProposalsPageClient proposals={serializedProposals} />;
}

