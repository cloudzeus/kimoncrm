"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  FileText,
  Download,
  Edit,
  Network,
  FileImage,
  Phone,
  Wifi,
  Camera,
  Tv,
  Smartphone,
  Router,
  User,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { FilesList } from "@/components/files/files-list";
import { CablingHierarchyForm } from "@/components/site-surveys/cabling-hierarchy-form";
import { VoipSurveyForm } from "@/components/site-surveys/voip-survey-form";
import { NetworkDiagramModal } from "@/components/site-surveys/network-diagram-modal";
import { ComprehensiveInfrastructureWizard } from "@/components/site-surveys/comprehensive-infrastructure-wizard";
import { EditProjectInfoModal } from "@/components/site-surveys/edit-project-info-modal";
import { EditCustomerInfoModal } from "@/components/site-surveys/edit-customer-info-modal";

interface SiteSurveyDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  arrangedDate: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone01: string | null;
    address: string | null;
    city: string | null;
  };
  contact: {
    id: string;
    name: string;
    email: string | null;
    mobilePhone: string | null;
    workPhone: string | null;
  } | null;
  assignFrom: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  assignTo: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  files: any[];
  voipSurvey?: any;
  cablingSurvey?: any;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "VOIP":
      return <Phone className="h-5 w-5" />;
    case "CABLING":
      return <Network className="h-5 w-5" />;
    case "WIFI":
      return <Wifi className="h-5 w-5" />;
    case "CCTV":
      return <Camera className="h-5 w-5" />;
    case "DIGITAL_SIGNAGE":
      return <Tv className="h-5 w-5" />;
    case "HOTEL_TV":
      return <Tv className="h-5 w-5" />;
    case "NETWORK":
      return <Router className="h-5 w-5" />;
    case "IOT":
      return <Smartphone className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case "VOIP":
      return "bg-blue-100 text-blue-800";
    case "CABLING":
      return "bg-green-100 text-green-800";
    case "WIFI":
      return "bg-purple-100 text-purple-800";
    case "CCTV":
      return "bg-red-100 text-red-800";
    case "DIGITAL_SIGNAGE":
      return "bg-orange-100 text-orange-800";
    case "HOTEL_TV":
      return "bg-yellow-100 text-yellow-800";
    case "NETWORK":
      return "bg-indigo-100 text-indigo-800";
    case "IOT":
      return "bg-pink-100 text-pink-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function SiteSurveyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [survey, setSurvey] = useState<SiteSurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [voipDialogOpen, setVoipDialogOpen] = useState(false);
  const [cablingDialogOpen, setCablingDialogOpen] = useState(false);
  const [networkDiagramOpen, setNetworkDiagramOpen] = useState(false);
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0);
  const [generatingWord, setGeneratingWord] = useState(false);
  const [downloadingBOM, setDownloadingBOM] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);

  useEffect(() => {
    fetchSurveyDetails();
  }, [id]);

  const generateWordDocument = async () => {
    try {
      setGeneratingWord(true);
      
      const response = await fetch(`/api/site-surveys/${id}/generate-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate Word document");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Site-Survey-${survey?.title.replace(/[^a-zA-Z0-9]/g, '-')}-${id}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Word document generated successfully!");
    } catch (error) {
      console.error("Error generating Word document:", error);
      toast.error("Failed to generate Word document");
    } finally {
      setGeneratingWord(false);
    }
  };

  const downloadBOM = async () => {
    if (!survey) return;
    
    try {
      setDownloadingBOM(true);

      // Prepare site survey data
      const siteSurveyData = {
        title: survey.title,
        description: survey.description,
        customer: survey.customer ? {
          name: survey.customer.name,
          email: survey.customer.email || undefined,
          phone: survey.customer.phone01 || undefined,
        } : undefined,
        contact: survey.contact ? {
          name: survey.contact.name,
          email: survey.contact.email || undefined,
          phone: survey.contact.mobilePhone || survey.contact.workPhone || undefined,
        } : undefined,
        assignTo: survey.assignTo ? {
          name: survey.assignTo.name,
          email: survey.assignTo.email || undefined,
        } : undefined,
        createdAt: survey.createdAt,
        updatedAt: survey.updatedAt,
        files: [],
      };

      // Generate BOM Excel using comprehensive infrastructure data
      const bomResponse = await fetch('/api/site-surveys/generate-bom-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSurveyData,
        }),
      });

      if (!bomResponse.ok) {
        throw new Error("Failed to generate BOM Excel");
      }
      
      const blob = await bomResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOM-${survey.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("BOM Excel downloaded successfully!");
    } catch (error) {
      console.error("Error downloading BOM:", error);
      toast.error("Failed to download BOM Excel");
    } finally {
      setDownloadingBOM(false);
    }
  };

  const handleSaveProjectInfo = async (data: any) => {
    const response = await fetch(`/api/site-surveys/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update project information");
    }

    // Refresh the survey data
    await fetchSurveyDetails();
  };

  const handleSaveCustomerInfo = async (data: any) => {
    if (!survey?.customer?.id) return;
    const response = await fetch(`/api/customers/${survey.customer.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update customer information");
    }

    // Refresh the survey data
    await fetchSurveyDetails();
  };

  const fetchSurveyDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/site-surveys/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch survey details");
      }
      const data = await response.json();
      setSurvey(data);
    } catch (error) {
      console.error("Error fetching survey details:", error);
      toast.error("Failed to load survey details");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading survey details...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Survey not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {getTypeIcon(survey.type)}
                <h1 className="text-[14px] font-bold uppercase tracking-tight">
                  {survey.title}
                </h1>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  SITE SURVEY
                </Badge>
                <Badge variant={survey.status === "Completed" ? "default" : "secondary"}>
                  {survey.status}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Site Survey ID: SS-{survey.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project and Customer Information Cards - Always Visible */}
        <div className="space-y-1 mb-4">
          {/* Project Information - Full Width */}
          <Card>
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span className="text-[10px]">PROJECT INFORMATION</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-5 px-1 text-[8px]"
                  onClick={() => setShowEditProjectModal(true)}
                >
                  <Edit className="h-2 w-2 mr-1" />
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-1">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[7px] font-medium text-muted-foreground">Title</label>
                  <p className="text-[8px] font-semibold">{survey.title}</p>
                </div>
                <div>
                  <label className="text-[7px] font-medium text-muted-foreground">Type</label>
                  <div className="flex items-center gap-1">
                    {getTypeIcon(survey.type)}
                    <span className="text-[8px] font-semibold">{survey.type}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[7px] font-medium text-muted-foreground">Status</label>
                  <Badge variant={survey.status === "Completed" ? "default" : "secondary"} className="text-[7px] h-3">
                    {survey.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-[7px] font-medium text-muted-foreground">Arranged Date</label>
                  <p className="text-[8px] font-semibold">
                    {survey.arrangedDate ? new Date(survey.arrangedDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information - Full Width */}
          <Card>
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span className="text-[10px]">CUSTOMER INFORMATION</span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-5 px-1 text-[8px]"
                    onClick={() => router.push(`/customers/${survey.customer.id}`)}
                    title="View Customer Details"
                  >
                    <ExternalLink className="h-2 w-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-5 px-1 text-[8px]"
                    onClick={() => setShowEditCustomerModal(true)}
                  >
                    <Edit className="h-2 w-2 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-1">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[7px] font-medium text-muted-foreground">Customer Name</label>
                  <p className="text-[8px] font-semibold">{survey.customer.name}</p>
                </div>
                <div>
                  <label className="text-[7px] font-medium text-muted-foreground">Email</label>
                  <p className="text-[7px]">{survey.customer.email || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-[7px] font-medium text-muted-foreground">Phone</label>
                  <p className="text-[7px]">{survey.customer.phone01 || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-[7px] font-medium text-muted-foreground">Address</label>
                  <p className="text-[7px]">{survey.customer.address || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Information - Full Width */}
          <Card>
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="text-[10px]">ASSIGNMENT</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-1">
              <div className="grid grid-cols-2 gap-2">
                {survey.assignTo && (
                  <div>
                    <label className="text-[7px] font-medium text-muted-foreground">Assigned To</label>
                    <p className="text-[8px] font-semibold">{survey.assignTo.name}</p>
                    <p className="text-[7px] text-muted-foreground">{survey.assignTo.email}</p>
                  </div>
                )}
                {survey.assignFrom && (
                  <div>
                    <label className="text-[7px] font-medium text-muted-foreground">Assigned From</label>
                    <p className="text-[8px] font-semibold">{survey.assignFrom.name}</p>
                    <p className="text-[7px] text-muted-foreground">{survey.assignFrom.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Infrastructure Wizard */}
        <ComprehensiveInfrastructureWizard
          siteSurveyId={id}
          siteSurveyData={survey}
          onComplete={() => {
            toast.success("Site survey completed!");
            fetchSurveyDetails();
          }}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end mb-6">
          <Button
            variant="outline"
            onClick={generateWordDocument}
            disabled={generatingWord}
          >
            <FileText className="h-4 w-4 mr-2" />
            {generatingWord ? "GENERATING..." : "DOWNLOAD WORD DOC"}
          </Button>
          <Button
            variant="outline"
            onClick={downloadBOM}
            disabled={downloadingBOM}
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadingBOM ? "DOWNLOADING..." : "DOWNLOAD BOM"}
          </Button>
        </div>

        {/* Files Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              ATTACHED FILES & BLUEPRINTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FilesList
              entityId={survey.id}
              entityType="SITESURVEY"
              refreshTrigger={filesRefreshTrigger}
              onFileDeleted={() => setFilesRefreshTrigger((prev) => prev + 1)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Modals */}
      {survey && (
        <>
          <EditProjectInfoModal
            isOpen={showEditProjectModal}
            onClose={() => setShowEditProjectModal(false)}
            projectData={survey}
            onSave={handleSaveProjectInfo}
          />
          <EditCustomerInfoModal
            isOpen={showEditCustomerModal}
            onClose={() => setShowEditCustomerModal(false)}
            customerData={survey.customer}
            onSave={handleSaveCustomerInfo}
          />
        </>
      )}
    </div>
  );
}
