"use client";

import { useState, useRef, useEffect } from "react";
import { TableHead } from "@/components/ui/table";
import { GripVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface ResizableTableHeaderProps {
  width: number;
  onResize: (newWidth: number) => void;
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  onSort?: () => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  sortKey?: string;
}

export function ResizableTableHeader({
  width,
  onResize,
  children,
  className,
  sortable,
  onSort,
  sortConfig,
  sortKey,
}: ResizableTableHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const headerRef = useRef<HTMLTableCellElement>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const diff = e.clientX - startX.current;
      const newWidth = startWidth.current + diff;
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = width;
  };

  const handleSortClick = (e: React.MouseEvent) => {
    // Don't trigger sort when clicking the resize handle
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle')) {
      return;
    }
    
    if (sortable && onSort) {
      onSort();
    }
  };

  const getSortIcon = () => {
    if (!sortable || !sortConfig || !sortKey) return null;
    
    const isActive = sortConfig.key === sortKey;
    if (!isActive) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  return (
    <TableHead
      ref={headerRef}
      className={`relative group ${className || ""} ${sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
      onClick={handleSortClick}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex-1 overflow-hidden flex items-center gap-1">
          {children}
          {getSortIcon()}
        </div>
        <div
          onMouseDown={handleMouseDown}
          className="resize-handle absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/50 flex items-center justify-center"
          style={{ width: "8px", marginRight: "-4px" }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </TableHead>
  );
}

