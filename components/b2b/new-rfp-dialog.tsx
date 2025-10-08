'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileSearch, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Opportunity {
  id: string;
  name: string;
  stage: string;
}

interface NewRFPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  contactId: string;
  onRFPCreated: (rfp: any) => void;
}

interface RFPFormData {
  title: string;
  description: string;
  dueDate: string;
  opportunityId: string;
  requirements: {
    technicalRequirements: string;
    budgetRange: string;
    timeline: string;
    additionalInfo: string;
  };
}

export function NewRFPDialog({ 
  isOpen, 
  onClose, 
  companyId, 
  contactId, 
  onRFPCreated 
}: NewRFPDialogProps) {
  const [formData, setFormData] = useState<RFPFormData>({
    title: '',
    description: '',
    dueDate: '',
    opportunityId: '',
    requirements: {
      technicalRequirements: '',
      budgetRange: '',
      timeline: '',
      additionalInfo: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // Fetch opportunities when dialog opens
  useState(() => {
    if (isOpen) {
      fetchOpportunities();
    }
  });

  const fetchOpportunities = async () => {
    try {
      const response = await fetch(`/api/b2b/opportunities?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/b2b/rfps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          contactId,
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate || null,
          opportunityId: formData.opportunityId || null,
          requirements: formData.requirements,
        }),
      });

      if (response.ok) {
        const newRFP = await response.json();
        toast.success('RFP created successfully!');
        onRFPCreated(newRFP);
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          opportunityId: '',
          requirements: {
            technicalRequirements: '',
            budgetRange: '',
            timeline: '',
            additionalInfo: '',
          },
        });
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create RFP');
      }
    } catch (error) {
      console.error('Error creating RFP:', error);
      toast.error('Failed to create RFP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSearch className="h-5 w-5" />
            <span>CREATE NEW REQUEST FOR PROPOSAL</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief title for your RFP"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of your project requirements..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opportunity">Opportunity</Label>
                <Select
                  value={formData.opportunityId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, opportunityId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an opportunity (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunities.map((opportunity) => (
                      <SelectItem key={opportunity.id} value={opportunity.id}>
                        {opportunity.name} ({opportunity.stage})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Requirements</h3>
            
            <div className="space-y-2">
              <Label htmlFor="technicalRequirements">Technical Requirements</Label>
              <Textarea
                id="technicalRequirements"
                value={formData.requirements.technicalRequirements}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requirements: { ...prev.requirements, technicalRequirements: e.target.value }
                }))}
                placeholder="Describe technical specifications, integrations, performance requirements..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetRange">Budget Range</Label>
                <Input
                  id="budgetRange"
                  value={formData.requirements.budgetRange}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requirements: { ...prev.requirements, budgetRange: e.target.value }
                  }))}
                  placeholder="e.g., €10,000 - €50,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Input
                  id="timeline"
                  value={formData.requirements.timeline}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requirements: { ...prev.requirements, timeline: e.target.value }
                  }))}
                  placeholder="e.g., 3-6 months"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={formData.requirements.additionalInfo}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requirements: { ...prev.requirements, additionalInfo: e.target.value }
                }))}
                placeholder="Any additional requirements, constraints, or information..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create RFP
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
