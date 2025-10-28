"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { File, Upload, Trash2, Eye, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { SingleSelectCustomer } from "./single-select-customer";
import { SingleSelectUser } from "./single-select-user";
import { SingleSelectContact } from "./single-select-contact";
import { SingleSelectCustomerSearch } from "./single-select-customer-search";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any;
}

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("");
  const [assignedCompanyId, setAssignedCompanyId] = useState<string>("");
  const [stage, setStage] = useState("LEAD_NEW");
  const [status, setStatus] = useState("ACTIVE");
  const [priority, setPriority] = useState("MEDIUM");
  const [source, setSource] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [probability, setProbability] = useState("");
  const [requestedSiteSurvey, setRequestedSiteSurvey] = useState(false);
  const [ownerId, setOwnerId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  // Search combo states
  const [companyOpen, setCompanyOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  
  // File management state
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDropdownData();
      if (lead) {
        fetchFiles();
      }
    }
  }, [open, lead?.id]);

  useEffect(() => {
    if (open && lead) {
      console.log("Loading lead data:", lead);
      // Load existing lead data
      setTitle(lead.title || "");
      setDescription(lead.description || "");
      const custId = lead.customerId || lead.customer?.id || "";
      console.log("Setting customer ID:", custId);
      setCustomerId(custId);
      setContactId(lead.contactId || "");
      setAssignedCompanyId(lead.assignedCompanyId || "");
      setStage(lead.stage || "LEAD_NEW");
      setStatus(lead.status || "ACTIVE");
      setPriority(lead.priority || "MEDIUM");
      setSource(lead.source || "");
      setEstimatedValue(lead.estimatedValue?.toString() || "");
      setProbability(lead.probability?.toString() || "");
      setRequestedSiteSurvey(lead.requestedSiteSurvey || false);
      setOwnerId(lead.ownerId || "");
      setAssigneeId(lead.assigneeId || "");
      setDepartmentId(lead.departmentId || "");
      setNotes(lead.notes || "");
      setExpectedCloseDate(lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toISOString().split('T')[0] : "");
      
      // Fetch contacts for the customer if present
      if (custId) {
        fetchContactsForCustomer(custId);
      }
    }
  }, [open, lead?.id]);

  // Handle customer changes in create mode (not edit mode)
  useEffect(() => {
    if (open && !lead && customerId && customerId !== "") {
      // Fetch contacts when customer is selected in CREATE mode
      console.log("Fetching contacts for customer:", customerId);
      fetchContactsForCustomer(customerId);
    } else if (open && !lead && !customerId) {
      setContacts([]);
      setContactId("");
    }
  }, [customerId, open, lead]);


  const fetchFiles = async () => {
    if (!lead?.id) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}/files`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !lead?.id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (fileDescription) {
        formData.append("description", fileDescription);
      }

      const res = await fetch(`/api/leads/${lead.id}/files`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("File uploaded successfully");
        fetchFiles();
        setShowUploadDialog(false);
        setSelectedFile(null);
        setFileDescription("");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("File deleted successfully");
        fetchFiles();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch ALL customers (use 10000 to trigger fetch-all mode)
      const customersRes = await fetch("/api/customers?limit=10000");
      const customersData = await customersRes.json();
      const customerList = customersData.customers || customersData.data || [];
      console.log(`[Lead Form] Fetched ${customerList.length} customers`);
      setCustomers(Array.isArray(customerList) ? customerList : []);

      // Fetch customers to use as assigned companies (for subcontractor assignment)
      const companiesRes = await fetch("/api/customers?limit=10000");
      const companiesData = await companiesRes.json();
      const companiesList = companiesData.customers || companiesData.data || [];
      console.log(`[Lead Form] Fetched ${companiesList.length} companies`);
      setCompanies(Array.isArray(companiesList) ? companiesList : []);

      // Fetch ALL users (Admins, Managers, Employees)
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      console.log("Fetched users data:", usersData);
      const usersList = Array.isArray(usersData) ? usersData : usersData?.data || [];
      setUsers(usersList);

      // Fetch departments
      try {
        const deptsRes = await fetch("/api/admin/departments");
        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          // API returns { departments: [...] }
          const departmentsList = deptsData.departments || deptsData.data || deptsData || [];
          setDepartments(Array.isArray(departmentsList) ? departmentsList : []);
        } else {
          console.warn("Could not fetch departments:", deptsRes.status);
          setDepartments([]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      }

      // Fetch contacts if customer is selected
      if (customerId) {
        const contactsRes = await fetch(`/api/customers/${customerId}/contacts`);
        const contactsData = await contactsRes.json();
        setContacts(Array.isArray(contactsData.data) ? contactsData.data : (contactsData || []));
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchContactsForCustomer = async (customerId: string) => {
    try {
      const res = await fetch(`/api/customers/${customerId}/contacts`);
      const data = await res.json();
      console.log("Fetched contacts for customer:", data);
      // API returns { data: contacts }
      setContacts(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        title,
        description,
        customerId: customerId || null,
        contactId: contactId || null,
        assignedCompanyId: assignedCompanyId || null,
        stage,
        status,
        priority,
        source: source || null,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        probability: probability ? parseInt(probability) : null,
        requestedSiteSurvey,
        ownerId: ownerId || null,
        assigneeId: assigneeId || null,
        departmentId: departmentId || null,
        notes: notes || null,
        expectedCloseDate: expectedCloseDate || null,
      };

      const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
      const method = lead ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save lead");
      }

      const data = await response.json();
      toast.success(lead ? "Lead updated successfully" : "Lead created successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save lead");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCustomer = () => customers.find(c => c.id === customerId);
  const getSelectedContact = () => contacts.find(c => c.id === contactId);
  const getSelectedOwner = () => users.find(u => u.id === ownerId);
  const getSelectedAssignee = () => users.find(u => u.id === assigneeId);
  const getSelectedCompany = () => companies.find(c => c.id === assignedCompanyId);
  const getSelectedDepartment = () => departments.find(d => d.id === departmentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Create New Lead"}</DialogTitle>
          <DialogDescription>
            {lead ? "Update lead information" : "Create a new lead and start the sales process"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: lead ? '1fr 1fr' : '1fr' }}>
            <TabsTrigger value="details">{lead ? 'Details' : 'Lead Information'}</TabsTrigger>
            {lead && (
              <TabsTrigger value="files">
                Files ({files.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4" id="lead-form">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Office Network Installation"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the lead..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Customer</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomerDialog(true)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <SingleSelectCustomer
                value={customerId}
                onChange={(value) => {
                  setCustomerId(value);
                  if (value) {
                    fetchContactsForCustomer(value);
                  }
                }}
                placeholder="Select customer..."
              />
            </div>

            {/* Contact Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Contact</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContactDialog(true)}
                  className="h-6 w-6 p-0"
                  disabled={!customerId}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <SingleSelectContact
                value={contactId}
                onChange={setContactId}
                placeholder="Select contact..."
                disabled={!customerId}
                contacts={contacts}
              />
            </div>
          </div>

          {/* Stage, Status, Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD_NEW">New Lead</SelectItem>
                  <SelectItem value="LEAD_WORKING">Working</SelectItem>
                  <SelectItem value="LEAD_QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="OPP_PROSPECTING">Opportunity</SelectItem>
                  <SelectItem value="RFP_RECEIVED">RFP Received</SelectItem>
                  <SelectItem value="QUOTE_SENT">Quote Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="FROZEN">Frozen</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Value and Probability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedValue">Estimated Value (€)</Label>
              <Input
                id="estimatedValue"
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="10000"
              />
            </div>

            <div>
              <Label htmlFor="probability">Win Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          {/* Owner and Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Owner (Sales Manager)</Label>
              <SingleSelectUser
                value={ownerId}
                onChange={setOwnerId}
                placeholder="Select owner..."
                users={users}
              />
            </div>

            <div>
              <Label>Assignee</Label>
              <SingleSelectUser
                value={assigneeId}
                onChange={setAssigneeId}
                placeholder="Select assignee..."
                users={users}
              />
            </div>
          </div>

          {/* Department and Company (Subcontractor) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assigned Company (Subcontractor)</Label>
              <SingleSelectCustomerSearch
                value={assignedCompanyId}
                onChange={setAssignedCompanyId}
                placeholder="Search by name, AFM, email..."
                customers={companies}
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div>
            <Label htmlFor="source">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select source..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="trade_show">Trade Show</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requestedSiteSurvey"
              checked={requestedSiteSurvey}
              onChange={(e) => setRequestedSiteSurvey(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="requestedSiteSurvey">Request Site Survey</Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

            </form>
          </TabsContent>

          {lead && (
            <TabsContent value="files" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Files</h3>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No files uploaded yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {files.map((file: any) => (
                    <Card key={file.id}>
                      <CardContent className="flex items-center justify-between py-3 px-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{file.name}</div>
                            {file.description && (
                              <div className="text-xs text-muted-foreground truncate">{file.description}</div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Uploaded: {new Date(file.createdAt).toLocaleDateString()}
                              {file.size && ` • ${(file.size / 1024).toFixed(1)} KB`}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDelete(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="lead-form" disabled={loading || !title}>
              {loading ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
            </Button>
          </DialogFooter>
      </DialogContent>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={showCustomerDialog}
        onClose={(refresh) => {
          setShowCustomerDialog(false);
          if (refresh) {
            toast.success("Customer added successfully");
            fetchDropdownData(); // Refresh customers list
          }
        }}
      />

      {/* Contact Form Dialog */}
      <ContactFormDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        customerId={customerId}
        onSuccess={() => {
          toast.success("Contact added successfully");
          if (customerId) {
            fetchContactsForCustomer(customerId);
          }
        }}
      />

      {/* File Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a file for this lead. The file will be associated with the lead and customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="upload-file">File</Label>
              <Input
                id="upload-file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="upload-description">Description (Optional)</Label>
              <Textarea
                id="upload-description"
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
    </Dialog>
  );
}

