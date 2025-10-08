'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiUserSelect } from '@/components/ui/multi-user-select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Building2 } from 'lucide-react';
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

interface Department {
  id: string;
  name: string;
  users: User[];
}

interface DepartmentUserAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
  onUsersUpdated: (departmentId: string, users: User[]) => void;
}

export function DepartmentUserAssignment({
  isOpen,
  onClose,
  department,
  onUsersUpdated,
}: DepartmentUserAssignmentProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (department) {
      setSelectedUsers(department.users);
    }
  }, [department]);

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/departments/${department.id}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers.map(user => user.id),
        }),
      });

      if (response.ok) {
        toast.success('Department users updated successfully!');
        onUsersUpdated(department.id, selectedUsers);
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update department users');
      }
    } catch (error) {
      console.error('Error updating department users:', error);
      toast.error('Failed to update department users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>ASSIGN USERS TO DEPARTMENT</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Department Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{department.name}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage user assignments for this department
            </p>
          </div>

          {/* Current Users */}
          {department.users.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Current Department Users</h4>
              <div className="flex flex-wrap gap-2">
                {department.users.map((user) => (
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
              placeholder="Select users for this department..."
              showRole={true}
            />
            
            <p className="text-sm text-muted-foreground">
              Select users who should be assigned to the {department.name} department.
              Users can belong to multiple departments.
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
