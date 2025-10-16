"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Plus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Contact {
  id: string;
  title: string | null;
  name: string;
  mobilePhone: string | null;
  workPhone: string | null;
  email: string | null;
  city: string | null;
}

interface Country {
  id: string;
  name: string;
}

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "customer" | "supplier" | "project";
  entityId: string;
  entityName: string;
  onSuccess: () => void;
}

export function AddContactDialog({
  open,
  onOpenChange,
  type,
  entityId,
  entityName,
  onSuccess,
}: AddContactDialogProps) {
  const [activeTab, setActiveTab] = useState<"select" | "create">("select");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [creatingContact, setCreatingContact] = useState(false);

  // Form data for creating new contact
  const [formData, setFormData] = useState({
    title: "",
    name: "",
    mobilePhone: "",
    homePhone: "",
    workPhone: "",
    address: "",
    city: "",
    zip: "",
    countryId: "",
    email: "",
    notes: "",
  });

  // Fetch contacts for selection
  useEffect(() => {
    if (open && activeTab === "select") {
      fetchContacts();
    }
  }, [open, activeTab, searchTerm]);

  // Fetch countries for form
  useEffect(() => {
    if (open && activeTab === "create") {
      fetchCountries();
    }
  }, [open, activeTab]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "100",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/contacts?${params}`);
      const data = await response.json();

      if (data.contacts) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch("/api/countries?limit=500");
      const data = await response.json();
      if (data.countries) {
        setCountries(data.countries);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const handleLinkExistingContact = async () => {
    if (!selectedContactId) {
      toast.error("Please select a contact");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/contacts/${selectedContactId}/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          entityId,
        }),
      });

      if (response.ok) {
        toast.success("Contact linked successfully");
        onSuccess();
        onOpenChange(false);
        setSelectedContactId("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to link contact");
      }
    } catch (error) {
      console.error("Error linking contact:", error);
      toast.error("Error linking contact");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setCreatingContact(true);

    try {
      // Step 1: Create the contact
      const createResponse = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          countryId: formData.countryId || null,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        toast.error(error.error || "Failed to create contact");
        return;
      }

      const newContact = await createResponse.json();

      // Step 2: Link the contact to the entity
      const linkResponse = await fetch(`/api/contacts/${newContact.id}/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          entityId,
        }),
      });

      if (linkResponse.ok) {
        toast.success("Contact created and linked successfully");
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({
          title: "",
          name: "",
          mobilePhone: "",
          homePhone: "",
          workPhone: "",
          address: "",
          city: "",
          zip: "",
          countryId: "",
          email: "",
          notes: "",
        });
      } else {
        const error = await linkResponse.json();
        toast.error(error.error || "Contact created but failed to link");
      }
    } catch (error) {
      console.error("Error creating and linking contact:", error);
      toast.error("Error creating contact");
    } finally {
      setCreatingContact(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "customer":
        return `ADD CONTACT TO CUSTOMER`;
      case "supplier":
        return `ADD CONTACT TO SUPPLIER`;
      case "project":
        return `ADD CONTACT TO PROJECT`;
      default:
        return "ADD CONTACT";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="uppercase">{getTitle()}</DialogTitle>
          <DialogDescription>
            Link an existing contact or create a new one for <strong>{entityName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "select" | "create")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select" className="uppercase">
              SELECT EXISTING
            </TabsTrigger>
            <TabsTrigger value="create" className="uppercase">
              CREATE NEW
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Contacts List */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="p-3 rounded-md border">
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No contacts found</p>
                    <p className="text-sm">Try adjusting your search or create a new contact</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedContactId === contact.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-secondary/50"
                      }`}
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {contact.title && (
                              <span className="text-muted-foreground mr-1">
                                {contact.title}
                              </span>
                            )}
                            {contact.name}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1 mt-1">
                            {contact.email && <div>📧 {contact.email}</div>}
                            {contact.mobilePhone && <div>📱 {contact.mobilePhone}</div>}
                            {contact.city && <div>📍 {contact.city}</div>}
                          </div>
                        </div>
                        {selectedContactId === contact.id && (
                          <Badge variant="default">SELECTED</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                CANCEL
              </Button>
              <Button
                onClick={handleLinkExistingContact}
                disabled={!selectedContactId || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                LINK CONTACT
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="create" className="flex-1 overflow-auto">
            <form onSubmit={handleCreateAndLink} className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-title">TITLE / POSITION</Label>
                      <Input
                        id="new-title"
                        placeholder="e.g., Engineer of the project, Project Manager, Technical Lead..."
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-name">
                        NAME <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="new-name"
                        placeholder="Full name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-email">EMAIL</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-mobilePhone">MOBILE PHONE</Label>
                      <Input
                        id="new-mobilePhone"
                        placeholder="+30 123 456 7890"
                        value={formData.mobilePhone}
                        onChange={(e) =>
                          setFormData({ ...formData, mobilePhone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-workPhone">WORK PHONE</Label>
                      <Input
                        id="new-workPhone"
                        placeholder="+30 123 456 7890"
                        value={formData.workPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, workPhone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-homePhone">HOME PHONE</Label>
                      <Input
                        id="new-homePhone"
                        placeholder="+30 123 456 7890"
                        value={formData.homePhone}
                        onChange={(e) =>
                          setFormData({ ...formData, homePhone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-address">ADDRESS</Label>
                    <Input
                      id="new-address"
                      placeholder="Street address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-city">CITY</Label>
                      <Input
                        id="new-city"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-zip">ZIP CODE</Label>
                      <Input
                        id="new-zip"
                        placeholder="12345"
                        value={formData.zip}
                        onChange={(e) =>
                          setFormData({ ...formData, zip: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-countryId">COUNTRY</Label>
                      <Select
                        value={formData.countryId || undefined}
                        onValueChange={(value) =>
                          setFormData({ ...formData, countryId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-notes">NOTES</Label>
                    <Textarea
                      id="new-notes"
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </ScrollArea>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={creatingContact}
                >
                  CANCEL
                </Button>
                <Button type="submit" disabled={creatingContact}>
                  {creatingContact && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Plus className="mr-2 h-4 w-4" />
                  CREATE & LINK
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

