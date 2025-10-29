"use client";

import { useState, useEffect, Fragment } from "react";
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
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  MoreVertical,
  Filter,
  TrendingUp,
  Calendar,
  User,
  DollarSign,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DealStage, LeadStatus, LeadPriority } from "@prisma/client";
import { LeadFormDialog } from "./lead-form-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResizableTableHeader } from "./resizable-table-header";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, EyeOff, ChevronDown, ChevronRight, CheckCircle, Upload as UploadIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Lead {
  id: string;
  leadNumber: string | null;
  title: string;
  description: string | null;
  stage: DealStage;
  status: LeadStatus;
  priority: LeadPriority;
  estimatedValue: number | null;
  probability: number | null;
  customer: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  contact: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    avatar: string | null;
    role: string;
  } | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    avatar: string | null;
    role: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  expectedCloseDate: string | null;
  requestedSiteSurvey: boolean;
  siteSurvey?: {
    id: string;
    title: string;
    status: string;
  } | null;
  _count: {
    quotes: number;
    rfps: number;
    projects: number;
    emails: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const STAGE_COLORS: Record<DealStage, string> = {
  LEAD_NEW: "bg-blue-500 text-white",
  LEAD_WORKING: "bg-purple-500 text-white",
  LEAD_NURTURING: "bg-yellow-500 text-white",
  LEAD_QUALIFIED: "bg-green-500 text-white",
  LEAD_DISQUALIFIED: "bg-red-500 text-white",
  OPP_PROSPECTING: "bg-cyan-500 text-white",
  OPP_DISCOVERY: "bg-indigo-500 text-white",
  OPP_QUALIFIED: "bg-emerald-500 text-white",
  OPP_PROPOSAL: "bg-orange-500 text-white",
  OPP_NEGOTIATION: "bg-amber-500 text-white",
  OPP_CLOSED_WON: "bg-green-600 text-white",
  OPP_CLOSED_LOST: "bg-red-600 text-white",
  RFP_RECEIVED: "bg-sky-500 text-white",
  RFP_GO_NO_GO: "bg-slate-500 text-white",
  RFP_DRAFTING: "bg-violet-500 text-white",
  RFP_INTERNAL_REVIEW: "bg-yellow-600 text-white",
  RFP_SUBMITTED: "bg-blue-600 text-white",
  RFP_CLARIFICATIONS: "bg-orange-600 text-white",
  RFP_AWARDED: "bg-green-700 text-white",
  RFP_LOST: "bg-red-700 text-white",
  RFP_CANCELLED: "bg-gray-600 text-white",
  QUOTE_DRAFT: "bg-cyan-600 text-white",
  QUOTE_INTERNAL_REVIEW: "bg-yellow-700 text-white",
  QUOTE_SENT: "bg-purple-600 text-white",
  QUOTE_NEGOTIATION: "bg-orange-700 text-white",
  QUOTE_ACCEPTED: "bg-green-800 text-white",
  QUOTE_REJECTED: "bg-red-800 text-white",
  QUOTE_EXPIRED: "bg-gray-700 text-white",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  ACTIVE: "bg-green-500 text-white",
  WON: "bg-emerald-600 text-white",
  LOST: "bg-red-600 text-white",
  CLOSED: "bg-gray-500 text-white",
  ARCHIVED: "bg-slate-600 text-white",
  FROZEN: "bg-cyan-500 text-white",
};

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  URGENT: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
};

