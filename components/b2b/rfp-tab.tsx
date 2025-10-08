'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileSearch, Eye, Calendar, Clock, Plus, CheckCircle } from 'lucide-react';
import { NewRFPDialog } from './new-rfp-dialog';

interface RFP {
  id: string;
  rfpNo: string | null;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity: {
    id: string;
    name: string;
    stage: string;
  } | null;
}

interface RFPTabProps {
  companyId: string;
  contactId: string;
}

export function RFPTab({ companyId, contactId }: RFPTabProps) {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRFP, setSelectedRFP] = useState<RFP | null>(null);
  const [isNewRFPOpen, setIsNewRFPOpen] = useState(false);

  useEffect(() => {
    async function fetchRFPs() {
      try {
        const response = await fetch(`/api/b2b/rfps?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setRfps(data);
        }
      } catch (error) {
        console.error('Failed to fetch RFPs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRFPs();
  }, [companyId]);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'default';
      case 'under_review':
      case 'under review':
        return 'secondary';
      case 'draft':
        return 'outline';
      case 'closed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStageVariant = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'proposal':
        return 'default';
      case 'negotiation':
        return 'secondary';
      case 'qualification':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      accessorKey: 'rfpNo',
      header: 'RFP #',
      cell: ({ row }: { row: { original: RFP } }) => (
        <span className="font-mono text-sm">
          {row.original.rfpNo || `#${row.original.id.slice(-8)}`}
        </span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }: { row: { original: RFP } }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: RFP } }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'opportunity',
      header: 'Opportunity',
      cell: ({ row }: { row: { original: RFP } }) => (
        <div>
          {row.original.opportunity ? (
            <div>
              <p className="font-medium text-sm">{row.original.opportunity.name}</p>
              <Badge variant={getStageVariant(row.original.opportunity.stage)} className="text-xs">
                {row.original.opportunity.stage}
              </Badge>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No opportunity</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }: { row: { original: RFP } }) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : 'TBD'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: RFP } }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: RFP } }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRFP(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.status === 'Draft' && (
            <Button variant="ghost" size="sm">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSearch className="h-5 w-5" />
              <span>REQUEST FOR PROPOSALS</span>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              NEW RFP
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSearch className="h-5 w-5" />
              <span>REQUEST FOR PROPOSALS</span>
            </div>
            <Button size="sm" onClick={() => setIsNewRFPOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              NEW RFP
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rfps.length > 0 ? (
            <DataTable columns={columns} data={rfps} />
          ) : (
            <div className="text-center py-8">
              <FileSearch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No RFPs found</h3>
              <p className="text-muted-foreground mb-4">You haven't submitted any requests for proposals yet.</p>
              <Button onClick={() => setIsNewRFPOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First RFP
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RFP Details Dialog */}
      {selectedRFP && (
        <Dialog open={!!selectedRFP} onOpenChange={() => setSelectedRFP(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileSearch className="h-5 w-5" />
                <span>RFP {selectedRFP.rfpNo || `#${selectedRFP.id.slice(-8)}`}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* RFP Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Title</h4>
                  <p className="text-lg font-semibold">{selectedRFP.title}</p>
                </div>
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge variant={getStatusVariant(selectedRFP.status)}>
                    {selectedRFP.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Opportunity</h4>
                  {selectedRFP.opportunity ? (
                    <div>
                      <p className="font-medium">{selectedRFP.opportunity.name}</p>
                      <Badge variant={getStageVariant(selectedRFP.opportunity.stage)}>
                        {selectedRFP.opportunity.stage}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No opportunity linked</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">Due Date</h4>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedRFP.dueDate ? new Date(selectedRFP.dueDate).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Created</h4>
                  <p>{new Date(selectedRFP.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium">Last Updated</h4>
                  <p>{new Date(selectedRFP.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* RFP Description */}
              {selectedRFP.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedRFP.description}</p>
                  </div>
                </div>
              )}

              {/* Sales Pipeline Progress */}
              <div>
                <h4 className="font-medium mb-4">Sales Pipeline Progress</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="text-sm">Lead</span>
                  </div>
                  <div className="w-8 h-0.5 bg-primary" />
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="text-sm">Opportunity</span>
                  </div>
                  <div className="w-8 h-0.5 bg-primary" />
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="text-sm font-medium">RFP</span>
                  </div>
                  <div className="w-8 h-0.5 bg-muted" />
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-muted rounded-full" />
                    <span className="text-sm text-muted-foreground">Quote</span>
                  </div>
                  <div className="w-8 h-0.5 bg-muted" />
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-muted rounded-full" />
                    <span className="text-sm text-muted-foreground">Order</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <FileSearch className="h-4 w-4 mr-2" />
                  Download RFP
                </Button>
                {selectedRFP.status === 'Draft' && (
                  <Button>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit RFP
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New RFP Dialog */}
      <NewRFPDialog 
        isOpen={isNewRFPOpen}
        onClose={() => setIsNewRFPOpen(false)}
        companyId={companyId}
        contactId={contactId}
        onRFPCreated={(newRFP) => {
          setRfps(prev => [newRFP, ...prev]);
          setIsNewRFPOpen(false);
        }}
      />
    </div>
  );
}
