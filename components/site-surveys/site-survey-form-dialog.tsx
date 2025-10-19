// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox } from "@/components/shared/combobox";
import { toast } from "sonner";
import { FileUpload } from "@/components/files/file-upload";
import { FilesList } from "@/components/files/files-list";
import { FileText } from "lucide-react";

const siteSurveyFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  // Type removed from schema - will be added as "COMPREHENSIVE" during submission
  customerId: z.string().min(1, "Customer is required"),
  contactId: z.string().optional(),
  arrangedDate: z.string().optional(),
  assignFromId: z.string().optional(),
  assignToId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  status: z.string().default("Scheduled"),
});

type SiteSurveyFormValues = z.infer<typeof siteSurveyFormSchema>;

interface SiteSurveyFormDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  customerId?: string; // Pre-filled when coming from customer detail
  siteSurvey?: any; // For editing
}

interface ComboboxOption {
  value: string;
  label: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
}

export function SiteSurveyFormDialog({
  open,
  onClose,
  customerId,
  siteSurvey,
}: SiteSurveyFormDialogProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<ComboboxOption[]>([]);
  const [customers, setCustomers] = useState<ComboboxOption[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<SiteSurveyFormValues>({
    resolver: zodResolver(siteSurveyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      // Type removed from form - will be added during submission
      customerId: customerId || "",
      contactId: "",
      arrangedDate: "",
      assignFromId: "",
      assignToId: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      status: "Scheduled",
    },
  });

  // Fetch users for assignment comboboxes
  useEffect(() => {
    if (open) {
      fetchUsers();
      if (!customerId) {
        fetchCustomers();
      }
    }
  }, [open, customerId]);

  // Fetch contacts when customer is selected
  useEffect(() => {
    const selectedCustomerId = form.watch("customerId");
    if (selectedCustomerId) {
      fetchCustomerContacts(selectedCustomerId);
    }
  }, [form.watch("customerId")]);

  // Load site survey data for editing
  useEffect(() => {
    if (siteSurvey && open) {
      form.reset({
        title: siteSurvey.title || "",
        description: siteSurvey.description || "",
        type: siteSurvey.type,
        customerId: siteSurvey.customerId || customerId || "",
        contactId: siteSurvey.contactId || "",
        arrangedDate: siteSurvey.arrangedDate
          ? new Date(siteSurvey.arrangedDate).toISOString().slice(0, 16)
          : "",
        assignFromId: siteSurvey.assignFromId || "",
        assignToId: siteSurvey.assignToId || "",
        address: siteSurvey.address || "",
        city: siteSurvey.city || "",
        phone: siteSurvey.phone || "",
        email: siteSurvey.email || "",
        status: siteSurvey.status || "Scheduled",
      });
    } else if (open && !siteSurvey) {
      form.reset({
        title: "",
        description: "",
        type: "VOIP" as any,
        customerId: customerId || "",
        contactId: "",
        arrangedDate: "",
        assignFromId: "",
        assignToId: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        status: "Scheduled",
      });
    }
  }, [siteSurvey, open, customerId]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/users");
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        const userOptions = data.map((user: any) => ({
          value: user.id,
          label: `${user.name || user.email} (${user.email})`,
        }));
        setUsers(userOptions);
      } else {
        console.error("Failed to fetch users:", data);
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await fetch("/api/customers?limit=1000");
      const data = await response.json();
      
      if (response.ok && data.customers && Array.isArray(data.customers)) {
        const customerOptions = data.customers.map((customer: any) => ({
          value: customer.id,
          label: `${customer.name}${customer.afm ? ` - AFM: ${customer.afm}` : ""}${customer.email ? ` - ${customer.email}` : ""}`,
        }));
        setCustomers(customerOptions);
      } else {
        console.error("Failed to fetch customers:", data);
        toast.error("Failed to load customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchCustomerContacts = async (customerId: string) => {
    try {
      setLoadingContacts(true);
      const response = await fetch(`/api/customers/${customerId}`);
      const data = await response.json();
      if (response.ok && data.customer.contacts) {
        const contactsList = data.customer.contacts.map((c: any) => c.contact);
        setContacts(contactsList);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const onSubmit = async (values: SiteSurveyFormValues) => {
    try {
      setSaving(true);

      const url = siteSurvey
        ? `/api/site-surveys/${siteSurvey.id}`
        : "/api/site-surveys";
      const method = siteSurvey ? "PATCH" : "POST";

      // Add COMPREHENSIVE type to the payload
      const payload = {
        ...values,
        type: "COMPREHENSIVE",
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          siteSurvey
            ? "Site survey updated successfully"
            : "Site survey created successfully"
        );
        
        if (!siteSurvey) {
          setCreatedSurveyId(data.id);
          // Switch to files tab after creation
          setActiveTab("files");
          toast.info("You can now upload files for this site survey");
        } else {
          onClose(true);
        }
      } else {
        toast.error(data.error || "Failed to save site survey");
      }
    } catch (error) {
      console.error("Error saving site survey:", error);
      toast.error("Failed to save site survey");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open && !uploadDialogOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase">
              {siteSurvey ? "EDIT SITE SURVEY" : "NEW SITE SURVEY"}
            </DialogTitle>
            <DialogDescription>
              {siteSurvey
                ? "Update site survey details"
                : "Create a new site survey for technical assessment"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">DETAILS</TabsTrigger>
              <TabsTrigger value="files" disabled={!siteSurvey && !createdSurveyId}>
                <FileText className="h-4 w-4 mr-2" />
                FILES
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Customer Selection - Only show if not pre-filled */}
              {!customerId && (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">CUSTOMER *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={customers}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            form.setValue("contactId", ""); // Reset contact when customer changes
                          }}
                          placeholder={loadingCustomers ? "Loading customers..." : "Select customer..."}
                          searchPlaceholder="Search by name, AFM, or email..."
                          emptyText="No customer found"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase">TITLE *</FormLabel>
                    <FormControl>
                      <Input placeholder="Site Survey Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Only - Type is now always COMPREHENSIVE */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">STATUS</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Scheduled">SCHEDULED</SelectItem>
                          <SelectItem value="Completed">COMPLETED</SelectItem>
                          <SelectItem value="Cancelled">CANCELLED</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase">DESCRIPTION</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter survey description..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact and Arranged Date */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">CONTACT</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value === "none" ? "" : value);
                        }}
                        defaultValue={field.value || "none"}
                        value={field.value || "none"}
                        disabled={!form.watch("customerId") || loadingContacts}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingContacts
                                  ? "Loading contacts..."
                                  : "Select contact"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No contact</SelectItem>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                              {contact.email && ` (${contact.email})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrangedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">ARRANGED DATE & TIME</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Assignment - Assign From and Assign To with Comboboxes */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignFromId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="uppercase">ASSIGNED FROM</FormLabel>
                      <Combobox
                        options={users}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder={loadingUsers ? "Loading users..." : "Select user..."}
                        searchPlaceholder="Search user..."
                        emptyText={loadingUsers ? "Loading users..." : "No user found"}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignToId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="uppercase">ASSIGNED TO</FormLabel>
                      <Combobox
                        options={users}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder={loadingUsers ? "Loading users..." : "Select user..."}
                        searchPlaceholder="Search user..."
                        emptyText={loadingUsers ? "Loading users..." : "No user found"}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address and City */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">ADDRESS</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">CITY</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">PHONE</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">EMAIL</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onClose()}
                      disabled={saving}
                    >
                      CANCEL
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "SAVING..." : siteSurvey ? "UPDATE" : createdSurveyId ? "UPDATE" : "CREATE"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              {(siteSurvey?.id || createdSurveyId) ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6">
                    <FileUpload
                      entityId={siteSurvey?.id || createdSurveyId!}
                      entityType="SITESURVEY"
                      onUploadComplete={() => {
                        setFilesRefreshTrigger((prev) => prev + 1);
                        toast.success("Files uploaded successfully");
                      }}
                    />
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-4 uppercase">UPLOADED FILES</h3>
                    <FilesList
                      entityId={siteSurvey?.id || createdSurveyId!}
                      entityType="SITESURVEY"
                      refreshTrigger={filesRefreshTrigger}
                      onFileDeleted={() => setFilesRefreshTrigger((prev) => prev + 1)}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={() => onClose(true)}
                    >
                      DONE
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Save the site survey first to upload files</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      {createdSurveyId && (
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="uppercase">UPLOAD FILES</DialogTitle>
              <DialogDescription>
                Upload documents, images, or other files for this site survey
              </DialogDescription>
            </DialogHeader>

            <FileUpload
              entityId={createdSurveyId}
              entityType="SITESURVEY"
              onUploadComplete={() => {
                setUploadDialogOpen(false);
                onClose(true);
              }}
            />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  onClose(true);
                }}
              >
                DONE
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
