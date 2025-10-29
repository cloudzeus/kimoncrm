"use client";

import { useState, useEffect } from "react";
import { Users, Plus, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAvatarUrl } from "@/lib/avatar/avatar-utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  avatar: string | null;
  role: string;
}

interface Participant {
  id: string;
  role: string;
  addedAt: string;
  user: User;
  addedBy: {
    id: string;
    name: string | null;
  } | null;
}

interface LeadParticipantsManagerProps {
  leadId: string;
  participants: Participant[];
  onParticipantsChanged: () => void;
}

export function LeadParticipantsManager({
  leadId,
  participants,
  onParticipantsChanged,
}: LeadParticipantsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("COLLABORATOR");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isDialogOpen) {
      fetchAvailableUsers();
    }
  }, [isDialogOpen]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch("/api/users?roles=EMPLOYEE,MANAGER,ADMIN");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      
      // Filter out users who are already participants
      const participantUserIds = participants.map(p => p.user.id);
      const filtered = data.users.filter(
        (user: User) => !participantUserIds.includes(user.id)
      );
      
      setAvailableUsers(filtered);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedUserId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });

      if (!response.ok) throw new Error("Failed to add participant");

      toast({
        title: "Success",
        description: "Participant added successfully",
      });

      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("COLLABORATOR");
      onParticipantsChanged();
    } catch (error) {
      console.error("Error adding participant:", error);
      toast({
        title: "Error",
        description: "Failed to add participant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveParticipant = async (userId: string, userName: string | null) => {
    if (!confirm(`Remove ${userName || "this user"} from participants?`)) return;

    try {
      const response = await fetch(
        `/api/leads/${leadId}/participants?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to remove participant");

      toast({
        title: "Success",
        description: "Participant removed successfully",
      });

      onParticipantsChanged();
    } catch (error) {
      console.error("Error removing participant:", error);
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ASSIGNEE":
        return "default";
      case "TASK_ASSIGNEE":
        return "secondary";
      case "COLLABORATOR":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Owner";
      case "ASSIGNEE":
        return "Assignee";
      case "TASK_ASSIGNEE":
        return "Task Assignee";
      case "COLLABORATOR":
        return "Collaborator";
      case "VIEWER":
        return "Viewer";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-sm font-semibold uppercase">PARTICIPANTS ({participants.length})</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              ADD PARTICIPANT
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ADD PARTICIPANT</DialogTitle>
              <DialogDescription>
                Add a user to participate in this lead conversation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">SELECT USER</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.name || user.email}</span>
                          <Badge variant="secondary" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">ROLE</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLLABORATOR">Collaborator (Can post notes)</SelectItem>
                    <SelectItem value="VIEWER">Viewer (Read only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  CANCEL
                </Button>
                <Button
                  onClick={handleAddParticipant}
                  disabled={isLoading || !selectedUserId}
                >
                  ADD
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="divide-y">
          {participants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No additional participants</p>
            </div>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(participant.user)} />
                    <AvatarFallback>
                      {getUserInitials(participant.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {participant.user.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(participant.role)}>
                    {getRoleLabel(participant.role)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {participant.user.role}
                  </Badge>
                  {participant.role !== "OWNER" && participant.role !== "ASSIGNEE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoveParticipant(
                          participant.user.id,
                          participant.user.name
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

