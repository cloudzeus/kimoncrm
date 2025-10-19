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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface EditProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: {
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
  };
  onSave: (data: any) => Promise<void>;
}

export function EditProjectInfoModal({
  isOpen,
  onClose,
  projectData,
  onSave,
}: EditProjectInfoModalProps) {
  const [formData, setFormData] = useState({
    title: projectData.title,
    description: projectData.description || "",
    type: projectData.type,
    status: projectData.status,
    arrangedDate: projectData.arrangedDate ? projectData.arrangedDate.split('T')[0] : "",
    address: projectData.address || "",
    city: projectData.city || "",
    phone: projectData.phone || "",
    email: projectData.email || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Format the arranged date
      const arrangedDate = formData.arrangedDate ? new Date(formData.arrangedDate).toISOString() : null;
      
      await onSave({
        ...formData,
        arrangedDate,
      });
      
      toast.success("Project information updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update project information");
      console.error("Error updating project:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Project Information</DialogTitle>
          <DialogDescription>
            Update the project details and information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter project title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Project Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPREHENSIVE">Comprehensive</SelectItem>
                  <SelectItem value="VOIP">VoIP</SelectItem>
                  <SelectItem value="CABLING">Cabling</SelectItem>
                  <SelectItem value="WIFI">WiFi</SelectItem>
                  <SelectItem value="DIGITAL_SIGNAGE">Digital Signage</SelectItem>
                  <SelectItem value="HOTEL_TV">Hotel TV</SelectItem>
                  <SelectItem value="NETWORK">Network</SelectItem>
                  <SelectItem value="CCTV">CCTV</SelectItem>
                  <SelectItem value="IOT">IoT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrangedDate">Arranged Date</Label>
              <div className="relative">
                <Input
                  id="arrangedDate"
                  type="date"
                  value={formData.arrangedDate}
                  onChange={(e) => setFormData({ ...formData, arrangedDate: e.target.value })}
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
