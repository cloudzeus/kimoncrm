"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Calendar, 
  TrendingUp, 
  User,
  Building,
  FileText,
  Quote,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  File,
  Download,
  Eye,
  UserPlus,
  Phone,
  AtSign,
  UserCheck,
  Plus,
  MoreVertical,
  ClipboardList,
  PlusCircle,
  CheckSquare
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { LeadEmailsTab } from "./lead-emails-tab";
import { LeadTasksKanban } from "./lead-tasks-kanban";

interface LeadDetailViewProps {
  lead: any;
  currentUserId: string;
  users: any[];
}

const STAGE_COLORS: Record<string, string> = {
  LEAD_NEW: "bg-blue-100 text-blue-800",
  LEAD_WORKING: "bg-purple-100 text-purple-800",
  LEAD_QUALIFIED: "bg-green-100 text-green-800",
  OPP_PROSPECTING: "bg-cyan-100 text-cyan-800",
  RFP_RECEIVED: "bg-blue-100 text-blue-800",
  QUOTE_SENT: "bg-purple-100 text-purple-800",
  // ... add more as needed
};

export function LeadDetailView({ lead, currentUserId, users }: LeadDetailViewProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [editingFile, setEditingFile] = useState<any>(null);
  const [editFileDescription, setEditFileDescription] = useState("");
  
  // Lead contacts state
  const [leadContacts, setLeadContacts] = useState<any[]>([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  
  // Site survey dialog state
  const [showSiteSurveyDialog, setShowSiteSurveyDialog] = useState(false);
  const [siteSurveyTitle, setSiteSurveyTitle] = useState("");
  const [siteSurveyDescription, setSiteSurveyDescription] = useState("");

  // Task statistics state
  const [taskStats, setTaskStats] = useState({ notStarted: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    fetchFiles();
    fetchLeadContacts();
    fetchTaskStats();
  }, [lead.id]);

  const fetchTaskStats = async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/tasks`);
      const data = await res.json();
      const tasks = data.tasks || [];
      const stats = {
        notStarted: tasks.filter((t: any) => t.status === 'NOT_STARTED').length,
        inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter((t: any) => t.status === 'COMPLETED').length,
      };
      setTaskStats(stats);
    } catch (error) {
      console.error("Error fetching task stats:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/files`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const fetchLeadContacts = async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/contacts`);
      const data = await res.json();
      setLeadContacts(data.contacts || []);
    } catch (error) {
      console.error("Error fetching lead contacts:", error);
    }
  };

  const handleContactSave = async () => {
    try {
      if (editingContact) {
        // Update existing contact
        const res = await fetch(`/api/leads/${lead.id}/contacts/${editingContact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
            role: contactRole,
            notes: contactNotes,
          }),
        });

        if (res.ok) {
          toast.success("Contact updated successfully");
          fetchLeadContacts();
        } else {
          toast.error("Failed to update contact");
        }
      } else {
        // Create new contact
        const res = await fetch(`/api/leads/${lead.id}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
            role: contactRole,
            notes: contactNotes,
          }),
        });

        if (res.ok) {
          toast.success("Contact added successfully");
          fetchLeadContacts();
        } else {
          toast.error("Failed to add contact");
        }
      }

      setShowContactDialog(false);
      resetContactForm();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("An error occurred");
    }
  };

  const handleContactDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const res = await fetch(`/api/leads/${lead.id}/contacts/${contactId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Contact deleted successfully");
        fetchLeadContacts();
      } else {
        toast.error("Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("An error occurred");
    }
  };

  const handleAddToContacts = async (contactId: string) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/contacts/${contactId}/add-to-contacts`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Contact added to main Contacts");
        fetchLeadContacts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add contact to main Contacts");
      }
    } catch (error) {
      console.error("Error adding contact to main Contacts:", error);
      toast.error("An error occurred");
    }
  };

  const resetContactForm = () => {
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactRole("");
    setContactNotes("");
    setEditingContact(null);
  };

  const openContactDialog = (contact?: any) => {
    if (contact) {
      setEditingContact(contact);
      setContactName(contact.name);
      setContactEmail(contact.email || "");
      setContactPhone(contact.phone || "");
      setContactRole(contact.role || "");
      setContactNotes(contact.notes || "");
    } else {
      resetContactForm();
    }
    setShowContactDialog(true);
  };

  const handleCreateSiteSurvey = async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/create-site-survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: siteSurveyTitle || `Site Survey - ${lead.title}`,
          description: siteSurveyDescription,
        }),
      });

      if (res.ok) {
        toast.success("Site survey created successfully");
        setShowSiteSurveyDialog(false);
        setSiteSurveyTitle("");
        setSiteSurveyDescription("");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create site survey");
      }
    } catch (error) {
      console.error("Error creating site survey:", error);
      toast.error("An error occurred");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Lead deleted successfully");
        router.push("/leads");
      } else {
        throw new Error("Failed to delete lead");
      }
    } catch (error) {
      toast.error("Failed to delete lead");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/leads")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-lg font-bold">{lead.title}</h1>
          <div className="flex items-center gap-2">
            <Badge>{lead.leadNumber}</Badge>
            <Badge className={STAGE_COLORS[lead.stage] || "bg-gray-100 text-gray-800"}>
              {lead.stage.replace(/_/g, " ")}
            </Badge>
            <Badge variant={lead.status === "ACTIVE" ? "default" : "secondary"}>
              {lead.status}
            </Badge>
            <Badge className={getPriorityColor(lead.priority)}>
              {lead.priority}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
                <MoreVertical className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openContactDialog()}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // Find the tasks tab and set it as active
                const tasksTab = document.querySelector('[value="tasks"]') as HTMLElement;
                if (tasksTab) {
                  tasksTab.click();
                }
                // Trigger task creation from the tasks kanban
                setTimeout(() => {
                  const addTaskButton = document.querySelector('[data-add-task]') as HTMLElement;
                  if (addTaskButton) {
                    addTaskButton.click();
                  }
                }, 100);
              }}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Add Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSiteSurveyDialog(true)}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Request Site Survey
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Lead Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Customer</label>
              <div className="font-medium text-sm">{lead.customer?.name || "-"}</div>
              {lead.customer && (
                <div className="mt-2 space-y-1">
                  {lead.customer.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 text-blue-600" />
                      <span>{lead.customer.email}</span>
                    </div>
                  )}
                  {lead.customer.phone01 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 text-green-600" />
                      <span>{lead.customer.phone01}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Contact</label>
              <div className="font-medium text-sm">{lead.contact?.name || "-"}</div>
              {lead.contact && (
                <div className="mt-2 space-y-1">
                  {lead.contact.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 text-blue-600" />
                      <span>{lead.contact.email}</span>
                    </div>
                  )}
                  {lead.contact.phone01 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 text-green-600" />
                      <span>{lead.contact.phone01}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {lead.description && (
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <div className="text-sm">{lead.description}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {lead.estimatedValue && (
                <div>
                  <label className="text-sm text-muted-foreground">Estimated Value</label>
                  <div className="font-medium text-sm">
                    €{lead.estimatedValue.toLocaleString()}
                    {lead.probability && ` (${lead.probability}% probability)`}
                  </div>
                </div>
              )}
              {lead.expectedCloseDate && (
                <div>
                  <label className="text-sm text-muted-foreground">Expected Close Date</label>
                  <div className="font-medium text-sm">
                    {new Date(lead.expectedCloseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Owner (Sales Manager)</label>
              <div className="font-medium text-sm">{lead.owner?.name || "-"}</div>
              {lead.owner?.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Mail className="h-3 w-3 text-blue-600" />
                  <span>{lead.owner.email}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Assignee</label>
              <div className="font-medium text-sm">{lead.assignee?.name || "-"}</div>
              {lead.assignee?.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Mail className="h-3 w-3 text-blue-600" />
                  <span>{lead.assignee.email}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Department</label>
              <div className="font-medium text-sm">{lead.department?.name || "-"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {taskStats.notStarted + taskStats.inProgress + taskStats.completed > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Not Started", value: taskStats.notStarted, fill: "#9CA3AF" },
                      { name: "In Progress", value: taskStats.inProgress, fill: "#3B82F6" },
                      { name: "Completed", value: taskStats.completed, fill: "#10B981" },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={false}
                  >
                    <Cell fill="#9CA3AF" />
                    <Cell fill="#3B82F6" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No tasks yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activities Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activities & Related Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({leadContacts.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
              <TabsTrigger value="quotes">Quotes ({lead.quotes.length})</TabsTrigger>
              <TabsTrigger value="rfps">RFPs ({lead.rfps.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({lead.projects.length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Quote className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-lg font-bold">{lead.quotes.length}</div>
                        <div className="text-xs text-muted-foreground">Quotes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-lg font-bold">{lead.rfps.length}</div>
                        <div className="text-xs text-muted-foreground">RFPs</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-lg font-bold">{lead.projects.length}</div>
                        <div className="text-xs text-muted-foreground">Projects</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {lead.requestedSiteSurvey && lead.siteSurvey && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Site Survey</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {lead.siteSurvey.title}
                          {lead.siteSurvey.status === "Completed" && (
                            <Badge className="bg-green-500 text-white">
                              ✓ Completed
                            </Badge>
                          )}
                          {lead.siteSurvey.status === "In Progress" && (
                            <Badge className="bg-blue-500 text-white">
                              ⟳ In Progress
                            </Badge>
                          )}
                          {lead.siteSurvey.status === "Scheduled" && (
                            <Badge className="bg-yellow-500 text-white">
                              📅 Scheduled
                            </Badge>
                          )}
                          {lead.siteSurvey.status === "Cancelled" && (
                            <Badge className="bg-red-500 text-white">
                              ✗ Cancelled
                            </Badge>
                          )}
                          {!["Completed", "In Progress", "Scheduled", "Cancelled"].includes(lead.siteSurvey.status) && (
                            <Badge className="bg-gray-500 text-white">
                              {lead.siteSurvey.status}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Type: {lead.siteSurvey.type}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/site-surveys/${lead.siteSurvey.id}/wizard`)}
                      >
                        Open Wizard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Files</h3>
                <Button onClick={() => setShowUploadDialog(true)} size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
              
              {files.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No files uploaded yet</p>
              ) : (
                <div className="grid gap-2">
                  {files.map((file: any) => (
                    <Card key={file.id}>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{file.name}</div>
                            {file.description && (
                              <div className="text-sm text-muted-foreground">{file.description}</div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Uploaded: {new Date(file.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}
                              {file.size && ` • ${(file.size / 1024).toFixed(1)} KB`}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingFile(file);
                              setEditFileDescription(file.description || "");
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
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

            <TabsContent value="contacts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Lead Contacts</h3>
                <Button onClick={() => openContactDialog()} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
              
              {leadContacts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No contacts added yet</p>
              ) : (
                <div className="grid gap-2">
                  {leadContacts.map((contact: any) => (
                    <Card key={contact.id}>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3 flex-1">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {contact.name}
                              {contact.linkedContact && (
                                <Badge variant="secondary" className="text-xs">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Linked
                                </Badge>
                              )}
                            </div>
                            {/* Email and Phone */}
                            {(contact.email || contact.phone) && (
                              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                {contact.email && (
                                  <div className="flex items-center gap-1">
                                    <AtSign className="h-3 w-3" />
                                    {contact.email}
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Role as Description */}
                            {contact.role && (
                              <div className="text-sm text-muted-foreground mt-1">
                                <strong>Title:</strong> {contact.role}
                              </div>
                            )}
                            
                            {/* Notes/Description */}
                            {contact.notes && (
                              <div className="text-sm text-muted-foreground mt-1 italic">
                                {contact.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!contact.linkedContact && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddToContacts(contact.id)}
                              title="Add to main Contacts"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openContactDialog(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleContactDelete(contact.id)}
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

            <TabsContent value="tasks" className="space-y-4">
              <LeadTasksKanban
                leadId={lead.id}
                leadContacts={leadContacts}
                users={users}
                onTasksChange={fetchTaskStats}
              />
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              <LeadEmailsTab
                leadId={lead.id}
                leadNumber={lead.leadNumber || ""}
                leadContacts={leadContacts}
                ownerEmail={lead.owner?.email}
                assigneeEmail={lead.assignee?.email}
              />
            </TabsContent>

            <TabsContent value="quotes" className="space-y-2">
              {lead.quotes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No quotes yet</p>
              ) : (
                lead.quotes.map((quote: any) => (
                  <Card key={quote.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <div className="font-medium">{quote.quoteNo}</div>
                        <div className="text-sm text-muted-foreground">
                          Total: €{quote.total?.toLocaleString() || 0}
                        </div>
                      </div>
                      <Badge>{quote.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="rfps" className="space-y-2">
              {lead.rfps.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No RFPs yet</p>
              ) : (
                lead.rfps.map((rfp: any) => (
                  <Card key={rfp.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <div className="font-medium">{rfp.title}</div>
                        <div className="text-sm text-muted-foreground">{rfp.description}</div>
                      </div>
                      <Badge>{rfp.stage}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="projects" className="space-y-2">
              {lead.projects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No projects yet</p>
              ) : (
                lead.projects.map((project: any) => (
                  <Card key={project.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.startAt && new Date(project.startAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                          {project.startAt && project.endAt && " - "}
                          {project.endAt && new Date(project.endAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </div>
                      </div>
                      <Badge>{project.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-2">
              {lead.statusChanges.map((change: any) => (
                <Card key={change.id}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className="mt-1">
                      {change.toStatus === "ACTIVE" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : change.toStatus === "CLOSED" ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{change.changedByUser.name}</span>
                        {" changed status from "}
                        <span className="font-medium">{change.fromStatus || "N/A"}</span>
                        {" to "}
                        <span className="font-medium">{change.toStatus}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(change.createdAt).toLocaleString()}
                        {change.note && ` - ${change.note}`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription>
              {editingContact ? "Update contact information" : "Add a new contact to this lead"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Enter contact name"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-role">Role</Label>
              <Input
                id="contact-role"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                placeholder="e.g., Decision Maker, Technical Contact"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea
                id="contact-notes"
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                placeholder="Additional notes about this contact"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleContactSave} disabled={!contactName.trim()}>
              {editingContact ? "Update" : "Add"} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Site Survey Dialog */}
      <Dialog open={showSiteSurveyDialog} onOpenChange={setShowSiteSurveyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Site Survey</DialogTitle>
            <DialogDescription>
              Create a site survey request for this lead
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="site-survey-title">Title</Label>
              <Input
                id="site-survey-title"
                value={siteSurveyTitle}
                onChange={(e) => setSiteSurveyTitle(e.target.value)}
                placeholder="Site Survey - Lead Title"
              />
            </div>
            
            <div>
              <Label htmlFor="site-survey-description">Description</Label>
              <Textarea
                id="site-survey-description"
                value={siteSurveyDescription}
                onChange={(e) => setSiteSurveyDescription(e.target.value)}
                placeholder="Enter description for the site survey"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSiteSurveyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSiteSurvey}>
              Create Site Survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

