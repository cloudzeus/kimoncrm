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
  CheckSquare, AlertCircle, Inbox, GripVertical, Mail, Phone, Clock, Users
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  assignees?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  attachments?: Array<{
    id: string;
    file: {
      id: string;
      name: string;
      url: string;
      size?: number;
      filetype?: string;
    };
  }>;
}

interface LeadTasksKanbanProps {
  leadId: string;
  leadContacts: any[];
  users: any[];
  onTasksChange?: () => void;
  currentUser?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function EnhancedLeadTasksKanban({ leadId, leadContacts, users, onTasksChange, currentUser }: LeadTasksKanbanProps) {
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
    dueTime: "",
    reminderDate: "",
    reminderTime: "",
    assigneeIds: [] as string[],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);

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

    // Get tasks in the destination status for proper ordering
    const destTasks = tasks
      .filter(t => t.status === destStatus)
      .sort((a, b) => a.order - b.order);

    // Calculate new order based on position
    let newOrder = 0;
    if (destination.index === 0) {
      // Moving to first position
      newOrder = destTasks.length > 0 ? destTasks[0].order - 1 : 0;
    } else if (destination.index >= destTasks.length) {
      // Moving to last position
      newOrder = destTasks.length > 0 ? destTasks[destTasks.length - 1].order + 1 : 0;
    } else {
      // Moving between tasks
      const prevTask = destTasks[destination.index - 1];
      const nextTask = destTasks[destination.index];
      newOrder = (prevTask.order + nextTask.order) / 2;
    }

    // Optimistic update
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      const taskIndex = newTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const task = newTasks[taskIndex];
      task.status = destStatus;
      task.order = newOrder;

