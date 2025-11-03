"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Calendar,
  Eye,
  Edit,
  GripVertical,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATUSES = [
  { id: "NOT_STARTED", label: "NOT STARTED", color: "bg-gray-500" },
  { id: "IN_PROGRESS", label: "IN PROGRESS", color: "bg-blue-500" },
  { id: "COMPLETED", label: "COMPLETED", color: "bg-green-500" },
];

interface AdminTasksKanbanProps {
  tasks: any[];
  onTaskUpdate: (taskId: string, status: string) => void;
  onViewDetails: (task: any) => void;
}

export function AdminTasksKanban({ tasks, onTaskUpdate, onViewDetails }: AdminTasksKanbanProps) {
  const [localTasks, setLocalTasks] = useState(tasks);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    const taskId = draggableId;
    const destStatus = destination.droppableId;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Optimistic update
    setLocalTasks(prevTasks => {
      const newTasks = [...prevTasks];
      const taskIndex = newTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const task = newTasks[taskIndex];
      task.status = destStatus;

      return newTasks;
    });

    try {
      // Call the update function
      await onTaskUpdate(taskId, destStatus);
      toast.success("Task status updated");
    } catch (error) {
      // Revert on error
      setLocalTasks(tasks);
      toast.error("Failed to update task");
    }
  };

  const getTasksByStatus = (status: string) => {
    return localTasks.filter(task => task.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map((status) => (
          <div key={status.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", status.color)} />
              <h3 className="font-semibold text-sm">{status.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {getTasksByStatus(status.id).length}
              </Badge>
            </div>

            <Droppable droppableId={status.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "space-y-2 min-h-[200px] p-2 rounded-lg transition-colors",
                    snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/20"
                  )}
                >
                  {getTasksByStatus(status.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "shadow-sm hover:shadow-md transition-shadow",
                            snapshot.isDragging && "rotate-2 shadow-lg"
                          )}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate mb-1">
                                  {task.title}
                                </h4>
                                {task.lead && (
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {task.lead.title}
                                  </p>
                                )}
                                {task.project && (
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {task.project.name}
                                  </p>
                                )}
                                {(task.assignedTo || task.assignee) && (
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                                    <User className="h-3 w-3" />
                                    {task.assignedTo?.name || task.assignee?.name || task.assignedTo?.email || task.assignee?.email}
                                  </p>
                                )}
                                {(task.dueDate || task.dueAt) && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className={cn(
                                      "text-xs",
                                      new Date(task.dueDate || task.dueAt) < new Date() && status.id !== "COMPLETED"
                                        ? "text-red-500 font-semibold"
                                        : "text-muted-foreground"
                                    )}>
                                      {format(new Date(task.dueDate || task.dueAt), "MMM dd")}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => onViewDetails(task)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {(task.leadId || task.projectId) && (
                                  <Link href={task.leadId ? `/leads/${task.leadId}` : `/projects/${task.projectId}`}>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

