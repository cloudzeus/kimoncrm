'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowRight, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Pause,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

interface StatusManagerProps {
  entityType: 'lead' | 'opportunity' | 'rfp' | 'quote';
  entityId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string, note?: string) => Promise<void>;
  disabled?: boolean;
}

const statusConfigs = {
  lead: {
    statuses: [
      { value: 'New', label: 'New', color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="h-3 w-3" /> },
      { value: 'Contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      { value: 'Qualified', label: 'Qualified', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      { value: 'Unqualified', label: 'Unqualified', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      { value: 'Converted', label: 'Converted', color: 'bg-purple-100 text-purple-800', icon: <ArrowRight className="h-3 w-3" /> },
    ],
    apiEndpoint: '/api/leads',
  },
  opportunity: {
    statuses: [
      { value: 'Active', label: 'Active', color: 'bg-green-100 text-green-800', icon: <Play className="h-3 w-3" /> },
      { value: 'On Hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800', icon: <Pause className="h-3 w-3" /> },
      { value: 'Lost', label: 'Lost', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      { value: 'Won', label: 'Won', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
    ],
    stages: [
      { value: 'Qualification', label: 'Qualification', color: 'bg-blue-100 text-blue-800' },
      { value: 'Proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'Negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
      { value: 'Closed Won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
      { value: 'Closed Lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
    ],
    apiEndpoint: '/api/opportunities',
  },
  rfp: {
    statuses: [
      { value: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-3 w-3" /> },
      { value: 'Submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: <ArrowRight className="h-3 w-3" /> },
      { value: 'Under Review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      { value: 'Awarded', label: 'Awarded', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      { value: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    ],
    apiEndpoint: '/api/rfps',
  },
  quote: {
    statuses: [
      { value: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-3 w-3" /> },
      { value: 'Sent', label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: <ArrowRight className="h-3 w-3" /> },
      { value: 'Viewed', label: 'Viewed', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      { value: 'Accepted', label: 'Accepted', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      { value: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      { value: 'Expired', label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
    ],
    apiEndpoint: '/api/quotes',
  },
};

export function StatusManager({ 
  entityType, 
  entityId, 
  currentStatus, 
  onStatusChange, 
  disabled = false 
}: StatusManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const config = statusConfigs[entityType];
  const currentStatusConfig = config.statuses.find(s => s.value === currentStatus);

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      toast.error('Please select a different status');
      return;
    }

    setLoading(true);
    try {
      await onStatusChange(selectedStatus, note);
      setIsDialogOpen(false);
      setSelectedStatus('');
      setNote('');
      toast.success('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const availableStatuses = config.statuses.filter(status => status.value !== currentStatus);

  return (
    <>
      <div className="flex items-center space-x-2">
        <Badge className={`${currentStatusConfig?.color} flex items-center space-x-1`}>
          {currentStatusConfig?.icon}
          <span>{currentStatusConfig?.label}</span>
        </Badge>
        
        {!disabled && availableStatuses.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Change
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>CHANGE STATUS</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <Badge className={`${currentStatusConfig?.color} flex items-center space-x-1 w-fit`}>
                {currentStatusConfig?.icon}
                <span>{currentStatusConfig?.label}</span>
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStatus">New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center space-x-2">
                        {status.icon}
                        <span>{status.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this status change..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={loading || !selectedStatus}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Status History Component
interface StatusHistoryProps {
  entityType: 'lead' | 'opportunity' | 'rfp' | 'quote';
  entityId: string;
}

export function StatusHistory({ entityType, entityId }: StatusHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusHistory();
  }, [entityType, entityId]);

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/status-history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch status history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((change, index) => (
        <div key={change.id} className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {change.fromStatus || 'New'}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {change.toStatus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              by {change.changedByUser?.name || change.changedByUser?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(change.createdAt).toLocaleString()}
            </p>
            {change.note && (
              <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                {change.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Status Filter Component
interface StatusFilterProps {
  entityType: 'lead' | 'opportunity' | 'rfp' | 'quote';
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export function StatusFilter({ entityType, selectedStatus, onStatusChange }: StatusFilterProps) {
  const config = statusConfigs[entityType];

  return (
    <Select value={selectedStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        {config.statuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            <div className="flex items-center space-x-2">
              {status.icon}
              <span>{status.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

