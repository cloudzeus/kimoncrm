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
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  emailGroup: string | null;
  parentId: string | null;
  managerId: string | null;
  parent?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
  _count: {
    users: number;
    children: number;
  };
}

export function DepartmentsManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    emailGroup: '',
    parentId: '',
    managerId: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/departments');
      const data = await response.json();
      if (response.ok) {
        setDepartments(data.departments);
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        emailGroup: formData.emailGroup || null,
        parentId: formData.parentId || null,
        managerId: formData.managerId || null,
      };

      const url = editingDept
        ? `/api/admin/departments/${editingDept.id}`
        : '/api/admin/departments';
      const method = editingDept ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          editingDept ? 'Department updated' : 'Department created'
        );
        setDialogOpen(false);
        resetForm();
        fetchDepartments();
      }
    } catch (error) {
      toast.error('Failed to save department');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const response = await fetch(`/api/admin/departments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Department deleted');
        fetchDepartments();
      }
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  const resetForm = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      emailGroup: '',
      parentId: '',
      managerId: '',
    });
  };

  const openDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        emailGroup: dept.emailGroup || '',
        parentId: dept.parentId || '',
        managerId: dept.managerId || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Departments</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email Group</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Sub-depts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell>{dept.emailGroup || '-'}</TableCell>
                <TableCell>{dept.parent?.name || '-'}</TableCell>
                <TableCell>{dept.manager?.name || '-'}</TableCell>
                <TableCell>{dept._count.users}</TableCell>
                <TableCell>{dept._count.children}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(dept)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(dept.id)}
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
              {editingDept ? 'Edit Department' : 'New Department'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Email Group</Label>
              <Input
                value={formData.emailGroup}
                onChange={(e) =>
                  setFormData({ ...formData, emailGroup: e.target.value })
                }
                placeholder="department@company.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingDept ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

