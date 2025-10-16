"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { toast } from "sonner";
import { safeJsonParse } from "@/lib/safe-json";
import { SupplierFormDialog } from "./supplier-form-dialog";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
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

interface Supplier {
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

interface SupplierDetailViewProps {
  supplierId: string;
}

export function SupplierDetailView({ supplierId }: SupplierDetailViewProps) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/suppliers/${supplierId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch supplier error:", response.status, errorText);
        toast.error("Supplier not found");
        router.push("/suppliers");
        return;
      }

      const responseText = await response.text();
      if (!responseText) {
        console.error("Empty response from supplier API");
        toast.error("Empty response from server");
        router.push("/suppliers");
        return;
      }

      const data = safeJsonParse(responseText);
      if (!data) {
        console.error("Failed to parse supplier response");
        toast.error("Invalid response from server");
        router.push("/suppliers");
        return;
      }
      setSupplier(data.supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      toast.error("Failed to load supplier");
      router.push("/suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  const handleUpdateFromAFM = async () => {
    if (!supplier?.afm) {
      toast.error("Supplier has no AFM to validate");
      return;
    }

    try {
      setUpdating(true);
      toast.loading(`Updating ${supplier.name} from Greek Tax Authority...`);

      const response = await fetch(`/api/suppliers/${supplier.id}/update-from-afm`, {
        method: "PATCH",
      });

      toast.dismiss();

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update from AFM error:", response.status, errorText);
        toast.error(`Failed to update supplier: ${response.status}`);
        return;
      }

      const responseText = await response.text();
      if (!responseText) {
        console.error("Empty response from AFM update API");
        toast.error("Empty response from server");
        return;
      }

      const data = safeJsonParse(responseText);
      if (!data) {
        console.error("Failed to parse AFM update response");
        toast.error("Invalid response from server");
        return;
      }

      if (data.success) {
        toast.success(
          `Supplier updated successfully. Fields updated: ${data.updatedFields.join(", ")}`
        );
        fetchSupplier();
      } else {
        toast.error(data.error || "Failed to update supplier");
      }
    } catch (error) {
      console.error("Error updating supplier from AFM:", error);
      toast.dismiss();
      toast.error("Failed to update supplier from Greek Tax Authority");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditDialogClose = (refresh = false) => {
    setIsEditDialogOpen(false);
    if (refresh) {
      fetchSupplier();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
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
            onClick={() => router.push("/suppliers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">
              {supplier.name}
            </h1>
            {supplier.sotitle && (
              <p className="text-muted-foreground mt-1">{supplier.sotitle}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {supplier.afm && (
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
            Edit Supplier
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        <Badge
          variant={supplier.isactive === "ACTIVE" ? "default" : "secondary"}
          className="uppercase"
        >
          {supplier.isactive === "ACTIVE" ? (
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

        {supplier.erp && (
          <Badge variant="outline" className="bg-green-50 uppercase">
            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
            <span className="text-green-600">Synced to ERP</span>
          </Badge>
        )}

        {supplier.trdr && (
          <Badge variant="outline" className="uppercase">
            TRDR: {supplier.trdr}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details" className="uppercase">
            <Building2 className="h-4 w-4 mr-2" />
            DETAILS
          </TabsTrigger>
          <TabsTrigger value="contacts" className="uppercase">
            <User className="h-4 w-4 mr-2" />
            CONTACTS {supplier.contacts && supplier.contacts.length > 0 && `(${supplier.contacts.length})`}
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
            <CardTitle className="flex items-center gap-2 uppercase">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.code && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Supplier Code
                </label>
                <p className="text-base mt-1">{supplier.code}</p>
              </div>
            )}

            {supplier.afm && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  AFM (VAT Number)
                </label>
                <p className="text-base mt-1">{supplier.afm}</p>
              </div>
            )}

            {supplier.jobtypetrd && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Business Activity
                </label>
                <p className="text-base mt-1">{supplier.jobtypetrd}</p>
              </div>
            )}

            {supplier.irsdata && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Tax Office
                </label>
                <p className="text-base mt-1">{supplier.irsdata}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.phone01 && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Primary Phone
                </label>
                <p className="text-base mt-1">
                  <a href={`tel:${supplier.phone01}`} className="hover:underline">
                    {supplier.phone01}
                  </a>
                </p>
              </div>
            )}

            {supplier.phone02 && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Secondary Phone
                </label>
                <p className="text-base mt-1">
                  <a href={`tel:${supplier.phone02}`} className="hover:underline">
                    {supplier.phone02}
                  </a>
                </p>
              </div>
            )}

            {supplier.email && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Email
                </label>
                <p className="text-base mt-1">
                  <a href={`mailto:${supplier.email}`} className="hover:underline">
                    {supplier.email}
                  </a>
                </p>
              </div>
            )}

            {supplier.emailacc && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Accounting Email
                </label>
                <p className="text-base mt-1">
                  <a href={`mailto:${supplier.emailacc}`} className="hover:underline">
                    {supplier.emailacc}
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.address && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Street Address
                </label>
                <p className="text-base mt-1">{supplier.address}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {supplier.city && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase">
                    City
                  </label>
                  <p className="text-base mt-1">{supplier.city}</p>
                </div>
              )}

              {supplier.zip && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase">
                    Postal Code
                  </label>
                  <p className="text-base mt-1">{supplier.zip}</p>
                </div>
              )}
            </div>

            {supplier.district && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  District
                </label>
                <p className="text-base mt-1">{supplier.district}</p>
              </div>
            )}

            {supplier.countryRel && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Country
                </label>
                <p className="text-base mt-1">{supplier.countryRel.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 uppercase">
              <FileText className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.socurrency && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase">
                  Currency Code
                </label>
                <p className="text-base mt-1">{supplier.socurrency}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase">
                Last Updated
              </label>
              <p className="text-base mt-1">
                {new Date(supplier.update).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase">
                Created At
              </label>
              <p className="text-base mt-1">
                {new Date(supplier.createdAt).toLocaleString()}
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
                Manage contacts associated with this supplier
              </p>
            </div>
            <Button
              onClick={() => setIsAddContactDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              ADD CONTACT
            </Button>
          </div>

          {supplier.contacts && supplier.contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplier.contacts.map((c) => (
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
                  No contacts have been linked to this supplier yet.
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

        <TabsContent value="files" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold uppercase">FILES</h2>
              <p className="text-muted-foreground">
                Manage files and documents for this supplier
              </p>
            </div>
            {supplier.afm && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <UploadIcon className="h-4 w-4 mr-2" />
                UPLOAD FILES
              </Button>
            )}
          </div>

          {supplier.afm ? (
            <FilesList
              entityId={supplier.id}
              entityType="SUPPLIER"
              refreshTrigger={filesRefreshTrigger}
              onFileDeleted={() => setFilesRefreshTrigger((prev) => prev + 1)}
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Supplier must have an AFM to upload files
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <SupplierFormDialog
        open={isEditDialogOpen}
        onClose={handleEditDialogClose}
        supplier={supplier}
      />

      {/* Add Contact Dialog */}
      <AddContactDialog
        open={isAddContactDialogOpen}
        onOpenChange={setIsAddContactDialogOpen}
        type="supplier"
        entityId={supplier.id}
        entityName={supplier.name}
        onSuccess={() => {
          fetchSupplier();
          setIsAddContactDialogOpen(false);
        }}
      />

      {/* Upload Files Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>UPLOAD FILES</DialogTitle>
            <DialogDescription>
              Upload files for supplier: {supplier.name} (AFM: {supplier.afm})
            </DialogDescription>
          </DialogHeader>
          {supplier.afm && (
            <FileUpload
              entityId={supplier.id}
              entityType="SUPPLIER"
              folderName={supplier.afm}
              onUploadComplete={() => {
                setFilesRefreshTrigger((prev) => prev + 1);
                toast.success("Files uploaded successfully");
              }}
              onClose={() => setIsUploadDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

