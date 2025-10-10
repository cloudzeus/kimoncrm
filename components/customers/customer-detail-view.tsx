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
} from "lucide-react";
import { toast } from "sonner";
import { CustomerFormDialog } from "./customer-form-dialog";

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

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}`);
      const data = await response.json();

      if (response.ok) {
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
            <h1 className="text-3xl font-bold uppercase tracking-tight">
              {customer.name}
            </h1>
            {customer.sotitle && (
              <p className="text-muted-foreground mt-1">{customer.sotitle}</p>
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
            <CardTitle className="flex items-center gap-2 uppercase">
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
            <CardTitle className="flex items-center gap-2 uppercase">
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
            <CardTitle className="flex items-center gap-2 uppercase">
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

      {/* Edit Dialog */}
      <CustomerFormDialog
        open={isEditDialogOpen}
        onClose={handleEditDialogClose}
        customer={customer}
      />
    </div>
  );
}