      return newTasks;
    });

    try {
      const res = await fetch(`/api/leads/${leadId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: destStatus,
          order: newOrder,
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
      fetchTasks(); // Revert on error
      toast.error("An error occurred");
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      // Prepare form data with user attribution
      const taskDescription = formData.description.trim();
      const attributedDescription = taskDescription && currentUser?.name 
        ? `${currentUser.name}: ${taskDescription}`
        : taskDescription;

      // Combine date and time for due date and reminder date
      const dueDateTime = formData.dueDate && formData.dueTime 
        ? `${formData.dueDate}T${formData.dueTime}:00`
        : formData.dueDate ? `${formData.dueDate}T09:00:00` : null;

      const reminderDateTime = formData.reminderDate && formData.reminderTime
        ? `${formData.reminderDate}T${formData.reminderTime}:00`
        : formData.reminderDate ? `${formData.reminderDate}T09:00:00` : null;

      const taskData = {
        ...formData,
        description: attributedDescription,
        dueDate: dueDateTime,
        reminderDate: reminderDateTime,
        assigneeIds: formData.assigneeIds,
      };

      const res = await fetch(`/api/leads/${leadId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        const result = await res.json();
        
        // Upload files if any
        if (selectedFiles.length > 0) {
          await uploadTaskFiles(result.task.id, selectedFiles);
        }

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
      // Add user attribution to description updates
      if (updates.description !== undefined && currentUser?.name) {
        const currentTask = tasks.find(t => t.id === taskId);
        if (currentTask && updates.description !== currentTask.description) {
          const newContent = updates.description.trim();
          if (newContent) {
            // Check if description already has user attribution
            const userPrefix = `${currentUser.name}:`;
            if (!newContent.startsWith(userPrefix)) {
              const existingDescription = currentTask.description || '';
              updates.description = existingDescription 
                ? `${existingDescription}\n${currentUser.name}: ${newContent}`
                : `${currentUser.name}: ${newContent}`;
            }
          }
        }
      }

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
        toast.success("Task deleted successfully");
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

  const uploadTaskFiles = async (taskId: string, files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      formData.append('entityId', taskId);
      formData.append('entityType', 'TASK');

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to upload files');
      }

      const result = await res.json();
      console.log('Files uploaded:', result);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedToId: "",
      contactId: "",
      dueDate: "",
      dueTime: "",
      reminderDate: "",
      reminderTime: "",
      assigneeIds: [],
    });
    setEditingTask(null);
    setSelectedFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const calculateDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold uppercase">TASKS</h2>
          <p className="text-muted-foreground">Manage and track lead tasks</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="uppercase">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="uppercase">Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {STATUSES.map((status) => {
              const statusTasks = getTasksByStatus(status.id);
              const percentage = tasks.length > 0 ? (statusTasks.length / tasks.length) * 100 : 0;
              return (
                <div key={status.id} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <status.icon className="h-4 w-4" />
                    <span className="font-medium uppercase">{status.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{statusTasks.length}</div>
                  <Progress value={percentage} className="mt-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-full overflow-hidden">
          {STATUSES.map((status) => {
            const statusTasks = getTasksByStatus(status.id);
            return (
              <div key={status.id} className="min-w-0 flex-1">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 uppercase">
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      {status.label}
                      <Badge variant="secondary" className="ml-auto">
                        {statusTasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Droppable droppableId={status.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-2 min-h-[200px] p-1 rounded-lg transition-colors ${
                            snapshot.isDraggingOver ? "bg-muted/50" : ""
                          }`}
                        >
                          {statusTasks.map((task, index) => {
                            const daysUntilDue = calculateDaysUntilDue(task.dueDate);
                            const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                            
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`cursor-pointer transition-all shadow-sm hover:shadow-md ${
                                      snapshot.isDragging ? "shadow-lg rotate-2" : ""
                                    } ${isOverdue ? "border-red-200 bg-red-50 shadow-red-100" : ""}`}
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setShowDetailsDialog(true);
                                    }}
                                  >
                                    <CardContent className="p-3">
                                      <div className="space-y-2">
                                        <div className="flex items-start justify-between">
                                          <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                                            {task.title}
                                          </h4>
                                          <div
                                            {...provided.dragHandleProps}
                                            className="ml-2 opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <GripVertical className="h-4 w-4" />
                                          </div>
                                        </div>
                                        
                                        {task.description && (
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {task.description}
                                          </p>
                                        )}
                                        
                                        <div className="flex flex-wrap gap-1">
                                          {task.assignedTo && (
                                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                              <User className="h-3 w-3 text-blue-600" />
                                              {task.assignedTo.name}
                                            </Badge>
                                          )}
                                          {task.assignees && task.assignees.length > 0 && (
                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                              <Users className="h-3 w-3 text-green-600" />
                                              {task.assignees.length} assignees
                                            </Badge>
                                          )}
                                          {task.contact && (
                                            <Badge variant="outline" className="text-xs">
                                              {task.contact.name}
                                            </Badge>
                                          )}
                                          {task.attachments && task.attachments.length > 0 && (
                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                              <FileIcon className="h-3 w-3 text-purple-600" />
                                              {task.attachments.length}
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
                                            <span>
                                              {isOverdue 
                                                ? `Overdue ${Math.abs(daysUntilDue || 0)}d` 
                                                : daysUntilDue === 0 
                                                ? 'Due today' 
                                                : `${daysUntilDue}d left`
                                              }
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            );
                          })}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="uppercase">{editingTask ? "EDIT TASK" : "CREATE TASK"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update task details below" : "Fill in the task information to create a new task"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6 py-4">
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
                  placeholder="Enter task description (your name will be automatically added)"
                  rows={4}
                />
                {currentUser?.name && (
                  <p className="text-xs text-muted-foreground">
                    Note: Your name "{currentUser.name}" will be automatically added to the description
                  </p>
                )}
              </div>

              <Separator />

              {/* Multiple Assignees */}
              <div className="space-y-2">
                <Label className="uppercase font-semibold">Assignees</Label>
                <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={assigneesOpen}
                      className="w-full justify-between"
                    >
                      {formData.assigneeIds.length > 0
                        ? `${formData.assigneeIds.length} user(s) selected`
                        : "Select assignees..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => {
                              const isSelected = formData.assigneeIds.includes(user.id);
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  assigneeIds: formData.assigneeIds.filter(id => id !== user.id)
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  assigneeIds: [...formData.assigneeIds, user.id]
                                });
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.assigneeIds.includes(user.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {user.name} ({user.email})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.assigneeIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.assigneeIds.map(userId => {
                      const user = users.find(u => u.id === userId);
                      return user ? (
                        <Badge key={userId} variant="secondary" className="text-xs">
                          {user.name}
                          <X 
                            className="ml-1 h-3 w-3 cursor-pointer" 
                            onClick={() => setFormData({
                              ...formData,
                              assigneeIds: formData.assigneeIds.filter(id => id !== userId)
                            })}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Contact Selection */}
              {leadContacts.length > 0 && (
                <div className="space-y-2">
                  <Label className="uppercase font-semibold">Contact</Label>
                  <Popover open={contactsOpen} onOpenChange={setContactsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={contactsOpen}
                        className="w-full justify-between"
                      >
                        {formData.contactId
                          ? leadContacts.find(contact => contact.id === formData.contactId)?.name
                          : "Select contact..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search contacts..." />
                        <CommandEmpty>No contacts found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setFormData({ ...formData, contactId: "" });
                              setContactsOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !formData.contactId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            No contact
                          </CommandItem>
                          {leadContacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              onSelect={() => {
                                setFormData({ ...formData, contactId: contact.id });
                                setContactsOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.contactId === contact.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {contact.name}
                              {contact.email && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {contact.email}
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <Separator />

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="uppercase font-semibold">Due Date & Time</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase font-semibold">Reminder Date & Time</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={formData.reminderDate}
                      onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    />
                  </div>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
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
                      <div className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                        {selectedTask.description}
                      </div>
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
                    {selectedTask.assignees && selectedTask.assignees.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-muted-foreground uppercase font-semibold text-xs">Multiple Assignees</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTask.assignees.map((assignee) => (
                            <Badge key={assignee.id} variant="secondary" className="text-xs">
                              {assignee.user.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                    <p className="text-sm">
                      {selectedTask.dueDate 
                        ? new Date(selectedTask.dueDate).toLocaleString() 
                        : "-"
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground uppercase font-semibold">Reminder Date</Label>
                    <p className="text-sm">
                      {selectedTask.reminderDate 
                        ? new Date(selectedTask.reminderDate).toLocaleString() 
                        : "-"
                      }
                    </p>
                  </div>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-muted-foreground uppercase font-semibold">Attachments</Label>
                      <div className="space-y-2">
                        {selectedTask.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileIcon className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium">{attachment.file.name}</p>
                                {attachment.file.size && (
                                  <p className="text-xs text-muted-foreground">
                                    {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(attachment.file.url, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

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
                const dueDateTime = selectedTask.dueDate ? new Date(selectedTask.dueDate) : null;
                const reminderDateTime = selectedTask.reminderDate ? new Date(selectedTask.reminderDate) : null;
                
                setFormData({
                  title: selectedTask.title,
                  description: selectedTask.description || "",
                  assignedToId: selectedTask.assignedTo?.id || "",
                  contactId: selectedTask.contact?.id || "",
                  dueDate: dueDateTime ? dueDateTime.toISOString().split('T')[0] : "",
                  dueTime: dueDateTime ? dueDateTime.toTimeString().slice(0, 5) : "",
                  reminderDate: reminderDateTime ? reminderDateTime.toISOString().split('T')[0] : "",
                  reminderTime: reminderDateTime ? reminderDateTime.toTimeString().slice(0, 5) : "",
                  assigneeIds: selectedTask.assignees?.map(a => a.userId) || [],
                });
                setShowDetailsDialog(false);
                setShowDialog(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteTask(selectedTask.id)}
              >
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
