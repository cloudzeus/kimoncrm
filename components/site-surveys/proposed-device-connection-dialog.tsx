"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Server, Link2, Package, Settings, Plus, X } from 'lucide-react';
import { ProposedDevice, ProposedConnection, CableType } from '@/types/proposed-infrastructure';
import { EquipmentItem } from '@/types/equipment-selection';

// Device Dialog Props
interface ProposedDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (device: ProposedDevice) => void;
  contextLocation: string; // e.g., "Building: Main → Floor: 1st Floor → Rack: Floor Rack 1"
  elementType: 'rack' | 'room'; // Where the device is being added
  onSelectProducts?: (device: Partial<ProposedDevice>, callback: (items: EquipmentItem[]) => void) => void;
  // Location indices
  buildingIndex: number;
  floorIndex: number;
  rackIndex?: number;
  roomIndex?: number;
  actualElementType: 'centralRack' | 'floorRack' | 'room';
}

// Connection Dialog Props
interface ProposedConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (connection: ProposedConnection) => void;
  fromLocation: string; // e.g., "Building: Main → Floor: 1st Floor → Rack: Floor Rack 1"
  buildings: any[]; // For selecting destination
}

// Device Dialog Component
export function ProposedDeviceDialog({
  open,
  onOpenChange,
  onAdd,
  contextLocation,
  elementType,
  onSelectProducts,
  buildingIndex,
  floorIndex,
  rackIndex,
  roomIndex,
  actualElementType,
}: ProposedDeviceDialogProps) {
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    quantity: 1,
    notes: '',
  });
  const [associatedProducts, setAssociatedProducts] = useState<EquipmentItem[]>([]);
  const [associatedServices, setAssociatedServices] = useState<EquipmentItem[]>([]);
  const [showProductSelection, setShowProductSelection] = useState(false);

  const resetForm = () => {
    setDeviceForm({
      name: '',
      type: '',
      brand: '',
      model: '',
      quantity: 1,
      notes: '',
    });
    setAssociatedProducts([]);
    setAssociatedServices([]);
  };

  const handleAdd = () => {
    if (!deviceForm.name || !deviceForm.type) {
      toast.error('Please fill in device name and type');
      return;
    }

    const newDevice: ProposedDevice = {
      id: `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: deviceForm.name,
      type: deviceForm.type,
      brand: deviceForm.brand || undefined,
      model: deviceForm.model || undefined,
      quantity: deviceForm.quantity,
      notes: deviceForm.notes || undefined,
      buildingIndex,
      floorIndex,
      rackIndex,
      roomIndex,
      elementType: actualElementType,
      associatedProducts,
      associatedServices,
    };

    onAdd(newDevice);
    resetForm();
    onOpenChange(false);
    toast.success('Device added successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Add Device to {elementType === 'rack' ? 'Rack' : 'Room'}
          </DialogTitle>
          <DialogDescription>
            Location: {contextLocation}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name *</Label>
              <Input
                id="device-name"
                placeholder="e.g., Switch, Router, Server"
                value={deviceForm.name}
                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type *</Label>
              <Select
                value={deviceForm.type}
                onValueChange={(value) => setDeviceForm({ ...deviceForm, type: value })}
              >
                <SelectTrigger id="device-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SWITCH">Switch</SelectItem>
                  <SelectItem value="ROUTER">Router</SelectItem>
                  <SelectItem value="SERVER">Server</SelectItem>
                  <SelectItem value="FIREWALL">Firewall</SelectItem>
                  <SelectItem value="ACCESS_POINT">Access Point</SelectItem>
                  <SelectItem value="PATCH_PANEL">Patch Panel</SelectItem>
                  <SelectItem value="PDU">PDU</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device-brand">Brand</Label>
              <Input
                id="device-brand"
                placeholder="e.g., Cisco, HP"
                value={deviceForm.brand}
                onChange={(e) => setDeviceForm({ ...deviceForm, brand: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-model">Model</Label>
              <Input
                id="device-model"
                placeholder="e.g., Catalyst 9300"
                value={deviceForm.model}
                onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-quantity">Quantity</Label>
            <Input
              id="device-quantity"
              type="number"
              min="1"
              value={deviceForm.quantity}
              onChange={(e) => setDeviceForm({ ...deviceForm, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-notes">Notes</Label>
            <Textarea
              id="device-notes"
              placeholder="Additional information about this device"
              value={deviceForm.notes}
              onChange={(e) => setDeviceForm({ ...deviceForm, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Associated Products/Services */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Associated Products & Services</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onSelectProducts) {
                    onSelectProducts(deviceForm, (items) => {
                      const newProducts = [...associatedProducts];
                      const newServices = [...associatedServices];
                      
                      items.forEach(item => {
                        if (item.type === 'product') {
                          newProducts.push(item);
                        } else {
                          newServices.push(item);
                        }
                      });
                      
                      setAssociatedProducts(newProducts);
                      setAssociatedServices(newServices);
                    });
                  } else {
                    toast.info('Please save the device first, then add products/services');
                  }
                }}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Product/Service
              </Button>
            </div>

            {(associatedProducts.length > 0 || associatedServices.length > 0) ? (
              <div className="space-y-2">
                {associatedProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-blue-600" />
                      <span className="text-sm font-medium">{product.name}</span>
                      <Badge variant="secondary" className="text-xs">Qty: {product.quantity}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssociatedProducts(associatedProducts.filter((_, i) => i !== idx))}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {associatedServices.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3 text-green-600" />
                      <span className="text-sm font-medium">{service.name}</span>
                      <Badge variant="secondary" className="text-xs">Qty: {service.quantity}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssociatedServices(associatedServices.filter((_, i) => i !== idx))}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No products or services associated yet
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
              <Server className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Connection Dialog Component
export function ProposedConnectionDialog({
  open,
  onOpenChange,
  onAdd,
  fromLocation,
  buildings,
}: ProposedConnectionDialogProps) {
  const [connectionForm, setConnectionForm] = useState({
    toBuilding: '',
    toFloor: '',
    toRack: '',
    toRoom: '',
    cableType: 'FIBER' as CableType,
    numberOfCables: 1,
    fiberCount: 12, // Total number of fibers in cable (for fiber optic)
    terminatedFibers: 12, // Number of fibers that will be terminated
    distance: 0,
    description: '',
    notes: '',
  });
  const [associatedProducts, setAssociatedProducts] = useState<EquipmentItem[]>([]);
  const [associatedServices, setAssociatedServices] = useState<EquipmentItem[]>([]);

  const resetForm = () => {
    setConnectionForm({
      toBuilding: '',
      toFloor: '',
      toRack: '',
      toRoom: '',
      cableType: 'FIBER',
      numberOfCables: 1,
      fiberCount: 12,
      terminatedFibers: 12,
      distance: 0,
      description: '',
      notes: '',
    });
    setAssociatedProducts([]);
    setAssociatedServices([]);
  };

  const handleAdd = () => {
    if (!connectionForm.toBuilding) {
      toast.error('Please select destination building');
      return;
    }

    // Create connection description
    const toLocation = [
      connectionForm.toBuilding,
      connectionForm.toFloor,
      connectionForm.toRack || connectionForm.toRoom
    ].filter(Boolean).join(' → ');

    const newConnection: ProposedConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromRackId: '', // Will be set by parent
      toRackId: '', // Will be set by parent
      connectionType: connectionForm.cableType,
      distance: connectionForm.distance || undefined,
      description: `${fromLocation} → ${toLocation} (${connectionForm.cableType} ×${connectionForm.numberOfCables})`,
      notes: connectionForm.notes || undefined,
      associatedProducts,
      associatedServices,
    };

    onAdd(newConnection);
    resetForm();
    onOpenChange(false);
    toast.success('Connection added successfully');
  };

  const selectedBuilding = buildings.find(b => b.name === connectionForm.toBuilding);
  const selectedFloor = selectedBuilding?.floors?.find((f: any) => f.name === connectionForm.toFloor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Add Connection
          </DialogTitle>
          <DialogDescription>
            From: {fromLocation}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cable Type *</Label>
              <Select
                value={connectionForm.cableType}
                onValueChange={(value: CableType) => setConnectionForm({ ...connectionForm, cableType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIBER">Fiber Optic</SelectItem>
                  <SelectItem value="COAXIAL">Coaxial</SelectItem>
                  <SelectItem value="RJ45">Cat6/Cat6a (RJ45)</SelectItem>
                  <SelectItem value="RJ11">Phone Line (RJ11)</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Cables</Label>
              <Input
                type="number"
                min="1"
                value={connectionForm.numberOfCables}
                onChange={(e) => setConnectionForm({ ...connectionForm, numberOfCables: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Destination Selection */}
          <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-semibold text-sm text-purple-800">Connection To:</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Building *</Label>
                <Select
                  value={connectionForm.toBuilding}
                  onValueChange={(value) => setConnectionForm({ ...connectionForm, toBuilding: value, toFloor: '', toRack: '', toRoom: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building, idx) => (
                      <SelectItem key={idx} value={building.name}>{building.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {connectionForm.toBuilding && (
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Select
                    value={connectionForm.toFloor}
                    onValueChange={(value) => setConnectionForm({ ...connectionForm, toFloor: value, toRack: '', toRoom: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedBuilding?.floors?.map((floor: any, idx: number) => (
                        <SelectItem key={idx} value={floor.name}>{floor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {connectionForm.toFloor && selectedFloor && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rack</Label>
                  <Select
                    value={connectionForm.toRack}
                    onValueChange={(value) => setConnectionForm({ ...connectionForm, toRack: value, toRoom: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rack (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFloor.floorRacks?.map((rack: any, idx: number) => (
                        <SelectItem key={idx} value={rack.name}>{rack.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select
                    value={connectionForm.toRoom}
                    onValueChange={(value) => setConnectionForm({ ...connectionForm, toRoom: value, toRack: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFloor.rooms?.map((room: any, idx: number) => (
                        <SelectItem key={idx} value={room.name}>{room.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Distance (meters)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={connectionForm.distance}
                onChange={(e) => setConnectionForm({ ...connectionForm, distance: parseFloat(e.target.value) || 0 })}
                placeholder="Cable length"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={connectionForm.description}
                onChange={(e) => setConnectionForm({ ...connectionForm, description: e.target.value })}
                placeholder="e.g., Backbone fiber run"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={connectionForm.notes}
              onChange={(e) => setConnectionForm({ ...connectionForm, notes: e.target.value })}
              placeholder="Additional notes about this connection"
              rows={2}
            />
          </div>

          {/* Associated Products/Services for Connection */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Required Products & Services</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.info('Product selection coming soon - will open equipment selection modal');
                }}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Items
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              e.g., Fiber cables, connectors, installation service
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700">
              <Link2 className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

