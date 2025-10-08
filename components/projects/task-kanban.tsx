'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Circle,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  dueAt: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  order: number;
  assignee?: {
    name: string | null;
    email: string;
  } | null;
  creator?: {
    name: string | null;
    email: string;
  } | null;
}

interface TaskKanbanProps {
  projectId: string;
  isManager: boolean;
  currentUserId: string;
}

const statusColumns = [
  { id: 'Todo', title: 'TO DO', color: 'bg-gray-100' },
  { id: 'InProgress', title: 'IN PROGRESS', color: 'bg-blue-100' },
  { id: 'Review', title: 'REVIEW', color: 'bg-yellow-100' },
  { id: 'Done', title: 'DONE', color: 'bg-green-100' },
];

const priorityColors = {
  Low: 'bg-gray-100 text-gray-800',
  Medium: 'bg-blue-100 text-blue-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
};

export function TaskKanban({ projectId, isManager, currentUserId }: TaskKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/tasks`),
        fetch('/api/users?roles=USER,MANAGER')
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to fetch task data:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;
    const oldStatus = source.droppableId;

    // Optimistic update
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, status: newStatus };
      }
      return task;
    });
    setTasks(updatedTasks);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          fromStatus: oldStatus,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setTasks(tasks);
        toast.error('Failed to update task status');
      } else {
        toast.success('Task status updated successfully');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setTasks(tasks);
      toast.error('Failed to update task status');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const calculateProgress = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Todo':
        return <Circle className="h-4 w-4" />;
      case 'InProgress':
        return <Play className="h-4 w-4" />;
      case 'Review':
        return <Eye className="h-4 w-4" />;
      case 'Done':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PROJECT TASKS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            {statusColumns.map((column) => (
              <div key={column.id} className="flex-1">
                <div className={`p-4 rounded-lg ${column.color}`}>
                  <h3 className="font-medium mb-4">{column.title}</h3>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white p-3 rounded border animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>PROJECT TASKS</CardTitle>
            {isManager && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                ADD TASK
              </Button>
            )}
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
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'Done').length}</div>
              <div className="text-sm text-muted-foreground">of {tasks.length} tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto">
          {statusColumns.map((column) => (
            <div key={column.id} className="flex-1 min-w-[300px]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    {getStatusIcon(column.id)}
                    <span>{column.title}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {getTasksByStatus(column.id).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] space-y-2 ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {getTasksByStatus(column.id).map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 bg-white border rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsTaskDialogOpen(true);
                                }}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium text-sm">{task.title}</h4>
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                                    >
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-2">
                                      {task.assignee && (
                                        <div className="flex items-center space-x-1">
                                          <User className="h-3 w-3" />
                                          <span>{task.assignee.name || task.assignee.email}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      {task.estimatedHours && (
                                        <div className="flex items-center space-x-1">
                                          <Clock className="h-3 w-3" />
                                          <span>{task.estimatedHours}h</span>
                                        </div>
                                      )}
                                      
                                      {task.dueAt && (
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>{new Date(task.dueAt).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task Details Dialog */}
      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          isOpen={isTaskDialogOpen}
          onClose={() => {
            setIsTaskDialogOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={fetchData}
          isManager={isManager}
          currentUserId={currentUserId}
          users={users}
          projectId={projectId}
        />
      )}

      {/* Create Task Dialog */}
      {isCreateDialogOpen && (
        <CreateTaskDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onTaskCreated={fetchData}
          projectId={projectId}
          users={users}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

// Task Details Dialog Component
interface TaskDetailsDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isManager: boolean;
  currentUserId: string;
  users: Array<{ id: string; name: string | null; email: string }>;
  projectId: string;
}

function TaskDetailsDialog({
  task,
  isOpen,
  onClose,
  onUpdate,
  isManager,
  currentUserId,
  users,
  projectId,
}: TaskDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    assigneeId: task.assigneeId || '',
    dueAt: task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : '',
    estimatedHours: task.estimatedHours || '',
    actualHours: task.actualHours || '',
  });

  const canEdit = isManager || currentUserId === task.assigneeId || currentUserId === task.creator?.email;

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          assigneeId: formData.assigneeId || null,
          dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
          actualHours: formData.actualHours ? parseFloat(formData.actualHours) : null,
        }),
      });

      if (response.ok) {
        onUpdate();
        onClose();
        toast.success('Task updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${task.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          fromStatus: task.status,
        }),
      });

      if (response.ok) {
        onUpdate();
        toast.success('Task status updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>TASK DETAILS</span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{task.status}</Badge>
              <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                {task.priority}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
                disabled={!isManager}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueAt">Due Date</Label>
              <Input
                id="dueAt"
                type="date"
                value={formData.dueAt}
                onChange={(e) => setFormData(prev => ({ ...prev, dueAt: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualHours">Actual Hours</Label>
              <Input
                id="actualHours"
                type="number"
                step="0.5"
                value={formData.actualHours}
                onChange={(e) => setFormData(prev => ({ ...prev, actualHours: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Status Change Buttons */}
          <div className="space-y-2">
            <Label>Change Status</Label>
            <div className="flex space-x-2">
              {statusColumns.map((status) => (
                <Button
                  key={status.id}
                  variant={task.status === status.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(status.id)}
                  disabled={loading || !canEdit}
                >
                  {getStatusIcon(status.id)}
                  <span className="ml-2">{status.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Create Task Dialog Component
interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  projectId: string;
  users: Array<{ id: string; name: string | null; email: string }>;
  currentUserId: string;
}

function CreateTaskDialog({
  isOpen,
  onClose,
  onTaskCreated,
  projectId,
  users,
  currentUserId,
}: CreateTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assigneeId: '',
    dueAt: '',
    estimatedHours: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please provide a task title');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          assigneeId: formData.assigneeId || null,
          dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
          createdBy: currentUserId,
        }),
      });

      if (response.ok) {
        onTaskCreated();
        onClose();
        setFormData({
          title: '',
          description: '',
          priority: 'Medium',
          assigneeId: '',
          dueAt: '',
          estimatedHours: '',
        });
        toast.success('Task created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>CREATE NEW TASK</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueAt">Due Date</Label>
              <Input
                id="dueAt"
                type="date"
                value={formData.dueAt}
                onChange={(e) => setFormData(prev => ({ ...prev, dueAt: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

