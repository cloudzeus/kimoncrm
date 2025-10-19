"use client";

import { useState } from "react";
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
import { toast } from "sonner";

interface EditCustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: {
    id: string;
    name: string;
    email: string | null;
    phone01: string | null;
    address: string | null;
    city: string | null;
  };
  onSave: (data: any) => Promise<void>;
}

export function EditCustomerInfoModal({
  isOpen,
  onClose,
  customerData,
  onSave,
}: EditCustomerInfoModalProps) {
  const [formData, setFormData] = useState({
    name: customerData.name,
    email: customerData.email || "",
    phone01: customerData.phone01 || "",
    address: customerData.address || "",
    city: customerData.city || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      await onSave({
        ...formData,
        // Convert empty strings to null for optional fields
        email: formData.email || null,
        phone01: formData.phone01 || null,
        address: formData.address || null,
        city: formData.city || null,
      });
      
      toast.success("Customer information updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update customer information");
      console.error("Error updating customer:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Customer Information</DialogTitle>
          <DialogDescription>
            Update the customer details and contact information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone01">Phone</Label>
              <Input
                id="phone01"
                value={formData.phone01}
                onChange={(e) => setFormData({ ...formData, phone01: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter full address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter city"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.name.trim()}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
