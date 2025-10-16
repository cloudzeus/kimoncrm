"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Send,
  FileDown,
  Edit,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { downloadVoipSurveyExcel } from "@/lib/excel/voip-survey-excel";
import { downloadCablingSurveyExcel } from "@/lib/excel/cabling-survey-excel";
import { VoipSurveyForm } from "@/components/site-surveys/voip-survey-form";
import { CablingHierarchyForm } from "@/components/site-surveys/cabling-hierarchy-form";
import { FilesList } from "@/components/files/files-list";

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
}

interface VoipSurveyData {
  id: string;
  siteSurveyId: string;
  oldPbxModel: string | null;
  oldPbxDescription: string | null;
  oldPbxDevices: any[] | null;
  providerName: string | null;
  providerLines: any[] | null;
  internetFeedType: string | null;
  internetFeedSpeed: string | null;
  networkDevices: any[] | null;
  cablingStatus: string | null;
  siteSurvey: SiteSurveyDetail;
}

export default function SiteSurveyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const returnUrl = searchParams.get('returnUrl') || '/site-surveys';

  const [survey, setSurvey] = useState<SiteSurveyDetail | null>(null);
  const [voipData, setVoipData] = useState<VoipSurveyData | null>(null);
  const [cablingData, setCablingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [voipDialogOpen, setVoipDialogOpen] = useState(false);
  const [cablingDialogOpen, setCablingDialogOpen] = useState(false);
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchSurveyDetails();
  }, [id]);

  const fetchSurveyDetails = async () => {
    try {
      setLoading(true);

      // Fetch site survey details
      const response = await fetch(`/api/site-surveys/${id}`);
      const data = await response.json();

      if (response.ok) {
        setSurvey(data);

        // If VOIP type, fetch VOIP details
        if (data.type === "VOIP") {
          const voipResponse = await fetch(`/api/site-surveys/${id}/voip`);
          if (voipResponse.ok) {
            const voipData = await voipResponse.json();
            setVoipData(voipData);
          }
        }

        // If CABLING type, fetch CABLING details
        if (data.type === "CABLING") {
          const cablingResponse = await fetch(`/api/site-surveys/${id}/cabling`);
          if (cablingResponse.ok) {
            const cablingData = await cablingResponse.json();
            setCablingData(cablingData);
          }
        }
      } else {
        toast.error("Site survey not found");
        router.push("/site-surveys");
      }
    } catch (error) {
      console.error("Error fetching survey:", error);
      toast.error("Failed to load site survey");
      router.push("/site-surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      toast.loading("Sending detailed report via email...");

      const response = await fetch(`/api/site-surveys/${id}/notify`, {
        method: "POST",
      });

      const data = await response.json();
      toast.dismiss();

      if (response.ok) {
        toast.success(data.message || "Report sent successfully");
      } else {
        toast.error(data.error || "Failed to send report");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.dismiss();
      toast.error("Failed to send report");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleGenerateExcel = async () => {
    try {
      setGeneratingExcel(true);

      if (survey?.type === "VOIP" && voipData) {
        await downloadVoipSurveyExcel(voipData);
        toast.success("Excel file generated successfully");
      } else if (survey?.type === "CABLING" && cablingData) {
        await downloadCablingSurveyExcel(cablingData);
        toast.success("Excel file generated successfully");
      } else {
        toast.error("Survey details not available");
      }
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    } finally {
      setGeneratingExcel(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading site survey...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(returnUrl)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">
              {survey.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              Site Survey ID: SS-{survey.id}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
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
            onClick={handleSendEmail}
            disabled={sendingEmail}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendingEmail ? "SENDING..." : "SEND REPORT"}
          </Button>
          {survey.type === "VOIP" && voipData && (
            <Button
              onClick={handleGenerateExcel}
              disabled={generatingExcel}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {generatingExcel ? "GENERATING..." : "DOWNLOAD EXCEL"}
            </Button>
          )}
          {survey.type === "CABLING" && cablingData && (
            <Button
              onClick={handleGenerateExcel}
              disabled={generatingExcel}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {generatingExcel ? "GENERATING..." : "DOWNLOAD EXCEL"}
            </Button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2">
        <Badge className={getTypeBadgeColor(survey.type)}>{survey.type}</Badge>
        <Badge variant={survey.status === "Completed" ? "default" : "secondary"}>
          {survey.status}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Survey Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase">
              <ClipboardList className="h-5 w-5" />
              Survey Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {survey.description && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Description
                </label>
                <p className="text-base mt-1">{survey.description}</p>
              </div>
            )}

            {survey.arrangedDate && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Arranged Date & Time
                </label>
                <p className="text-base mt-1">
                  {new Date(survey.arrangedDate).toLocaleString()}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Created
                </label>
                <p className="text-base mt-1">
                  {new Date(survey.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Last Updated
                </label>
                <p className="text-base mt-1">
                  {new Date(survey.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase">
              <Building2 className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase">
                Customer Name
              </label>
              <p className="text-base mt-1">{survey.customer.name}</p>
            </div>

            {survey.contact && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Contact Person
                </label>
                <p className="text-base mt-1">{survey.contact.name}</p>
                {survey.contact.email && (
                  <p className="text-sm text-muted-foreground">
                    {survey.contact.email}
                  </p>
                )}
              </div>
            )}

            {survey.customer.phone01 && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone
                </label>
                <p className="text-base mt-1">{survey.customer.phone01}</p>
              </div>
            )}

            {survey.customer.email && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <p className="text-base mt-1">{survey.customer.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        {(survey.address || survey.city) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 uppercase">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {survey.address && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase">
                    Address
                  </label>
                  <p className="text-base mt-1">{survey.address}</p>
                </div>
              )}

              {survey.city && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase">
                    City
                  </label>
                  <p className="text-base mt-1">{survey.city}</p>
                </div>
              )}

              {survey.phone && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase">
                    On-Site Phone
                  </label>
                  <p className="text-base mt-1">{survey.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase">
              <User className="h-5 w-5" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {survey.assignFrom && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Assigned From
                </label>
                <p className="text-base mt-1">{survey.assignFrom.name}</p>
                <p className="text-sm text-muted-foreground">
                  {survey.assignFrom.email}
                </p>
              </div>
            )}

            {survey.assignTo && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Assigned To
                </label>
                <p className="text-base mt-1">{survey.assignTo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {survey.assignTo.email}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* VOIP Technical Details */}
      {survey.type === "VOIP" && voipData && (
        <>
          <Separator className="my-8" />
          
          <div>
            <h2 className="text-2xl font-bold uppercase mb-6">VOIP TECHNICAL DETAILS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old PBX System */}
            {(voipData.oldPbxModel || voipData.oldPbxDescription || (voipData.oldPbxDevices && voipData.oldPbxDevices.length > 0)) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="uppercase">Old PBX System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {voipData.oldPbxModel && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase">
                        PBX Model
                      </label>
                      <p className="text-base mt-1">{voipData.oldPbxModel}</p>
                    </div>
                  )}

                  {voipData.oldPbxDescription && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase">
                        Description
                      </label>
                      <p className="text-base mt-1 whitespace-pre-wrap">{voipData.oldPbxDescription}</p>
                    </div>
                  )}

                  {voipData.oldPbxDevices && voipData.oldPbxDevices.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase mb-2 block">
                        PBX Devices
                      </label>
                      <div className="space-y-2">
                        {voipData.oldPbxDevices.map((device: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="font-semibold">Type:</span> {device.type}
                              </div>
                              <div>
                                <span className="font-semibold">Model:</span> {device.model}
                              </div>
                              <div>
                                <span className="font-semibold">Number:</span> {device.number}
                              </div>
                              <div>
                                <span className="font-semibold">Location:</span> {device.location || "-"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {voipData.cablingStatus && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase">
                        Cabling Status
                      </label>
                      <p className="text-base mt-1 whitespace-pre-wrap">{voipData.cablingStatus}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Provider Information */}
            {(voipData.providerName || (voipData.providerLines && voipData.providerLines.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase">Provider Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {voipData.providerName && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase">
                        Provider Name
                      </label>
                      <p className="text-base mt-1">{voipData.providerName}</p>
                    </div>
                  )}

                  {voipData.providerLines && voipData.providerLines.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase mb-2 block">
                        Provider Lines
                      </label>
                      <div className="space-y-2">
                        {voipData.providerLines.map((line: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <span><strong>Type:</strong> {line.type}</span>
                              <span><strong>Lines:</strong> {line.lines}</span>
                              <span><strong>Phone:</strong> {line.phoneNumber || "-"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Internet Connection */}
            {(voipData.internetFeedType || voipData.internetFeedSpeed) && (
              <Card>
                <CardHeader>
                  <CardTitle className="uppercase">Internet Connection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {voipData.internetFeedType && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase">
                        Feed Type
                      </label>
                      <p className="text-base mt-1">{voipData.internetFeedType}</p>
                    </div>
                  )}

                  {voipData.internetFeedSpeed && (
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground uppercase">
                        Feed Speed
                      </label>
                      <p className="text-base mt-1">{voipData.internetFeedSpeed}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Network Devices */}
            {voipData.networkDevices && voipData.networkDevices.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="uppercase">Network Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {voipData.networkDevices.map((device: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-semibold">Type:</span> {device.type}
                          </div>
                          <div>
                            <span className="font-semibold">Device:</span> {device.deviceName}
                          </div>
                          <div>
                            <span className="font-semibold">IP:</span> {device.deviceIp || "-"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Future Request */}
            {(voipData.pbxBrand || voipData.conChannelsNum || voipData.extensionsNum || voipData.hotelPms) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="uppercase">Future Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {voipData.pbxBrand && (
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground uppercase">
                          PBX Brand
                        </label>
                        <p className="text-base mt-1">{voipData.pbxBrand}</p>
                      </div>
                    )}
                    {voipData.conChannelsNum && (
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground uppercase">
                          Concurrent Channels
                        </label>
                        <p className="text-base mt-1">{voipData.conChannelsNum}</p>
                      </div>
                    )}
                    {voipData.extensionsNum && (
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground uppercase">
                          Extensions Number
                        </label>
                        <p className="text-base mt-1">{voipData.extensionsNum}</p>
                      </div>
                    )}
                    {voipData.hotelPms && (
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground uppercase">
                          Hotel PMS
                        </label>
                        <p className="text-base mt-1">{voipData.hotelPms}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Files Section */}
      <Separator className="my-8" />
      
      <div>
        <h2 className="text-2xl font-bold uppercase mb-6">
          <FileText className="h-6 w-6 inline mr-2" />
          SURVEY FILES
        </h2>
        <FilesList
          entityId={survey.id}
          entityType="SITESURVEY"
          refreshTrigger={filesRefreshTrigger}
          onFileDeleted={() => setFilesRefreshTrigger((prev) => prev + 1)}
        />
      </div>

      {/* VOIP Edit Dialog */}
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

      {/* CABLING Edit Dialog */}
      {survey.type === "CABLING" && cablingDialogOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-7xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg border bg-background shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold uppercase">CABLING SURVEY - INFRASTRUCTURE HIERARCHY</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCablingDialogOpen(false)}
                >
                  ✕
                </Button>
              </div>
              <CablingHierarchyForm
                siteSurveyId={survey.id}
                onSuccess={() => {
                  setCablingDialogOpen(false);
                  fetchSurveyDetails();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

