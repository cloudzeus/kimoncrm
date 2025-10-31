"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ProposalsTable } from './proposals-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Proposal {
  id: string;
  proposalNo: string | null;
  projectTitle: string | null;
  projectDescription: string | null;
  status: string;
  stage: string;
  erpQuoteNumber: string | null;
  wordDocumentUrl: string | null;
  createdAt: Date;
  customer: {
    id: string;
    name: string;
  };
  lead: {
    id: string;
    leadNumber: string;
  } | null;
  rfp: {
    id: string;
    rfpNo: string | null;
  } | null;
  generatedByUser: {
    id: string;
    name: string | null;
  } | null;
}

interface ProposalInput extends Omit<Proposal, 'createdAt'> {
  createdAt: string;
}

interface ProposalsPageClientProps {
  proposals: ProposalInput[];
}

export function ProposalsPageClient({ proposals: initialProposals }: ProposalsPageClientProps) {
  const router = useRouter();
  const [proposals] = useState<Proposal[]>(
    initialProposals.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
    }))
  );

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold uppercase">Προτάσεις</h1>
          <p className="text-muted-foreground normal-case">
            Διαχείριση τεχνικών προτάσεων και προσφορών
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} id="proposals-refresh-btn">
          <RefreshCw className="h-4 w-4 mr-2" />
          ΑΝΑΝΕΩΣΗ
        </Button>
      </div>

      {/* Proposals Table or Empty State */}
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold uppercase">Δεν υπάρχουν προτάσεις</h3>
                <p className="text-muted-foreground normal-case">
                  Δημιουργήστε την πρώτη σας πρόταση από ένα Site Survey
                </p>
              </div>
              <Link href="/site-surveys">
                <Button>
                  ΜΕΤΑΒΑΣΗ ΣΤΑ SITE SURVEYS
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProposalsTable proposals={proposals} onRefresh={handleRefresh} />
      )}
    </div>
  );
}

