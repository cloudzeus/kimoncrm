// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Calendar, User, Edit, Trash2, File as FileIcon, X, Eye,
  CheckSquare, AlertCircle, Inbox, GripVertical, Mail, Phone, Clock
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  { id: "NOT_STARTED", label: "Not Started", color: "bg-gray-500", icon: Inbox },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500", icon: AlertCircle },
  { id: "COMPLETED", label: "Completed", color: "bg-green-500", icon: CheckSquare },
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
    phone01?: string | null;
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
  onTasksChange?: () => void;
}

export function LeadTasksKanban({ leadId, leadContacts, users, onTasksChange }: LeadTasksKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: "",
    contactId: "",
    dueDate: "",
    reminderDate: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [leadId]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/tasks`);
      const data = await res.json();
      setTasks(data.tasks || []);
      if (onTasksChange) onTasksChange();
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    const taskId = draggableId;
    const destStatus = destination.droppableId;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Optimistic update
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      const taskIndex = newTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const task = newTasks[taskIndex];
      task.status = destStatus;
      task.order = destination.index;

      return newTasks;
    });

    try {
      const res = await fetch(`/api/leads/${leadId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: destStatus,
          order: destination.index,
        }),
      });

      if (!res.ok) {
        fetchTasks(); // Revert on error
        toast.error("Failed to update task");
      } else {
        toast.success("Task moved successfully");
        if (onTasksChange) onTasksChange();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      fetchTasks();
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
        const error = await res.json();
        toast.error(error.message || "Failed to create task");
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
        if (showDetailsDialog) {
          setShowDetailsDialog(false);
          setSelectedTask(null);
        }
        if (showDialog) {
          setShowDialog(false);
          resetForm();
        }
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
        setShowDetailsDialog(false);
        setSelectedTask(null);
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("An error occurred");
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
    setSelectedFiles([]);
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetailsDialog(true);
  };

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const calculateProgress = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "COMPLETED").length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">LEAD TASKS</CardTitle>
            <Button 
              size="sm" 
              onClick={() => {
                setEditingTask(null);
                setShowDialog(true);
              }}
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <Plus className="h-4 w-4 mr-2" />
              ADD TASK
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">PROGRESS</span>
                <span className="text-sm text-muted-foreground">
                  {calculateProgress()}% Complete
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'COMPLETED').length}</div>
              <div className="text-sm text-muted-foreground">of {tasks.length} tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto">
          {STATUSES.map((status) => {
            const StatusIcon = status.icon;
            const columnTasks = getTasksByStatus(status.id);

            return (
              <div key={status.id} className="flex-1 min-w-[300px]">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <div className={`${status.color} p-2 rounded-lg text-white`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <span className="uppercase font-semibold">{status.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {columnTasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Droppable droppableId={status.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[400px] space-y-2 transition-all rounded-lg p-2 ${
                            snapshot.isDraggingOver
                              ? 'bg-blue-50 border-2 border-dashed border-blue-400 shadow-inner'
                              : 'bg-transparent'
                          }`}
                        >
                          {columnTasks.length === 0 ? (
                            <div className={`flex items-center justify-center h-32 border-2 border-dashed rounded-lg ${
                              snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50/50'
                            }`}>
                              <p className="text-xs text-muted-foreground">
                                {snapshot.isDraggingOver ? 'Drop here' : 'No tasks'}
                              </p>
                            </div>
                          ) : (
                            columnTasks.map((task, index) => {
                              const daysUntilDue = getDaysUntilDue(task.dueDate);
                              const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                              
                              return (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`cursor-pointer hover:shadow-lg transition-all group ${
                                        snapshot.isDragging ? 'opacity-75 shadow-2xl rotate-2' : ''
                                      } ${isOverdue ? 'border-l-red-500' : 'border-l-transparent'} border-l-4`}
                                      onClick={() => handleTaskClick(task)}
                                    >
                                      <CardContent className="p-4">
                                        <div className="space-y-3">
                                          <div className="flex items-start gap-2">
                                            <div {...provided.dragHandleProps} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                            </div>
                                            <h4 className="font-semibold text-sm flex-1">{task.title}</h4>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleTaskClick(task);
                                                }}
                                              >
                                                <Eye className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          {task.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                              {task.description}
                                            </p>
                                          )}
                                          
                                          <div className="flex flex-wrap gap-2">
                                            {task.assignedTo && (
                                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                <User className="h-3 w-3 text-blue-600" />
                                                {task.assignedTo.name}
                                              </Badge>
                                            )}
                                            {task.contact && (
                                              <Badge variant="outline" className="text-xs">
                                                {task.contact.name}
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {task.dueDate && (
                                            <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                              isOverdue ? 'text-red-600' : 
                                              daysUntilDue !== null && daysUntilDue <= 3 ? 'text-orange-600' : 
                                              'text-muted-foreground'
                                            }`}>
                                              <Calendar className="h-3.5 w-3.5" />
                                              <span>{isOverdue ? `Overdue ${Math.abs(daysUntilDue || 0)}d` : `${daysUntilDue}d left`}</span>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Draggable>
                              );
                            })
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Create/Edit Task Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="uppercase">{editingTask ? "EDIT TASK" : "CREATE TASK"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update task details below" : "Fill in the task information to create a new task"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="uppercase font-semibold">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase font-semibold">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={4}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="uppercase font-semibold">Assign To</Label>
                <Select 
                  value={formData.assignedToId} 
                  onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {leadContacts.length > 0 && (
                <div className="space-y-2">
                  <Label className="uppercase font-semibold">Contact</Label>
                  <Select 
                    value={formData.contactId} 
                    onValueChange={(value) => setFormData({ ...formData, contactId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leadContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="uppercase font-semibold">Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase font-semibold">Reminder Date</Label>
                  <Input
                    type="date"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="uppercase font-semibold">Attachments</Label>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="flex items-center gap-2">
                          <FileIcon className="h-3 w-3 text-blue-600" />
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={editingTask ? () => handleUpdateTask(editingTask.id, formData) : handleCreateTask}
              disabled={loading || !formData.title.trim()}
            >
              {loading ? "Saving..." : (editingTask ? "UPDATE" : "CREATE")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      {selectedTask && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
              <DialogDescription>View and manage task details</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
              <div className="space-y-6 py-4">
                {selectedTask.description && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground uppercase font-semibold">Description</Label>
                      <p className="text-sm">{selectedTask.description}</p>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground uppercase font-semibold">Assigned To</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <p className="text-sm">{selectedTask.assignedTo?.name || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground uppercase font-semibold">Contact</Label>
                    {selectedTask.contact ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          <p className="text-sm">{selectedTask.contact.name}</p>
                        </div>
                        {selectedTask.contact.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{selectedTask.contact.email}</span>
                          </div>
                        )}
                        {selectedTask.contact.phone01 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{selectedTask.contact.phone01}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">-</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground uppercase font-semibold">Due Date</Label>
                    <p className="text-sm">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground uppercase font-semibold">Reminder Date</Label>
                    <p className="text-sm">{selectedTask.reminderDate ? new Date(selectedTask.reminderDate).toLocaleDateString() : "-"}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-muted-foreground uppercase font-semibold">Status</Label>
                  <Select 
                    value={selectedTask.status} 
                    onValueChange={(value) => handleUpdateTask(selectedTask.id, { status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditingTask(selectedTask);
                setFormData({
                  title: selectedTask.title,
                  description: selectedTask.description || "",
                  assignedToId: selectedTask.assignedTo?.id || "",
                  contactId: selectedTask.contact?.id || "",
                  dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : "",
                  reminderDate: selectedTask.reminderDate ? new Date(selectedTask.reminderDate).toISOString().split('T')[0] : "",
                });
                setShowDetailsDialog(false);
                setShowDialog(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteTask(selectedTask.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}