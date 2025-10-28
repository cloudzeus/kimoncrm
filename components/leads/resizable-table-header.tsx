"use client";

import { useState, useRef, useEffect } from "react";
import { TableHead } from "@/components/ui/table";
import { GripVertical } from "lucide-react";

interface ResizableTableHeaderProps {
  width: number;
  onResize: (newWidth: number) => void;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ResizableTableHeader({
  width,
  onResize,
  children,
  className,
  onClick,
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

  return (
    <TableHead
      ref={headerRef}
      className={`relative group ${className || ""}`}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 overflow-hidden">{children}</div>
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

