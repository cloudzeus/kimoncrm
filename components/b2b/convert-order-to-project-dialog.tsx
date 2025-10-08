'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiUserSelect } from '@/components/ui/multi-user-select';
import { Loader2, Package, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNo: string | null;
  companyId: string;
  contactId: string;
  status: string;
  total: number | null;
  currency: string | null;
  items: Array<{
    id: string;
    product: {
      name: string;
      sku: string;
    };
    qty: number;
  }>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  department?: {
    name: string;
  } | null;
  workPosition?: {
    title: string;
  } | null;
}

interface ConvertOrderToProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onProjectCreated: (project: any) => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedUsers: User[];
}

export function ConvertOrderToProjectDialog({
  isOpen,
  onClose,
  order,
  onProjectCreated,
}: ConvertOrderToProjectDialogProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: `Installation - ${order.orderNo || order.id.slice(-8)}`,
    description: `Project for order ${order.orderNo || order.id.slice(-8)}`,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    assignedUsers: [],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please provide a project name');
      return;
    }

    if (formData.assignedUsers.length === 0) {
      toast.error('Please assign at least one user to the project');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/b2b/convert-order-to-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          projectData: {
            name: formData.name,
            description: formData.description,
            startDate: formData.startDate ? new Date(formData.startDate) : null,
            endDate: formData.endDate ? new Date(formData.endDate) : null,
          },
          assignedUserIds: formData.assignedUsers.map(user => user.id),
        }),
      });

      if (response.ok) {
        const project = await response.json();
        toast.success('Project created successfully!');
        onProjectCreated(project);
        
        // Reset form
        setFormData({
          name: `Installation - ${order.orderNo || order.id.slice(-8)}`,
          description: `Project for order ${order.orderNo || order.id.slice(-8)}`,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          assignedUsers: [],
        });
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = (startDate: string, durationDays: number) => {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + (durationDays * 24 * 60 * 60 * 1000));
    return end.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>CONVERT ORDER TO PROJECT</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Information */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Order #:</span>
                <span className="ml-2 font-mono">
                  {order.orderNo || `#${order.id.slice(-8)}`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2">{order.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-medium">
                  {order.total ? `${order.currency || 'EUR'} ${order.total.toLocaleString()}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Items:</span>
                <span className="ml-2">{order.items.length} products</span>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Project Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the installation project..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    startDate: e.target.value,
                    endDate: e.target.value ? calculateEndDate(e.target.value, 30) : prev.endDate
                  }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Quick Duration Buttons */}
            {formData.startDate && (
              <div className="space-y-2">
                <Label>Quick Duration</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      endDate: calculateEndDate(prev.startDate, 7)
                    }))}
                  >
                    1 Week
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      endDate: calculateEndDate(prev.startDate, 30)
                    }))}
                  >
                    1 Month
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      endDate: calculateEndDate(prev.startDate, 90)
                    }))}
                  >
                    3 Months
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* User Assignment */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <h3 className="font-medium">Assign Users</h3>
            </div>
            
            <div className="space-y-2">
              <Label>Project Team *</Label>
              <MultiUserSelect
                selectedUsers={formData.assignedUsers}
                onUsersChange={(users) => setFormData(prev => ({ ...prev, assignedUsers: users }))}
                placeholder="Select users for this project..."
                roles={['USER', 'MANAGER']} // Only internal users for projects
                showRole={true}
              />
              <p className="text-sm text-muted-foreground">
                Select users who will work on this installation project.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
