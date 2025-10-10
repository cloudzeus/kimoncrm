"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Download, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  Upload, 
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Receipt
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// PaymentType type matching our API response
interface PaymentType {
  id: string;
  payment: string;
  code: string;
  name: string;
  sodtype: string;
  createdAt?: string;
  updatedAt?: string;
}

export function PaymentTypesManager() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentType>>({
    payment: '',
    code: '',
    name: '',
    sodtype: '',
  });
  const { toast } = useToast();

  // Load payment types from database
  const loadPaymentTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment-types');
      const data = await response.json();

      if (response.ok) {
        setPaymentTypes(data.paymentTypes || []);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load payment types",
          variant: "destructive",
        });
        setPaymentTypes([]);
      }
    } catch (error) {
      console.error("Load payment types error:", error);
      toast({
        title: "Error",
        description: "Error loading payment types",
        variant: "destructive",
      });
      setPaymentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const syncWithSoftOne = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/payment-types/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully synced: ${result.created} created, ${result.updated} updated, ${result.filtered} filtered out`,
        });
        setLastSync(new Date());
        loadPaymentTypes(); // Reload the data
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to sync with SoftOne",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Error",
        description: "Error syncing with SoftOne",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = () => {
    setEditingPaymentType(null);
    setFormData({
      payment: '',
      code: '',
      name: '',
      sodtype: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (paymentType: PaymentType) => {
    setEditingPaymentType(paymentType);
    setFormData({
      payment: paymentType.payment,
      code: paymentType.code,
      name: paymentType.name,
      sodtype: paymentType.sodtype,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (paymentType: PaymentType) => {
    if (!confirm(`Are you sure you want to delete "${paymentType.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/payment-types?id=${paymentType.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment type deleted successfully",
        });
        loadPaymentTypes();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete payment type",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Error deleting payment type",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPaymentType ? '/api/payment-types' : '/api/payment-types';
      const method = editingPaymentType ? 'PUT' : 'POST';
      const body = editingPaymentType 
        ? { id: editingPaymentType.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: editingPaymentType ? "Payment type updated successfully" : "Payment type created successfully",
        });
        setIsDialogOpen(false);
        loadPaymentTypes();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save payment type",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Error saving payment type",
        variant: "destructive",
      });
    }
  };

  // Define columns for payment types table
  const paymentTypeColumns: Column<PaymentType>[] = [
    {
      key: "payment",
      label: "Payment Code",
      render: (value) => (
        <div className="font-mono text-[11px] font-medium">{value}</div>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (value) => (
        <div className="font-mono text-[11px]">{value}</div>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (value) => (
        <div className="font-medium text-[11px]">{value}</div>
      ),
    },
    {
      key: "sodtype",
      label: "Type",
      render: (value) => (
        <Badge 
          variant={value === "12" ? "default" : "secondary"}
          className={`text-[11px] ${
            value === "12" 
              ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          {value === "12" ? "Supplier" : value === "13" ? "Customer" : value}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(record)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadPaymentTypes();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <div className="text-muted-foreground">Loading payment types...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with sync button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                PAYMENT TYPES MANAGEMENT
              </CardTitle>
              <CardDescription>
                Manage payment types synchronized with SoftOne ERP
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {lastSync && (
                <span className="text-sm text-muted-foreground">
                  Last sync: {lastSync.toLocaleString()}
                </span>
              )}
              <Button 
                onClick={handleCreate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New
              </Button>
              <Button 
                onClick={syncWithSoftOne} 
                disabled={syncing}
                className="flex items-center gap-2"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {syncing ? "Syncing..." : "Sync with SoftOne"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            PAYMENT TYPES
          </CardTitle>
          <CardDescription>
            Payment methods - {paymentTypes.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={paymentTypes}
            columns={paymentTypeColumns}
            searchKey="name"
            searchPlaceholder="Search payment types..."
          />
        </CardContent>
      </Card>

      {/* Sync Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            SYNCHRONIZATION INFORMATION
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Total Payment Types: {paymentTypes.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Synced with SoftOne</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Auto-sync Available</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Field Mapping:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code>PAYMENT</code> → <code>payment</code> (Payment code)</li>
                <li><code>CODE</code> → <code>code</code> (Internal code)</li>
                <li><code>NAME</code> → <code>name</code> (Payment type name)</li>
                <li><code>SODTYPE</code> → <code>sodtype</code> (Type: 12=Supplier, 13=Customer)</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    SoftOne ERP Integration
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Only payment types with SODTYPE 12 (Supplier) and 13 (Customer) are synced. 
                    Other payment types are filtered out during synchronization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPaymentType ? 'Edit Payment Type' : 'Add New Payment Type'}
            </DialogTitle>
            <DialogDescription>
              {editingPaymentType ? 'Update the payment type information.' : 'Enter payment type information.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="payment">Payment Code *</Label>
                <Input
                  id="payment"
                  value={formData.payment}
                  onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                  required
                  placeholder="e.g., 1000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="e.g., 1000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Ταίς Μετρητοίς"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sodtype">Type *</Label>
                <Select
                  value={formData.sodtype}
                  onValueChange={(value) => setFormData({ ...formData, sodtype: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">Supplier (12)</SelectItem>
                    <SelectItem value="13">Customer (13)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPaymentType ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



