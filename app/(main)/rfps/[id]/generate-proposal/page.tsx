import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { ProposalForm } from '@/components/proposals/proposal-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Package, Briefcase } from 'lucide-react';

interface GenerateProposalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GenerateProposalPage({ params }: GenerateProposalPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Await params in Next.js 15+
  const { id } = await params;

  // Fetch RFP with all relations
  const rfp = await prisma.rFP.findUnique({
    where: { id },
    include: {
      customer: true,
      contact: true,
      lead: {
        include: {
          siteSurvey: true,
        },
      },
    },
  });

  if (!rfp) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">RFP ΔΕΝ ΒΡΕΘΗΚΕ</h1>
          <p className="text-muted-foreground">
            Το RFP που ζητήσατε δεν υπάρχει ή δεν έχετε πρόσβαση.
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

  // Extract equipment from RFP requirements
  const requirements = (rfp.requirements as any) || {};
  const equipment = requirements.equipment || [];
  
  const productsCount = equipment.filter((item: any) => 
    item.type === 'product' || item.itemType === 'product' || item.productId
  ).length;
  
  const servicesCount = equipment.filter((item: any) => 
    item.type === 'service' || item.itemType === 'service' || item.serviceId
  ).length;

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/leads" className="text-muted-foreground hover:text-foreground">
          LEADS
        </Link>
        <span className="text-muted-foreground">/</span>
        {rfp.leadId && (
          <>
            <Link
              href={`/leads/${rfp.leadId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {rfp.lead?.leadNumber || rfp.leadId}
            </Link>
            <span className="text-muted-foreground">/</span>
          </>
        )}
        <Link
          href={`/rfps/${rfp.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          RFP
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold">ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΤΑΣΗΣ</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          ΔΗΜΙΟΥΡΓΙΑ ΤΕΧΝΙΚΗΣ ΠΡΟΤΑΣΗΣ
        </h1>
        <p className="text-muted-foreground">
          Δημιουργήστε μια πλήρη τεχνική πρόταση με AI-generated περιεχόμενο από το RFP
        </p>
      </div>

      {/* RFP Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ΠΕΡΙΛΗΨΗ RFP</CardTitle>
          <CardDescription>
            Αυτά τα δεδομένα θα χρησιμοποιηθούν για τη δημιουργία της πρότασης
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">RFP TITLE</p>
                <p className="text-lg font-semibold">{rfp.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">ΠΡΟΪΟΝΤΑ</p>
                <p className="text-lg font-semibold">{productsCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950">
              <Briefcase className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">ΥΠΗΡΕΣΙΕΣ</p>
                <p className="text-lg font-semibold">{servicesCount}</p>
              </div>
            </div>
          </div>

          {rfp.description && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">ΠΕΡΙΓΡΑΦΗ RFP:</p>
              <p className="text-sm">{rfp.description}</p>
            </div>
          )}

          {rfp.lead?.siteSurvey && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-green-600 mb-2">
                ✓ ΣΥΝΔΕΔΕΜΕΝΟ SITE SURVEY
              </p>
              <p className="text-sm text-muted-foreground">
                Τα δεδομένα υποδομής από το site survey θα συμπεριληφθούν στην πρόταση
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposal Form */}
      <ProposalForm
        rfpId={rfp.id}
        customerName={rfp.customer.name}
        leadNumber={rfp.lead?.leadNumber}
      />

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                ΤΙ ΘΑ ΔΗΜΙΟΥΡΓΗΘΕΙ;
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>AI-Generated Technical Description</strong>: Πλήρης τεχνική περιγραφή στα ελληνικά</li>
                <li>• <strong>Infrastructure Analysis</strong>: Περιγραφή της υποδομής από το site survey</li>
                <li>• <strong>Products & Services</strong>: Κατηγοριοποιημένη περιγραφή προϊόντων και υπηρεσιών</li>
                <li>• <strong>Scope of Work</strong>: Αναλυτική εμβέλεια εργασιών</li>
                <li>• <strong>Pricing Table</strong>: Πλήρης τιμολόγηση με formulas</li>
                <li>• <strong>Word Document</strong>: Επαγγελματικό έγγραφο έτοιμο για αποστολή</li>
                <li>• <strong>ERP Integration</strong>: Αυτόματη καταχώρηση στο SoftOne ERP</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