export function LeadsManager() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("created");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingLeadId, setUploadingLeadId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Column visibility and widths
  const defaultColumnWidths = {
    checkbox: 50,
    expand: 50,
    leadNumber: 100,
    title: 200,
    customer: 180,
    stage: 140,
    status: 100,
    priority: 100,
    value: 120,
    owner: 150,
    activities: 120,
    actions: 80,
  };

  const defaultVisibleColumns = {
    checkbox: true,
    expand: true,
    leadNumber: true,
    title: true,
    customer: true,
    stage: true,
    status: true,
    priority: true,
    value: true,
    owner: true,
    activities: true,
    actions: true,
  };

  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  
  const handleColumnResize = (column: keyof typeof columnWidths, newWidth: number) => {
    setColumnWidths(prev => ({ ...prev, [column]: Math.max(50, newWidth) }));
  };

  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const toggleRowExpand = (leadId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const getSortedLeads = () => {
    const sorted = [...filteredLeads].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case "leadNumber":
          aVal = a.leadNumber || "";
          bVal = b.leadNumber || "";
          break;
        case "title":
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case "customer":
          aVal = a.customer?.name.toLowerCase() || "";
          bVal = b.customer?.name.toLowerCase() || "";
          break;
        case "stage":
          aVal = a.stage;
          bVal = b.stage;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "priority":
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case "value":
          aVal = a.estimatedValue || 0;
          bVal = b.estimatedValue || 0;
          break;
        case "created":
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.size === 0) {
      toast.error("No leads selected");
      return;
    }

    try {
      toast.loading(`Performing bulk action on ${selectedLeads.size} leads...`);
      
      // Implement bulk actions here
      switch (action) {
        case "delete":
          for (const leadId of Array.from(selectedLeads)) {
            await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
          }
          toast.success(`${selectedLeads.size} leads deleted`);
          break;
        case "notify":
          for (const leadId of Array.from(selectedLeads)) {
            await fetch(`/api/leads/${leadId}/notify`, { method: "POST" });
          }
          toast.success(`Notifications sent to ${selectedLeads.size} leads`);
          break;
      }
      
      setSelectedLeads(new Set());
      fetchLeads();
    } catch (error) {
      toast.error("Failed to perform bulk action");
    }
  };

  const handleNotifyLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/notify`, {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("Notifications sent successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send notifications");
      }
    } catch (error) {
      console.error("Error notifying lead:", error);
      toast.error("Failed to send notifications");
    }
  };

  const handleUploadFile = (leadId: string) => {
    setUploadingLeadId(leadId);
    setShowUploadDialog(true);
    setSelectedFile(null);
    setFileDescription("");
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadingLeadId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (fileDescription) {
        formData.append("description", fileDescription);
      }

      const res = await fetch(`/api/leads/${uploadingLeadId}/files`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("File uploaded successfully");
        setShowUploadDialog(false);
        setSelectedFile(null);
        setFileDescription("");
        setUploadingLeadId(null);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [stageFilter, statusFilter, sortBy]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (stageFilter !== "all") params.append("stage", stageFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/leads?${params}`);
      const data = await response.json();
      setLeads(data.data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
      toast.success("Lead deleted");
      fetchLeads();
    } catch (error) {
      toast.error("Failed to delete lead");
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      lead.title?.toLowerCase().includes(searchLower) ||
      lead.leadNumber?.toLowerCase().includes(searchLower) ||
      lead.customer?.name.toLowerCase().includes(searchLower) ||
      lead.contact?.name.toLowerCase().includes(searchLower)
    );
  });

  if (!mounted) {
    return <div className="space-y-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="LEAD_NEW">New</SelectItem>
              <SelectItem value="LEAD_WORKING">Working</SelectItem>
              <SelectItem value="LEAD_QUALIFIED">Qualified</SelectItem>
              <SelectItem value="OPP_PROSPECTING">Opportunity</SelectItem>
              <SelectItem value="RFP_RECEIVED">RFP</SelectItem>
              <SelectItem value="QUOTE_SENT">Quote</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
              <SelectItem value="FROZEN">Frozen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {selectedLeads.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedLeads.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction("notify")}>
                  <Mail className="h-4 w-4 mr-2" />
                  Notify Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkAction("delete")} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Popover open={showColumnDialog} onOpenChange={setShowColumnDialog}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Settings2 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <Label>Visible Columns</Label>
                {Object.entries(visibleColumns).map(([column, visible]) => {
                  const columnLabels: Record<string, string> = {
                    checkbox: "Checkbox",
                    expand: "Expand",
                    leadNumber: "Lead Number",
                    title: "Title",
                    customer: "Customer",
                    stage: "Stage",
                    status: "Status",
                    priority: "Priority",
                    value: "Value",
                    owner: "Owner/Assignee",
                    activities: "Activities",
                    actions: "Actions",
                  };
                  return (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={column}
                        checked={visible}
                        onCheckedChange={() => toggleColumnVisibility(column as any)}
                      />
                      <Label htmlFor={column} className="text-sm font-normal cursor-pointer">
                        {columnLabels[column] || column}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={fetchLeads} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { setEditingLead(null); setShowFormDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.checkbox && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLeads.size === leads.length && leads.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLeads(new Set(leads.map(l => l.id)));
                      } else {
                        setSelectedLeads(new Set());
                      }
                    }}
                  />
                </TableHead>
              )}
              {visibleColumns.expand && <TableHead className="w-12" />}
              {visibleColumns.leadNumber && (
                <ResizableTableHeader
                  width={columnWidths.leadNumber}
                  onResize={(w) => handleColumnResize("leadNumber", w)}
                  className="cursor-pointer font-semibold"
                  onClick={() => handleSort("leadNumber")}
                >
                  <div className="flex items-center gap-2">
                    Lead Number
                    {sortBy === "leadNumber" && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </ResizableTableHeader>
              )}
              {visibleColumns.title && (
                <ResizableTableHeader
                  width={columnWidths.title}
                  onResize={(w) => handleColumnResize("title", w)}
                  className="cursor-pointer font-semibold"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-2">
                    Title
                    {sortBy === "title" && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </ResizableTableHeader>
              )}
              {visibleColumns.customer && (
                <ResizableTableHeader
                  width={columnWidths.customer}
                  onResize={(w) => handleColumnResize("customer", w)}
                  className="cursor-pointer font-semibold"
                  onClick={() => handleSort("customer")}
                >
                  <div className="flex items-center gap-2">
                    Customer
                    {sortBy === "customer" && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </ResizableTableHeader>
              )}
              {visibleColumns.stage && (
                <ResizableTableHeader
                  width={columnWidths.stage}
                  onResize={(w) => handleColumnResize("stage", w)}
                  className="cursor-pointer font-semibold"
                  onClick={() => handleSort("stage")}
                >
                  <div className="flex items-center gap-2">
                    Stage
                    {sortBy === "stage" && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </ResizableTableHeader>
              )}
              {visibleColumns.status && (
                <ResizableTableHeader
                  width={columnWidths.status}
                  onResize={(w) => handleColumnResize("status", w)}
                  className="cursor-pointer font-semibold"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortBy === "status" && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </ResizableTableHeader>
              )}
              {visibleColumns.priority && (
                <ResizableTableHeader
                  width={columnWidths.priority}
                  onResize={(w) => handleColumnResize("priority", w)}
                  className="cursor-pointer font-semibold"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center gap-2">
                    Priority
                    {sortBy === "priority" && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </ResizableTableHeader>
              )}
              {visibleColumns.value && (
                <ResizableTableHeader
                  width={columnWidths.value}
                  onResize={(w) => handleColumnResize("value", w)}
                  className="cursor-pointer font-semibold"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center gap-2">
                    Value
                    {sortBy === "value" && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </ResizableTableHeader>
              )}
              {visibleColumns.owner && (
                <TableHead>Owner/Assignee</TableHead>
              )}
              {visibleColumns.activities && (
                <TableHead>Activities</TableHead>
              )}
              {visibleColumns.actions && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : getSortedLeads().length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              getSortedLeads().map((lead) => (
                <Fragment key={lead.id}>
                  <TableRow className="hover:bg-muted/50">
                    {visibleColumns.checkbox && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={() => toggleSelectLead(lead.id)}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.expand && (
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleRowExpand(lead.id)}>
                          {expandedRows.has(lead.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                    {visibleColumns.leadNumber && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        <div className="font-medium">{lead.leadNumber}</div>
                      </TableCell>
                    )}
                    {visibleColumns.title && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        <div className="font-medium">{lead.title}</div>
                      </TableCell>
                    )}
                    {visibleColumns.customer && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        {lead.customer ? (
                          <div>
                            <div className="font-medium">{lead.customer.name}</div>
                            {lead.contact && (
                              <div className="text-xs text-muted-foreground">{lead.contact.name}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.stage && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        <Badge className={`${STAGE_COLORS[lead.stage]}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {lead.stage.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        <Badge className={`${STATUS_COLORS[lead.status]}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.priority && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        <Badge className={`${PRIORITY_COLORS[lead.priority]}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.value && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        {lead.estimatedValue ? (
                          <div className="font-medium">
                            €{lead.estimatedValue.toLocaleString()}
                            {lead.probability && (
                              <div className="text-xs text-muted-foreground">
                                {lead.probability}% prob.
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.owner && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        <div className="flex items-center gap-2">
                          {lead.owner && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-7 w-7 cursor-pointer">
                                  <AvatarImage src={lead.owner.avatar || lead.owner.image || undefined} />
                                  <AvatarFallback className="text-[9px]">
                                    {lead.owner.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{lead.owner.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{lead.owner.name}</p>
                                <p className="text-xs text-muted-foreground">{lead.owner.email}</p>
                                <p className="text-xs text-muted-foreground">Role: {lead.owner.role}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {lead.assignee && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-6 w-6 cursor-pointer border-2 border-muted">
                                  <AvatarImage src={lead.assignee.avatar || lead.assignee.image || undefined} />
                                  <AvatarFallback className="text-[8px]">
                                    {lead.assignee.name?.charAt(0) || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{lead.assignee.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{lead.assignee.name}</p>
                                <p className="text-xs text-muted-foreground">{lead.assignee.email}</p>
                                <p className="text-xs text-muted-foreground">Role: {lead.assignee.role}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.activities && (
                      <TableCell className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                        <div className="flex flex-col gap-1.5">
                      {lead.siteSurvey && (
                        <div>
                          <Badge variant="outline" className="text-[9px]">
                            📋 SS: {lead.siteSurvey.status}
                          </Badge>
                        </div>
                      )}
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {lead._count.quotes > 0 && (
                          <span>📄 {lead._count.quotes}</span>
                        )}
                        {lead._count.rfps > 0 && (
                          <span>📋 {lead._count.rfps}</span>
                        )}
                        {lead._count.projects > 0 && (
                          <span>📁 {lead._count.projects}</span>
                        )}
                        {lead._count.emails > 0 && (
                          <span>📧 {lead._count.emails}</span>
                        )}
                        </div>
                      </div>
                      </TableCell>
                    )}
                    {visibleColumns.actions && (
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingLead(lead); setShowFormDialog(true); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNotifyLead(lead.id)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Notify Users
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUploadFile(lead.id)}>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Upload File
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(lead.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                  {expandedRows.has(lead.id) && (
                    <TableRow key={`expanded-${lead.id}`}>
                      <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="bg-muted/30">
                        <div className="p-4 space-y-4 text-sm">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <span className="font-semibold text-xs">Lead Number:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{lead.leadNumber}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-xs">Title:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{lead.title}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-xs">Customer:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{lead.customer?.name || "Not assigned"}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-xs">Contact:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{lead.contact?.name || "Not assigned"}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <span className="font-semibold text-xs">Stage:</span>
                              <div className="mt-1">
                                <Badge className={`${STAGE_COLORS[lead.stage]}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                  {lead.stage.replace(/_/g, " ")}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="font-semibold text-xs">Status:</span>
                              <div className="mt-1">
                                <Badge className={`${STATUS_COLORS[lead.status]}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                  {lead.status}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="font-semibold text-xs">Priority:</span>
                              <div className="mt-1">
                                <Badge className={`${PRIORITY_COLORS[lead.priority]}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                  {lead.priority}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="font-semibold text-xs">Estimated Value:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{lead.estimatedValue ? `€${lead.estimatedValue.toLocaleString()}` : "-"}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="font-semibold text-xs">Owner:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{lead.owner?.name || "Not assigned"}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-xs">Assignee:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{lead.assignee?.name || "Not assigned"}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-xs">Department:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{lead.department?.name || "Not assigned"}</p>
                            </div>
                          </div>

                          {lead.description && (
                            <div>
                              <span className="font-semibold text-xs">Description:</span>
                              <p className="text-muted-foreground mt-1 text-sm">{lead.description}</p>
                            </div>
                          )}
                          {lead.expectedCloseDate && (
                            <div>
                              <span className="font-semibold text-xs">Expected Close Date:</span>
                              <p className="text-muted-foreground mt-1 text-xs">{new Date(lead.expectedCloseDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lead Form Dialog */}
      <LeadFormDialog
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) {
            setEditingLead(null);
            fetchLeads();
          }
        }}
        lead={editingLead}
      />

      {/* Upload File Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File for Lead</DialogTitle>
            <DialogDescription>
              Upload a file for this lead. The file will be associated with the lead and customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Enter file description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={!selectedFile || uploading}>
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

