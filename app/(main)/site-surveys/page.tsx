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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  Network,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteSurveyFormDialog } from "@/components/site-surveys/site-survey-form-dialog";
import { VoipSurveyForm } from "@/components/site-surveys/voip-survey-form";
import { CablingHierarchyForm } from "@/components/site-surveys/cabling-hierarchy-form";
import { NetworkDiagramModal } from "@/components/site-surveys/network-diagram-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface SiteSurvey {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  arrangedDate: string | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone01: string | null;
  };
  contact: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  assignFrom: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

export default function SiteSurveysPage() {
  const router = useRouter();
  const [siteSurveys, setSiteSurveys] = useState<SiteSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<SiteSurvey | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<SiteSurvey | null>(null);
  const [mounted, setMounted] = useState(false);
  const [voipDialogOpen, setVoipDialogOpen] = useState(false);
  const [selectedVoipSurvey, setSelectedVoipSurvey] = useState<SiteSurvey | null>(null);
  const [cablingDialogOpen, setCablingDialogOpen] = useState(false);
  const [selectedCablingSurvey, setSelectedCablingSurvey] = useState<SiteSurvey | null>(null);
  const [networkDiagramOpen, setNetworkDiagramOpen] = useState(false);
  const [diagramData, setDiagramData] = useState<any>(null);
  const [diagramSurveyId, setDiagramSurveyId] = useState<string | null>(null);

  // Fix hydration by mounting on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchSiteSurveys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, typeFilter, statusFilter]);

  const fetchSiteSurveys = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/site-surveys?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSiteSurveys(data.siteSurveys || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error("Failed to load site surveys");
      }
    } catch (error) {
      console.error("Error fetching site surveys:", error);
      toast.error("Failed to load site surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (surveyId: string) => {
    router.push(`/site-surveys/${surveyId}`);
  };

  const handleEdit = (survey: SiteSurvey) => {
    setEditingSurvey(survey);
    setIsDialogOpen(true);
  };

  const handleDelete = (survey: SiteSurvey) => {
    setSurveyToDelete(survey);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!surveyToDelete) return;

    try {
      const response = await fetch(`/api/site-surveys/${surveyToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Site survey deleted successfully");
        fetchSiteSurveys();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete site survey");
      }
    } catch (error) {
      console.error("Error deleting site survey:", error);
      toast.error("Failed to delete site survey");
    } finally {
      setDeleteDialogOpen(false);
      setSurveyToDelete(null);
    }
  };

  const handleShowDiagram = async (surveyId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/site-surveys/${surveyId}/cabling`);
      
      if (!response.ok) {
        throw new Error("Failed to load cabling data");
      }

      const data = await response.json();
      
      // Debug: Log the API response
      console.log("API Response data:", data);
      console.log("Buildings from API:", data.siteSurvey?.buildings);
      console.log("Building connections from API:", data.buildingConnections);
      
      // Transform the data to match NetworkDiagram props
      const diagramData = {
        buildings: data.siteSurvey?.buildings || [],
        buildingConnections: data.buildingConnections || [], // Get building connections from API
      };
      
      setDiagramData(diagramData);
      setDiagramSurveyId(surveyId);
      setNetworkDiagramOpen(true);
    } catch (error) {
      console.error("Error loading diagram:", error);
      toast.error("Failed to load network diagram");
    } finally {
      setLoading(false);
    }
  };

  const refreshDiagramData = async () => {
    if (diagramSurveyId && networkDiagramOpen) {
      try {
        const response = await fetch(`/api/site-surveys/${diagramSurveyId}/cabling`);
        
        if (!response.ok) {
          throw new Error("Failed to load cabling data");
        }

        const data = await response.json();
        
        // Transform the data to match NetworkDiagram props
        const diagramData = {
          buildings: data.siteSurvey?.buildings || [],
          buildingConnections: data.buildingConnections || [], // Get building connections from API
        };
        
        setDiagramData(diagramData);
      } catch (error) {
        console.error("Error refreshing diagram:", error);
      }
    }
  };

  const handleNotifyPeople = async (survey: SiteSurvey) => {
    try {
      toast.loading("Sending notification emails...");
      
      const response = await fetch(`/api/site-surveys/${survey.id}/notify`, {
        method: "POST",
      });

      const data = await response.json();
      toast.dismiss();

      if (response.ok) {
        toast.success(data.message || "Notification emails sent successfully");
      } else {
        console.error("Notification error:", data);
        toast.error(data.error || "Failed to send notification emails");
        
        // Show detailed error in console for debugging
        if (data.debug) {
          console.log("Debug info:", data.debug);
        }
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.dismiss();
      toast.error("Failed to send notification emails");
    }
  };

  const handleDialogClose = (refresh = false) => {
    setIsDialogOpen(false);
    setEditingSurvey(null);
    if (refresh) {
      fetchSiteSurveys();
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "Scheduled":
        return "secondary";
      case "Cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "VOIP":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "CABLING":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "WIFI":
        return "bg-cyan-100 text-cyan-800 hover:bg-cyan-100";
      case "DIGITAL_SIGNAGE":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
      case "HOTEL_TV":
        return "bg-violet-100 text-violet-800 hover:bg-violet-100";
      case "NETWORK":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "CCTV":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "IOT":
        return "bg-pink-100 text-pink-800 hover:bg-pink-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            SITE SURVEYS
          </h1>
          <p className="text-muted-foreground">
            Manage site surveys and technical assessments
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          NEW SITE SURVEY
        </Button>
      </div>

      {/* Filters */}
      {mounted && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search site surveys..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL TYPES</SelectItem>
              <SelectItem value="VOIP">VOIP</SelectItem>
              <SelectItem value="CABLING">CABLING</SelectItem>
              <SelectItem value="WIFI">WIFI</SelectItem>
              <SelectItem value="DIGITAL_SIGNAGE">DIGITAL SIGNAGE</SelectItem>
              <SelectItem value="HOTEL_TV">HOTEL TV</SelectItem>
              <SelectItem value="NETWORK">NETWORK</SelectItem>
              <SelectItem value="CCTV">CCTV</SelectItem>
              <SelectItem value="IOT">IOT</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STATUS</SelectItem>
              <SelectItem value="Scheduled">SCHEDULED</SelectItem>
              <SelectItem value="Completed">COMPLETED</SelectItem>
              <SelectItem value="Cancelled">CANCELLED</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchSiteSurveys}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">TITLE</TableHead>
              <TableHead className="font-semibold">TYPE</TableHead>
              <TableHead className="font-semibold">CUSTOMER</TableHead>
              <TableHead className="font-semibold">ASSIGNED TO</TableHead>
              <TableHead className="font-semibold">ARRANGED DATE & TIME</TableHead>
              <TableHead className="font-semibold">STATUS</TableHead>
              <TableHead className="text-right font-semibold">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading site surveys...
                </TableCell>
              </TableRow>
            ) : siteSurveys.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No site surveys found
                </TableCell>
              </TableRow>
            ) : (
              siteSurveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium">{survey.title}</TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeColor(survey.type)}>
                      {survey.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{survey.customer.name}</TableCell>
                  <TableCell>
                    {survey.assignTo ? survey.assignTo.name : "-"}
                  </TableCell>
                  <TableCell>
                    {survey.arrangedDate
                      ? new Date(survey.arrangedDate).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(survey.status)}>
                      {survey.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>ACTIONS</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleView(survey.id)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          VIEW DETAILS
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(survey)}>
                          <Edit className="h-4 w-4 mr-2" />
                          EDIT
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNotifyPeople(survey)}>
                          <Mail className="h-4 w-4 mr-2" />
                          NOTIFY PEOPLE
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/site-surveys/${survey.id}/details`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          VIEW DETAILS
                        </DropdownMenuItem>
                        {survey.type === "VOIP" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedVoipSurvey(survey);
                              setVoipDialogOpen(true);
                            }}>
                              <Phone className="h-4 w-4 mr-2" />
                              VOIP DETAILS
                            </DropdownMenuItem>
                          </>
                        )}
                        {survey.type === "CABLING" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedCablingSurvey(survey);
                              setCablingDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              CABLING DETAILS
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowDiagram(survey.id)}>
                              <Network className="h-4 w-4 mr-2" />
                              SHOW DIAGRAM
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(survey)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            PREVIOUS
          </Button>
          <span className="text-sm text-muted-foreground">
            PAGE {page} OF {totalPages} ({total} total)
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            NEXT
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <SiteSurveyFormDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        siteSurvey={editingSurvey}
      />

      {/* VOIP Survey Dialog */}
      {selectedVoipSurvey && (
        <VoipSurveyForm
          open={voipDialogOpen}
          onClose={(refresh) => {
            setVoipDialogOpen(false);
            setSelectedVoipSurvey(null);
            if (refresh) {
              fetchSiteSurveys();
            }
          }}
          siteSurveyId={selectedVoipSurvey.id}
          siteSurveyTitle={selectedVoipSurvey.title}
        />
      )}

      {/* CABLING Survey Dialog */}
      {selectedCablingSurvey && cablingDialogOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-7xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg border bg-background shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold uppercase">CABLING SURVEY - INFRASTRUCTURE HIERARCHY</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCablingDialogOpen(false);
                    setSelectedCablingSurvey(null);
                  }}
                >
                  ✕
                </Button>
              </div>
              <CablingHierarchyForm
                siteSurveyId={selectedCablingSurvey.id}
                onSuccess={() => {
                  setCablingDialogOpen(false);
                  setSelectedCablingSurvey(null);
                  fetchSiteSurveys();
                  // Refresh diagram data if it's currently open
                  refreshDiagramData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase">
              DELETE SITE SURVEY
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the site survey "
              {surveyToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Network Diagram Modal */}
      {diagramData && (
        <NetworkDiagramModal
          open={networkDiagramOpen}
          onClose={() => {
            setNetworkDiagramOpen(false);
            setDiagramData(null);
          }}
          buildings={diagramData.buildings}
          buildingConnections={diagramData.buildingConnections}
        />
      )}
    </div>
  );
}

