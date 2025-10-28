'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface WorkPosition {
  id: string;
  title: string;
  departmentId: string;
  department?: { id: string; name: string };
  _count: {
    users: number;
  };
}

interface Department {
  id: string;
  name: string;
}

export function PositionsManager() {
  const [positions, setPositions] = useState<WorkPosition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<WorkPosition | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [positionsRes, deptsRes] = await Promise.all([
        fetch('/api/admin/positions'),
        fetch('/api/admin/departments'),
      ]);

      const positionsData = await positionsRes.json();
      const deptsData = await deptsRes.json();

      if (positionsRes.ok) {
        setPositions(positionsData.positions);
      }
      if (deptsRes.ok) {
        setDepartments(deptsData.departments);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingPos
        ? `/api/admin/positions/${editingPos.id}`
        : '/api/admin/positions';
      const method = editingPos ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingPos ? 'Position updated' : 'Position created');
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to save position');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const response = await fetch(`/api/admin/positions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Position deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete position');
    }
  };

  const resetForm = () => {
    setEditingPos(null);
    setFormData({
      title: '',
      departmentId: '',
    });
  };

  const openDialog = (pos?: WorkPosition) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({
        title: pos.title,
        departmentId: pos.departmentId,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Work Positions</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Position
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((pos) => (
              <TableRow key={pos.id}>
                <TableCell className="font-medium">{pos.title}</TableCell>
                <TableCell>{pos.department?.name || '-'}</TableCell>
                <TableCell>{pos._count.users}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(pos)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pos.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPos ? 'Edit Position' : 'New Position'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPos ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

