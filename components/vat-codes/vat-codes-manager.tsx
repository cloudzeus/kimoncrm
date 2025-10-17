// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface VatRate {
  id: string;
  name: string;
  rate: number;
  softoneCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SoftOneVatData {
  VAT: string;
  NAME: string;
  PERCNT: string;
}

interface SoftOneResponse {
  success: boolean;
  errorcode: number;
  error: string;
  "Num.VATs"?: number;
  result: SoftOneVatData[];
}

export function VatCodesManager() {
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load VAT rates
  useEffect(() => {
    loadVatRates();
  }, []);

  const loadVatRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vat-codes');
      if (response.ok) {
        const data = await response.json();
        setVatRates(data.vatRates);
      } else {
        toast.error("Failed to load VAT rates");
      }
    } catch (error) {
      console.error("Load VAT rates error:", error);
      toast.error("Error loading VAT rates");
    } finally {
      setLoading(false);
    }
  };

  const syncWithSoftOne = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/vat-codes/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully connected to SoftOne - ${result.total} VAT codes available`);
        setLastSync(new Date());
        loadVatRates(); // Reload the data from SoftOne
      } else {
        toast.error(result.message || "Failed to connect to SoftOne");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Error connecting to SoftOne");
    } finally {
      setSyncing(false);
    }
  };

  // Define columns for VAT rates table
  const vatRateColumns: Column<VatRate>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      key: "rate",
      label: "Rate",
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="font-mono">
          {value}%
        </Badge>
      ),
    },
    {
      key: "softoneCode",
      label: "SoftOne Code",
      sortable: true,
      render: (value) => (
        <Badge variant="secondary" className="font-mono">
          {value}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with sync button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              VAT RATES MANAGEMENT
            </CardTitle>
            <CardDescription>
              View VAT rates directly from SoftOne ERP system
            </CardDescription>
          </div>
            
            <div className="flex items-center gap-2">
              {lastSync && (
                <span className="text-sm text-muted-foreground">
                  Last connection: {lastSync.toLocaleString()}
                </span>
              )}
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
                {syncing ? "Connecting..." : "Test SoftOne Connection"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* VAT Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>VAT RATES</CardTitle>
          <CardDescription>
            Current VAT rates in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={vatRates}
            columns={vatRateColumns}
            searchable={true}
            sortable={true}
            resizable={true}
            loading={loading}
            emptyMessage="No VAT rates found"
          />
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            SYNC INFORMATION
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Total VAT Rates: {vatRates.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Live from SoftOne ERP</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Mapping:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code>NAME</code> → <code>name</code> (VAT rate name)</li>
                <li><code>PERCNT</code> → <code>rate</code> (VAT percentage)</li>
                <li><code>VAT</code> → <code>softoneCode</code> (SoftOne identifier)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
