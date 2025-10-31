'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  FileText, 
  Send, 
  Loader2, 
  Building2, 
  Wrench, 
  Package, 
  Briefcase, 
  ListChecks,
  Download,
  Sparkles,
  ArrowLeft,
  PackageCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { ProposalProductsEnhancementModal } from '@/components/proposals/proposal-products-enhancement-modal';

interface ProposalEditorProps {
  proposal: any; // Proposal with all relations
}

export function ProposalEditor({ proposal: initialProposal }: ProposalEditorProps) {
  const router = useRouter();
  const [proposal, setProposal] = useState(initialProposal);
  const [saving, setSaving] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [sendingToERP, setSendingToERP] = useState(false);
  const [regeneratingAI, setRegeneratingAI] = useState(false);
  const [enhancementModalOpen, setEnhancementModalOpen] = useState(false);

  // Editable content states
  const [infrastructureDesc, setInfrastructureDesc] = useState(proposal.infrastructureDesc || '');
  const [technicalDesc, setTechnicalDesc] = useState(proposal.technicalDesc || '');
  const [productsDesc, setProductsDesc] = useState(proposal.productsDesc || '');
  const [servicesDesc, setServicesDesc] = useState(proposal.servicesDesc || '');
  const [scopeOfWork, setScopeOfWork] = useState(proposal.scopeOfWork || '');

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          infrastructureDesc,
          technicalDesc,
          productsDesc,
          servicesDesc,
          scopeOfWork,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save proposal');
      }

      setProposal(data.proposal);
      
      toast.success('ΕΠΙΤΥΧΙΑ', {
        description: 'Οι αλλαγές αποθηκεύτηκαν. Πατήστε "ΔΗΜΙΟΥΡΓΙΑ WORD" για να ενημερώσετε το έγγραφο.',
      });
    } catch (error: any) {
      console.error('Error saving proposal:', error);
      toast.error('ΣΦΑΛΜΑ', {
        description: error.message || 'Αποτυχία αποθήκευσης',
      });
    } finally {
      setSaving(false);
    }
  };

  // Generate Word document
  const handleGenerateDocument = async () => {
    setGeneratingDoc(true);
    
    try {
      // First, save any unsaved changes to ensure Word document has latest content
      const saveResponse = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          infrastructureDesc,
          technicalDesc,
          productsDesc,
          servicesDesc,
          scopeOfWork,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save changes before generating document');
      }

      // Now generate the Word document with the saved content
      const response = await fetch(`/api/proposals/${proposal.id}/generate-document`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate document');
      }

      setProposal(data.proposal);
      
      toast.success('ΕΠΙΤΥΧΙΑ', {
        description: 'Το έγγραφο Word δημιουργήθηκε με τις τελευταίες αλλαγές σας και κατεβαίνει τώρα!',
      });

      // Download the file
      if (data.file?.url) {
        const downloadUrl = `/api/files/download?url=${encodeURIComponent(data.file.url)}&filename=${encodeURIComponent(data.file.filename)}`;
        window.open(downloadUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error generating document:', error);
      toast.error('ΣΦΑΛΜΑ', {
        description: error.message || 'Αποτυχία δημιουργίας εγγράφου',
      });
    } finally {
      setGeneratingDoc(false);
    }
  };

  // Send to ERP
  const handleSendToERP = async () => {
    setSendingToERP(true);
    
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/send-to-erp`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send to ERP');
      }

      setProposal(data.proposal);
      
      toast.success('ΕΠΙΤΥΧΙΑ', {
        description: `Η πρόταση καταχωρήθηκε στο ERP με αριθμό: ${data.erp.quoteNumber}`,
      });
    } catch (error: any) {
      console.error('Error sending to ERP:', error);
      toast.error('ΣΦΑΛΜΑ', {
        description: error.message || 'Αποτυχία αποστολής στο ERP',
      });
    } finally {
      setSendingToERP(false);
    }
  };

  // Regenerate AI content
  const handleRegenerateAI = async () => {
    setRegeneratingAI(true);
    
    try {
      toast.info('ΑΝΑΔΗΜΙΟΥΡΓΙΑ', {
        description: 'Το AI δημιουργεί νέο περιεχόμενο...',
      });

      const response = await fetch(`/api/rfps/${proposal.rfpId}/generate-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectTitle: proposal.projectTitle,
          projectDescription: proposal.projectDescription,
          projectScope: proposal.projectScope,
          projectDuration: proposal.projectDuration,
          projectStartDate: proposal.projectStartDate,
          projectEndDate: proposal.projectEndDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate AI content');
      }

      // Update the proposal with new AI content
      const updateResponse = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          infrastructureDesc: data.proposal.infrastructureDesc,
          technicalDesc: data.proposal.technicalDesc,
          productsDesc: data.proposal.productsDesc,
          servicesDesc: data.proposal.servicesDesc,
          scopeOfWork: data.proposal.scopeOfWork,
        }),
      });

      const updateData = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(updateData.error || 'Failed to update proposal');
      }

      // Update local state with new content
      setInfrastructureDesc(data.proposal.infrastructureDesc || '');
      setTechnicalDesc(data.proposal.technicalDesc || '');
      setProductsDesc(data.proposal.productsDesc || '');
      setServicesDesc(data.proposal.servicesDesc || '');
      setScopeOfWork(data.proposal.scopeOfWork || '');
      setProposal(updateData.proposal);
      
      toast.success('ΕΠΙΤΥΧΙΑ', {
        description: 'Το περιεχόμενο αναδημιουργήθηκε με AI',
      });
    } catch (error: any) {
      console.error('Error regenerating AI content:', error);
      toast.error('ΣΦΑΛΜΑ', {
        description: error.message || 'Αποτυχία αναδημιουργίας περιεχομένου',
      });
    } finally {
      setRegeneratingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/proposals')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        ΠΙΣΩ ΣΤΗ ΛΙΣΤΑ
      </Button>

      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{proposal.projectTitle}</CardTitle>
              <CardDescription className="mt-2">
                {proposal.customer?.name || 'No Customer'} | {proposal.lead?.leadNumber || 'No Lead Number'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={proposal.status === 'DRAFT' ? 'secondary' : 'default'}>
                {proposal.status}
              </Badge>
              <Badge variant="outline">
                {proposal.stage}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Action Buttons Group */}
            <div className="flex items-center rounded-lg overflow-hidden shadow-sm">
              <Button
                className="rounded-none bg-blue-600 hover:bg-blue-700 text-white border-r border-blue-500"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    ΑΠΟΘΗΚΕΥΣΗ
                  </>
                )}
              </Button>

              <Button
                className="rounded-none bg-purple-600 hover:bg-purple-700 text-white border-r border-purple-500"
                size="sm"
                onClick={handleRegenerateAI}
                disabled={regeneratingAI}
              >
                {regeneratingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI
                  </>
                )}
              </Button>

              <Button
                className="rounded-none bg-orange-600 hover:bg-orange-700 text-white border-r border-orange-500"
                size="sm"
                onClick={handleGenerateDocument}
                disabled={generatingDoc}
              >
                {generatingDoc ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-1" />
                    WORD
                  </>
                )}
              </Button>

              <Button
                className="rounded-none bg-pink-600 hover:bg-pink-700 text-white border-r border-pink-500"
                size="sm"
                onClick={() => setEnhancementModalOpen(true)}
              >
                <PackageCheck className="h-4 w-4 mr-1" />
                CHECK PRODUCTS
              </Button>

              {proposal.wordDocumentUrl && (
                <Button
                  className="rounded-none bg-cyan-600 hover:bg-cyan-700 text-white border-r border-cyan-500"
                  size="sm"
                  onClick={() => {
                    const downloadUrl = `/api/files/download?url=${encodeURIComponent(proposal.wordDocumentUrl)}&filename=${encodeURIComponent(`Proposal_${proposal.projectTitle}.docx`)}`;
                    window.open(downloadUrl, '_blank');
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  DOWNLOAD
                </Button>
              )}

              <Button
                className="rounded-none bg-green-600 hover:bg-green-700 text-white"
                size="sm"
                onClick={handleSendToERP}
                disabled={sendingToERP || !!proposal.erpQuoteNumber}
              >
                {sendingToERP ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : proposal.erpQuoteNumber ? (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    {proposal.erpQuoteNumber}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    ERP
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor Tabs */}
      <Tabs id="proposal-content-tabs" defaultValue="infrastructure" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="infrastructure" className="gap-2 data-[state=active]:text-blue-600">
            <Building2 className="h-4 w-4 text-blue-600" />
            ΥΠΟΔΟΜΗ
          </TabsTrigger>
          <TabsTrigger value="technical" className="gap-2 data-[state=active]:text-orange-600">
            <Wrench className="h-4 w-4 text-orange-600" />
            ΤΕΧΝΙΚΑ
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 data-[state=active]:text-green-600">
            <Package className="h-4 w-4 text-green-600" />
            ΠΡΟΪΟΝΤΑ
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2 data-[state=active]:text-purple-600">
            <Briefcase className="h-4 w-4 text-purple-600" />
            ΥΠΗΡΕΣΙΕΣ
          </TabsTrigger>
          <TabsTrigger value="scope" className="gap-2 data-[state=active]:text-pink-600">
            <ListChecks className="h-4 w-4 text-pink-600" />
            ΕΜΒΕΛΕΙΑ
          </TabsTrigger>
        </TabsList>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ΠΕΡΙΓΡΑΦΗ ΥΠΟΔΟΜΗΣ</CardTitle>
              <CardDescription>
                AI-generated περιγραφή της υποδομής και τοπολογίας
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="infrastructureDesc" className="text-xs font-semibold">
                  ΚΕΙΜΕΝΟ
                </Label>
                <Textarea
                  id="infrastructureDesc"
                  value={infrastructureDesc}
                  onChange={(e) => setInfrastructureDesc(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Το AI θα δημιουργήσει την περιγραφή της υποδομής..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ</CardTitle>
              <CardDescription>
                AI-generated τεχνική περιγραφή της λύσης
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="technicalDesc" className="text-xs font-semibold">
                  ΚΕΙΜΕΝΟ
                </Label>
                <Textarea
                  id="technicalDesc"
                  value={technicalDesc}
                  onChange={(e) => setTechnicalDesc(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Το AI θα δημιουργήσει την τεχνική περιγραφή..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ΠΕΡΙΓΡΑΦΗ ΠΡΟΪΟΝΤΩΝ</CardTitle>
              <CardDescription>
                AI-generated περιγραφή των προϊόντων ανά κατηγορία και brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="productsDesc" className="text-xs font-semibold">
                  ΚΕΙΜΕΝΟ
                </Label>
                <Textarea
                  id="productsDesc"
                  value={productsDesc}
                  onChange={(e) => setProductsDesc(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Το AI θα δημιουργήσει την περιγραφή των προϊόντων..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ΠΕΡΙΓΡΑΦΗ ΥΠΗΡΕΣΙΩΝ</CardTitle>
              <CardDescription>
                AI-generated περιγραφή των υπηρεσιών
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="servicesDesc" className="text-xs font-semibold">
                  ΚΕΙΜΕΝΟ
                </Label>
                <Textarea
                  id="servicesDesc"
                  value={servicesDesc}
                  onChange={(e) => setServicesDesc(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Το AI θα δημιουργήσει την περιγραφή των υπηρεσιών..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scope Tab */}
        <TabsContent value="scope">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ΕΜΒΕΛΕΙΑ ΕΡΓΑΣΙΩΝ</CardTitle>
              <CardDescription>
                AI-generated εμβέλεια των εργασιών (scope of work)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="scopeOfWork" className="text-xs font-semibold">
                  ΚΕΙΜΕΝΟ
                </Label>
                <Textarea
                  id="scopeOfWork"
                  value={scopeOfWork}
                  onChange={(e) => setScopeOfWork(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Το AI θα δημιουργήσει την εμβέλεια των εργασιών..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Enhancement Modal */}
      <ProposalProductsEnhancementModal
        open={enhancementModalOpen}
        onOpenChange={setEnhancementModalOpen}
        proposalId={proposal.id}
      />
    </div>
  );
}

