// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  Upload, 
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Building2
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

// IrsData type matching our API response
interface IrsData {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  district?: string | null;
  zip?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function IrsDataManager() {
  const [irsData, setIrsData] = useState<IrsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<IrsData | null>(null);
  const [formData, setFormData] = useState<Partial<IrsData>>({
    code: '',
    name: '',
    address: '',
    district: '',
    zip: '',
  });
  const { toast } = useToast();

  // Load IRS data from database
  const loadIrsData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/irs-data');
      const data = await response.json();

      if (response.ok) {
        setIrsData(data.irsData || []);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load IRS data",
          variant: "destructive",
        });
        setIrsData([]);
      }
    } catch (error) {
      console.error("Load IRS data error:", error);
      toast({
        title: "Error",
        description: "Error loading IRS data",
        variant: "destructive",
      });
      setIrsData([]);
    } finally {
      setLoading(false);
    }
  };

  const syncWithSoftOne = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/irs-data/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully synced: ${result.created} created, ${result.updated} updated`,
        });
        setLastSync(new Date());
        loadIrsData(); // Reload the data
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
    setEditingData(null);
    setFormData({
      code: '',
      name: '',
      address: '',
      district: '',
      zip: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (data: IrsData) => {
    setEditingData(data);
    setFormData({
      code: data.code,
      name: data.name,
      address: data.address || '',
      district: data.district || '',
      zip: data.zip || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (data: IrsData) => {
    if (!confirm(`Are you sure you want to delete "${data.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/irs-data?id=${data.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "IRS data deleted successfully",
        });
        loadIrsData();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete IRS data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Error deleting IRS data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingData ? '/api/irs-data' : '/api/irs-data';
      const method = editingData ? 'PUT' : 'POST';
      const body = editingData 
        ? { id: editingData.id, ...formData }
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
          description: editingData ? "IRS data updated successfully" : "IRS data created successfully",
        });
        setIsDialogOpen(false);
        loadIrsData();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save IRS data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Error saving IRS data",
        variant: "destructive",
      });
    }
  };

  // Define columns for IRS data table
  const irsDataColumns: Column<IrsData>[] = [
    {
      key: "code",
      label: "Code",
      render: (value) => (
        <div className="font-mono text-[11px] font-medium">{value}</div>
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
      key: "address",
      label: "Address",
      render: (value) => (
        <div className="text-[11px] text-muted-foreground">{value || '-'}</div>
      ),
    },
    {
      key: "district",
      label: "District",
      render: (value) => (
        <Badge variant="outline" className="text-[11px]">
          {value || '-'}
        </Badge>
      ),
    },
    {
      key: "zip",
      label: "ZIP Code",
      render: (value) => (
        <div className="font-mono text-[11px]">{value || '-'}</div>
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
    loadIrsData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <div className="text-muted-foreground">Loading IRS data...</div>
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
                <Building2 className="h-5 w-5" />
                IRS DATA MANAGEMENT
              </CardTitle>
              <CardDescription>
                Manage tax office data synchronized with SoftOne ERP
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

      {/* IRS Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            TAX OFFICES (ΔΟΥ)
          </CardTitle>
          <CardDescription>
            Greek tax office data - {irsData.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={irsData}
            columns={irsDataColumns}
            searchKey="name"
            searchPlaceholder="Search tax offices..."
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
                <span className="text-sm">Total Records: {irsData.length}</span>
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
                <li><code>CODE</code> → <code>code</code> (Tax office code)</li>
                <li><code>NAME</code> → <code>name</code> (Tax office name)</li>
                <li><code>ADDRESS</code> → <code>address</code> (Address)</li>
                <li><code>DISTRICT</code> → <code>district</code> (District)</li>
                <li><code>ZIP</code> → <code>zip</code> (ZIP code)</li>
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
                    Tax office data is synchronized with SoftOne ERP system. 
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
              {editingData ? 'Edit IRS Data' : 'Add New IRS Data'}
            </DialogTitle>
            <DialogDescription>
              {editingData ? 'Update the tax office information.' : 'Enter tax office information.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="e.g., 1101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Α΄ ΑΘΗΝΩΝ"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., ΑΝΑΞΑΓΟΡΑ 6"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g., ΑΘΗΝΩΝ"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  placeholder="e.g., 10010"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingData ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
