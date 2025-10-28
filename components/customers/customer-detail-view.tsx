"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  ArrowLeft,
  Edit,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  Plus,
  ClipboardList,
  MoreVertical,
  Trash2,
  Upload as UploadFileIcon,
  Send,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerFormDialog } from "./customer-form-dialog";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { SiteSurveyFormDialog } from "@/components/site-surveys/site-survey-form-dialog";
import { EntityEmailsTab } from "@/components/shared/entity-emails-tab";
import { VoipSurveyForm } from "@/components/site-surveys/voip-survey-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Upload as UploadIcon } from "lucide-react";
import { FilesList } from "@/components/files/files-list";
import { FileUpload } from "@/components/files/file-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Customer {
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
  contacts?: Array<{
    contact: {
      id: string;
      name: string;
      title: string | null;
      email: string | null;
      mobilePhone: string | null;
    };
  }>;
}

interface CustomerDetailViewProps {
  customerId: string;
}

export function CustomerDetailView({ customerId }: CustomerDetailViewProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  const [siteSurveys, setSiteSurveys] = useState<any[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [isSiteSurveyDialogOpen, setIsSiteSurveyDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<any | null>(null);
  const [voipDialogOpen, setVoipDialogOpen] = useState(false);
  const [selectedVoipSurvey, setSelectedVoipSurvey] = useState<any | null>(null);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}`);
      const data = await response.json();

      if (response.ok) {
        console.log("Customer data:", data.customer);
        console.log("Customer contacts:", data.customer?.contacts);
        setCustomer(data.customer);
      } else {
        toast.error("Customer not found");
        router.push("/customers");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Failed to load customer");
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  useEffect(() => {
    // Check URL params for tab and action, and hash for emails tab
    if (typeof window !== 'undefined') {
      // Check for hash
      if (window.location.hash === '#emails') {
        setActiveTab('emails');
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      const action = urlParams.get('action');
      
      if (tab) {
        setActiveTab(tab);
      }
      
      if (action === 'new' && tab === 'site-surveys') {
        setIsSiteSurveyDialogOpen(true);
        // Clean up URL
        window.history.replaceState({}, '', `/customers/${customerId}?tab=site-surveys`);
      }
    }
  }, [customerId]);

  useEffect(() => {
    if (activeTab === 'site-surveys') {
      fetchSiteSurveys();
    }
  }, [activeTab, customerId]);

  const fetchSiteSurveys = async () => {
    try {
      setLoadingSurveys(true);
      const response = await fetch(`/api/site-surveys?customerId=${customerId}&limit=100`);
      const data = await response.json();

      if (response.ok) {
        setSiteSurveys(data.siteSurveys || []);
      } else {
        toast.error("Failed to load site surveys");
      }
    } catch (error) {
      console.error("Error fetching site surveys:", error);
      toast.error("Failed to load site surveys");
    } finally {
      setLoadingSurveys(false);
    }
  };

  const handleEditSurvey = (survey: any) => {
    setEditingSurvey(survey);
    setIsSiteSurveyDialogOpen(true);
  };

  const handleDeleteSurvey = (survey: any) => {
    setSurveyToDelete(survey);
    setDeleteDialogOpen(true);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "VOIP":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "CABLING":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
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

  const confirmDeleteSurvey = async () => {
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

  const handleNotifySurvey = async (survey: any) => {
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

  const handleUpdateFromAFM = async () => {
    if (!customer?.afm) {
      toast.error("Customer has no AFM to validate");
      return;
    }

    try {
      setUpdating(true);
      toast.loading(`Updating ${customer.name} from Greek Tax Authority...`);

      const response = await fetch(`/api/customers/${customer.id}/update-from-afm`, {
        method: "PATCH",
      });

      const data = await response.json();

      toast.dismiss();

      if (response.ok && data.success) {
        toast.success(
          `Customer updated successfully. Fields updated: ${data.updatedFields.join(", ")}`
        );
        fetchCustomer();
      } else {
        toast.error(data.error || "Failed to update customer");
      }
    } catch (error) {
      console.error("Error updating customer from AFM:", error);
      toast.dismiss();
      toast.error("Failed to update customer from Greek Tax Authority");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditDialogClose = (refresh = false) => {
    setIsEditDialogOpen(false);
    if (refresh) {
      fetchCustomer();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
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
            onClick={() => router.push("/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tight">
              {customer.name}
            </h1>
            {customer.sotitle && (
              <p className="text-sm text-muted-foreground mt-1">{customer.sotitle}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {customer.afm && (
            <Button
              variant="outline"
              onClick={handleUpdateFromAFM}
              disabled={updating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`} />
              Update from AFM
            </Button>
          )}
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Customer
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        <Badge
          variant={customer.isactive === "ACTIVE" ? "default" : "secondary"}
          className="uppercase"
        >
          {customer.isactive === "ACTIVE" ? (
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

        {customer.erp && (
          <Badge variant="outline" className="bg-green-50 uppercase">
            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
            <span className="text-green-600">Synced to ERP</span>
          </Badge>
        )}

        {customer.trdr && (
          <Badge variant="outline" className="uppercase">
            TRDR: {customer.trdr}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details" className="uppercase">
            <Building2 className="h-4 w-4 mr-2" />
            DETAILS
          </TabsTrigger>
          <TabsTrigger value="contacts" className="uppercase">
            <User className="h-4 w-4 mr-2" />
            CONTACTS {customer.contacts && customer.contacts.length > 0 && `(${customer.contacts.length})`}
          </TabsTrigger>
          <TabsTrigger value="site-surveys" className="uppercase">
            <ClipboardList className="h-4 w-4 mr-2" />
            SITE SURVEYS {siteSurveys.length > 0 && `(${siteSurveys.length})`}
          </TabsTrigger>
          <TabsTrigger value="emails" className="uppercase">
            <Mail className="h-4 w-4 mr-2" />
            EMAILS
          </TabsTrigger>
          <TabsTrigger value="files" className="uppercase">
            <FileText className="h-4 w-4 mr-2" />
            FILES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 uppercase">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.code && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Customer Code
                </label>
                <p className="text-base mt-1">{customer.code}</p>
              </div>
            )}

            {customer.afm && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  AFM (VAT Number)
                </label>
                <p className="text-base mt-1">{customer.afm}</p>
              </div>
            )}

            {customer.jobtypetrd && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Business Activity
                </label>
                <p className="text-base mt-1">{customer.jobtypetrd}</p>
              </div>
            )}

            {customer.irsdata && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Tax Office
                </label>
                <p className="text-base mt-1">{customer.irsdata}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 uppercase">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.phone01 && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Primary Phone
                </label>
                <p className="text-base mt-1">
                  <a href={`tel:${customer.phone01}`} className="hover:underline">
                    {customer.phone01}
                  </a>
                </p>
              </div>
            )}

            {customer.phone02 && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Secondary Phone
                </label>
                <p className="text-base mt-1">
                  <a href={`tel:${customer.phone02}`} className="hover:underline">
                    {customer.phone02}
                  </a>
                </p>
              </div>
            )}

            {customer.email && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Email
                </label>
                <p className="text-base mt-1">
                  <a href={`mailto:${customer.email}`} className="hover:underline">
                    {customer.email}
                  </a>
                </p>
              </div>
            )}

            {customer.emailacc && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Accounting Email
                </label>
                <p className="text-base mt-1">
                  <a href={`mailto:${customer.emailacc}`} className="hover:underline">
                    {customer.emailacc}
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 uppercase">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.address && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Street Address
                </label>
                <p className="text-base mt-1">{customer.address}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {customer.city && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase">
                    City
                  </label>
                  <p className="text-base mt-1">{customer.city}</p>
                </div>
              )}

              {customer.zip && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase">
                    Postal Code
                  </label>
                  <p className="text-base mt-1">{customer.zip}</p>
                </div>
              )}
            </div>

            {customer.district && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  District
                </label>
                <p className="text-base mt-1">{customer.district}</p>
              </div>
            )}

            {customer.countryRel && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Country
                </label>
                <p className="text-base mt-1">{customer.countryRel.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 uppercase">
              <FileText className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.socurrency && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Currency Code
                </label>
                <p className="text-base mt-1">{customer.socurrency}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase">
                Last Updated
              </label>
              <p className="text-base mt-1">
                {new Date(customer.update).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase">
                Created At
              </label>
              <p className="text-base mt-1">
                {new Date(customer.createdAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold uppercase">CONTACTS</h2>
              <p className="text-sm text-muted-foreground">
                Manage contacts associated with this customer
              </p>
            </div>
            <Button
              onClick={() => setIsAddContactDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              ADD CONTACT
            </Button>
          </div>

          {customer.contacts && customer.contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.contacts.map((c) => (
                <Card
                  key={c.contact.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/contacts/${c.contact.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <div>
                        {c.contact.title && (
                          <div className="text-sm text-muted-foreground font-normal mb-1">
                            {c.contact.title}
                          </div>
                        )}
                        <div>{c.contact.name}</div>
                      </div>
                      <User className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {c.contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${c.contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          {c.contact.email}
                        </a>
                      </div>
                    )}
                    {c.contact.mobilePhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${c.contact.mobilePhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          {c.contact.mobilePhone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">NO CONTACTS YET</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  No contacts have been linked to this customer yet.
                </p>
                <Button
                  onClick={() => setIsAddContactDialogOpen(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ADD FIRST CONTACT
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="site-surveys" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold uppercase">SITE SURVEYS</h2>
              <p className="text-muted-foreground">
                Site surveys and assessments for this customer
              </p>
            </div>
            <Button onClick={() => setIsSiteSurveyDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              NEW SITE SURVEY
            </Button>
          </div>

          {loadingSurveys ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </Card>
          ) : siteSurveys.length > 0 ? (
            <div className="space-y-4">
              {siteSurveys.map((survey: any) => (
                <Card key={survey.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{survey.title}</h3>
                          <Badge variant={survey.status === "Completed" ? "default" : "secondary"}>
                            {survey.status}
                          </Badge>
                          <Badge className={getTypeBadgeColor(survey.type)}>
                            {survey.type}
                          </Badge>
                        </div>
                        {survey.description && (
                          <p className="text-sm text-muted-foreground">{survey.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                          {survey.arrangedDate && (
                            <div>
                              <span className="font-semibold">Arranged Date & Time:</span>{" "}
                              {new Date(survey.arrangedDate).toLocaleString()}
                            </div>
                          )}
                          {survey.assignTo && (
                            <div>
                              <span className="font-semibold">Assigned To:</span>{" "}
                              {survey.assignTo.name}
                            </div>
                          )}
                          {survey.address && (
                            <div>
                              <span className="font-semibold">Address:</span>{" "}
                              {survey.address}
                            </div>
                          )}
                          {survey.phone && (
                            <div>
                              <span className="font-semibold">Phone:</span>{" "}
                              {survey.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>ACTIONS</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push(`/site-surveys/${survey.id}?returnUrl=/customers/${customerId}%3Ftab%3Dsite-surveys`)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            VIEW DETAILS
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSurvey(survey)}>
                            <Edit className="h-4 w-4 mr-2" />
                            EDIT
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingSurvey(survey);
                            setIsSiteSurveyDialogOpen(true);
                            // Set the dialog to files tab after opening
                            setTimeout(() => {
                              const tabsList = document.querySelector('[role="tablist"]');
                              const filesTab = document.querySelector('[value="files"]') as HTMLElement;
                              if (filesTab) filesTab.click();
                            }, 100);
                          }}>
                            <UploadFileIcon className="h-4 w-4 mr-2" />
                            MANAGE FILES
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleNotifySurvey(survey)}>
                            <Send className="h-4 w-4 mr-2" />
                            NOTIFY PEOPLE
                          </DropdownMenuItem>
                          {survey.type === "VOIP" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedVoipSurvey(survey);
                                setVoipDialogOpen(true);
                              }}>
                                <PhoneCall className="h-4 w-4 mr-2" />
                                VOIP DETAILS
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteSurvey(survey)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            DELETE
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <CardContent className="space-y-4">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No site surveys have been created for this customer yet.
                </p>
                <Button
                  onClick={() => setIsSiteSurveyDialogOpen(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  CREATE FIRST SITE SURVEY
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold uppercase">ASSOCIATED EMAILS</h2>
              <p className="text-muted-foreground">
                Email threads from contacts associated with this customer
              </p>
            </div>
          </div>
          
          <EntityEmailsTab
            contacts={customer.contacts || []}
            entityId={customer.id}
            entityType="customer"
          />
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold uppercase">FILES</h2>
              <p className="text-muted-foreground">
                Manage files and documents for this customer
              </p>
            </div>
            {customer.afm && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <UploadIcon className="h-4 w-4 mr-2" />
                UPLOAD FILES
              </Button>
            )}
          </div>

          {customer.afm ? (
            <FilesList
              entityId={customer.id}
              entityType="CUSTOMER"
              refreshTrigger={filesRefreshTrigger}
              onFileDeleted={() => setFilesRefreshTrigger((prev) => prev + 1)}
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Customer must have an AFM to upload files
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <CustomerFormDialog
        open={isEditDialogOpen}
        onClose={handleEditDialogClose}
        customer={customer}
      />

      {/* Add Contact Dialog */}
      <AddContactDialog
        open={isAddContactDialogOpen}
        onOpenChange={setIsAddContactDialogOpen}
        type="customer"
        entityId={customer.id}
        entityName={customer.name}
        onSuccess={() => {
          fetchCustomer();
          setIsAddContactDialogOpen(false);
        }}
      />

      {/* Upload Files Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>UPLOAD FILES</DialogTitle>
            <DialogDescription>
              Upload files for customer: {customer.name} (AFM: {customer.afm})
            </DialogDescription>
          </DialogHeader>
          {customer.afm && (
            <FileUpload
              entityId={customer.id}
              entityType="CUSTOMER"
              folderName={customer.afm}
              onUploadComplete={() => {
                setFilesRefreshTrigger((prev) => prev + 1);
                toast.success("Files uploaded successfully");
              }}
              onClose={() => setIsUploadDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Site Survey Dialog */}
      <SiteSurveyFormDialog
        open={isSiteSurveyDialogOpen}
        onClose={(refresh) => {
          setIsSiteSurveyDialogOpen(false);
          setEditingSurvey(null);
          if (refresh) {
            fetchSiteSurveys();
          }
        }}
        customerId={customer.id}
        siteSurvey={editingSurvey}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase">
              DELETE SITE SURVEY
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the site survey "
              {surveyToDelete?.title}"? This action cannot be undone and will also delete all associated files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSurvey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </div>
  );
}

