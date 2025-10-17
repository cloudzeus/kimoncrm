// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Download, Eye, Calendar, Euro } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Quote {
  id: string;
  quoteNo: string | null;
  status: string;
  total: number | null;
  currency: string;
  validUntil: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    qty: number;
    price: number;
    lineTotal: number;
  }>;
}

interface QuotesTabProps {
  companyId: string;
}

export function QuotesTab({ companyId }: QuotesTabProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const response = await fetch(`/api/b2b/quotes?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setQuotes(data);
        }
      } catch (error) {
        console.error('Failed to fetch quotes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, [companyId]);

  const columns = [
    {
      accessorKey: 'quoteNo',
      header: 'Quote #',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="font-mono text-sm">
          {row.original.quoteNo || `#${row.original.id.slice(-8)}`}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Quote } }) => {
        const status = row.original.status;
        const variant = status === 'Approved' ? 'default' : 
                      status === 'Pending' ? 'secondary' : 
                      status === 'Expired' ? 'destructive' : 'outline';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="font-medium">
          {row.original.total ? `${row.original.currency} ${row.original.total.toLocaleString()}` : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'validUntil',
      header: 'Valid Until',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.validUntil ? new Date(row.original.validUntil).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Quote } }) => (
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuote(row.original)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </Dialog>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
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
            <FileText className="h-5 w-5" />
            <span>QUOTES</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
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
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>QUOTES</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotes.length > 0 ? (
            <DataTable columns={columns} data={quotes} />
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No quotes found</h3>
              <p className="text-muted-foreground">You don't have any quotes yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Details Dialog */}
      {selectedQuote && (
        <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Quote {selectedQuote.quoteNo || `#${selectedQuote.id.slice(-8)}`}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Quote Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge variant={
                    selectedQuote.status === 'Approved' ? 'default' : 
                    selectedQuote.status === 'Pending' ? 'secondary' : 
                    selectedQuote.status === 'Expired' ? 'destructive' : 'outline'
                  }>
                    {selectedQuote.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Total Amount</h4>
                  <p className="text-lg font-bold">
                    {selectedQuote.total ? `${selectedQuote.currency} ${selectedQuote.total.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Valid Until</h4>
                  <p>{selectedQuote.validUntil ? new Date(selectedQuote.validUntil).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Created</h4>
                  <p>{new Date(selectedQuote.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Quote Items */}
              <div>
                <h4 className="font-medium mb-4">Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-muted font-medium text-sm">
                    <div>Item</div>
                    <div className="text-center">Quantity</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Total</div>
                  </div>
                  {selectedQuote.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-4 gap-4 p-4 border-t">
                      <div>
                        <p className="font-medium">{item.name}</p>
                      </div>
                      <div className="text-center">{item.qty}</div>
                      <div className="text-right">{item.price.toLocaleString()}</div>
                      <div className="text-right font-medium">
                        {item.lineTotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Convert to Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
