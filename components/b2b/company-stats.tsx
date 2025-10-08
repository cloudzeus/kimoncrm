'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ShoppingCart, Ticket, FolderOpen, TrendingUp, Clock } from 'lucide-react';

interface CompanyStatsProps {
  companyId: string;
}

interface StatsData {
  quotes: {
    total: number;
    pending: number;
    approved: number;
    expired: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    totalValue: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResolutionTime: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
}

export function CompanyStats({ companyId }: CompanyStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/b2b/stats?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [companyId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Failed to load stats</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Quotes Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">QUOTES</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.quotes.total}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {stats.quotes.pending} Pending
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stats.quotes.approved} Approved
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Orders Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ORDERS</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.orders.total}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>Total Value: €{stats.orders.totalValue.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {stats.orders.pending} Pending
            </Badge>
            <Badge variant="default" className="text-xs">
              {stats.orders.processing} Processing
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SUPPORT TICKETS</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tickets.total}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Avg: {stats.tickets.avgResolutionTime}h</span>
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <Badge variant="destructive" className="text-xs">
              {stats.tickets.open} Open
            </Badge>
            <Badge variant="default" className="text-xs">
              {stats.tickets.inProgress} In Progress
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Projects Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">PROJECTS</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.projects.total}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>{stats.projects.active} Active</span>
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <Badge variant="secondary" className="text-xs">
              {stats.projects.completed} Completed
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.projects.onHold} On Hold
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
