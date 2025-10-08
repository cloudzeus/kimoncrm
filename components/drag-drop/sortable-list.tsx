"use client";

import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface SortableItem {
  id: string;
  order: number;
  [key: string]: any;
}

interface SortableListProps<T extends SortableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  onEdit,
  onDelete,
  onView,
  renderItem,
  title,
  emptyMessage = "No items to display",
  className = "",
}: SortableListProps<T>) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (result: DropResult) => {
    setDraggedItem(result.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggedItem(null);

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // Create new array with reordered items
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(destinationIndex, 0, reorderedItem);

    // Update order values
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    onReorder(updatedItems);
  };

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm text-muted-foreground">
            {items.length} items
          </div>
        </div>
      )}

      {sortedItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable droppableId="sortable-list">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-2 ${snapshot.isDraggingOver ? "bg-muted/50 rounded-md" : ""}`}
              >
                {sortedItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all duration-200 ${
                          snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                        } ${draggedItem === item.id ? "opacity-50" : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab hover:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            <div className="flex-1">
                              {renderItem(item, index)}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {onView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onView(item)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(item)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
        </DragDropContext>
      )}
    </div>
  );
}
