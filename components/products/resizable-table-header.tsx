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
  sortKey?: string;
  currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

export function ResizableTableHeader({
  width,
  onResize,
  children,
  className,
  sortable = false,
  sortKey,
  currentSort,
  onSort,
}: ResizableTableHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const headerRef = useRef<HTMLTableCellElement>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const diff = e.clientX - startX.current;
      const newWidth = Math.max(60, startWidth.current + diff); // Min width 60px
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
    e.stopPropagation();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = width;
  };

  const handleSort = () => {
    if (sortable && sortKey && onSort) {
      onSort(sortKey);
    }
  };

  const isSorted = sortable && currentSort?.key === sortKey;
  const sortDirection = isSorted ? currentSort?.direction : null;

  return (
    <TableHead
      ref={headerRef}
      className={`relative group ${className || ""}`}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
    >
      <div className="flex items-center justify-between">
        <div 
          className={`flex-1 overflow-hidden flex items-center gap-1 ${sortable ? 'cursor-pointer hover:text-primary' : ''}`}
          onClick={handleSort}
        >
          {children}
          {sortable && (
            <div className="ml-1">
              {!isSorted && <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
              {isSorted && sortDirection === 'asc' && <ArrowUp className="h-3 w-3" />}
              {isSorted && sortDirection === 'desc' && <ArrowDown className="h-3 w-3" />}
            </div>
          )}
        </div>
        <div
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/50 flex items-center justify-center"
          style={{ width: "8px", marginRight: "-4px" }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </TableHead>
  );
}

