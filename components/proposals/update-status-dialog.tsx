"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: {
    id: string;
    status: string;
    projectTitle?: string | null;
    leadId?: string | null;
  };
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'ΠΡΟΣΧΕΔΙΟ', requiresProject: false },
  { value: 'IN_REVIEW', label: 'ΥΠΟ ΕΞΕΤΑΣΗ', requiresProject: false },
  { value: 'APPROVED', label: 'ΕΓΚΕΚΡΙΜΕΝΟ', requiresProject: false },
  { value: 'SENT', label: 'ΣΤΑΛΘΗΚΕ', requiresProject: false },
  { value: 'ACCEPTED', label: 'ΑΠΟΔΕΚΤΟ', requiresProject: true },
  { value: 'REVISED', label: 'ΑΝΑΘΕΩΡΗΘΗΚΕ', requiresProject: false },
  { value: 'REJECTED', label: 'ΑΠΟΡΡΙΦΘΗΚΕ', requiresProject: false },
  { value: 'WON', label: 'ΚΕΡΔΗΘΗΚΕ', requiresProject: true },
  { value: 'LOST', label: 'ΧΑΘΗΚΕ', requiresProject: false },
  { value: 'EXPIRED', label: 'ΕΛΗΞΕ', requiresProject: false },
];

export function UpdateStatusDialog({
  open,
  onOpenChange,
  proposal,
  onSuccess,
}: UpdateStatusDialogProps) {
  const [status, setStatus] = useState(proposal.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Project creation fields
  const [projectManagerId, setProjectManagerId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const selectedStatusOption = STATUS_OPTIONS.find(opt => opt.value === status);
  const requiresProject = selectedStatusOption?.requiresProject && proposal.leadId;

  // Fetch users and departments when project fields are required
  useEffect(() => {
    if (requiresProject && open) {
      fetchUsersAndDepartments();
    }
  }, [requiresProject, open]);

  const fetchUsersAndDepartments = async () => {
    try {
      const [usersRes, deptRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/departments'),
      ]);
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData);
      }
    } catch (error) {
      console.error('Error fetching users/departments:', error);
    }
  };

  const handleSubmit = async () => {
    if (status === proposal.status) {
      toast.error('Επιλέξτε διαφορετική κατάσταση');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        status,
        note: note.trim() || undefined,
      };

      // Add project fields if converting to ACCEPTED/WON
      if (requiresProject) {
        payload.projectManagerId = projectManagerId || undefined;
        payload.departmentId = departmentId || undefined;
        payload.projectStartDate = projectStartDate || undefined;
        payload.projectEndDate = projectEndDate || undefined;
      }

      const response = await fetch(`/api/proposals/${proposal.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      const result = await response.json();

      if (result.leadConverted && result.project) {
        toast.success(`Η πρόταση ${STATUS_OPTIONS.find(o => o.value === status)?.label.toLowerCase()} επιτυχώς! Το Lead μετατράπηκε σε Project.`);
      } else {
        toast.success(`Η κατάσταση ενημερώθηκε σε ${STATUS_OPTIONS.find(o => o.value === status)?.label}`);
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error updating proposal status:', error);
      toast.error(error.message || 'Αποτυχία ενημέρωσης κατάστασης');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ενημέρωση Κατάστασης Πρότασης</DialogTitle>
          <DialogDescription>
            Αλλάξτε την κατάσταση της πρότασης. {requiresProject && 'Θα δημιουργηθεί αυτόματα νέο Project και το Lead θα μετατραπεί σε WON.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Νέα Κατάσταση</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Επιλέξτε κατάσταση" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.value === proposal.status}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresProject && (
            <>
              <div className="space-y-2">
                <Label htmlFor="projectManager">Project Manager (Προαιρετικό)</Label>
                <Select value={projectManagerId} onValueChange={setProjectManagerId}>
                  <SelectTrigger id="projectManager">
                    <SelectValue placeholder="Επιλέξτε Project Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Κανένας</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Τμήμα (Προαιρετικό)</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Επιλέξτε Τμήμα" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Κανένα</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Ημερομηνία Έναρξης</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Ημερομηνία Λήξης</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={projectEndDate}
                    onChange={(e) => setProjectEndDate(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Σημειώσεις (Προαιρετικό)</Label>
            <Textarea
              id="note"
              placeholder="Προσθέστε σημειώσεις για την αλλαγή κατάστασης..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Ακύρωση
          </Button>
          <Button onClick={handleSubmit} disabled={loading || status === proposal.status}>
            {loading ? 'Ενημέρωση...' : 'Ενημέρωση Κατάστασης'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

