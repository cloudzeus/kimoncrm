'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiUserSelect } from '@/components/ui/multi-user-select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

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

interface WorkPosition {
  id: string;
  title: string;
  department: {
    name: string;
  };
  users: User[];
}

interface PositionUserAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  position: WorkPosition;
  onUsersUpdated: (positionId: string, users: User[]) => void;
}

export function PositionUserAssignment({
  isOpen,
  onClose,
  position,
  onUsersUpdated,
}: PositionUserAssignmentProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (position) {
      setSelectedUsers(position.users);
    }
  }, [position]);

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/positions/${position.id}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers.map(user => user.id),
        }),
      });

      if (response.ok) {
        toast.success('Position users updated successfully!');
        onUsersUpdated(position.id, selectedUsers);
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update position users');
      }
    } catch (error) {
      console.error('Error updating position users:', error);
      toast.error('Failed to update position users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>ASSIGN USERS TO POSITION</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Position Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              <span className="font-medium">{position.title}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Department: {position.department.name}
            </p>
          </div>

          {/* Current Users */}
          {position.users.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Current Position Users</h4>
              <div className="flex flex-wrap gap-2">
                {position.users.map((user) => (
                  <Badge key={user.id} variant="secondary">
                    {user.name || user.email}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User Assignment */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <h3 className="font-medium">Assign Users</h3>
            </div>
            
            <MultiUserSelect
              selectedUsers={selectedUsers}
              onUsersChange={setSelectedUsers}
              placeholder="Select users for this position..."
              departments={[position.department.name]} // Filter by department
              showRole={true}
            />
            
            <p className="text-sm text-muted-foreground">
              Select users who should be assigned to the {position.title} position.
              Users will be filtered by the {position.department.name} department.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
