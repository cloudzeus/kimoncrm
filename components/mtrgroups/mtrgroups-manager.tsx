"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MtrGroup {
  mtrgroup: string;
  code: string;
  name: string;
  sodtype: number;
  isactive: boolean;
}

interface MtrGroupsManagerProps {
  initialGroups: MtrGroup[];
  sodtype: number;
}

interface CreateGroupDialogProps {
  onClose: () => void;
  onSuccess: () => void;
  sodtype: number;
}

function CreateGroupDialog({ onClose, onSuccess, sodtype }: CreateGroupDialogProps) {
  const [name, setName] = useState("");
  const [mtrgroup, setMtrgroup] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Generate mtrgroup (3-digit code) automatically based on available numbers
    const generateCode = async () => {
      try {
        const res = await fetch(`/api/mtrgroups?sodtype=${sodtype}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const existingCodes = data.data.map((g: MtrGroup) => parseInt(g.mtrgroup)).filter((c: number) => !isNaN(c));
            let nextCode = 1;
            while (existingCodes.includes(nextCode)) {
              nextCode++;
            }
            const codeStr = nextCode.toString().padStart(3, '0');
            setMtrgroup(codeStr);
            setCode(codeStr);
          }
        }
      } catch (error) {
        console.error('Error generating code:', error);
      }
    };
    generateCode();
  }, [sodtype]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !mtrgroup || !code) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/mtrgroups/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mtrgroup,
          name,
          code,
          sodtype,
          isactive: 0,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Mtrgroup created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to create mtrgroup');
      }
    } catch (error) {
      console.error('Error creating mtrgroup:', error);
      toast.error('Failed to create mtrgroup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">NAME</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter group name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mtrgroup">MTRGROUP CODE (3 digits)</Label>
        <Input
          id="mtrgroup"
          value={mtrgroup}
          onChange={(e) => setMtrgroup(e.target.value)}
          placeholder="001"
          maxLength={3}
          pattern="[0-9]{3}"
          required
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated based on next available code
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">CODE</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="001"
          maxLength={3}
          pattern="[0-9]{3}"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          CANCEL
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'CREATING...' : 'CREATE'}
        </Button>
      </div>
    </form>
  );
}

interface EditGroupDialogProps {
  group: MtrGroup;
  onClose: () => void;
  onSuccess: () => void;
}

function EditGroupDialog({ group, onClose, onSuccess }: EditGroupDialogProps) {
  const [name, setName] = useState(group.name);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/mtrgroups/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mtrgroup: group.mtrgroup,
          name,
          sodtype: group.sodtype,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Mtrgroup updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to update mtrgroup');
      }
    } catch (error) {
      console.error('Error updating mtrgroup:', error);
      toast.error('Failed to update mtrgroup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mtrgroup">MTRGROUP CODE</Label>
        <Input
          id="mtrgroup"
          value={group.mtrgroup}
          disabled
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">NAME</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter group name"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          CANCEL
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'UPDATING...' : 'UPDATE'}
        </Button>
      </div>
    </form>
  );
}

export function MtrGroupsManager({ initialGroups, sodtype }: MtrGroupsManagerProps) {
  const [groups, setGroups] = useState<MtrGroup[]>(initialGroups);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MtrGroup | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mtrgroups?sodtype=${sodtype}`);
      if (!res.ok) throw new Error('Failed to fetch mtrgroups');
      
      const data = await res.json();
      if (data.success) {
        setGroups(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch mtrgroups');
      }
    } catch (error) {
      console.error('Error fetching mtrgroups:', error);
      toast.error('Failed to load mtrgroups');
    } finally {
      setLoading(false);
    }
  }, [sodtype]);

  const syncFromERP = useCallback(async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/master-data/mtrgroups/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sodtype }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(`Sync complete: ${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped`);
        fetchGroups();
      } else {
        toast.error(data.message || 'Failed to sync from ERP');
      }
    } catch (error) {
      console.error('Error syncing mtrgroups:', error);
      toast.error('Failed to sync from ERP');
    } finally {
      setSyncing(false);
    }
  }, [sodtype, fetchGroups]);

  const handleEdit = useCallback((group: MtrGroup) => {
    setEditingGroup(group);
    setEditDialogOpen(true);
  }, []);

  const typeLabel = sodtype === 51 ? 'PRODUCTS' : 'SERVICES';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{typeLabel} MTRGROUPS</h3>
          <p className="text-sm text-muted-foreground">
            Manage mtrgroups for {typeLabel.toLowerCase()} from SoftOne ERP (sodtype: {sodtype})
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncFromERP}
            disabled={syncing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'SYNCING...' : 'SYNC FROM ERP'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGroups}
            disabled={loading || syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </Button>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                ADD MTRGROUP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>CREATE MTRGROUP ({typeLabel})</DialogTitle>
                <DialogDescription>
                  Add a new mtrgroup to SoftOne ERP (sodtype: {sodtype})
                </DialogDescription>
              </DialogHeader>
              <CreateGroupDialog
                onClose={() => setCreateDialogOpen(false)}
                onSuccess={fetchGroups}
                sodtype={sodtype}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Groups Table */}
      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading mtrgroups...</p>
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No mtrgroups found for {typeLabel.toLowerCase()}.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MTRGROUP CODE</TableHead>
                  <TableHead>CODE</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>SODTYPE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.mtrgroup}>
                    <TableCell className="font-mono">{group.mtrgroup}</TableCell>
                    <TableCell className="font-mono">{group.code}</TableCell>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.sodtype}</TableCell>
                    <TableCell>
                      <Badge variant={group.isactive ? "default" : "secondary"}>
                        {group.isactive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(group)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingGroup && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>EDIT MTRGROUP ({typeLabel})</DialogTitle>
              <DialogDescription>
                Update mtrgroup information (sodtype: {editingGroup.sodtype})
              </DialogDescription>
            </DialogHeader>
            <EditGroupDialog
              group={editingGroup}
              onClose={() => {
                setEditDialogOpen(false);
                setEditingGroup(null);
              }}
              onSuccess={fetchGroups}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
