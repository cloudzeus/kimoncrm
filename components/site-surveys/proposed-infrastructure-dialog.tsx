'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Package, Settings, Cable } from 'lucide-react';
import { 
  ProposedFloorRack, 
  ProposedRoom, 
  ProposedOutlet,
  ProposedDevice,
  CableType 
} from '@/types/proposed-infrastructure';
import { EquipmentItem } from '@/types/equipment-selection';
import { toast } from 'sonner';

interface ProposedRackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingIndex: number;
  floorIndex: number;
  buildingName: string;
  floorName: string;
  onAdd: (rack: ProposedFloorRack) => void;
}

export function ProposedRackDialog({
  open,
  onOpenChange,
  buildingIndex,
  floorIndex,
  buildingName,
  floorName,
  onAdd,
}: ProposedRackDialogProps) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    units: 42,
    location: '',
    notes: '',
  });

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast.error('Rack name is required');
      return;
    }

    const newRack: ProposedFloorRack = {
      id: `proposed-rack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: form.name,
      code: form.code,
      units: form.units,
      location: form.location,
      isNew: true,
      notes: form.notes,
      proposedDevices: [],
      connections: [],
      buildingIndex,
      floorIndex,
      associatedProducts: [],
      associatedServices: [],
    };

    onAdd(newRack);
    setForm({ name: '', code: '', units: 42, location: '', notes: '' });
    onOpenChange(false);
    toast.success('Proposed rack added');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Proposed Floor Rack</DialogTitle>
          <DialogDescription>
            Adding to: {buildingName} → {floorName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Rack Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., IDF-01, MDF Main"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g., R-101"
              />
            </div>
            <div>
              <Label>Units (U)</Label>
              <Input
                type="number"
                min="1"
                value={form.units}
                onChange={(e) => setForm({ ...form, units: parseInt(e.target.value) || 42 })}
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Server Room, Corridor"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes about this proposed rack..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Proposed Rack
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProposedRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingIndex: number;
  floorIndex: number;
  buildingName: string;
  floorName: string;
  onAdd: (room: ProposedRoom) => void;
}

export function ProposedRoomDialog({
  open,
  onOpenChange,
  buildingIndex,
  floorIndex,
  buildingName,
  floorName,
  onAdd,
}: ProposedRoomDialogProps) {
  const [form, setForm] = useState({
    name: '',
    type: 'OFFICE' as ProposedRoom['type'],
    notes: '',
  });

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    const newRoom: ProposedRoom = {
      id: `proposed-room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: form.name,
      type: form.type,
      isNew: true,
      notes: form.notes,
      proposedOutlets: [],
      proposedDevices: [],
      buildingIndex,
      floorIndex,
    };

    onAdd(newRoom);
    setForm({ name: '', type: 'OFFICE', notes: '' });
    onOpenChange(false);
    toast.success('Proposed room added');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Proposed Room</DialogTitle>
          <DialogDescription>
            Adding to: {buildingName} → {floorName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Room Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Conference Room A, Office 101"
            />
          </div>

          <div>
            <Label>Room Type</Label>
            <Select value={form.type} onValueChange={(value: any) => setForm({ ...form, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OFFICE">Office</SelectItem>
                <SelectItem value="MEETING_ROOM">Meeting Room</SelectItem>
                <SelectItem value="CLOSET">Closet/Storage</SelectItem>
                <SelectItem value="CORRIDOR">Corridor</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes about this proposed room..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Proposed Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProposedOutletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  onAdd: (outlet: ProposedOutlet) => void;
  onSelectProducts: (outlet: ProposedOutlet) => void;
}

export function ProposedOutletDialog({
  open,
  onOpenChange,
  roomName,
  onAdd,
  onSelectProducts,
}: ProposedOutletDialogProps) {
  const [form, setForm] = useState({
    name: '',
    type: 'RJ45' as CableType,
    quantity: 1,
    terminationPoint: '',
    notes: '',
  });

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast.error('Outlet name is required');
      return;
    }

    const newOutlet: ProposedOutlet = {
      id: `proposed-outlet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: form.name,
      type: form.type,
      quantity: form.quantity,
      terminationPoint: form.terminationPoint,
      notes: form.notes,
      associatedProducts: [],
      associatedServices: [],
    };

    onAdd(newOutlet);
    
    // Prompt to add products/services
    setTimeout(() => {
      onSelectProducts(newOutlet);
    }, 100);
    
    setForm({ name: '', type: 'RJ45', quantity: 1, terminationPoint: '', notes: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Proposed Outlets</DialogTitle>
          <DialogDescription>
            Adding to: {roomName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Outlet Name/Description *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Wall Outlets - North Side"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cable Type</Label>
              <Select value={form.type} onValueChange={(value: CableType) => setForm({ ...form, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RJ45">RJ45 (Ethernet)</SelectItem>
                  <SelectItem value="FIBER">Fiber Optic</SelectItem>
                  <SelectItem value="COAXIAL">Coaxial</SelectItem>
                  <SelectItem value="RJ11">RJ11 (Phone)</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div>
            <Label>Termination Point</Label>
            <Input
              value={form.terminationPoint}
              onChange={(e) => setForm({ ...form, terminationPoint: e.target.value })}
              placeholder="e.g., Floor Rack IDF-01"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> After adding the outlet, you'll be able to select associated products (cables, patch panels, jacks) and services (installation, testing).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Outlets
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

