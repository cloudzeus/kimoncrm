"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  Server,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Network,
  Wifi,
  Camera,
  Tv,
  Smartphone,
  Monitor,
  Router,
  PhoneCall,
  FileImage,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { FilesList } from "@/components/files/files-list";
import { CablingHierarchyForm } from "@/components/site-surveys/cabling-hierarchy-form";
import { VoipSurveyForm } from "@/components/site-surveys/voip-survey-form";
import { NetworkDiagramModal } from "@/components/site-surveys/network-diagram-modal";
import { EquipmentDisplay } from "@/components/site-surveys/equipment-display";
import { BOMManagerEnhanced } from "@/components/site-surveys/bom-manager-enhanced";

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
  buildings?: any[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "VOIP":
      return <PhoneCall className="h-5 w-5" />;
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

export default function SiteSurveyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [survey, setSurvey] = useState<SiteSurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [voipDialogOpen, setVoipDialogOpen] = useState(false);
  const [cablingDialogOpen, setCablingDialogOpen] = useState(false);
  const [networkDiagramOpen, setNetworkDiagramOpen] = useState(false);
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0);
  const [generatingWord, setGeneratingWord] = useState(false);
  const [downloadingBOM, setDownloadingBOM] = useState(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);

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
        body: JSON.stringify({
          equipment: equipment, // Pass the equipment data from BOM tab
        }),
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

      // Fetch cabling survey data if it's a cabling type
      let buildings = [];
      if (survey.type === 'CABLING') {
        const cablingResponse = await fetch(`/api/site-surveys/${id}/cabling`);
        if (cablingResponse.ok) {
          const cablingData = await cablingResponse.json();
          buildings = cablingData.data?.buildings || [];
        }
      }

      // Extract equipment from buildings
      const equipment: any[] = [];
      buildings.forEach((building: any) => {
        if (building.centralRacks) {
          building.centralRacks.forEach((rack: any) => {
            if (rack.devices) {
              rack.devices.forEach((device: any) => {
                equipment.push({
                  itemId: device.equipmentId || device.id,
                  name: device.name,
                  type: device.itemType || device.type,
                  brand: device.brand,
                  model: device.model,
                  category: '',
                  unit: 'Each',
                  quantity: device.quantity || 1,
                  price: 0,
                  totalPrice: 0,
                  notes: device.notes,
                  infrastructureElement: {
                    type: 'centralRack',
                    name: rack.name,
                    buildingName: building.name,
                  },
                });
              });
            }
          });
        }
        if (building.floors) {
          building.floors.forEach((floor: any) => {
            if (floor.rooms) {
              floor.rooms.forEach((room: any) => {
                if (room.devices) {
                  room.devices.forEach((device: any) => {
                    equipment.push({
                      itemId: device.equipmentId || device.id,
                      name: device.name,
                      type: device.itemType || device.type,
                      brand: device.brand,
                      model: device.model,
                      category: '',
                      unit: 'Each',
                      quantity: device.quantity || 1,
                      price: 0,
                      totalPrice: 0,
                      notes: device.notes,
                      infrastructureElement: {
                        type: 'room',
                        name: room.name,
                        floorName: floor.name,
                        buildingName: building.name,
                      },
                    });
                  });
                }
              });
            }
            if (floor.floorRacks) {
              floor.floorRacks.forEach((rack: any) => {
                if (rack.devices) {
                  rack.devices.forEach((device: any) => {
                    equipment.push({
                      itemId: device.equipmentId || device.id,
                      name: device.name,
                      type: device.itemType || device.type,
                      brand: device.brand,
                      model: device.model,
                      category: '',
                      unit: 'Each',
                      quantity: device.quantity || 1,
                      price: 0,
                      totalPrice: 0,
                      notes: device.notes,
                      infrastructureElement: {
                        type: 'floorRack',
                        name: rack.name,
                        floorName: floor.name,
                        buildingName: building.name,
                      },
                    });
                  });
                }
              });
            }
          });
        }
      });

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
        files: [], // Files will be fetched separately if needed
      };

      // Generate BOM Excel
      const bomResponse = await fetch('/api/site-surveys/generate-bom-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment,
          buildings,
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
      a.download = `BOM-${survey.title.replace(/[^a-zA-Z0-9]/g, '-')}-${id}.xlsx`;
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

  const fetchSurveyDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/site-surveys/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch survey details");
      }
      const data = await response.json();
      setSurvey(data);

      // Fetch cabling data if it's a cabling survey
      if (data.type === 'CABLING') {
        try {
          const cablingResponse = await fetch(`/api/site-surveys/${id}/cabling`);
          if (cablingResponse.ok) {
            const cablingData = await cablingResponse.json();
            setBuildings(cablingData.data?.buildings || []);
          }
        } catch (cablingError) {
          console.error('Error fetching cabling data:', cablingError);
        }
      }
    } catch (error) {
      console.error("Error fetching survey details:", error);
      toast.error("Failed to load survey details");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWord = async () => {
    try {
      // TODO: Implement Word document generation
      toast.info("Word document generation coming soon!");
    } catch (error) {
      console.error("Error generating Word document:", error);
      toast.error("Failed to generate Word document");
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
                <Badge className={getTypeBadgeColor(survey.type)}>
                  {survey.type}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
            <TabsTrigger value="details">DETAILS</TabsTrigger>
            <TabsTrigger value="infrastructure">INFRASTRUCTURE</TabsTrigger>
            <TabsTrigger value="equipment">EQUIPMENT</TabsTrigger>
            <TabsTrigger value="bom">BOM</TabsTrigger>
            <TabsTrigger value="files">FILES</TabsTrigger>
            <TabsTrigger value="history">HISTORY</TabsTrigger>
          </TabsList>

          {/* Action Buttons Row */}
          <div className="flex gap-2 justify-end">
            {survey.type === "VOIP" && (
              <Button
                variant="outline"
                onClick={() => setVoipDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                EDIT VOIP DETAILS
              </Button>
            )}
            {survey.type === "CABLING" && (
              <Button
                variant="outline"
                onClick={() => setCablingDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                EDIT CABLING DETAILS
              </Button>
            )}
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
            <Button
              variant="outline"
              onClick={() => setNetworkDiagramOpen(true)}
            >
              <Network className="h-4 w-4 mr-2" />
              NETWORK DIAGRAM
            </Button>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="space-y-6">
              {/* Project Information - Full Width */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="text-[12px]">PROJECT INFORMATION</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Title</label>
                      <p className="text-[12px] font-semibold">{survey.title}</p>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Type</label>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(survey.type)}
                        <span className="text-[12px] font-semibold">{survey.type}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Status</label>
                      <Badge variant={survey.status === "Completed" ? "default" : "secondary"} className="text-[11px]">
                        {survey.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Arranged Date</label>
                      <p className="text-[12px] font-semibold">
                        {survey.arrangedDate ? new Date(survey.arrangedDate).toLocaleDateString() : "Not set"}
                      </p>
                    </div>
                  </div>
                  {survey.description && (
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Description</label>
                      <p className="text-[11px] mt-1">{survey.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Information - Full Width */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      <span className="text-[12px]">CUSTOMER INFORMATION</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Customer Name</label>
                    <p className="text-[12px] font-semibold">{survey.customer.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Email</label>
                      <p className="text-[11px]">{survey.customer.email || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Phone</label>
                      <p className="text-[11px]">{survey.customer.phone01 || "Not provided"}</p>
                    </div>
                  </div>
                  {survey.customer.address && (
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Address</label>
                      <p className="text-[11px]">{survey.customer.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment Information - Full Width */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="text-[12px]">ASSIGNMENT</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {survey.assignTo && (
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">Assigned To</label>
                        <p className="text-[12px] font-semibold">{survey.assignTo.name}</p>
                        <p className="text-[11px] text-muted-foreground">{survey.assignTo.email}</p>
                      </div>
                    )}
                    {survey.assignFrom && (
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">Assigned From</label>
                        <p className="text-[12px] font-semibold">{survey.assignFrom.name}</p>
                        <p className="text-[11px] text-muted-foreground">{survey.assignFrom.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SURVEY DETAILS</CardTitle>
              </CardHeader>
              <CardContent>
                {survey.type === "VOIP" && survey.voipSurvey ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">VOIP Survey Data</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Old PBX Model</label>
                        <p>{survey.voipSurvey.oldPbxModel || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Provider Name</label>
                        <p>{survey.voipSurvey.providerName || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Internet Feed Type</label>
                        <p>{survey.voipSurvey.internetFeedType || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Internet Feed Speed</label>
                        <p>{survey.voipSurvey.internetFeedSpeed || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                ) : survey.type === "CABLING" && survey.cablingSurvey ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Cabling Survey Data</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">General Notes</label>
                        <p>{survey.cablingSurvey.generalNotes || "No notes"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Project Scope</label>
                        <p>{survey.cablingSurvey.projectScope || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No detailed survey data available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Infrastructure Tab */}
          <TabsContent value="infrastructure" className="space-y-6">
            {survey.type === "CABLING" && survey.buildings && survey.buildings.length > 0 ? (
              <CablingHierarchyForm
                siteSurveyId={survey.id}
                onSuccess={() => {
                  fetchSurveyDetails();
                  toast.success("Infrastructure updated successfully");
                }}
                onEquipmentUpdate={(equipmentData) => {
                  setEquipment(equipmentData);
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No infrastructure data available for this survey type.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            {survey.type === 'CABLING' && buildings.length > 0 ? (
              <EquipmentDisplay buildings={buildings} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {survey.type === 'CABLING' 
                      ? 'No equipment added yet. Add equipment to the site survey infrastructure.'
                      : 'Equipment management is only available for cabling surveys.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* BOM Tab */}
          <TabsContent value="bom" className="space-y-6">
            {survey.type === 'CABLING' && buildings.length > 0 ? (
              <BOMManagerEnhanced
                equipment={equipment}
                onUpdateEquipment={setEquipment}
                buildings={buildings}
                files={survey.files || []}
                siteSurveyData={{
                  id: survey.id,
                  title: survey.title,
                  customer: survey.customer || { name: 'Unknown Customer' },
                  createdAt: survey.createdAt,
                  updatedAt: survey.updatedAt,
                  arrangedDate: survey.arrangedDate,
                  address: survey.address,
                  city: survey.city,
                  status: survey.status,
                  type: survey.type,
                }}
                onSave={() => {
                  toast.success("BOM saved successfully");
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {survey.type === 'CABLING' 
                      ? 'No equipment added yet. Add equipment to the site survey infrastructure first.'
                      : 'BOM management is only available for cabling surveys.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
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
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>HISTORY & TIMESTAMPS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="font-semibold">
                      {new Date(survey.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="font-semibold">
                      {new Date(survey.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {survey.type === "VOIP" && (
        <VoipSurveyForm
          open={voipDialogOpen}
          onClose={(refresh) => {
            setVoipDialogOpen(false);
            if (refresh) {
              fetchSurveyDetails();
            }
          }}
          siteSurveyId={survey.id}
          siteSurveyTitle={survey.title}
        />
      )}

      {survey.type === "CABLING" && (
        <CablingHierarchyForm
          siteSurveyId={survey.id}
          onSuccess={() => {
            fetchSurveyDetails();
            setCablingDialogOpen(false);
          }}
        />
      )}

      <NetworkDiagramModal
        open={networkDiagramOpen}
        onClose={() => setNetworkDiagramOpen(false)}
        buildings={survey.buildings || []}
        buildingConnections={[]}
      />
    </div>
  );
}
