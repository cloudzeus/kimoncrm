"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Eye
} from "lucide-react";
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

interface LeadDetailViewProps {
  lead: any;
  currentUserId: string;
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

export function LeadDetailView({ lead, currentUserId }: LeadDetailViewProps) {
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

  useEffect(() => {
    fetchFiles();
  }, [lead.id]);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/files`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Customer</label>
              <div className="font-medium">{lead.customer?.name || "-"}</div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Contact</label>
              <div className="font-medium">{lead.contact?.name || "-"}</div>
            </div>
            {lead.description && (
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <div className="text-sm">{lead.description}</div>
              </div>
            )}
            {lead.estimatedValue && (
              <div>
                <label className="text-sm text-muted-foreground">Estimated Value</label>
                <div className="font-medium">
                  €{lead.estimatedValue.toLocaleString()}
                  {lead.probability && ` (${lead.probability}% probability)`}
                </div>
              </div>
            )}
            {lead.expectedCloseDate && (
              <div>
                <label className="text-sm text-muted-foreground">Expected Close Date</label>
                <div className="font-medium">
                  {new Date(lead.expectedCloseDate).toLocaleDateString()}
                </div>
              </div>
            )}
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
              <div className="font-medium">{lead.owner?.name || "-"}</div>
              {lead.owner?.email && (
                <div className="text-sm text-muted-foreground">{lead.owner.email}</div>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Assignee</label>
              <div className="font-medium">{lead.assignee?.name || "-"}</div>
              {lead.assignee?.email && (
                <div className="text-sm text-muted-foreground">{lead.assignee.email}</div>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Department</label>
              <div className="font-medium">{lead.department?.name || "-"}</div>
            </div>
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
                        <div className="font-medium">{lead.siteSurvey.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Status: {lead.siteSurvey.status}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/site-surveys/${lead.siteSurvey.id}`)}
                      >
                        View Survey
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
                              Uploaded: {new Date(file.createdAt).toLocaleDateString()}
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
                          {project.startAt && new Date(project.startAt).toLocaleDateString()}
                          {project.startAt && project.endAt && " - "}
                          {project.endAt && new Date(project.endAt).toLocaleDateString()}
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

