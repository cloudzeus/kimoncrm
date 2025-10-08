'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ticket, Eye, MessageSquare, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react';

interface TicketMessage {
  id: string;
  fromRole: string;
  body: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  body: string | null;
  status: string;
  priority: string;
  slaDueAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: {
    id: string;
    name: string | null;
  } | null;
  supportContract: {
    id: string;
    name: string;
    sla: {
      name: string;
      responseTimeHours: number;
    };
  } | null;
  messages: TicketMessage[];
}

interface TicketsTabProps {
  companyId: string;
}

export function TicketsTab({ companyId }: TicketsTabProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const response = await fetch(`/api/b2b/tickets?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setTickets(data);
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [companyId]);

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Ticket className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'new':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSLAStatus = (slaDueAt: string | null, createdAt: string) => {
    if (!slaDueAt) return null;
    
    const now = new Date();
    const dueDate = new Date(slaDueAt);
    const createdDate = new Date(createdAt);
    const hoursElapsed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    if (dueDate < now) {
      return { status: 'breach', color: 'text-red-600' };
    } else if (hoursElapsed > (parseFloat(slaDueAt) * 0.8)) {
      return { status: 'warning', color: 'text-yellow-600' };
    } else {
      return { status: 'ok', color: 'text-green-600' };
    }
  };

  const columns = [
    {
      accessorKey: 'id',
      header: 'Ticket #',
      cell: ({ row }: { row: { original: SupportTicket } }) => (
        <div className="flex items-center space-x-2">
          {getPriorityIcon(row.original.priority)}
          <span className="font-mono text-sm">
            #{row.original.id.slice(-8)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }: { row: { original: SupportTicket } }) => (
        <div>
          <p className="font-medium">{row.original.subject}</p>
          {row.original.supportContract && (
            <p className="text-xs text-muted-foreground">
              SLA: {row.original.supportContract.sla.name}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: SupportTicket } }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }: { row: { original: SupportTicket } }) => (
        <Badge variant={getPriorityVariant(row.original.priority)}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      cell: ({ row }: { row: { original: SupportTicket } }) => (
        <span className="text-sm">
          {row.original.assignee?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      accessorKey: 'slaDueAt',
      header: 'SLA Status',
      cell: ({ row }: { row: { original: SupportTicket } }) => {
        const slaStatus = getSLAStatus(row.original.slaDueAt, row.original.createdAt);
        if (!slaStatus) return <span className="text-sm text-muted-foreground">No SLA</span>;
        
        return (
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${slaStatus.color.replace('text-', 'bg-')}`} />
            <span className={`text-xs ${slaStatus.color}`}>
              {slaStatus.status === 'breach' ? 'Breach' : 
               slaStatus.status === 'warning' ? 'Warning' : 'OK'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: SupportTicket } }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: SupportTicket } }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTicket(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ticket className="h-5 w-5" />
            <span>SUPPORT TICKETS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
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
          <CardTitle className="flex items-center space-x-2">
            <Ticket className="h-5 w-5" />
            <span>SUPPORT TICKETS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <DataTable columns={columns} data={tickets} />
          ) : (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No support tickets found</h3>
              <p className="text-muted-foreground">You don't have any support tickets yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Ticket className="h-5 w-5" />
                <span>Ticket #{selectedTicket.id.slice(-8)}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Ticket Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Subject</h4>
                  <p className="text-lg font-semibold">{selectedTicket.subject}</p>
                </div>
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge variant={getStatusVariant(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Priority</h4>
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon(selectedTicket.priority)}
                    <Badge variant={getPriorityVariant(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Assignee</h4>
                  <p>{selectedTicket.assignee?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Support Contract</h4>
                  <p>{selectedTicket.supportContract?.name || 'No contract'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Created</h4>
                  <p>{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Ticket Description */}
              {selectedTicket.body && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedTicket.body}</p>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div>
                <h4 className="font-medium mb-4">Conversation</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.fromRole === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.fromRole === 'customer' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <p className={`text-xs mt-2 ${
                          message.fromRole === 'customer' 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {message.fromRole === 'customer' ? 'You' : 'Support'} • {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Reply
                </Button>
                {selectedTicket.status === 'New' && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
