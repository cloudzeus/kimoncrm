"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit, Trash2, Briefcase, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkPosition {
  id: string;
  title: string;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    name: string;
  };
  _count?: {
    users: number;
  };
}

interface Department {
  id: string;
  name: string;
}

export default function PositionsManagementPage() {
  const [positions, setPositions] = useState<WorkPosition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<WorkPosition | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    departmentId: ""
  });
  const { toast } = useToast();

  // Fetch positions and departments
  const fetchData = async () => {
    try {
      const [positionsResponse, departmentsResponse] = await Promise.all([
        fetch("/api/admin/positions"),
        fetch("/api/admin/departments")
      ]);

      if (positionsResponse.ok && departmentsResponse.ok) {
        const [positionsData, departmentsData] = await Promise.all([
          positionsResponse.json(),
          departmentsResponse.json()
        ]);
        setPositions(positionsData.positions);
        setDepartments(departmentsData.departments);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPosition 
        ? `/api/admin/positions/${editingPosition.id}`
        : "/api/admin/positions";
      
      const method = editingPosition ? "PUT" : "POST";
      
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
          description: editingPosition 
            ? "Position updated successfully" 
            : "Position created successfully"
        });
        setIsDialogOpen(false);
        setEditingPosition(null);
        setFormData({
          title: "",
          departmentId: ""
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save position",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save position",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (position: WorkPosition) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      departmentId: position.departmentId
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/positions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Position deleted successfully"
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete position",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete position",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      departmentId: ""
    });
    setEditingPosition(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading positions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            POSITIONS MANAGEMENT
          </h1>
          <p className="text-muted-foreground">
            Manage work positions within departments
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPosition ? "Edit Position" : "Add New Position"}
              </DialogTitle>
              <DialogDescription>
                {editingPosition 
                  ? "Update the position information below." 
                  : "Create a new work position within a department."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Position Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Software Engineer, Marketing Manager..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
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
                  {editingPosition ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Positions
          </CardTitle>
          <CardDescription>
            Manage positions within your organizational structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{position.department.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {position._count?.users || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(position.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(position)}
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
                            <AlertDialogTitle>Delete Position</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{position.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(position.id)}
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
