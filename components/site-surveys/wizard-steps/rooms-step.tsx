"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  FileImage,
  Wifi,
  Camera,
  Tv,
  Building2,
  WifiIcon
} from "lucide-react";
import { toast } from "sonner";
import { BuildingData, FloorData, RoomData, OutletData, DeviceData } from "../comprehensive-infrastructure-wizard";

interface RoomsStepProps {
  buildings: BuildingData[];
  onUpdate: (buildings: BuildingData[]) => void;
  siteSurveyId: string;
}

export function RoomsStep({
  buildings,
  onUpdate,
  siteSurveyId,
}: RoomsStepProps) {
  const [localBuildings, setLocalBuildings] = useState<BuildingData[]>(buildings);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");

  useEffect(() => {
    setLocalBuildings(buildings);
    if (buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [buildings, selectedBuildingId]);

  const selectedBuilding = localBuildings.find(b => b.id === selectedBuildingId);
  const selectedFloor = selectedBuilding?.floors?.find(f => f.id === selectedFloorId);

  const updateBuilding = (buildingId: string, updates: Partial<BuildingData>) => {
    const updatedBuildings = localBuildings.map(building => 
      building.id === buildingId ? { ...building, ...updates } : building
    );
    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
  };

  const updateFloor = (buildingId: string, floorId: string, updates: Partial<FloorData>) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const updatedFloors = building.floors?.map(floor => 
      floor.id === floorId ? { ...floor, ...updates } : floor
    ) || [];
    updateBuilding(buildingId, { floors: updatedFloors });
  };

  const addRoom = (buildingId: string, floorId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const newRoom: RoomData = {
      id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Room ${(floor.rooms?.length || 0) + 1}`,
      number: "",
      type: "OFFICE",
      notes: "",
      outlets: [],
      devices: [],
      connections: [],
    };

    const updatedRooms = [...(floor.rooms || []), newRoom];
    updateFloor(buildingId, floorId, { rooms: updatedRooms });
    toast.success("Room added");
  };

  const removeRoom = (buildingId: string, floorId: string, roomId: string) => {
    if (confirm("Are you sure you want to remove this room?")) {
      const building = localBuildings.find(b => b.id === buildingId);
      if (!building) return;

      const floor = building.floors?.find(f => f.id === floorId);
      if (!floor) return;

      const updatedRooms = floor.rooms?.filter(r => r.id !== roomId) || [];
      updateFloor(buildingId, floorId, { rooms: updatedRooms });
      toast.success("Room removed");
    }
  };

  const updateRoom = (buildingId: string, floorId: string, roomId: string, updates: Partial<RoomData>) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const updatedRooms = floor.rooms?.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    ) || [];
    updateFloor(buildingId, floorId, { rooms: updatedRooms });
  };

  const addOutlet = (buildingId: string, floorId: string, roomId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const room = floor.rooms?.find(r => r.id === roomId);
    if (!room) return;

    const newOutlet: OutletData = {
      id: `outlet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: `Outlet ${(room.outlets?.length || 0) + 1}`,
      type: "ETHERNET",
      connection: {
        id: `conn-${Date.now()}`,
        fromDevice: "",
        toDevice: "",
        connectionType: "",
        notes: "",
      },
    };

    const updatedOutlets = [...(room.outlets || []), newOutlet];
    updateRoom(buildingId, floorId, roomId, { outlets: updatedOutlets });
    toast.success("Outlet added");
  };

  const removeOutlet = (buildingId: string, floorId: string, roomId: string, outletId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const room = floor.rooms?.find(r => r.id === roomId);
    if (!room) return;

    const updatedOutlets = room.outlets?.filter(o => o.id !== outletId) || [];
    updateRoom(buildingId, floorId, roomId, { outlets: updatedOutlets });
    toast.success("Outlet removed");
  };

  const updateOutlet = (buildingId: string, floorId: string, roomId: string, outletId: string, updates: Partial<OutletData>) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const room = floor.rooms?.find(r => r.id === roomId);
    if (!room) return;

    const updatedOutlets = room.outlets?.map(outlet => 
      outlet.id === outletId ? { ...outlet, ...updates } : outlet
    ) || [];
    updateRoom(buildingId, floorId, roomId, { outlets: updatedOutlets });
  };

  const addDevice = (buildingId: string, floorId: string, roomId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const room = floor.rooms?.find(r => r.id === roomId);
    if (!room) return;

    const newDevice: DeviceData = {
      id: `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "OTHER",
      brand: "",
      model: "",
      ip: "",
      notes: "",
      images: [],
      services: [], // Add services array
    };

    const updatedDevices = [...(room.devices || []), newDevice];
    updateRoom(buildingId, floorId, roomId, { devices: updatedDevices });
    toast.success("Device added");
  };

  const removeDevice = (buildingId: string, floorId: string, roomId: string, deviceId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const room = floor.rooms?.find(r => r.id === roomId);
    if (!room) return;

    const updatedDevices = room.devices?.filter(d => d.id !== deviceId) || [];
    updateRoom(buildingId, floorId, roomId, { devices: updatedDevices });
    toast.success("Device removed");
  };

  const updateDevice = (buildingId: string, floorId: string, roomId: string, deviceId: string, updates: Partial<DeviceData>) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const room = floor.rooms?.find(r => r.id === roomId);
    if (!room) return;

    const updatedDevices = room.devices?.map(device => 
      device.id === deviceId ? { ...device, ...updates } : device
    ) || [];
    updateRoom(buildingId, floorId, roomId, { devices: updatedDevices });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'PHONE':
      case 'VOIP_PHONE':
        return Phone;
      case 'AP':
        return WifiIcon;
      case 'CAMERA':
        return Camera;
      case 'TV':
        return Tv;
      default:
        return Wifi;
    }
  };

  if (localBuildings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Phone className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Buildings Available</h3>
          <p className="text-sm text-muted-foreground">
            Please add buildings first in the previous step
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Rooms Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure rooms, outlets, and devices for each floor
          </p>
        </div>
      </div>

      {/* Building and Floor Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Building</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {localBuildings.map((building) => (
                <Button
                  key={building.id}
                  variant={selectedBuildingId === building.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedBuildingId(building.id);
                    setSelectedFloorId("");
                  }}
                >
                  {building.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedBuilding && (
          <Card>
            <CardHeader>
              <CardTitle>Select Floor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {selectedBuilding.floors?.map((floor) => (
                  <Button
                    key={floor.id}
                    variant={selectedFloorId === floor.id ? "default" : "outline"}
                    onClick={() => setSelectedFloorId(floor.id)}
                  >
                    {floor.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedBuilding && selectedFloor && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedBuilding.name} - {selectedFloor.name} - Rooms
              </CardTitle>
              <Button onClick={() => addRoom(selectedBuilding.id, selectedFloor.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedFloor.rooms && selectedFloor.rooms.length > 0 ? (
              <div className="space-y-6">
                {selectedFloor.rooms.map((room, index) => (
                  <Card key={room.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{room.name}</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeRoom(selectedBuilding.id, selectedFloor.id, room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Room Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Room Name</Label>
                          <Input
                            value={room.name}
                            onChange={(e) => updateRoom(selectedBuilding.id, selectedFloor.id, room.id, { name: e.target.value })}
                            placeholder="Enter room name"
                          />
                        </div>
                        <div>
                          <Label>Room Number</Label>
                          <Input
                            value={room.number || ''}
                            onChange={(e) => updateRoom(selectedBuilding.id, selectedFloor.id, room.id, { number: e.target.value })}
                            placeholder="Enter room number"
                          />
                        </div>
                        <div>
                          <Label>Room Type</Label>
                          <select
                            value={room.type}
                            onChange={(e) => updateRoom(selectedBuilding.id, selectedFloor.id, room.id, { type: e.target.value })}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="OFFICE">Office</option>
                            <option value="CONFERENCE">Conference Room</option>
                            <option value="RECEPTION">Reception</option>
                            <option value="SERVER_ROOM">Server Room</option>
                            <option value="STORAGE">Storage</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            value={room.notes || ''}
                            onChange={(e) => updateRoom(selectedBuilding.id, selectedFloor.id, room.id, { notes: e.target.value })}
                            placeholder="Additional notes"
                          />
                        </div>
                      </div>

                      {/* Outlets Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Outlets</h4>
                          <Button
                            size="sm"
                            onClick={() => addOutlet(selectedBuilding.id, selectedFloor.id, room.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Outlet
                          </Button>
                        </div>
                        
                        {room.outlets && room.outlets.length > 0 ? (
                          <div className="space-y-2">
                            {room.outlets.map((outlet) => (
                              <Card key={outlet.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <Label>Label</Label>
                                        <Input
                                          value={outlet.label}
                                          onChange={(e) => updateOutlet(selectedBuilding.id, selectedFloor.id, room.id, outlet.id, { label: e.target.value })}
                                          placeholder="Outlet label"
                                        />
                                      </div>
                                      <div>
                                        <Label>Type</Label>
                                        <select
                                          value={outlet.type}
                                          onChange={(e) => updateOutlet(selectedBuilding.id, selectedFloor.id, room.id, outlet.id, { type: e.target.value })}
                                          className="w-full p-2 border rounded-md"
                                        >
                                          <option value="ETHERNET">Ethernet</option>
                                          <option value="POWER">Power</option>
                                          <option value="COAX">Coax</option>
                                          <option value="FIBER">Fiber</option>
                                          <option value="OTHER">Other</option>
                                        </select>
                                      </div>
                                      <div>
                                        <Label>Connection</Label>
                                        <Input
                                          value={outlet.connection?.toDevice || ''}
                                          onChange={(e) => updateOutlet(selectedBuilding.id, selectedFloor.id, room.id, outlet.id, { 
                                            connection: { ...outlet.connection, toDevice: e.target.value }
                                          })}
                                          placeholder="Connected to rack"
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeOutlet(selectedBuilding.id, selectedFloor.id, room.id, outlet.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No outlets added yet</p>
                          </div>
                        )}
                      </div>

                      {/* Devices Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Devices</h4>
                          <Button
                            size="sm"
                            onClick={() => addDevice(selectedBuilding.id, selectedFloor.id, room.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Device
                          </Button>
                        </div>
                        
                        {room.devices && room.devices.length > 0 ? (
                          <div className="space-y-2">
                            {room.devices.map((device) => {
                              const DeviceIcon = getDeviceIcon(device.type);
                              return (
                                <Card key={device.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 flex-1">
                                        <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                                          <div>
                                            <Label>Type</Label>
                                            <select
                                              value={device.type}
                                              onChange={(e) => updateDevice(selectedBuilding.id, selectedFloor.id, room.id, device.id, { type: e.target.value as any })}
                                              className="w-full p-2 border rounded-md"
                                            >
                                              <option value="PHONE">Phone</option>
                                              <option value="VOIP_PHONE">VoIP Phone</option>
                                              <option value="TV">TV</option>
                                              <option value="AP">Access Point</option>
                                              <option value="CAMERA">Camera</option>
                                              <option value="IOT">IoT Device</option>
                                              <option value="OTHER">Other</option>
                                            </select>
                                          </div>
                                          <div>
                                            <Label>Brand</Label>
                                            <Input
                                              value={device.brand || ''}
                                              onChange={(e) => updateDevice(selectedBuilding.id, selectedFloor.id, room.id, device.id, { brand: e.target.value })}
                                              placeholder="Device brand"
                                            />
                                          </div>
                                          <div>
                                            <Label>Model</Label>
                                            <Input
                                              value={device.model || ''}
                                              onChange={(e) => updateDevice(selectedBuilding.id, selectedFloor.id, room.id, device.id, { model: e.target.value })}
                                              placeholder="Device model"
                                            />
                                          </div>
                                          <div>
                                            <Label>IP Address</Label>
                                            <Input
                                              value={device.ip || ''}
                                              onChange={(e) => updateDevice(selectedBuilding.id, selectedFloor.id, room.id, device.id, { ip: e.target.value })}
                                              placeholder="IP address"
                                            />
                                          </div>
                                          <div className="md:col-span-4">
                                            <Label>Notes</Label>
                                            <Input
                                              value={device.notes || ''}
                                              onChange={(e) => updateDevice(selectedBuilding.id, selectedFloor.id, room.id, device.id, { notes: e.target.value })}
                                              placeholder="Additional notes"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeDevice(selectedBuilding.id, selectedFloor.id, room.id, device.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No devices added yet</p>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {room.outlets?.length || 0} Outlets
                        </Badge>
                        <Badge variant="outline">
                          {room.devices?.length || 0} Devices
                        </Badge>
                        <Badge variant="outline">
                          {room.connections?.length || 0} Connections
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Rooms Added</p>
                <p className="text-sm mb-4">Add rooms to configure devices and outlets</p>
                <Button onClick={() => addRoom(selectedBuilding.id, selectedFloor.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Room
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
