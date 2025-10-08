'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Ticket, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SupportContract {
  id: string;
  name: string;
  sla: {
    id: string;
    name: string;
    responseTimeHours: number;
    resolutionTimeHours: number;
  };
  isActive: boolean;
  endDate: string | null;
}

interface NewTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  contactId: string;
  supportContracts: SupportContract[];
}

interface TicketFormData {
  subject: string;
  description: string;
  priority: string;
  supportContractId: string;
}

export function NewTicketDialog({ 
  isOpen, 
  onClose, 
  companyId, 
  contactId, 
  supportContracts 
}: NewTicketDialogProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    subject: '',
    description: '',
    priority: 'Normal',
    supportContractId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (supportContracts.length > 0 && !formData.supportContractId) {
      toast.error('Please select a support contract');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/b2b/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          contactId,
          subject: formData.subject,
          body: formData.description,
          priority: formData.priority,
          supportContractId: formData.supportContractId || null,
        }),
      });

      if (response.ok) {
        toast.success('Support ticket created successfully!');
        setFormData({
          subject: '',
          description: '',
          priority: 'Normal',
          supportContractId: '',
        });
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create support ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  };

  const selectedContract = supportContracts.find(
    contract => contract.id === formData.supportContractId
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Ticket className="h-5 w-5" />
            <span>CREATE NEW SUPPORT TICKET</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Support Contract Selection */}
          {supportContracts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="supportContract">Support Contract *</Label>
              <Select
                value={formData.supportContractId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supportContractId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a support contract" />
                </SelectTrigger>
                <SelectContent>
                  {supportContracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{contract.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {contract.sla.name}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* SLA Information */}
              {selectedContract && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">SLA Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Response Time:</span>
                      <span className="ml-2 font-medium">
                        {selectedContract.sla.responseTimeHours} hours
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resolution Time:</span>
                      <span className="ml-2 font-medium">
                        {selectedContract.sla.resolutionTimeHours} hours
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    <span>Low</span>
                  </div>
                </SelectItem>
                <SelectItem value="Normal">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-600" />
                    <span>Normal</span>
                  </div>
                </SelectItem>
                <SelectItem value="High">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                    <span>High</span>
                  </div>
                </SelectItem>
                <SelectItem value="Urgent">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-800" />
                    <span>Urgent</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
              rows={6}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
