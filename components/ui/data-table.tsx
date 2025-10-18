// @ts-nocheck
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Settings, 
  Search,
  Eye,
  EyeOff,
  GripVertical,
  ArrowUpDown,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  visible?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  type?: "string" | "number" | "date" | "boolean" | "custom";
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  key: string;
  value: string;
  operator: "contains" | "equals" | "startsWith" | "endsWith";
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  resizable?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onSortChange?: (sort: SortConfig | null) => void;
  onFilterChange?: (filters: FilterConfig[]) => void;
  onExport?: (data: T[], columns: Column<T>[]) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  exportable = true,
  sortable = true,
  filterable = true,
  selectable = false,
  resizable = true,
  onRowClick,
  onSelectionChange,
  onSortChange,
  onFilterChange,
  onExport,
  className = "",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [columnConfig, setColumnConfig] = useState<Record<string, { visible: boolean; width: number }>>(
    columns.reduce((acc, col) => ({
      ...acc,
      [col.key as string]: {
        visible: col.visible !== false,
        width: col.width || 150,
      },
    }), {})
  );
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

  // Helper functions
  const getNestedValue = (obj: any, path: string) => {
    if (!path) return undefined;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = getNestedValue(row, col.key);
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    if (filters.length > 0) {
      result = result.filter((row) =>
        filters.every((filter) => {
          const value = getNestedValue(row, filter.key);
          const filterValue = filter.value.toLowerCase();
          const stringValue = value?.toString().toLowerCase() || "";

          switch (filter.operator) {
            case "contains":
              return stringValue.includes(filterValue);
            case "equals":
              return stringValue === filterValue;
            case "startsWith":
              return stringValue.startsWith(filterValue);
            case "endsWith":
              return stringValue.endsWith(filterValue);
            default:
              return true;
          }
        })
      );
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, columns]);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    if (!sortable) return;

    const newSortConfig: SortConfig = {
      key,
      direction: sortConfig?.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    };

    setSortConfig(newSortConfig);
    onSortChange?.(newSortConfig);
  }, [sortConfig, sortable, onSortChange]);

  // Handle column visibility toggle
  const toggleColumnVisibility = useCallback((key: string) => {
    setColumnConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        visible: !prev[key].visible,
      },
    }));
  }, []);

  // Handle column width change
  const handleColumnResize = useCallback((key: string, newWidth: number) => {
    const column = columns.find(col => col.key === key);
    const minWidth = column?.minWidth || 50;
    const maxWidth = column?.maxWidth || 500;

    setColumnConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        width: Math.min(Math.max(newWidth, minWidth), maxWidth),
      },
    }));
  }, [columns]);

  // Handle row selection
  const toggleRowSelection = useCallback((rowId: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    setSelectedRows(newSelection);

    const selectedData = data.filter(row => newSelection.has(getRowId(row)));
    onSelectionChange?.(selectedData);
  }, [selectedRows, data, onSelectionChange]);

  // Handle select all
  const toggleSelectAll = useCallback(() => {
    if (selectedRows.size === filteredAndSortedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelection = new Set(filteredAndSortedData.map(row => getRowId(row)));
      setSelectedRows(newSelection);
      onSelectionChange?.(filteredAndSortedData);
    }
  }, [selectedRows, filteredAndSortedData, onSelectionChange]);

  // Export to Excel
  const handleExport = useCallback(async () => {
    try {
      const visibleColumns = columns.filter(col => columnConfig[col.key as string]?.visible);
      
      const exportData = filteredAndSortedData.map(row => {
        const exportRow: Record<string, any> = {};
        visibleColumns.forEach(col => {
          const value = getNestedValue(row, col.key);
          exportRow[col.label] = value;
        });
        return exportRow;
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data");

      // Add headers
      if (exportData.length > 0) {
        const headers = Object.keys(exportData[0]);
        worksheet.addRow(headers);
        
        // Add data rows
        exportData.forEach(row => {
          worksheet.addRow(Object.values(row));
        });
      }

      // Generate and download the file
      const fileName = `export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully");
      onExport?.(filteredAndSortedData, visibleColumns);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  }, [filteredAndSortedData, columns, columnConfig, onExport]);

  // Helper functions
  const getRowId = (row: T) => {
    return row.id || row.key || JSON.stringify(row);
  };

  const visibleColumns = columns.filter(col => columnConfig[col.key as string]?.visible);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          )}
          
          {filterable && (
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {selectable && (
            <Badge variant="secondary">
              {selectedRows.size} selected
            </Badge>
          )}
          
          <DropdownMenu open={columnSettingsOpen} onOpenChange={setColumnSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuItem
                  key={column.key as string}
                  onClick={() => toggleColumnVisibility(column.key as string)}
                  className="flex items-center space-x-2"
                >
                  {columnConfig[column.key as string]?.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span>{column.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {selectable && (
                  <th className="w-12 px-4 py-3 text-left">
                    <Checkbox
                      checked={selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                )}
                
                {visibleColumns.map((column, index) => (
                  <th
                    key={`header-${column.key as string}-${index}`}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                    style={{ width: columnConfig[column.key as string]?.width }}
                  >
                    <div className="flex items-center space-x-2">
                      {sortable && column.sortable !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort(column.key as string)}
                        >
                          {column.label}
                          {sortConfig?.key === column.key && sortConfig && (
                            sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            )
                          )}
                        </Button>
                      )}
                      {(!sortable || column.sortable === false) && (
                        <span>{column.label}</span>
                      )}
                      
                      {resizable && (
                        <div className="flex-1 cursor-col-resize" 
                             onMouseDown={(e) => {
                               // Column resize logic would go here
                               // This is a simplified version
                             }}>
                          <GripVertical className="h-3 w-3 opacity-0 hover:opacity-100" />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {loading ? (
                <tr>
                  <td 
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)} 
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredAndSortedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)} 
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((row, index) => (
                  <tr
                    key={getRowId(row)}
                    className={`border-t hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedRows.has(getRowId(row))}
                          onCheckedChange={() => toggleRowSelection(getRowId(row))}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    
                    {visibleColumns.map((column, columnIndex) => (
                      <td key={`${getRowId(row)}-${column.key as string}-${columnIndex}`} className="px-4 py-3">
                        {column.render ? (
                          column.render(getNestedValue(row, column.key), row)
                        ) : (
                          <span>{getNestedValue(row, column.key)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredAndSortedData.length} of {data.length} entries
        </div>
        <div>
          {selectedRows.size > 0 && `${selectedRows.size} selected`}
        </div>
      </div>
    </div>
  );
}
