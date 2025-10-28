"use client";

import { useState, useEffect, useRef } from "react";
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
  Eye,
  MoreVertical,
  Link as LinkIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Columns2,
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
import ExcelJS from "exceljs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactFormDialog } from "./contact-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ResizableTableHeader } from "./resizable-table-header";
import { ContactEmailsModal } from "./contact-emails-modal";

interface Contact {
  id: string;
  title: string | null;
  name: string;
  mobilePhone: string | null;
  homePhone: string | null;
  workPhone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  countryId: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  country?: {
    id: string;
    name: string;
    softoneCode: string;
  } | null;
  customers?: Array<{
    customer: {
      id: string;
      name: string;
    };
  }>;
  suppliers?: Array<{
    supplier: {
      id: string;
      name: string;
    };
  }>;
  contactProjects?: Array<{
    project: {
      id: string;
      name: string;
    };
  }>;
}

export function ContactsManager() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [total, setTotal] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [emailsModalOpen, setEmailsModalOpen] = useState(false);
  const [selectedContactForEmails, setSelectedContactForEmails] = useState<Contact | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    email: true,
    mobilePhone: true,
    city: true,
    country: true,
    customers: true,
    suppliers: true,
    projects: true,
  });

  // Column width state - only load from localStorage after mount to avoid hydration mismatch
  const [columnWidths, setColumnWidths] = useState({
    name: 200,
    email: 200,
    mobilePhone: 150,
    city: 150,
    country: 150,
    customers: 200,
    suppliers: 200,
    projects: 200,
  });

  // Load column widths from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contacts-column-widths');
      if (saved) {
        setColumnWidths(JSON.parse(saved));
      }
    }
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/contacts?${params}`);
      const data = await response.json();

      if (data.contacts) {
        setContacts(data.contacts);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Save column widths to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('contacts-column-widths', JSON.stringify(columnWidths));
    }
  }, [columnWidths, mounted]);

  // Auto-search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchContacts();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchField, pageSize]);

  useEffect(() => {
    if (mounted) {
      fetchContacts();
    }
  }, [page]);

  const handleSort = (column: string) => {
    setSortConfig((prev) => {
      if (prev?.key === column) {
        return prev.direction === 'asc' 
          ? { key: column, direction: 'desc' }
          : null;
      }
      return { key: column, direction: 'asc' };
    });
  };

  const applySorting = (column: string, direction: 'asc' | 'desc') => {
    const sorted = [...contacts].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (column) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
        case 'mobilePhone':
          aVal = a.mobilePhone;
          bVal = b.mobilePhone;
          break;
        case 'city':
          aVal = a.city;
          bVal = b.city;
          break;
        case 'country':
          aVal = a.country?.name;
          bVal = b.country?.name;
          break;
        default:
          return 0;
      }

      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;

      const comparison = aVal.toString().localeCompare(bVal.toString(), undefined, { numeric: true });
      return direction === 'asc' ? comparison : -comparison;
    });

    setContacts(sorted);
  };

  useEffect(() => {
    if (sortConfig) {
      applySorting(sortConfig.key, sortConfig.direction);
    }
  }, [sortConfig]);



  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;

    try {
      const response = await fetch(`/api/contacts/${contactToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Contact deleted successfully");
        fetchContacts();
      } else {
        toast.error("Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Error deleting contact");
    } finally {
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleExport = async () => {
    try {
      toast.info("Exporting contacts...");

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Contacts");

      // Define columns
      worksheet.columns = [
        { header: "NAME", key: "name", width: 30 },
        { header: "TITLE", key: "title", width: 15 },
        { header: "EMAIL", key: "email", width: 30 },
        { header: "MOBILE PHONE", key: "mobilePhone", width: 20 },
        { header: "WORK PHONE", key: "workPhone", width: 20 },
        { header: "HOME PHONE", key: "homePhone", width: 20 },
        { header: "ADDRESS", key: "address", width: 40 },
        { header: "CITY", key: "city", width: 20 },
        { header: "ZIP", key: "zip", width: 15 },
        { header: "COUNTRY", key: "country", width: 20 },
        { header: "CUSTOMERS", key: "customers", width: 40 },
        { header: "SUPPLIERS", key: "suppliers", width: 40 },
        { header: "PROJECTS", key: "projects", width: 40 },
        { header: "CREATED AT", key: "createdAt", width: 20 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      // Add data rows
      contacts.forEach((contact) => {
        worksheet.addRow({
          name: contact.name,
          title: contact.title || "",
          email: contact.email || "",
          mobilePhone: contact.mobilePhone || "",
          workPhone: contact.workPhone || "",
          homePhone: contact.homePhone || "",
          address: contact.address || "",
          city: contact.city || "",
          zip: contact.zip || "",
          country: contact.country?.name || "",
          customers: contact.customers?.map((c) => c.customer.name).join(", ") || "",
          suppliers: contact.suppliers?.map((s) => s.supplier.name).join(", ") || "",
          projects: contact.contactProjects?.map((p) => p.project.name).join(", ") || "",
          createdAt: new Date(contact.createdAt).toLocaleDateString(),
        });
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contacts_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Contacts exported successfully");
    } catch (error) {
      console.error("Error exporting contacts:", error);
      toast.error("Failed to export contacts");
    }
  };

  const handleViewDetails = (contactId: string) => {
    router.push(`/contacts/${contactId}`);
  };

  const handleViewEmails = (contact: Contact) => {
    setSelectedContactForEmails(contact);
    setEmailsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold uppercase">CONTACTS</h1>
          <p className="text-sm text-muted-foreground">
            Manage all contacts and their relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContacts}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            REFRESH
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={contacts.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            EXPORT
          </Button>
          <Button
            onClick={() => {
              setEditingContact(null);
              setIsDialogOpen(true);
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            ADD CONTACT
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2 flex-1 max-w-2xl">
          <Select
            value={searchField}
            onValueChange={setSearchField}
            defaultValue="all"
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="mobilePhone">Mobile</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${searchField === "all" ? "all fields" : searchField}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Columns2 className="h-4 w-4" />
              COLUMNS
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">VISIBLE COLUMNS</Label>
              <ScrollArea className="h-64">
                <div className="space-y-2 mt-2">
                  {Object.entries(columnVisibility).map(([key, visible]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={visible}
                        onCheckedChange={(checked) => {
                          setColumnVisibility((prev) => ({
                            ...prev,
                            [key]: checked as boolean,
                          }));
                        }}
                      />
                      <label
                        htmlFor={key}
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                      >
                        {key}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
        {mounted && (
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="200">200 per page</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats */}
      <div className="text-xs text-muted-foreground">
        Showing {contacts.length} of {total} contacts
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columnVisibility.name && (
                <ResizableTableHeader
                  width={columnWidths.name}
                  onResize={(newWidth) => setColumnWidths((prev) => ({ ...prev, name: newWidth }))}
                  sortable
                  sortKey="name"
                  sortConfig={sortConfig}
                  onSort={() => handleSort('name')}
                >
                  NAME
                </ResizableTableHeader>
              )}
              {columnVisibility.email && (
                <ResizableTableHeader
                  width={columnWidths.email}
                  onResize={(newWidth) => setColumnWidths((prev) => ({ ...prev, email: newWidth }))}
                  sortable
                  sortKey="email"
                  sortConfig={sortConfig}
                  onSort={() => handleSort('email')}
                >
                  EMAIL
                </ResizableTableHeader>
              )}
              {columnVisibility.mobilePhone && (
                <ResizableTableHeader
                  width={columnWidths.mobilePhone}
                  onResize={(newWidth) => setColumnWidths((prev) => ({ ...prev, mobilePhone: newWidth }))}
                  sortable
                  sortKey="mobilePhone"
                  sortConfig={sortConfig}
                  onSort={() => handleSort('mobilePhone')}
                >
                  MOBILE PHONE
                </ResizableTableHeader>
              )}
              {columnVisibility.city && (
                <ResizableTableHeader
                  width={columnWidths.city}
                  onResize={(newWidth) => setColumnWidths((prev) => ({ ...prev, city: newWidth }))}
                  sortable
                  sortKey="city"
                  sortConfig={sortConfig}
                  onSort={() => handleSort('city')}
                >
                  CITY
                </ResizableTableHeader>
              )}
              {columnVisibility.country && (
                <ResizableTableHeader
                  width={columnWidths.country}
                  onResize={(newWidth) => setColumnWidths((prev) => ({ ...prev, country: newWidth }))}
                  sortable
                  sortKey="country"
                  sortConfig={sortConfig}
                  onSort={() => handleSort('country')}
                >
                  COUNTRY
                </ResizableTableHeader>
              )}
              {columnVisibility.customers && (
                <TableHead style={{ width: `${columnWidths.customers}px` }}>CUSTOMERS</TableHead>
              )}
              {columnVisibility.suppliers && (
                <TableHead style={{ width: `${columnWidths.suppliers}px` }}>SUPPLIERS</TableHead>
              )}
              {columnVisibility.projects && (
                <TableHead style={{ width: `${columnWidths.projects}px` }}>PROJECTS</TableHead>
              )}
              <TableHead className="w-[80px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-xs">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  {columnVisibility.name && (
                    <TableCell className="font-medium text-xs">
                      {contact.title && (
                        <span className="text-muted-foreground mr-1">
                          {contact.title}
                        </span>
                      )}
                      {contact.name}
                    </TableCell>
                  )}
                  {columnVisibility.email && (
                    <TableCell className="text-xs">{contact.email || "-"}</TableCell>
                  )}
                  {columnVisibility.mobilePhone && (
                    <TableCell className="text-xs">{contact.mobilePhone || "-"}</TableCell>
                  )}
                  {columnVisibility.city && (
                    <TableCell className="text-xs">{contact.city || "-"}</TableCell>
                  )}
                  {columnVisibility.country && (
                    <TableCell className="text-xs">{contact.country?.name || "-"}</TableCell>
                  )}
                  {columnVisibility.customers && (
                    <TableCell className="text-xs">
                      {contact.customers && contact.customers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.customers.slice(0, 2).map((c) => (
                            <Badge key={c.customer.id} variant="secondary">
                              {c.customer.name}
                            </Badge>
                          ))}
                          {contact.customers.length > 2 && (
                            <Badge variant="secondary">
                              +{contact.customers.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.suppliers && (
                    <TableCell className="text-xs">
                      {contact.suppliers && contact.suppliers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.suppliers.slice(0, 2).map((s) => (
                            <Badge key={s.supplier.id} variant="secondary">
                              {s.supplier.name}
                            </Badge>
                          ))}
                          {contact.suppliers.length > 2 && (
                            <Badge variant="secondary">
                              +{contact.suppliers.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.projects && (
                    <TableCell className="text-xs">
                      {contact.contactProjects && contact.contactProjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.contactProjects.slice(0, 2).map((p) => (
                            <Badge key={p.project.id} variant="secondary">
                              {p.project.name}
                            </Badge>
                          ))}
                          {contact.contactProjects.length > 2 && (
                            <Badge variant="secondary">
                              +{contact.contactProjects.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>ACTIONS</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(contact.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          VIEW DETAILS
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleViewEmails(contact)}
                          disabled={!contact.email}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          VIEW EMAILS
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          EDIT
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setContactToDelete(contact);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          DELETE
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            PREVIOUS
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            NEXT
          </Button>
        </div>
      </div>

      {/* Contact Form Dialog */}
      <ContactFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingContact(null);
        }}
        contact={editingContact}
        onSuccess={() => {
          fetchContacts();
          setIsDialogOpen(false);
          setEditingContact(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ARE YOU SURE?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact {contactToDelete?.name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>DELETE</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Emails Modal */}
      {selectedContactForEmails && (
        <ContactEmailsModal
          open={emailsModalOpen}
          onOpenChange={setEmailsModalOpen}
          contactId={selectedContactForEmails.id}
          contactEmail={selectedContactForEmails.email}
        />
      )}
    </div>
  );
}

