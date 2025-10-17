'use client';

/**
 * Services Manager Component
 * Advanced table with sorting and filtering for services
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  RefreshCw, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Languages,
  Edit,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import ServiceEditDialog from './service-edit-dialog';
import ServiceTranslateDialog from './service-translate-dialog';
import ServiceBatchProcessDialog from './service-batch-process-dialog';

interface ServiceTranslation {
  id: string;
  serviceId: string;
  languageCode: string;
  name: string | null;
  description: string | null;
  language: {
    code: string;
    name: string;
    nativeName: string;
  };
}

interface Service {
  id: string;
  mtrl: string | null;
  code: string | null;
  mtrcategory: string | null;
  serviceCategoryCode: string | null;
  name: string;
  brandId: string | null;
  isActive: boolean;
  brand: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  translations: ServiceTranslation[];
  createdAt: string;
  updatedAt: string;
}

export default function ServicesManager() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('all');
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [translatingService, setTranslatingService] = useState<Service | null>(null);
  const [batchProcessDialogOpen, setBatchProcessDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Fetch services
  const fetchServices = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (isActiveFilter !== 'all') {
        params.append('isActive', isActiveFilter);
      }

      if (serviceCategoryFilter !== 'all') {
        params.append('serviceCategoryCode', serviceCategoryFilter);
      }

      const response = await fetch(`/api/services?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setServices(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error(data.error || 'Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'ERROR',
        description: 'Failed to fetch services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch service categories
  const fetchServiceCategories = async () => {
    try {
      const response = await fetch('/api/services/categories');
      const data = await response.json();
      if (data.success) {
        setServiceCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching service categories:', error);
    }
  };

  useEffect(() => {
    fetchServiceCategories();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [page, pageSize, searchTerm, isActiveFilter, serviceCategoryFilter]);

  // Handle service selection
  const toggleServiceSelection = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  const toggleAllServices = () => {
    if (selectedServiceIds.length === services.length) {
      setSelectedServiceIds([]);
    } else {
      setSelectedServiceIds(services.map((s) => s.id));
    }
  };

  // Clear selection when services change
  useEffect(() => {
    setSelectedServiceIds([]);
  }, [services]);

  const handleBulkProcess = () => {
    setBatchProcessDialogOpen(true);
  };

  // Handle sync with SoftOne ERP
  const handleSyncServices = async () => {
    try {
      setSyncing(true);
      
      toast({
        title: 'SYNCING',
        description: 'Syncing services from SoftOne ERP...',
      });

      const response = await fetch('/api/services/sync-all', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'SYNC COMPLETE',
          description: `Created: ${data.stats.created}, Updated: ${data.stats.updated}, Errors: ${data.stats.errors}`,
        });
        
        // Refresh services list
        await fetchServices();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing services:', error);
      toast({
        title: 'ERROR',
        description: error instanceof Error ? error.message : 'Failed to sync services',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = (serviceId: string) => {
    router.push(`/services/${serviceId}`);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setEditDialogOpen(true);
  };

  const handleTranslate = (service: Service) => {
    setTranslatingService(service);
    setTranslateDialogOpen(true);
  };

  const handleSearch = () => {
    setPage(1);
    fetchServices();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight uppercase">SERVICES</h2>
          <p className="text-muted-foreground">
            Manage your services catalog
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleSyncServices}
            disabled={syncing}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'SYNCING...' : 'SYNC WITH ERP'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="SEARCH SERVICES..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={serviceCategoryFilter} onValueChange={setServiceCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="CATEGORY" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL CATEGORIES</SelectItem>
              {serviceCategories.map((cat) => (
                <SelectItem key={cat.code} value={cat.code}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="STATUS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STATUS</SelectItem>
              <SelectItem value="true">ACTIVE</SelectItem>
              <SelectItem value="false">INACTIVE</SelectItem>
            </SelectContent>
          </Select>

          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats and Batch Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>TOTAL: {total}</span>
          <span>PAGE {page} OF {totalPages}</span>
        </div>
        
        {selectedServiceIds.length > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={handleBulkProcess}
          >
            <Edit className="mr-2 h-4 w-4" />
            BATCH PROCESS ({selectedServiceIds.length})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 50 }}>
                <Checkbox
                  checked={services.length > 0 && selectedServiceIds.length === services.length}
                  onCheckedChange={toggleAllServices}
                />
              </TableHead>
              <TableHead style={{ width: 100 }}>MTRL</TableHead>
              <TableHead style={{ width: 120 }}>CODE</TableHead>
              <TableHead style={{ width: 300 }}>NAME</TableHead>
              <TableHead style={{ width: 150 }}>BRAND</TableHead>
              <TableHead style={{ width: 150 }}>CATEGORY</TableHead>
              <TableHead style={{ width: 100 }}>TRANSLATIONS</TableHead>
              <TableHead style={{ width: 110 }}>STATUS</TableHead>
              <TableHead style={{ width: 80 }}>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  NO SERVICES FOUND
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell style={{ width: 50 }}>
                    <Checkbox
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={() => toggleServiceSelection(service.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {service.mtrl || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {service.code || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {service.name}
                  </TableCell>
                  <TableCell>
                    {service.brand ? (
                      <span className="text-sm">{service.brand.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.serviceCategoryCode ? (
                      serviceCategories.find(cat => cat.code === service.serviceCategoryCode)?.name || service.serviceCategoryCode
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {service.translations.length > 0 ? (
                      <div className="flex gap-1">
                        {service.translations.map((t) => (
                          <Badge key={t.id} variant="outline" className="text-xs">
                            {t.languageCode.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">NONE</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.isActive ? 'default' : 'secondary'}>
                      {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>ACTIONS</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(service)}>
                          <Edit className="mr-2 h-4 w-4" />
                          EDIT
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTranslate(service)}>
                          <Languages className="mr-2 h-4 w-4" />
                          TRANSLATE VIA DEEPSEEK
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(service.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          VIEW DETAILS
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          SHOWING {((page - 1) * pageSize) + 1} TO {Math.min(page * pageSize, total)} OF {total} SERVICES
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            PREVIOUS
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            NEXT
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <ServiceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        service={editingService}
        onSuccess={fetchServices}
      />

      {/* Translate Dialog */}
      <ServiceTranslateDialog
        open={translateDialogOpen}
        onOpenChange={setTranslateDialogOpen}
        service={translatingService}
        onSuccess={fetchServices}
      />

      {/* Batch Process Dialog */}
      <ServiceBatchProcessDialog
        open={batchProcessDialogOpen}
        onOpenChange={setBatchProcessDialogOpen}
        selectedServiceIds={selectedServiceIds}
        onSuccess={fetchServices}
      />
    </div>
  );
}

