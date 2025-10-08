'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Eye, Download, Package, Truck, CheckCircle, Clock, Euro, FolderPlus } from 'lucide-react';
import { ConvertOrderToProjectDialog } from './convert-order-to-project-dialog';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  qty: number;
  price: number;
}

interface Order {
  id: string;
  orderNo: string | null;
  status: string;
  channel: string;
  total: number | null;
  currency: string | null;
  afmVerified: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events: Array<{
    id: string;
    status: string;
    note: string | null;
    at: string;
  }>;
}

interface OrdersTabProps {
  companyId: string;
}

export function OrdersTab({ companyId }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [orderToConvert, setOrderToConvert] = useState<Order | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch(`/api/b2b/orders?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [companyId]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'processing':
      case 'shipped':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      accessorKey: 'orderNo',
      header: 'Order #',
      cell: ({ row }: { row: { original: Order } }) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.original.status)}
          <span className="font-mono text-sm">
            {row.original.orderNo || `#${row.original.id.slice(-8)}`}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Order } }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'channel',
      header: 'Channel',
      cell: ({ row }: { row: { original: Order } }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.channel}
        </Badge>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: { row: { original: Order } }) => (
        <span className="font-medium">
          {row.original.total ? `${row.original.currency || 'EUR'} ${row.original.total.toLocaleString()}` : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'afmVerified',
      header: 'AFM',
      cell: ({ row }: { row: { original: Order } }) => (
        <Badge variant={row.original.afmVerified ? 'default' : 'destructive'}>
          {row.original.afmVerified ? 'Verified' : 'Not Verified'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: Order } }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Order } }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedOrder(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.status === 'Completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOrderToConvert(row.original);
                setIsConvertDialogOpen(true);
              }}
              title="Convert to Project"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          )}
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
            <ShoppingCart className="h-5 w-5" />
            <span>ORDERS</span>
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
            <ShoppingCart className="h-5 w-5" />
            <span>ORDERS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <DataTable columns={columns} data={orders} />
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground">You don't have any orders yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Order {selectedOrder.orderNo || `#${selectedOrder.id.slice(-8)}`}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Status</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(selectedOrder.status)}
                    <Badge variant={getStatusVariant(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Total Amount</h4>
                  <p className="text-lg font-bold">
                    {selectedOrder.total ? `${selectedOrder.currency || 'EUR'} ${selectedOrder.total.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Channel</h4>
                  <Badge variant="outline">{selectedOrder.channel}</Badge>
                </div>
                <div>
                  <h4 className="font-medium">AFM Verification</h4>
                  <Badge variant={selectedOrder.afmVerified ? 'default' : 'destructive'}>
                    {selectedOrder.afmVerified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Created</h4>
                  <p>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium">Last Updated</h4>
                  <p>{new Date(selectedOrder.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-4">Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-muted font-medium text-sm">
                    <div>Product</div>
                    <div className="text-center">SKU</div>
                    <div className="text-center">Quantity</div>
                    <div className="text-right">Price</div>
                  </div>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-4 gap-4 p-4 border-t">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                      </div>
                      <div className="text-center font-mono text-sm">{item.product.sku}</div>
                      <div className="text-center">{item.qty}</div>
                      <div className="text-right font-medium">
                        {(item.qty * item.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Events/Tracking */}
              {selectedOrder.events.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">Order Timeline</h4>
                  <div className="space-y-3">
                    {selectedOrder.events.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="p-2 bg-muted rounded-full">
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{event.status}</p>
                            <span className="text-sm text-muted-foreground">
                              {new Date(event.at).toLocaleDateString()}
                            </span>
                          </div>
                          {event.note && (
                            <p className="text-sm text-muted-foreground mt-1">{event.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                {selectedOrder.status === 'Pending' && (
                  <Button variant="destructive">
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Convert Order to Project Dialog */}
      {orderToConvert && (
        <ConvertOrderToProjectDialog
          isOpen={isConvertDialogOpen}
          onClose={() => {
            setIsConvertDialogOpen(false);
            setOrderToConvert(null);
          }}
          order={orderToConvert}
          onProjectCreated={(project) => {
            // Optionally update the orders list or show success message
            console.log('Project created:', project);
          }}
        />
      )}
    </div>
  );
}
