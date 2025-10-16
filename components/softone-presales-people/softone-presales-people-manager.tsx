"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Download, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  Upload, 
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// SoftOnePresalesPerson type matching our API response
interface SoftOnePresalesPerson {
  id: string;
  uftbl01: string;
  code: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export function SoftOnePresalesPeopleManager() {
  const [presalesPeople, setPresalesPeople] = useState<SoftOnePresalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  // Load presales people from database
  const loadPresalesPeople = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/softone-presales-people');
      const data = await response.json();

      if (response.ok) {
        setPresalesPeople(data.presalesPeople || []);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load presales people",
          variant: "destructive",
        });
        setPresalesPeople([]);
      }
    } catch (error) {
      console.error("Load presales people error:", error);
      toast({
        title: "Error",
        description: "Error loading presales people",
        variant: "destructive",
      });
      setPresalesPeople([]);
    } finally {
      setLoading(false);
    }
  };

  const syncWithSoftOne = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/softone-presales-people/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully synced: ${result.created} created, ${result.updated} updated`,
        });
        setLastSync(new Date());
        loadPresalesPeople(); // Reload the data
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

  // Define columns for presales people table
  const presalesPeopleColumns: Column<SoftOnePresalesPerson>[] = [
    {
      key: "uftbl01",
      label: "UFTBL01",
      render: (value) => (
        <div className="font-mono text-[11px] font-medium">{value}</div>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (value) => (
        <Badge variant="outline" className="text-[11px] font-mono">
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
  ];

  useEffect(() => {
    loadPresalesPeople();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <div className="text-muted-foreground">Loading presales people...</div>
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
                <Users className="h-5 w-5" />
                SOFTONE PRESALES PEOPLE
              </CardTitle>
              <CardDescription>
                View SoftOne presales people synchronized from ERP system
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {lastSync && (
                <span className="text-sm text-muted-foreground">
                  Last sync: {lastSync.toLocaleString()}
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
                {syncing ? "Syncing..." : "Sync with SoftOne"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Presales People Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            PRESALES PEOPLE FROM SOFTONE ERP
          </CardTitle>
          <CardDescription>
            SoftOne presales people data - {presalesPeople.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={presalesPeople}
            columns={presalesPeopleColumns}
            searchKey="name"
            searchPlaceholder="Search presales people..."
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
                <span className="text-sm">Total Presales People: {presalesPeople.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Synced with SoftOne</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Read-only Data</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Field Mapping:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code>UFTBL01</code> → <code>uftbl01</code> (SoftOne table reference)</li>
                <li><code>CODE</code> → <code>code</code> (Person code)</li>
                <li><code>NAME</code> → <code>name</code> (Person name)</li>
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
                    Presales people data is synchronized with SoftOne ERP system. 
                    This is read-only data - use the sync button to update records from the ERP system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





