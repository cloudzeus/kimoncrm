"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SendProposalDialog } from './send-proposal-dialog';
import { EditPricingDialog } from './edit-pricing-dialog';
import { UpdateStatusDialog } from './update-status-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Send,
  DollarSign,
  Download,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Proposal {
  id: string;
  proposalNo: string | null;
  projectTitle: string | null;
  projectDescription: string | null;
  status: string;
  stage: string;
  erpQuoteNumber: string | null;
  wordDocumentUrl: string | null;
  completeProposalUrl: string | null;
  completeProposalName: string | null;
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
    requirements?: string | null;
  } | null;
  generatedByUser: {
    id: string;
    name: string | null;
  } | null;
}

interface ProposalsTableProps {
  proposals: Proposal[];
  onRefresh?: () => void;
}

export function ProposalsTable({ proposals, onRefresh }: ProposalsTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedRows, setSelectedRows] = useState<Proposal[]>([]);
  const [deleting, setDeleting] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'ΠΡΟΣΧΕΔΙΟ' },
      IN_REVIEW: { variant: 'default', label: 'ΥΠΟ ΕΞΕΤΑΣΗ' },
      APPROVED: { variant: 'default', label: 'ΕΓΚΕΚΡΙΜΕΝΟ' },
      SENT: { variant: 'default', label: 'ΣΤΑΛΘΗΚΕ' },
      ACCEPTED: { variant: 'default', label: 'ΑΠΟΔΕΚΤΟ' },
      REVISED: { variant: 'default', label: 'ΑΝΑΘΕΩΡΗΘΗΚΕ' },
      REJECTED: { variant: 'destructive', label: 'ΑΠΟΡΡΙΦΘΗΚΕ' },
      WON: { variant: 'default', label: 'ΚΕΡΔΗΘΗΚΕ' },
      LOST: { variant: 'destructive', label: 'ΧΑΘΗΚΕ' },
      EXPIRED: { variant: 'outline', label: 'ΕΛΗΞΕ' },
    };
    return variants[status] || { variant: 'secondary', label: status };
  };

  const getStageBadge = (stage: string) => {
    const variants: Record<string, string> = {
      CONTENT_GENERATION: 'ΔΗΜΙΟΥΡΓΙΑ ΠΕΡΙΕΧΟΜΕΝΟΥ',
      CONTENT_REVIEW: 'ΕΛΕΓΧΟΣ ΠΕΡΙΕΧΟΜΕΝΟΥ',
      DOCUMENT_GENERATION: 'ΔΗΜΙΟΥΡΓΙΑ ΕΓΓΡΑΦΟΥ',
      ERP_INTEGRATION: 'ΕΝΣΩΜΑΤΩΣΗ ERP',
      COMPLETED: 'ΟΛΟΚΛΗΡΩΘΗΚΕ',
    };
    return variants[stage] || stage;
  };

  const handleDelete = async () => {
    if (!selectedProposal) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/proposals/${selectedProposal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete proposal');
      }

      toast.success('Η πρόταση διαγράφηκε επιτυχώς');
      setDeleteDialogOpen(false);
      setSelectedProposal(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της πρότασης');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    setDeleting(true);
    try {
      // Delete all selected proposals in parallel
      const deletePromises = selectedRows.map(proposal =>
        fetch(`/api/proposals/${proposal.id}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.allSettled(deletePromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        toast.success(`${successCount} πρότασ${successCount === 1 ? 'η' : 'εις'} διαγράφηκ${successCount === 1 ? 'ε' : 'αν'} επιτυχώς`);
      }
      
      if (failCount > 0) {
        toast.error(`Αποτυχία διαγραφής ${failCount} πρότασ${failCount === 1 ? 'ης' : 'εων'}`);
      }

      setBulkDeleteDialogOpen(false);
      setSelectedRows([]);
      onRefresh?.();
    } catch (error) {
      console.error('Error bulk deleting proposals:', error);
      toast.error('Σφάλμα κατά τη μαζική διαγραφή');
    } finally {
      setDeleting(false);
    }
  };

  const handleRegenerateDocument = async (proposal: Proposal) => {
    try {
      toast.info('Αναδημιουργία εγγράφου...');
      
      const response = await fetch(`/api/proposals/${proposal.id}/generate-document`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate document');
      }

      const data = await response.json();
      toast.success('Το έγγραφο αναδημιουργήθηκε επιτυχώς');
      
      // Download the file
      if (data.fileUrl) {
        const link = document.createElement('a');
        link.href = data.fileUrl;
        link.download = data.filename || 'proposal.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      onRefresh?.();
    } catch (error) {
      console.error('Error regenerating document:', error);
      toast.error('Σφάλμα κατά την αναδημιουργία του εγγράφου');
    }
  };

  const handleDownloadDocument = async (proposal: Proposal) => {
    try {
      if (!proposal.wordDocumentUrl) {
        toast.error('Δεν υπάρχει έγγραφο για λήψη');
        return;
      }

      toast.info('Λήψη εγγράφου...');
      
      // Use proxy endpoint to download file
      const proxyUrl = `/api/files/download?url=${encodeURIComponent(proposal.wordDocumentUrl)}&filename=${encodeURIComponent(proposal.projectTitle + '.docx' || 'proposal.docx')}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${proposal.projectTitle || 'proposal'}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success('Το έγγραφο λήφθηκε επιτυχώς');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Σφάλμα κατά τη λήψη του εγγράφου');
    }
  };

  const handleDownloadCompleteProposal = async (proposal: Proposal) => {
    try {
      if (!proposal.completeProposalUrl) {
        toast.error('Δεν υπάρχει πλήρης πρόταση για λήψη');
        return;
      }

      toast.info('Λήψη πλήρους πρότασης AI...');
      
      // Use proxy endpoint to download file
      const filename = proposal.completeProposalName || 'Complete-Proposal.docx';
      const proxyUrl = `/api/files/download?url=${encodeURIComponent(proposal.completeProposalUrl)}&filename=${encodeURIComponent(filename)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error('Failed to download complete proposal');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success('Η πλήρης πρόταση AI λήφθηκε επιτυχώς');
    } catch (error) {
      console.error('Error downloading complete proposal:', error);
      toast.error('Σφάλμα κατά τη λήψη της πλήρους πρότασης');
    }
  };

  const handleSendToERP = async (proposal: Proposal) => {
    try {
      toast.info('Αποστολή στο ERP...');
      
      const response = await fetch(`/api/proposals/${proposal.id}/send-to-erp`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send to ERP');
      }

      const data = await response.json();
      toast.success(`Η πρόταση στάλθηκε στο ERP. Αριθμός προσφοράς: ${data.erpQuoteNumber}`);
      onRefresh?.();
    } catch (error) {
      console.error('Error sending to ERP:', error);
      toast.error('Σφάλμα κατά την αποστολή στο ERP');
    }
  };

  const truncateText = (text: string | null | undefined, maxLength: number = 60) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const columns: Column<Proposal>[] = [
    {
      key: 'proposalNo',
      label: 'ΑΡΙΘΜΟΣ ΠΡΟΤΑΣΗΣ',
      sortable: true,
      filterable: true,
      width: 140,
      render: (value, row) => (
        <span className="font-mono text-xs">
          {value || row.id.substring(0, 8)}
        </span>
      ),
    },
    {
      key: 'projectTitle',
      label: 'ΤΙΤΛΟΣ ΕΡΓΟΥ',
      sortable: true,
      filterable: true,
      width: 250,
      render: (value) => {
        const title = value || 'Χωρίς τίτλο';
        const truncated = truncateText(title, 60);
        const shouldTruncate = title.length > 60;
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium text-xs cursor-help">
                  {shouldTruncate ? truncated : title}
                </span>
              </TooltipTrigger>
              {shouldTruncate && (
                <TooltipContent className="max-w-md">
                  <p className="text-xs">{title}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      key: 'customer.name',
      label: 'ΠΕΛΑΤΗΣ',
      sortable: true,
      filterable: true,
      width: 200,
      render: (value, row) => {
        const customerName = row.customer.name;
        const truncated = truncateText(customerName, 60);
        const shouldTruncate = customerName.length > 60;
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs cursor-help">
                  {shouldTruncate ? truncated : customerName}
                </span>
              </TooltipTrigger>
              {shouldTruncate && (
                <TooltipContent className="max-w-md">
                  <p className="text-xs">{customerName}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      key: 'lead.leadNumber',
      label: 'LEAD',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value, row) => <span className="text-xs">{row.lead?.leadNumber || '-'}</span>,
    },
    {
      key: 'status',
      label: 'ΚΑΤΑΣΤΑΣΗ',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => {
        const statusInfo = getStatusBadge(value);
        return (
          <Badge variant={statusInfo.variant} className="text-xs">
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'stage',
      label: 'ΣΤΑΔΙΟ',
      sortable: true,
      filterable: true,
      width: 200,
      render: (value) => (
        <Badge variant="outline" className="text-xs">
          {getStageBadge(value)}
        </Badge>
      ),
    },
    {
      key: 'erpQuoteNumber',
      label: 'ΚΩΔΙΚΟΣ ERP',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value) => value ? (
        <Badge variant="default" className="bg-blue-600 font-mono text-xs">
          {value}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      ),
    },
    {
      key: 'generatedByUser.name',
      label: 'ΔΗΜΙΟΥΡΓΗΘΗΚΕ ΑΠΟ',
      sortable: true,
      filterable: true,
      width: 180,
      render: (value, row) => <span className="text-xs">{row.generatedByUser?.name || 'Άγνωστος'}</span>,
    },
    {
      key: 'createdAt',
      label: 'ΗΜΕΡΟΜΗΝΙΑ',
      sortable: true,
      filterable: true,
      width: 120,
      type: 'date',
      render: (value) => <span className="text-xs">{format(new Date(value), 'dd/MM/yyyy')}</span>,
    },
    {
      key: 'actions',
      label: 'ΕΝΕΡΓΕΙΕΣ',
      sortable: false,
      filterable: false,
      width: 100,
      render: (value, row) => (
        <DropdownMenu key={`dropdown-${row.id}`}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" id={`proposal-actions-${row.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>ΕΝΕΡΓΕΙΕΣ</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => router.push(`/proposals/${row.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Επεξεργασία
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push(`/proposals/${row.id}/view`)}>
              <Eye className="h-4 w-4 mr-2" />
              Προβολή Λεπτομερειών
            </DropdownMenuItem>
            
            {row.lead && (
              <DropdownMenuItem onClick={() => router.push(`/leads/${row.lead!.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                Προβολή Lead
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => {
                setSelectedProposal(row);
                setStatusDialogOpen(true);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Ενημέρωση Κατάστασης
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => {
                setSelectedProposal(row);
                setPricingDialogOpen(true);
              }}
              disabled={!row.rfp}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Επεξεργασία Τιμών
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => handleRegenerateDocument(row)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Αναδημιουργία Εγγράφου
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleDownloadDocument(row)}
              disabled={!row.wordDocumentUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Λήψη Βασικής Προσφοράς
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => handleDownloadCompleteProposal(row)}
              disabled={!row.completeProposalUrl}
              className="text-purple-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Λήψη Πλήρους Πρότασης AI
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => {
                setSelectedProposal(row);
                setSendDialogOpen(true);
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Αποστολή στον Πελάτη
            </DropdownMenuItem>
            
            {!row.erpQuoteNumber && row.stage === 'COMPLETED' && (
              <DropdownMenuItem onClick={() => handleSendToERP(row)}>
                <Send className="h-4 w-4 mr-2" />
                Αποστολή στο ERP
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                setSelectedProposal(row);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Διαγραφή
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4 border">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedRows.length} επιλεγμέν{selectedRows.length === 1 ? 'η' : 'ες'}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Διαγραφή ({selectedRows.length})
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRows([])}
          >
            Καθαρισμός επιλογής
          </Button>
        </div>
      )}

      <DataTable
        data={proposals}
        columns={columns}
        searchable={true}
        exportable={true}
        sortable={true}
        filterable={true}
        selectable={true}
        resizable={true}
        onRowClick={(row) => router.push(`/proposals/${row.id}/edit`)}
        onSelectionChange={(rows) => setSelectedRows(rows as Proposal[])}
        onExport={(data, columns) => {
          toast.success(`Εξαγωγή ${data.length} προτάσεων σε Excel`);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ΔΙΑΓΡΑΦΗ ΠΡΟΤΑΣΗΣ</AlertDialogTitle>
            <AlertDialogDescription>
              Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την πρόταση;
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Ακύρωση
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Διαγραφή...' : 'Διαγραφή'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ΜΑΖΙΚΗ ΔΙΑΓΡΑΦΗ ΠΡΟΤΑΣΕΩΝ</AlertDialogTitle>
            <AlertDialogDescription>
              Είστε σίγουροι ότι θέλετε να διαγράψετε {selectedRows.length} πρότασ{selectedRows.length === 1 ? 'η' : 'εις'};
              Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Ακύρωση
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Διαγραφή...' : `Διαγραφή ${selectedRows.length}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send to Customer Dialog */}
      {selectedProposal && (
        <>
          <SendProposalDialog
            open={sendDialogOpen}
            onOpenChange={setSendDialogOpen}
            proposalId={selectedProposal.id}
            proposalTitle={selectedProposal.projectTitle || 'Τεχνική Πρόταση'}
            customerName={selectedProposal.customer.name}
            onSuccess={() => {
              onRefresh?.();
            }}
          />
          
          {selectedProposal.rfp && (
            <EditPricingDialog
              open={pricingDialogOpen}
              onOpenChange={setPricingDialogOpen}
              rfpId={selectedProposal.rfp.id}
              products={selectedProposal.rfp.requirements ? JSON.parse(selectedProposal.rfp.requirements).products || [] : []}
              services={selectedProposal.rfp.requirements ? JSON.parse(selectedProposal.rfp.requirements).services || [] : []}
              onSuccess={() => {
                onRefresh?.();
                toast.success('ΤΙΜΕΣ ΕΝΗΜΕΡΩΘΗΚΑΝ', {
                  description: 'Μπορείτε τώρα να αναδημιουργήσετε την πρόταση με τις νέες τιμές.',
                });
              }}
            />
          )}
          
          <UpdateStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            proposal={{
              id: selectedProposal.id,
              status: selectedProposal.status,
              projectTitle: selectedProposal.projectTitle,
              leadId: selectedProposal.lead?.id,
            }}
            onSuccess={() => {
              onRefresh?.();
            }}
          />
        </>
      )}
    </>
  );
}

