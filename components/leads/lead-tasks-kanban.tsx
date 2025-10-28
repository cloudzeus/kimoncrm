"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, User, Edit, Trash2, Upload, File as FileIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MultiUserSelect } from "@/components/ui/multi-user-select";
import { MultiSelectContacts } from "./multi-select-contacts";

const STATUSES = [
  { id: "NOT_STARTED", label: "Not Started", color: "bg-gray-100 text-gray-800" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-800" },
  { id: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800" },
];

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  order: number;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  contact?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  dueDate?: string | null;
  reminderDate?: string | null;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface LeadTasksKanbanProps {
  leadId: string;
  leadContacts: any[];
  users: any[];
}

export function LeadTasksKanban({ leadId, leadContacts, users }: LeadTasksKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: "",
    contactId: "",
    dueDate: "",
    reminderDate: "",
  });

  useEffect(() => {
    fetchTasks();
  }, [leadId]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/tasks`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Task created successfully");
        fetchTasks();
        resetForm();
        setShowDialog(false);
      } else {
        toast.error("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        toast.success("Task updated successfully");
        fetchTasks();
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("An error occurred");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/leads/${leadId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Task deleted");
        fetchTasks();
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("An error occurred");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      handleUpdateTask(taskId, { status: newStatus });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedToId: "",
      contactId: "",
      dueDate: "",
      reminderDate: "",
    });
    setEditingTask(null);
  };

  const groupedTasks = STATUSES.map(status => ({
    ...status,
    tasks: tasks
      .filter(task => task.status === status.id)
      .sort((a, b) => a.order - b.order),
  }));

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">Tasks</h3>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {groupedTasks.map((column) => (
          <div key={column.id} className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <Badge className={column.color}>{column.label}</Badge>
              <span className="text-xs text-muted-foreground">{column.tasks.length}</span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {column.tasks.map((task) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(task);
                              setFormData({
                                title: task.title,
                                description: task.description || "",
                                assignedToId: task.assignedTo?.id || "",
                                contactId: task.contact?.id || "",
                                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
                                reminderDate: task.reminderDate ? new Date(task.reminderDate).toISOString().split('T')[0] : "",
                              });
                              setShowDialog(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 text-xs">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{getDaysUntilDue(task.dueDate)} days</span>
                          </div>
                        )}
                        {task.reminderDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Reminder</span>
                          </div>
                        )}
                        {task.assignedTo && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignedTo.name}</span>
                          </div>
                        )}
                        {task.contact && (
                          <Badge variant="secondary" className="text-xs">
                            {task.contact.name}
                          </Badge>
                        )}
                      </div>

                      {task.status !== "COMPLETED" && (
                        <select
                          className="w-full text-xs rounded-md border border-input bg-background px-2 py-1"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        >
                          {STATUSES.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Task Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update task details" : "Create a new task for this lead"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assign To</Label>
                <select
                  id="assignedTo"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="contact">Contact</Label>
                <select
                  id="contact"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                >
                  <option value="">Select contact</option>
                  {leadContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="reminderDate">Reminder Date</Label>
                <Input
                  id="reminderDate"
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={editingTask ? () => handleUpdateTask(editingTask.id, formData).then(() => { setShowDialog(false); resetForm(); }) : handleCreateTask}
              disabled={loading || !formData.title.trim()}
            >
              {loading ? "Saving..." : (editingTask ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
