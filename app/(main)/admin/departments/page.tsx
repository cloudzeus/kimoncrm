"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Department {
  id: string;
  name: string;
  emailGroup: string | null;
  parentId: string | null;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: { name: string } | null;
  manager?: { name: string } | null;
  _count?: {
    users: number;
    children: number;
  };
}

export default function DepartmentsManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    emailGroup: "",
    parentId: "",
    managerId: ""
  });
  const { toast } = useToast();

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/admin/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch departments",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // Load users for manager selection
    (async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          // Map and store minimal user data
          setUsers(
            (data || []).map((u: any) => ({ id: u.id, name: u.name, email: u.email }))
          );
        }
      } catch {
        // ignore, handled in UI silently
      }
    })();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingDepartment 
        ? `/api/admin/departments/${editingDepartment.id}`
        : "/api/admin/departments";
      
      const method = editingDepartment ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: editingDepartment 
            ? "Department updated successfully" 
            : "Department created successfully"
        });
        setIsDialogOpen(false);
        setEditingDepartment(null);
        setFormData({
          name: "",
          emailGroup: "",
          parentId: "",
          managerId: ""
        });
        fetchDepartments();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save department",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save department",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      emailGroup: department.emailGroup || "",
      parentId: department.parentId || "",
      managerId: department.managerId || ""
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/departments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Department deleted successfully"
        });
        fetchDepartments();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete department",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      emailGroup: "",
      parentId: "",
      managerId: ""
    });
    setEditingDepartment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            DEPARTMENTS MANAGEMENT
          </h1>
          <p className="text-muted-foreground">
            Manage organizational departments and their structure
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? "Edit Department" : "Add New Department"}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment 
                  ? "Update the department information below." 
                  : "Create a new department in the organization."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Marketing, Sales, IT..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailGroup">Email Group</Label>
                <Input
                  id="emailGroup"
                  value={formData.emailGroup}
                  onChange={(e) => setFormData({ ...formData, emailGroup: e.target.value })}
                  placeholder="marketing@company.com"
                />
              </div>

              {/* Parent Department */}
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Department</Label>
                <Select
                  value={formData.parentId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="Select parent (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent (top-level)</SelectItem>
                    {departments
                      .filter((d) => !editingDepartment || d.id !== editingDepartment.id)
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manager */}
              <div className="space-y-2">
                <Label htmlFor="managerId">Manager</Label>
                <Select
                  value={formData.managerId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, managerId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="managerId">
                    <SelectValue placeholder="Select manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No manager</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDepartment ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departments
          </CardTitle>
          <CardDescription>
            Manage your organizational structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email Group</TableHead>
                <TableHead>Parent Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Sub-departments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>
                    {department.emailGroup ? (
                      <Badge variant="secondary">{department.emailGroup}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {department.parent ? (
                      <Badge variant="outline">{department.parent.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {department.manager ? (
                      <Badge variant="outline">{department.manager.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {department._count?.users || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {department._count?.children || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(department)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Department</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{department.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(department.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
