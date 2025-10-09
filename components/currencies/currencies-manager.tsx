"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Download, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  Upload, 
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Banknote
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

// Currency type matching our API response
interface Currency {
  id: string;
  socurrency: string;
  shortcut: string;
  name: string;
  intercode: string;
  symbol?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function CurrenciesManager() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [formData, setFormData] = useState<Partial<Currency>>({
    socurrency: '',
    shortcut: '',
    name: '',
    intercode: '',
    symbol: '',
  });
  const { toast } = useToast();

  // Load currencies from database
  const loadCurrencies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/currencies');
      const data = await response.json();

      if (response.ok) {
        setCurrencies(data.currencies || []);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load currencies",
          variant: "destructive",
        });
        setCurrencies([]);
      }
    } catch (error) {
      console.error("Load currencies error:", error);
      toast({
        title: "Error",
        description: "Error loading currencies",
        variant: "destructive",
      });
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  const syncWithSoftOne = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/currencies/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully synced: ${result.created} created, ${result.updated} updated`,
        });
        setLastSync(new Date());
        loadCurrencies(); // Reload the data
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
    setEditingCurrency(null);
    setFormData({
      socurrency: '',
      shortcut: '',
      name: '',
      intercode: '',
      symbol: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      socurrency: currency.socurrency,
      shortcut: currency.shortcut,
      name: currency.name,
      intercode: currency.intercode,
      symbol: currency.symbol || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (currency: Currency) => {
    if (!confirm(`Are you sure you want to delete "${currency.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/currencies?id=${currency.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Currency deleted successfully",
        });
        loadCurrencies();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete currency",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Error deleting currency",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCurrency ? '/api/currencies' : '/api/currencies';
      const method = editingCurrency ? 'PUT' : 'POST';
      const body = editingCurrency 
        ? { id: editingCurrency.id, ...formData }
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
          description: editingCurrency ? "Currency updated successfully" : "Currency created successfully",
        });
        setIsDialogOpen(false);
        loadCurrencies();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save currency",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Error saving currency",
        variant: "destructive",
      });
    }
  };

  // Define columns for currencies table
  const currencyColumns: Column<Currency>[] = [
    {
      key: "socurrency",
      label: "SoftOne Code",
      render: (value) => (
        <div className="font-mono text-[11px] font-medium">{value}</div>
      ),
    },
    {
      key: "shortcut",
      label: "Shortcut",
      render: (value) => (
        <Badge variant="secondary" className="text-[11px]">
          {value}
        </Badge>
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
      key: "intercode",
      label: "ISO Code",
      render: (value) => (
        <Badge variant="outline" className="text-[11px] font-mono">
          {value}
        </Badge>
      ),
    },
    {
      key: "symbol",
      label: "Symbol",
      render: (value) => (
        <div className="text-[11px] text-muted-foreground">{value || '-'}</div>
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
    loadCurrencies();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <div className="text-muted-foreground">Loading currencies...</div>
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
                <DollarSign className="h-5 w-5" />
                CURRENCIES MANAGEMENT
              </CardTitle>
              <CardDescription>
                Manage currencies synchronized with SoftOne ERP
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

      {/* Currencies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            CURRENCIES
          </CardTitle>
          <CardDescription>
            Currency data - {currencies.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={currencies}
            columns={currencyColumns}
            searchKey="name"
            searchPlaceholder="Search currencies..."
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
                <span className="text-sm">Total Currencies: {currencies.length}</span>
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
                <li><code>SOCURRENCY</code> → <code>socurrency</code> (SoftOne currency code)</li>
                <li><code>SHORTCUT</code> → <code>shortcut</code> (Currency shortcut)</li>
                <li><code>NAME</code> → <code>name</code> (Currency name)</li>
                <li><code>INTERCODE</code> → <code>intercode</code> (ISO currency code)</li>
                <li><code>SYMBOL</code> → <code>symbol</code> (Currency symbol/icon URL)</li>
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
                    Currency data is synchronized with SoftOne ERP system. 
                    Use the sync button to update records from the ERP system.
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
              {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
            </DialogTitle>
            <DialogDescription>
              {editingCurrency ? 'Update the currency information.' : 'Enter currency information.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="socurrency">SoftOne Currency Code *</Label>
                <Input
                  id="socurrency"
                  value={formData.socurrency}
                  onChange={(e) => setFormData({ ...formData, socurrency: e.target.value })}
                  required
                  placeholder="e.g., 100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shortcut">Shortcut *</Label>
                <Input
                  id="shortcut"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  required
                  placeholder="e.g., EURO"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., EURO"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="intercode">ISO Code *</Label>
                <Input
                  id="intercode"
                  value={formData.intercode}
                  onChange={(e) => setFormData({ ...formData, intercode: e.target.value })}
                  required
                  placeholder="e.g., EUR"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="symbol">Symbol (Icon URL)</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="e.g., https://example.com/eur-icon.png"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCurrency ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
