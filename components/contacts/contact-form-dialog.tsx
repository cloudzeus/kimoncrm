"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { MultiSelectCustomers } from "./multi-select-customers";
import { MultiSelectSuppliers } from "./multi-select-suppliers";

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
  customers?: Array<{
    customer: {
      id: string;
      name: string;
    };
  }>;
  suppliers?: Array<{
    supplier: {
      id: string;
      name: string;
    };
  }>;
  contactProjects?: Array<{
    project: {
      id: string;
      name: string;
    };
  }>;
}

interface Country {
  id: string;
  name: string;
  softoneCode: string;
}

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSuccess: () => void;
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  onSuccess,
}: ContactFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
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

  // Fetch countries on mount
  useEffect(() => {
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
    fetchCountries();
  }, []);

  // Reset form when dialog opens/closes or contact changes
  useEffect(() => {
    if (open && contact) {
      setFormData({
        title: contact.title || "",
        name: contact.name || "",
        mobilePhone: contact.mobilePhone || "",
        homePhone: contact.homePhone || "",
        workPhone: contact.workPhone || "",
        address: contact.address || "",
        city: contact.city || "",
        zip: contact.zip || "",
        countryId: contact.countryId || "",
        email: contact.email || "",
        notes: contact.notes || "",
      });
      // Load existing relationships
      setSelectedCustomerIds(
        contact.customers?.map((c) => c.customer.id) || []
      );
      setSelectedSupplierIds(
        contact.suppliers?.map((s) => s.supplier.id) || []
      );
    } else if (open && !contact) {
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
      setSelectedCustomerIds([]);
      setSelectedSupplierIds([]);
    }
  }, [open, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);

    try {
      const url = contact ? `/api/contacts/${contact.id}` : "/api/contacts";
      const method = contact ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title?.trim() || null,
          name: formData.name?.trim(),
          mobilePhone: formData.mobilePhone?.trim() || null,
          homePhone: formData.homePhone?.trim() || null,
          workPhone: formData.workPhone?.trim() || null,
          address: formData.address?.trim() || null,
          city: formData.city?.trim() || null,
          zip: formData.zip?.trim() || null,
          countryId: formData.countryId?.trim() || null,
          email: formData.email?.trim() || null,
          notes: formData.notes?.trim() || null,
          // Include selected customers and suppliers
          customerIds: selectedCustomerIds,
          supplierIds: selectedSupplierIds,
        }),
      });

      if (response.ok) {
        toast.success(
          contact ? "Contact updated successfully" : "Contact created successfully"
        );
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save contact");
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Error saving contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {contact ? "EDIT CONTACT" : "ADD NEW CONTACT"}
          </DialogTitle>
          <DialogDescription>
            {contact
              ? "Update the contact information below."
              : "Fill in the details to create a new contact."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">TITLE / POSITION</Label>
              <Input
                id="title"
                placeholder="e.g., Engineer of the project, Project Manager, Technical Lead..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                NAME <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">EMAIL</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobilePhone">MOBILE PHONE</Label>
              <Input
                id="mobilePhone"
                placeholder="+30 123 456 7890"
                value={formData.mobilePhone}
                onChange={(e) =>
                  setFormData({ ...formData, mobilePhone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workPhone">WORK PHONE</Label>
              <Input
                id="workPhone"
                placeholder="+30 123 456 7890"
                value={formData.workPhone}
                onChange={(e) =>
                  setFormData({ ...formData, workPhone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homePhone">HOME PHONE</Label>
              <Input
                id="homePhone"
                placeholder="+30 123 456 7890"
                value={formData.homePhone}
                onChange={(e) =>
                  setFormData({ ...formData, homePhone: e.target.value })
                }
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">ADDRESS</Label>
            <Input
              id="address"
              placeholder="Street address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          {/* City, ZIP, Country */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">CITY</Label>
              <Input
                id="city"
                placeholder="City"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP CODE</Label>
              <Input
                id="zip"
                placeholder="12345"
                value={formData.zip}
                onChange={(e) =>
                  setFormData({ ...formData, zip: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryId">COUNTRY</Label>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">NOTES</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Customers */}
          <div className="space-y-2">
            <Label>CUSTOMERS</Label>
            <MultiSelectCustomers
              selectedIds={selectedCustomerIds}
              onChange={setSelectedCustomerIds}
            />
          </div>

          {/* Suppliers */}
          <div className="space-y-2">
            <Label>SUPPLIERS</Label>
            <MultiSelectSuppliers
              selectedIds={selectedSupplierIds}
              onChange={setSelectedSupplierIds}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              CANCEL
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contact ? "UPDATE" : "CREATE"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

