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
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Calendar,
  Building2,
  Briefcase,
  FolderOpen,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ContactFormDialog } from "./contact-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Contact {
  id: string;
  title: string | null;
  name: string;
  mobilePhone: string | null;
  homePhone: string | null;
  workPhone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  countryId: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  country?: {
    id: string;
    name: string;
    softoneCode: string;
  } | null;
  customers?: Array<{
    customer: {
      id: string;
      name: string;
      code: string | null;
    };
  }>;
  suppliers?: Array<{
    supplier: {
      id: string;
      name: string;
      code: string | null;
    };
  }>;
  contactProjects?: Array<{
    project: {
      id: string;
      name: string;
      status: string;
    };
  }>;
}

interface ContactDetailViewProps {
  contactId: string;
}

export function ContactDetailView({ contactId }: ContactDetailViewProps) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contacts/${contactId}`);

      if (!response.ok) {
        toast.error("Contact not found");
        router.push("/contacts");
        return;
      }

      const data = await response.json();
      setContact(data);
    } catch (error) {
      console.error("Error fetching contact:", error);
      toast.error("Failed to load contact");
      router.push("/contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
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
            onClick={() => router.push("/contacts")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">
              {contact.title && `${contact.title} `}
              {contact.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Contact Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContact}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            REFRESH
          </Button>
          <Button size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            EDIT
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 uppercase">
                <User className="h-5 w-5" />
                BASIC INFORMATION
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    Full Name
                  </p>
                  <p className="text-base font-medium">
                    {contact.title && `${contact.title} `}
                    {contact.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    Email
                  </p>
                  <p className="text-base font-medium flex items-center gap-2">
                    {contact.email ? (
                      <>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-primary hover:underline"
                        >
                          {contact.email}
                        </a>
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    Mobile Phone
                  </p>
                  <p className="text-base font-medium flex items-center gap-2">
                    {contact.mobilePhone ? (
                      <>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${contact.mobilePhone}`}
                          className="text-primary hover:underline"
                        >
                          {contact.mobilePhone}
                        </a>
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    Work Phone
                  </p>
                  <p className="text-base font-medium flex items-center gap-2">
                    {contact.workPhone ? (
                      <>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${contact.workPhone}`}
                          className="text-primary hover:underline"
                        >
                          {contact.workPhone}
                        </a>
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    Home Phone
                  </p>
                  <p className="text-base font-medium flex items-center gap-2">
                    {contact.homePhone ? (
                      <>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${contact.homePhone}`}
                          className="text-primary hover:underline"
                        >
                          {contact.homePhone}
                        </a>
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 uppercase">
                <MapPin className="h-5 w-5" />
                ADDRESS INFORMATION
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">
                  Address
                </p>
                <p className="text-base font-medium">
                  {contact.address || "-"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    City
                  </p>
                  <p className="text-base font-medium">{contact.city || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    ZIP Code
                  </p>
                  <p className="text-base font-medium">{contact.zip || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    Country
                  </p>
                  <p className="text-base font-medium">
                    {contact.country?.name || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {contact.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase">
                  <FileText className="h-5 w-5" />
                  NOTES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Relationships */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase text-sm">
                  <Building2 className="h-4 w-4" />
                  CUSTOMERS
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contact.customers && contact.customers.length > 0 ? (
                  <div className="space-y-2">
                    {contact.customers.map((c) => (
                      <div
                        key={c.customer.id}
                        className="flex items-center justify-between p-2 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer"
                        onClick={() => router.push(`/customers/${c.customer.id}`)}
                      >
                        <span className="text-sm font-medium">
                          {c.customer.name}
                        </span>
                        {c.customer.code && (
                          <Badge variant="outline" className="text-xs">
                            {c.customer.code}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No customers linked</p>
                )}
              </CardContent>
            </Card>

            {/* Suppliers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase text-sm">
                  <Briefcase className="h-4 w-4" />
                  SUPPLIERS
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contact.suppliers && contact.suppliers.length > 0 ? (
                  <div className="space-y-2">
                    {contact.suppliers.map((s) => (
                      <div
                        key={s.supplier.id}
                        className="flex items-center justify-between p-2 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer"
                        onClick={() => router.push(`/suppliers/${s.supplier.id}`)}
                      >
                        <span className="text-sm font-medium">
                          {s.supplier.name}
                        </span>
                        {s.supplier.code && (
                          <Badge variant="outline" className="text-xs">
                            {s.supplier.code}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No suppliers linked</p>
                )}
              </CardContent>
            </Card>

            {/* Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase text-sm">
                  <FolderOpen className="h-4 w-4" />
                  PROJECTS
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contact.contactProjects && contact.contactProjects.length > 0 ? (
                  <div className="space-y-2">
                    {contact.contactProjects.map((p) => (
                      <div
                        key={p.project.id}
                        className="flex items-center justify-between p-2 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer"
                        onClick={() => router.push(`/projects/${p.project.id}`)}
                      >
                        <span className="text-sm font-medium">
                          {p.project.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {p.project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No projects linked</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 uppercase">
                <Calendar className="h-5 w-5" />
                METADATA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">
                  Created At
                </p>
                <p className="text-base font-medium">
                  {new Date(contact.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase">
                  Updated At
                </p>
                <p className="text-base font-medium">
                  {new Date(contact.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="uppercase">QUICK STATS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Customers</span>
                <Badge variant="secondary">
                  {contact.customers?.length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Suppliers</span>
                <Badge variant="secondary">
                  {contact.suppliers?.length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Projects</span>
                <Badge variant="secondary">
                  {contact.contactProjects?.length || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <ContactFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        contact={contact}
        onSuccess={() => {
          fetchContact();
          setIsEditDialogOpen(false);
        }}
      />
    </div>
  );
}


