"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  GripVertical,
  Settings2,
  Eye,
  EyeOff,
  RotateCw,
  ExternalLink,
  MoreVertical,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { ResizableTableHeader } from "./resizable-table-header";
import { toast } from "sonner";
import { FileUpload } from "@/components/files/file-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ExcelJS from "exceljs";
import { safeJsonParse } from "@/lib/safe-json";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Supplier {
  id: string;
  trdr: number | null;
  code: string | null;
  afm: string | null;
  name: string;
  sotitle: string | null;
  jobtypetrd: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  district: string | null;
  country: string | null;
  isactive: "ACTIVE" | "INACTIVE";
  erp: boolean;
  phone01: string | null;
  phone02: string | null;
  email: string | null;
  emailacc: string | null;
  irsdata: string | null;
  socurrency: number | null;
  update: string;
  createdAt: string;
  countryRel?: {
    name: string;
    softoneCode: string;
  } | null;
}

export function SuppliersManager() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [supplierForUpload, setSupplierForUpload] = useState<Supplier | null>(null);
  // Default values that work for both server and client
  const defaultColumnWidths = {
      trdr: 100,
      code: 120,
      afm: 130,
      name: 250,
      sotitle: 200,
      jobtypetrd: 150,
      address: 220,
      city: 130,
      zip: 100,
      district: 140,
      country: 130,
      phone: 140,
      phone02: 140,
      email: 200,
      emailacc: 200,
      irsdata: 180,
      socurrency: 130,
      status: 110,
      erp: 120,
      createdAt: 170,
      updatedAt: 170,
      actions: 80, // Compact for dropdown menu
  };

  const defaultVisibleColumns = {
    trdr: false,
    code: true,
    afm: true,
    name: true,
    sotitle: false,
    jobtypetrd: false,
    address: false,
    city: true,
    zip: false,
    district: false,
    country: false,
    phone: true,
    phone02: false,
    email: true,
    emailacc: false,
    irsdata: false,
    socurrency: false,
    status: true,
    erp: true,
    createdAt: false,
    updatedAt: false,
  };

  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    const savedWidths = localStorage.getItem("suppliers-column-widths");
    const savedVisibility = localStorage.getItem("suppliers-visible-columns");

    if (savedWidths) {
      try {
        const parsedWidths = JSON.parse(savedWidths);
        // Merge with defaults to include new fields
        setColumnWidths({ ...defaultColumnWidths, ...parsedWidths });
      } catch (e) {
        console.error("Failed to parse column widths:", e);
        setColumnWidths(defaultColumnWidths);
      }
    } else {
      setColumnWidths(defaultColumnWidths);
    }

    if (savedVisibility) {
      try {
        const parsedVisibility = JSON.parse(savedVisibility);
        // Merge with defaults to include new fields
        setVisibleColumns({ ...defaultVisibleColumns, ...parsedVisibility });
      } catch (e) {
        console.error("Failed to parse visible columns:", e);
        setVisibleColumns(defaultVisibleColumns);
      }
    } else {
      setVisibleColumns(defaultVisibleColumns);
    }

    setIsHydrated(true);
  }, []);

  const fetchSuppliers = async (searchQuery = "", searchBy = "all", pageNum = 1, limit = 50) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(searchBy !== "all" && { searchField: searchBy }),
      });

      const response = await fetch(`/api/suppliers?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        toast.error(`Failed to fetch suppliers: ${response.status}`);
        return;
      }

      const responseText = await response.text();
      if (!responseText) {
        console.error("Empty response from suppliers API");
        toast.error("Empty response from server");
        return;
      }

      const data = safeJsonParse(responseText);
      if (!data) {
        console.error("Failed to parse suppliers response");
        toast.error("Invalid response from server");
        return;
      }
      setSuppliers(data.suppliers);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(searchTerm, searchField, page, pageSize);
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchSuppliers(searchTerm, searchField, 1, pageSize);
  };

  const handleSyncSoftOne = async () => {
    try {
      setSyncing(true);
      toast.loading("Syncing suppliers from SoftOne ERP...");

      const response = await fetch("/api/suppliers/sync-softone", {
        method: "POST",
      });

      toast.dismiss();

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Sync API Error:", response.status, errorText);
        toast.error(`Failed to sync suppliers: ${response.status}`);
        return;
      }

      const responseText = await response.text();
      if (!responseText) {
        console.error("Empty response from sync API");
        toast.error("Empty response from server");
        return;
      }

      const data = safeJsonParse(responseText);
      if (!data) {
        console.error("Failed to parse sync response");
        toast.error("Invalid response from server");
        return;
      }

      if (data.success) {
        toast.success(
          `Sync completed: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped`
        );
        fetchSuppliers(searchTerm, searchField, page, pageSize);
      } else {
        toast.error(data.error || "Failed to sync suppliers");
      }
    } catch (error) {
      console.error("Error syncing suppliers:", error);
      toast.error("Failed to sync suppliers");
    } finally {
      setSyncing(false);
    }
  };

  const handleView = (supplierId: string) => {
    router.push(`/suppliers/${supplierId}`);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleUploadFiles = (supplier: Supplier) => {
    setSupplierForUpload(supplier);
    setUploadDialogOpen(true);
  };

  const handleUpdateFromAFM = async (supplier: Supplier) => {
    if (!supplier.afm) {
      toast.error("Supplier has no AFM to validate");
      return;
    }

    try {
      toast.loading(`Updating ${supplier.name} from Greek Tax Authority...`);

      const response = await fetch(`/api/suppliers/${supplier.id}/update-from-afm`, {
        method: "PATCH",
      });

      toast.dismiss();

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update API Error:", response.status, errorText);
        toast.error(`Failed to update supplier: ${response.status}`);
        return;
      }

      const responseText = await response.text();
      if (!responseText) {
        console.error("Empty response from update API");
        toast.error("Empty response from server");
        return;
      }

      const data = safeJsonParse(responseText);
      if (!data) {
        console.error("Failed to parse update response");
        toast.error("Invalid response from server");
        return;
      }

      if (data.success) {
        toast.success(
          `Supplier updated successfully. Fields updated: ${data.updatedFields.join(", ")}`
        );
        fetchSuppliers(searchTerm, searchField, page, pageSize);
      } else {
        toast.error(data.error || "Failed to update supplier");
      }
    } catch (error) {
      console.error("Error updating supplier from AFM:", error);
      toast.dismiss();
      toast.error("Failed to update supplier from Greek Tax Authority");
    }
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      const response = await fetch(`/api/suppliers/${supplierToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete API Error:", response.status, errorText);
        toast.error(`Failed to delete supplier: ${response.status}`);
        return;
      }

      // For DELETE, we don't need to parse JSON response
      toast.success("Supplier deleted successfully");
      fetchSuppliers(searchTerm, searchField, page, pageSize);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Failed to delete supplier");
    } finally {
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleDialogClose = (refresh = false) => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    if (refresh) {
      fetchSuppliers(searchTerm, searchField, page, pageSize);
    }
  };

  // Handle column resize
  const handleColumnResize = (column: string, newWidth: number) => {
    const newWidths = {
      ...columnWidths,
      [column]: Math.max(80, newWidth), // Minimum width of 80px
    };
    setColumnWidths(newWidths);
    if (isHydrated) {
      localStorage.setItem("suppliers-column-widths", JSON.stringify(newWidths));
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    const newVisibility = {
      ...visibleColumns,
      [column]: !visibleColumns[column],
    };
    setVisibleColumns(newVisibility);
    if (isHydrated) {
      localStorage.setItem("suppliers-visible-columns", JSON.stringify(newVisibility));
    }
  };

  // Reset view to defaults
  const resetView = () => {
    setColumnWidths(defaultColumnWidths);
    setVisibleColumns(defaultVisibleColumns);
    if (isHydrated) {
      localStorage.setItem("suppliers-column-widths", JSON.stringify(defaultColumnWidths));
      localStorage.setItem("suppliers-visible-columns", JSON.stringify(defaultVisibleColumns));
    }
    toast.success("View reset to default with all available fields");
  };

  // Export to Excel
  const handleExportToExcel = async () => {
    try {
      toast.loading("Exporting suppliers to Excel...");

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Suppliers");

      // Define columns based on visible columns
      const columns: any[] = [];
      
      if (visibleColumns.trdr) {
        columns.push({ header: "SOFTONE ID (TRDR)", key: "trdr", width: 15 });
      }
      if (visibleColumns.code) {
        columns.push({ header: "CODE", key: "code", width: 15 });
      }
      if (visibleColumns.afm) {
        columns.push({ header: "AFM", key: "afm", width: 15 });
      }
      if (visibleColumns.name) {
        columns.push({ header: "NAME", key: "name", width: 35 });
      }
      if (visibleColumns.sotitle) {
        columns.push({ header: "COMMERCIAL TITLE", key: "sotitle", width: 30 });
      }
      if (visibleColumns.jobtypetrd) {
        columns.push({ header: "JOB TYPE", key: "jobtypetrd", width: 20 });
      }
      if (visibleColumns.address) {
        columns.push({ header: "ADDRESS", key: "address", width: 30 });
      }
      if (visibleColumns.city) {
        columns.push({ header: "CITY", key: "city", width: 20 });
      }
      if (visibleColumns.zip) {
        columns.push({ header: "ZIP", key: "zip", width: 10 });
      }
      if (visibleColumns.district) {
        columns.push({ header: "DISTRICT", key: "district", width: 20 });
      }
      if (visibleColumns.country) {
        columns.push({ header: "COUNTRY", key: "country", width: 20 });
      }
      if (visibleColumns.phone) {
        columns.push({ header: "PHONE 1", key: "phone01", width: 15 });
      }
      if (visibleColumns.phone02) {
        columns.push({ header: "PHONE 2", key: "phone02", width: 15 });
      }
      if (visibleColumns.email) {
        columns.push({ header: "EMAIL", key: "email", width: 30 });
      }
      if (visibleColumns.emailacc) {
        columns.push({ header: "ACCOUNTING EMAIL", key: "emailacc", width: 30 });
      }
      if (visibleColumns.irsdata) {
        columns.push({ header: "TAX OFFICE", key: "irsdata", width: 25 });
      }
      if (visibleColumns.socurrency) {
        columns.push({ header: "CURRENCY", key: "socurrency", width: 15 });
      }
      if (visibleColumns.status) {
        columns.push({ header: "STATUS", key: "isactive", width: 12 });
      }
      if (visibleColumns.erp) {
        columns.push({ header: "ERP SYNCED", key: "erp", width: 12 });
      }
      if (visibleColumns.createdAt) {
        columns.push({ header: "CREATED DATE", key: "createdAt", width: 20 });
      }
      if (visibleColumns.updatedAt) {
        columns.push({ header: "LAST UPDATED", key: "update", width: 20 });
      }

      worksheet.columns = columns;

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data rows
      suppliers.forEach((supplier) => {
        const row: any = {};
        
        if (visibleColumns.trdr) row.trdr = supplier.trdr || "-";
        if (visibleColumns.code) row.code = supplier.code || "-";
        if (visibleColumns.afm) row.afm = supplier.afm || "-";
        if (visibleColumns.name) row.name = supplier.name;
        if (visibleColumns.sotitle) row.sotitle = supplier.sotitle || "-";
        if (visibleColumns.jobtypetrd) row.jobtypetrd = supplier.jobtypetrd || "-";
        if (visibleColumns.address) row.address = supplier.address || "-";
        if (visibleColumns.city) row.city = supplier.city || "-";
        if (visibleColumns.zip) row.zip = supplier.zip || "-";
        if (visibleColumns.district) row.district = supplier.district || "-";
        if (visibleColumns.country) row.country = supplier.countryRel?.name || supplier.country || "-";
        if (visibleColumns.phone) row.phone01 = supplier.phone01 || "-";
        if (visibleColumns.phone02) row.phone02 = supplier.phone02 || "-";
        if (visibleColumns.email) row.email = supplier.email || "-";
        if (visibleColumns.emailacc) row.emailacc = supplier.emailacc || "-";
        if (visibleColumns.irsdata) row.irsdata = supplier.irsdata || "-";
        if (visibleColumns.socurrency) row.socurrency = supplier.socurrency || "-";
        if (visibleColumns.status) row.isactive = supplier.isactive;
        if (visibleColumns.erp) row.erp = supplier.erp ? "Yes" : "No";
        if (visibleColumns.createdAt) row.createdAt = new Date(supplier.createdAt).toLocaleString();
        if (visibleColumns.updatedAt) row.update = new Date(supplier.update).toLocaleString();

        worksheet.addRow(row);
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `suppliers_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(`Exported ${suppliers.length} suppliers to Excel`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.dismiss();
      toast.error("Failed to export suppliers to Excel");
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-2xl">
          {isHydrated ? (
            <Select value={searchField} onValueChange={setSearchField}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="afm">AFM</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone01">Phone</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="w-[140px] h-9 border rounded-md" />
          )}
          
          <Input
            placeholder={`Search ${searchField === "all" ? "all fields" : searchField}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[11px] uppercase">Column Settings</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetView}
                    className="h-8 text-xs"
                  >
                    Reset View
                  </Button>
                </div>
                <div className="space-y-3">
                  {Object.entries(visibleColumns).map(([column, visible]) => {
                    const columnLabels: Record<string, string> = {
                      trdr: "SOFTONE ID (TRDR)",
                      code: "CODE",
                      afm: "AFM",
                      name: "NAME",
                      sotitle: "COMMERCIAL TITLE",
                      jobtypetrd: "JOB TYPE",
                      address: "ADDRESS",
                      city: "CITY",
                      zip: "ZIP",
                      district: "DISTRICT",
                      country: "COUNTRY",
                      phone: "PHONE 1",
                      phone02: "PHONE 2",
                      email: "EMAIL",
                      emailacc: "ACCOUNTING EMAIL",
                      irsdata: "TAX OFFICE",
                      socurrency: "CURRENCY",
                      status: "STATUS",
                      erp: "ERP SYNC",
                      createdAt: "CREATED DATE",
                      updatedAt: "LAST UPDATED",
                    };
                    return (
                      <div key={column} className="flex items-center space-x-2">
                        <Checkbox
                          id={column}
                          checked={visible}
                          onCheckedChange={() => toggleColumnVisibility(column)}
                        />
                        <Label
                          htmlFor={column}
                          className="text-[11px] font-normal cursor-pointer flex items-center gap-2"
                        >
                          {visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {columnLabels[column] || column.toUpperCase()}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={suppliers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>

          <Button
            variant="outline"
            onClick={handleSyncSoftOne}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            Sync SoftOne
          </Button>

          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Supplier
          </Button>
        </div>
      </div>

      {/* Field Labels */}
      <div className="bg-muted/30 rounded-lg p-3">
        <div className="flex flex-wrap gap-4 text-xs">
          {visibleColumns.trdr && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">TRDR:</span>
              <span className="text-muted-foreground">SoftOne ID</span>
            </div>
          )}
          {visibleColumns.code && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Code:</span>
              <span className="text-muted-foreground">Supplier Code</span>
            </div>
          )}
          {visibleColumns.afm && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">AFM:</span>
              <span className="text-muted-foreground">VAT Number</span>
            </div>
          )}
          {visibleColumns.name && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Name:</span>
              <span className="text-muted-foreground">Company Name</span>
            </div>
          )}
          {visibleColumns.sotitle && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Commercial Title:</span>
              <span className="text-muted-foreground">Trade Name</span>
            </div>
          )}
          {visibleColumns.jobtypetrd && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Job Type:</span>
              <span className="text-muted-foreground">Business Activity</span>
            </div>
          )}
          {visibleColumns.address && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Address:</span>
              <span className="text-muted-foreground">Street Address</span>
            </div>
          )}
          {visibleColumns.city && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">City:</span>
              <span className="text-muted-foreground">Location</span>
            </div>
          )}
          {visibleColumns.zip && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">ZIP:</span>
              <span className="text-muted-foreground">Postal Code</span>
            </div>
          )}
          {visibleColumns.district && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">District:</span>
              <span className="text-muted-foreground">Region/State</span>
            </div>
          )}
          {visibleColumns.country && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Country:</span>
              <span className="text-muted-foreground">Nation</span>
            </div>
          )}
          {visibleColumns.phone && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Phone 1:</span>
              <span className="text-muted-foreground">Primary Contact</span>
            </div>
          )}
          {visibleColumns.phone02 && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Phone 2:</span>
              <span className="text-muted-foreground">Secondary Contact</span>
            </div>
          )}
          {visibleColumns.email && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Email:</span>
              <span className="text-muted-foreground">Primary Email</span>
            </div>
          )}
          {visibleColumns.emailacc && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Accounting Email:</span>
              <span className="text-muted-foreground">Billing Email</span>
            </div>
          )}
          {visibleColumns.irsdata && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Tax Office:</span>
              <span className="text-muted-foreground">IRS Data</span>
            </div>
          )}
          {visibleColumns.socurrency && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Currency:</span>
              <span className="text-muted-foreground">Currency Code</span>
            </div>
          )}
          {visibleColumns.status && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Status:</span>
              <span className="text-muted-foreground">Active/Inactive</span>
            </div>
          )}
          {visibleColumns.erp && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">ERP:</span>
              <span className="text-muted-foreground">Sync Status</span>
            </div>
          )}
          {visibleColumns.createdAt && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Created:</span>
              <span className="text-muted-foreground">Created Date</span>
            </div>
          )}
          {visibleColumns.updatedAt && (
            <div className="flex items-center gap-1">
              <span className="font-semibold uppercase text-primary">Updated:</span>
              <span className="text-muted-foreground">Last Modified</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div>
          Showing {suppliers.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, total)} of {total} suppliers
        </div>
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          {isHydrated ? (
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="300">300</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="w-[100px] h-9 border rounded-md" />
          )}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.trdr && (
                <ResizableTableHeader
                  width={columnWidths.trdr}
                  onResize={(w) => handleColumnResize("trdr", w)}
                  className="font-semibold"
                >
                  TRDR
                </ResizableTableHeader>
              )}
              {visibleColumns.code && (
                <ResizableTableHeader
                  width={columnWidths.code}
                  onResize={(w) => handleColumnResize("code", w)}
                  className="font-semibold"
                >
                  CODE
                </ResizableTableHeader>
              )}
              {visibleColumns.afm && (
                <ResizableTableHeader
                  width={columnWidths.afm}
                  onResize={(w) => handleColumnResize("afm", w)}
                  className="font-semibold"
                >
                  AFM
                </ResizableTableHeader>
              )}
              {visibleColumns.name && (
                <ResizableTableHeader
                  width={columnWidths.name}
                  onResize={(w) => handleColumnResize("name", w)}
                  className="font-semibold"
                >
                  NAME
                </ResizableTableHeader>
              )}
              {visibleColumns.sotitle && (
                <ResizableTableHeader
                  width={columnWidths.sotitle}
                  onResize={(w) => handleColumnResize("sotitle", w)}
                  className="font-semibold"
                >
                  COMMERCIAL TITLE
                </ResizableTableHeader>
              )}
              {visibleColumns.jobtypetrd && (
                <ResizableTableHeader
                  width={columnWidths.jobtypetrd}
                  onResize={(w) => handleColumnResize("jobtypetrd", w)}
                  className="font-semibold"
                >
                  JOB TYPE
                </ResizableTableHeader>
              )}
              {visibleColumns.address && (
                <ResizableTableHeader
                  width={columnWidths.address}
                  onResize={(w) => handleColumnResize("address", w)}
                  className="font-semibold"
                >
                  ADDRESS
                </ResizableTableHeader>
              )}
              {visibleColumns.city && (
                <ResizableTableHeader
                  width={columnWidths.city}
                  onResize={(w) => handleColumnResize("city", w)}
                  className="font-semibold"
                >
                  CITY
                </ResizableTableHeader>
              )}
              {visibleColumns.zip && (
                <ResizableTableHeader
                  width={columnWidths.zip}
                  onResize={(w) => handleColumnResize("zip", w)}
                  className="font-semibold"
                >
                  ZIP
                </ResizableTableHeader>
              )}
              {visibleColumns.district && (
                <ResizableTableHeader
                  width={columnWidths.district}
                  onResize={(w) => handleColumnResize("district", w)}
                  className="font-semibold"
                >
                  DISTRICT
                </ResizableTableHeader>
              )}
              {visibleColumns.country && (
                <ResizableTableHeader
                  width={columnWidths.country}
                  onResize={(w) => handleColumnResize("country", w)}
                  className="font-semibold"
                >
                  COUNTRY
                </ResizableTableHeader>
              )}
              {visibleColumns.phone && (
                <ResizableTableHeader
                  width={columnWidths.phone}
                  onResize={(w) => handleColumnResize("phone", w)}
                  className="font-semibold"
                >
                  PHONE 1
                </ResizableTableHeader>
              )}
              {visibleColumns.phone02 && (
                <ResizableTableHeader
                  width={columnWidths.phone02}
                  onResize={(w) => handleColumnResize("phone02", w)}
                  className="font-semibold"
                >
                  PHONE 2
                </ResizableTableHeader>
              )}
              {visibleColumns.email && (
                <ResizableTableHeader
                  width={columnWidths.email}
                  onResize={(w) => handleColumnResize("email", w)}
                  className="font-semibold"
                >
                  EMAIL
                </ResizableTableHeader>
              )}
              {visibleColumns.emailacc && (
                <ResizableTableHeader
                  width={columnWidths.emailacc}
                  onResize={(w) => handleColumnResize("emailacc", w)}
                  className="font-semibold"
                >
                  ACCOUNTING EMAIL
                </ResizableTableHeader>
              )}
              {visibleColumns.irsdata && (
                <ResizableTableHeader
                  width={columnWidths.irsdata}
                  onResize={(w) => handleColumnResize("irsdata", w)}
                  className="font-semibold"
                >
                  TAX OFFICE
                </ResizableTableHeader>
              )}
              {visibleColumns.socurrency && (
                <ResizableTableHeader
                  width={columnWidths.socurrency}
                  onResize={(w) => handleColumnResize("socurrency", w)}
                  className="font-semibold"
                >
                  CURRENCY
                </ResizableTableHeader>
              )}
              {visibleColumns.status && (
                <ResizableTableHeader
                  width={columnWidths.status}
                  onResize={(w) => handleColumnResize("status", w)}
                  className="font-semibold"
                >
                  STATUS
                </ResizableTableHeader>
              )}
              {visibleColumns.erp && (
                <ResizableTableHeader
                  width={columnWidths.erp}
                  onResize={(w) => handleColumnResize("erp", w)}
                  className="font-semibold"
                >
                  ERP
                </ResizableTableHeader>
              )}
              {visibleColumns.createdAt && (
                <ResizableTableHeader
                  width={columnWidths.createdAt}
                  onResize={(w) => handleColumnResize("createdAt", w)}
                  className="font-semibold"
                >
                  CREATED
                </ResizableTableHeader>
              )}
              {visibleColumns.updatedAt && (
                <ResizableTableHeader
                  width={columnWidths.updatedAt}
                  onResize={(w) => handleColumnResize("updatedAt", w)}
                  className="font-semibold"
                >
                  UPDATED
                </ResizableTableHeader>
              )}
              <ResizableTableHeader
                width={columnWidths.actions}
                onResize={(w) => handleColumnResize("actions", w)}
                className="text-right font-semibold"
              >
                ACTIONS
              </ResizableTableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="text-center py-8">
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="text-center py-8 text-muted-foreground">
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  {visibleColumns.trdr && (
                    <TableCell 
                      style={{ width: `${columnWidths.trdr}px`, minWidth: `${columnWidths.trdr}px` }}
                    >
                      <div className="font-mono text-[11px]">{supplier.trdr || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.code && (
                    <TableCell 
                      style={{ width: `${columnWidths.code}px`, minWidth: `${columnWidths.code}px` }}
                    >
                      <div className="font-medium text-[11px]">{supplier.code || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.afm && (
                    <TableCell style={{ width: `${columnWidths.afm}px`, minWidth: `${columnWidths.afm}px` }}>
                      <div className="text-[11px]">{supplier.afm || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.name && (
                    <TableCell style={{ 
                      width: `${columnWidths.name}px`, 
                      minWidth: `${columnWidths.name}px`,
                      maxWidth: `${columnWidths.name}px`
                    }}>
                      <div className="font-medium text-[11px] break-words whitespace-normal">{supplier.name}</div>
                    </TableCell>
                  )}
                  {visibleColumns.sotitle && (
                    <TableCell style={{ 
                      width: `${columnWidths.sotitle}px`, 
                      minWidth: `${columnWidths.sotitle}px`
                    }}>
                      <div className="text-[11px] break-words whitespace-normal">
                        {supplier.sotitle || "-"}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.jobtypetrd && (
                    <TableCell style={{ width: `${columnWidths.jobtypetrd}px`, minWidth: `${columnWidths.jobtypetrd}px` }}>
                      <div className="text-[11px]">{supplier.jobtypetrd || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.address && (
                    <TableCell style={{ width: `${columnWidths.address}px`, minWidth: `${columnWidths.address}px` }}>
                      <div className="text-[11px] break-words whitespace-normal">
                        {supplier.address || "-"}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.city && (
                    <TableCell style={{ width: `${columnWidths.city}px`, minWidth: `${columnWidths.city}px` }}>
                      <div className="text-[11px]">{supplier.city || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.zip && (
                    <TableCell style={{ width: `${columnWidths.zip}px`, minWidth: `${columnWidths.zip}px` }}>
                      <div className="text-[11px]">{supplier.zip || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.district && (
                    <TableCell style={{ width: `${columnWidths.district}px`, minWidth: `${columnWidths.district}px` }}>
                      <div className="text-[11px]">{supplier.district || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.country && (
                    <TableCell style={{ width: `${columnWidths.country}px`, minWidth: `${columnWidths.country}px` }}>
                      <div className="text-[11px]">{supplier.countryRel?.name || supplier.country || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.phone && (
                    <TableCell style={{ width: `${columnWidths.phone}px`, minWidth: `${columnWidths.phone}px` }}>
                      <div className="text-[11px]">{supplier.phone01 || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.phone02 && (
                    <TableCell style={{ width: `${columnWidths.phone02}px`, minWidth: `${columnWidths.phone02}px` }}>
                      <div className="text-[11px]">{supplier.phone02 || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.email && (
                    <TableCell 
                      style={{ width: `${columnWidths.email}px`, minWidth: `${columnWidths.email}px` }}
                    >
                      <div className="text-[11px] truncate">{supplier.email || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.emailacc && (
                    <TableCell 
                      style={{ width: `${columnWidths.emailacc}px`, minWidth: `${columnWidths.emailacc}px` }}
                    >
                      <div className="text-[11px] truncate">{supplier.emailacc || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.irsdata && (
                    <TableCell style={{ width: `${columnWidths.irsdata}px`, minWidth: `${columnWidths.irsdata}px` }}>
                      <div className="text-[11px]">{supplier.irsdata || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.socurrency && (
                    <TableCell style={{ width: `${columnWidths.socurrency}px`, minWidth: `${columnWidths.socurrency}px` }}>
                      <div className="text-[11px]">{supplier.socurrency || "-"}</div>
                    </TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell style={{ width: `${columnWidths.status}px`, minWidth: `${columnWidths.status}px` }}>
                      <Badge
                        variant={
                          supplier.isactive === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {supplier.isactive === "ACTIVE" ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.erp && (
                    <TableCell style={{ width: `${columnWidths.erp}px`, minWidth: `${columnWidths.erp}px` }}>
                      {supplier.erp ? (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          <span className="text-green-600">Synced</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Synced
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.createdAt && (
                    <TableCell style={{ width: `${columnWidths.createdAt}px`, minWidth: `${columnWidths.createdAt}px` }}>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.updatedAt && (
                    <TableCell style={{ width: `${columnWidths.updatedAt}px`, minWidth: `${columnWidths.updatedAt}px` }}>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(supplier.update).toLocaleDateString()}
                      </div>
                    </TableCell>
                  )}
                  <TableCell 
                    className="text-right" 
                    style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}
                  >
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleView(supplier.id)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {supplier.afm && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateFromAFM(supplier)}>
                                <RotateCw className="h-4 w-4 mr-2" />
                                Update from Tax Authority
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUploadFiles(supplier)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Files
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(supplier)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Supplier Form Dialog */}
      <SupplierFormDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        supplier={editingSupplier}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete supplier &quot;{supplierToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Files Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>UPLOAD FILES</DialogTitle>
            <DialogDescription>
              Upload files for supplier: {supplierForUpload?.name} (AFM: {supplierForUpload?.afm})
            </DialogDescription>
          </DialogHeader>
          {supplierForUpload && supplierForUpload.afm && (
            <FileUpload
              entityId={supplierForUpload.id}
              entityType="SUPPLIER"
              folderName={supplierForUpload.afm}
              onUploadComplete={() => {
                toast.success("Files uploaded successfully");
              }}
              onClose={() => {
                setUploadDialogOpen(false);
                setSupplierForUpload(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

