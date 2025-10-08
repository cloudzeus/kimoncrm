'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface MultiUserSelectProps {
  selectedUsers: User[];
  onUsersChange: (users: User[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showRole?: boolean;
  roles?: string[]; // Filter users by roles
  departments?: string[]; // Filter users by departments
}

export function MultiUserSelect({
  selectedUsers,
  onUsersChange,
  placeholder = "Select users...",
  disabled = false,
  className,
  showRole = true,
  roles = [],
  departments = [],
}: MultiUserSelectProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roles, departments]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roles.length > 0) {
        roles.forEach(role => params.append('roles', role));
      }
      if (departments.length > 0) {
        departments.forEach(dept => params.append('departments', dept));
      }
      
      const response = await fetch(`/api/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (user: User) => {
    const isSelected = selectedUsers.some(selected => selected.id === user.id);
    
    if (isSelected) {
      onUsersChange(selectedUsers.filter(selected => selected.id !== user.id));
    } else {
      onUsersChange([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onUsersChange(selectedUsers.filter(user => user.id !== userId));
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'default';
      case 'USER':
        return 'secondary';
      case 'B2B':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getUserDisplayName = (user: User) => {
    return user.name || user.email;
  };

  const getUserSubtitle = (user: User) => {
    const parts = [];
    if (user.department?.name) parts.push(user.department.name);
    if (user.workPosition?.title) parts.push(user.workPosition.title);
    return parts.join(' • ');
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant={getRoleVariant(user.role)}
              className="flex items-center space-x-1 pr-1"
            >
              <User className="h-3 w-3" />
              <span>{getUserDisplayName(user)}</span>
              {showRole && (
                <span className="text-xs opacity-70">
                  ({user.role})
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveUser(user.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* User Selection Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedUsers.length === 0 ? (
              placeholder
            ) : (
              `${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} selected`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading users...' : 'No users found.'}
              </CommandEmpty>
              <CommandGroup>
                {users.map((user) => {
                  const isSelected = selectedUsers.some(selected => selected.id === user.id);
                  return (
                    <CommandItem
                      key={user.id}
                      value={`${user.name || user.email} ${user.email}`}
                      onSelect={() => handleUserToggle(user)}
                      className="flex items-center space-x-2"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{getUserDisplayName(user)}</span>
                          <Badge variant={getRoleVariant(user.role)} className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {getUserSubtitle(user)}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
