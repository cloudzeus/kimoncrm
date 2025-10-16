'use client';

/**
 * Manufacturers Manager Component
 * Main component for managing manufacturers with table, filters, and actions
 */

import { useState, useEffect } from 'react';
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
  Plus, 
  Search, 
  RefreshCw, 
  Upload,
  Trash2,
  Edit,
  MoreVertical,
} from 'lucide-react';
import ManufacturerFormDialog from './manufacturer-form-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Manufacturer {
  id: string;
  mtrmanfctr: string | null;
  code: string | null;
  name: string;
  isActive: boolean;
  softoneCode: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

export default function ManufacturersManager() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [manufacturerToDelete, setManufacturerToDelete] = useState<Manufacturer | null>(null);
  
  const { toast } = useToast();

  // Fetch manufacturers
  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search,
      });

      if (isActiveFilter !== 'all') {
        params.append('isActive', isActiveFilter);
      }

      const response = await fetch(`/api/manufacturers?${params}`);
      const data = await response.json();

      if (data.success) {
        setManufacturers(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch manufacturers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch manufacturers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Sync manufacturers from ERP
  const syncManufacturers = async () => {
    try {
      setSyncing(true);
      toast({
        title: 'Syncing',
        description: 'Starting manufacturer sync from SoftOne ERP...',
      });

      const response = await fetch('/api/manufacturers/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Synced ${data.stats.total} manufacturers: ${data.stats.created} created, ${data.stats.updated} updated`,
        });
        fetchManufacturers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to sync manufacturers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing manufacturers:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync manufacturers',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Delete manufacturer
  const deleteManufacturer = async (manufacturer: Manufacturer) => {
    try {
      const response = await fetch(`/api/manufacturers/${manufacturer.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Manufacturer deleted successfully',
        });
        fetchManufacturers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete manufacturer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete manufacturer',
        variant: 'destructive',
      });
    }
  };

  // Load manufacturers on mount and when filters change
  useEffect(() => {
    fetchManufacturers();
  }, [page, search, isActiveFilter]);

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search manufacturers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Manufacturers</SelectItem>
              <SelectItem value="true">Active Only</SelectItem>
              <SelectItem value="false">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchManufacturers()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={syncManufacturers}
            disabled={syncing}
          >
            <Upload className="mr-2 h-4 w-4" />
            Sync from ERP
          </Button>
          <Button onClick={() => {
            setEditingManufacturer(null);
            setIsFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Manufacturer
          </Button>
        </div>
      </div>

      {/* Manufacturers Table */}
      <div className="rounded-md border shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CODE</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>PRODUCTS</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>CREATED</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading manufacturers...
                </TableCell>
              </TableRow>
            ) : manufacturers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No manufacturers found
                </TableCell>
              </TableRow>
            ) : (
              manufacturers.map((manufacturer) => (
                <TableRow key={manufacturer.id}>
                  <TableCell className="font-medium">{manufacturer.code}</TableCell>
                  <TableCell>{manufacturer.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{manufacturer._count.products}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={manufacturer.isActive ? 'default' : 'secondary'}>
                      {manufacturer.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(manufacturer.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>ACTIONS</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setEditingManufacturer(manufacturer);
                          setIsFormOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          EDIT
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setManufacturerToDelete(manufacturer);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                          disabled={manufacturer._count.products > 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          DELETE
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Manufacturer Form Dialog */}
      <ManufacturerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        manufacturer={editingManufacturer}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingManufacturer(null);
          fetchManufacturers();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ARE YOU SURE?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              manufacturer from the database.
              {manufacturerToDelete && manufacturerToDelete._count.products > 0 && (
                <p className="mt-2 text-destructive font-semibold">
                  This manufacturer has {manufacturerToDelete._count.products} associated products and cannot be deleted.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (manufacturerToDelete) {
                  deleteManufacturer(manufacturerToDelete);
                  setDeleteDialogOpen(false);
                  setManufacturerToDelete(null);
                }
              }}
              disabled={manufacturerToDelete?._count.products! > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

