// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Search,
  Filter,
  Eye,
  Edit
} from 'lucide-react';
import { StatusManager, StatusFilter } from '@/components/shared/status-manager';
import { toast } from 'sonner';

interface EntityStats {
  total: number;
  byStatus: Record<string, number>;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
  source: string | null;
  createdAt: string;
}

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  status: string;
  amount: number | null;
  closeDate: string | null;
  company: {
    name: string;
  };
  createdAt: string;
}

interface RFP {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  company: {
    name: string;
  };
  contact: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  createdAt: string;
}

interface Quote {
  id: string;
  quoteNo: string | null;
  status: string;
  total: number | null;
  validUntil: string | null;
  company: {
    name: string;
  } | null;
  contact: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  createdAt: string;
}

export function StatusManagementDashboard() {
  const [stats, setStats] = useState<{
    leads: EntityStats;
    opportunities: EntityStats;
    rfps: EntityStats;
    quotes: EntityStats;
  } | null>(null);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<{
    leads: string;
    opportunities: string;
    rfps: string;
    quotes: string;
  }>({
    leads: 'all',
    opportunities: 'all',
    rfps: 'all',
    quotes: 'all',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, leadsRes, opportunitiesRes, rfpsRes, quotesRes] = await Promise.all([
        fetch('/api/admin/status-stats'),
        fetch('/api/leads'),
        fetch('/api/opportunities'),
        fetch('/api/rfps'),
        fetch('/api/quotes'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData);
      }

      if (opportunitiesRes.ok) {
        const opportunitiesData = await opportunitiesRes.json();
        setOpportunities(opportunitiesData);
      }

      if (rfpsRes.ok) {
        const rfpsData = await rfpsRes.json();
        setRfps(rfpsData);
      }

      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        setQuotes(quotesData);
      }
    } catch (error) {
      console.error('Failed to fetch status data:', error);
      toast.error('Failed to load status data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (entityType: string, entityId: string, newStatus: string, note?: string) => {
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, note }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        toast.success('Status updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Filter data based on search and status filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.leads === 'all' || lead.status === statusFilter.leads;
    return matchesSearch && matchesStatus;
  });

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = !searchTerm || 
      opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.opportunities === 'all' || opp.status === statusFilter.opportunities;
    return matchesSearch && matchesStatus;
  });

  const filteredRfps = rfps.filter(rfp => {
    const matchesSearch = !searchTerm || 
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.rfps === 'all' || rfp.status === statusFilter.rfps;
    return matchesSearch && matchesStatus;
  });

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = !searchTerm || 
      (quote.quoteNo && quote.quoteNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote.company?.name && quote.company.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter.quotes === 'all' || quote.status === statusFilter.quotes;
    return matchesSearch && matchesStatus;
  });

  // Table columns
  const leadsColumns = [
    {
      accessorKey: 'name',
      header: 'Lead Name',
      cell: ({ row }: { row: { original: Lead } }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }: { row: { original: Lead } }) => (
        <span>{row.original.company || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }: { row: { original: Lead } }) => (
        <Badge variant="outline">{row.original.source || 'N/A'}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Lead } }) => (
        <StatusManager
          entityType="lead"
          entityId={row.original.id}
          currentStatus={row.original.status}
          onStatusChange={(newStatus, note) => handleStatusChange('lead', row.original.id, newStatus, note)}
        />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: Lead } }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const opportunitiesColumns = [
    {
      accessorKey: 'name',
      header: 'Opportunity',
      cell: ({ row }: { row: { original: Opportunity } }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground">{row.original.company.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: { row: { original: Opportunity } }) => (
        <span className="font-medium">
          {row.original.amount ? `€${row.original.amount.toLocaleString()}` : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }: { row: { original: Opportunity } }) => (
        <Badge variant="secondary">{row.original.stage}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Opportunity } }) => (
        <StatusManager
          entityType="opportunity"
          entityId={row.original.id}
          currentStatus={row.original.status}
          onStatusChange={(newStatus, note) => handleStatusChange('opportunity', row.original.id, newStatus, note)}
        />
      ),
    },
  ];

  const rfpsColumns = [
    {
      accessorKey: 'title',
      header: 'RFP Title',
      cell: ({ row }: { row: { original: RFP } }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-sm text-muted-foreground">{row.original.company.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }: { row: { original: RFP } }) => (
        <span className="text-sm">
          {row.original.contact 
            ? `${row.original.contact.firstName} ${row.original.contact.lastName}`
            : 'N/A'
          }
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }: { row: { original: RFP } }) => (
        <span className="text-sm">
          {row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: RFP } }) => (
        <StatusManager
          entityType="rfp"
          entityId={row.original.id}
          currentStatus={row.original.status}
          onStatusChange={(newStatus, note) => handleStatusChange('rfp', row.original.id, newStatus, note)}
        />
      ),
    },
  ];

  const quotesColumns = [
    {
      accessorKey: 'quoteNo',
      header: 'Quote #',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="font-mono">{row.original.quoteNo || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span>{row.original.company?.name || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="font-medium">
          {row.original.total ? `€${row.original.total.toLocaleString()}` : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'validUntil',
      header: 'Valid Until',
      cell: ({ row }: { row: { original: Quote } }) => (
        <span className="text-sm">
          {row.original.validUntil ? new Date(row.original.validUntil).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Quote } }) => (
        <StatusManager
          entityType="quote"
          entityId={row.original.id}
          currentStatus={row.original.status}
          onStatusChange={(newStatus, note) => handleStatusChange('quote', row.original.id, newStatus, note)}
        />
      ),
    },
  ];

  if (loading || !stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>LEADS</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.total}</div>
            <div className="flex space-x-1 mt-2">
              {Object.entries(stats.leads.byStatus).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>OPPORTUNITIES</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opportunities.total}</div>
            <div className="flex space-x-1 mt-2">
              {Object.entries(stats.opportunities.byStatus).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>RFPS</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rfps.total}</div>
            <div className="flex space-x-1 mt-2">
              {Object.entries(stats.rfps.byStatus).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>QUOTES</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quotes.total}</div>
            <div className="flex space-x-1 mt-2">
              {Object.entries(stats.quotes.byStatus).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>SEARCH & FILTER</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search across all entities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <StatusFilter
              entityType="lead"
              selectedStatus={statusFilter.leads}
              onStatusChange={(status) => setStatusFilter(prev => ({ ...prev, leads: status }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>LEADS ({filteredLeads.length})</span>
              <StatusFilter
                entityType="lead"
                selectedStatus={statusFilter.leads}
                onStatusChange={(status) => setStatusFilter(prev => ({ ...prev, leads: status }))}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={leadsColumns} data={filteredLeads.slice(0, 10)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>OPPORTUNITIES ({filteredOpportunities.length})</span>
              <StatusFilter
                entityType="opportunity"
                selectedStatus={statusFilter.opportunities}
                onStatusChange={(status) => setStatusFilter(prev => ({ ...prev, opportunities: status }))}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={opportunitiesColumns} data={filteredOpportunities.slice(0, 10)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>RFPS ({filteredRfps.length})</span>
              <StatusFilter
                entityType="rfp"
                selectedStatus={statusFilter.rfps}
                onStatusChange={(status) => setStatusFilter(prev => ({ ...prev, rfps: status }))}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={rfpsColumns} data={filteredRfps.slice(0, 10)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>QUOTES ({filteredQuotes.length})</span>
              <StatusFilter
                entityType="quote"
                selectedStatus={statusFilter.quotes}
                onStatusChange={(status) => setStatusFilter(prev => ({ ...prev, quotes: status }))}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={quotesColumns} data={filteredQuotes.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

