"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2,
  Layers3,
  Home,
  Server,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Link2,
  FileDown,
  Loader2,
  MoreVertical,
  FileImage,
  MapPin,
  Upload,
} from "lucide-react";
import { ImageUploadButton } from "@/components/site-surveys/image-upload-button";

interface Building {
  name: string;
  code?: string;
  address?: string;
  notes?: string;
  floors: Floor[];
  centralRacks: Rack[];
  images?: string[];
  blueprints?: string[];
}

interface Floor {
  name: string;
  level?: number;
  notes?: string;
  racks: Rack[];
  rooms: Room[];
  images?: string[];
  blueprints?: string[];
}

interface Rack {
  name: string;
  code?: string;
  units?: number;
  location?: string;
  notes?: string;
  images?: string[];
}

interface Room {
  name: string;
  type: 'OFFICE' | 'MEETING_ROOM' | 'CLOSET' | 'CORRIDOR' | 'OTHER';
  notes?: string;
}

interface BuildingConnection {
  id: string;
  fromBuilding: number;
  toBuilding: number;
  connectionType: string;
  description: string;
  distance?: number;
  notes?: string;
}

interface InfrastructureStepProps {
  buildings: Building[];
  buildingConnections: BuildingConnection[];
  onUpdate: (data: { buildings: Building[]; buildingConnections: BuildingConnection[] }) => void;
  siteSurveyId: string;
}

export function InfrastructureStep({
  buildings,
  buildingConnections,
  onUpdate,
  siteSurveyId,
}: InfrastructureStepProps) {
  const [localBuildings, setLocalBuildings] = useState<Building[]>(buildings);
  const [localConnections, setLocalConnections] = useState<BuildingConnection[]>(buildingConnections);
  const [expandedBuilding, setExpandedBuilding] = useState<number | null>(null);
  const [expandedFloor, setExpandedFloor] = useState<{ building: number; floor: number } | null>(null);

  // Dialog states
  const [buildingDialog, setBuildingDialog] = useState(false);
  const [floorDialog, setFloorDialog] = useState(false);
  const [rackDialog, setRackDialog] = useState(false);
  const [roomDialog, setRoomDialog] = useState(false);
  const [connectionDialog, setConnectionDialog] = useState(false);

  // File generation state
  const [generatingFile, setGeneratingFile] = useState(false);
  
  // Image upload dialogs
  const [buildingImageDialog, setBuildingImageDialog] = useState<{ buildingIndex: number; type: 'image' | 'blueprint' } | null>(null);
  const [centralRackImageDialog, setCentralRackImageDialog] = useState<{ buildingIndex: number; rackIndex: number } | null>(null);
  const [floorImageDialog, setFloorImageDialog] = useState<{ buildingIndex: number; floorIndex: number; type: 'image' | 'blueprint' } | null>(null);

  // Form states
  const [editingBuilding, setEditingBuilding] = useState<number | null>(null);
  const [editingFloor, setEditingFloor] = useState<{ building: number; floor: number } | null>(null);
  const [editingRack, setEditingRack] = useState<{ building: number; floor?: number; rack: number; type: 'central' | 'floor' } | null>(null);
  const [editingRoom, setEditingRoom] = useState<{ building: number; floor: number; room: number } | null>(null);

  const [buildingForm, setBuildingForm] = useState({ name: '', code: '', address: '', notes: '' });
  const [floorForm, setFloorForm] = useState({ name: '', level: 0, notes: '' });
  const [rackForm, setRackForm] = useState({ name: '', code: '', units: 42, location: '', notes: '' });
  const [roomForm, setRoomForm] = useState<{ name: string; type: 'OFFICE' | 'MEETING_ROOM' | 'CLOSET' | 'CORRIDOR' | 'OTHER'; notes: string }>({ name: '', type: 'OFFICE', notes: '' });
  const [connectionForm, setConnectionForm] = useState({
    fromBuilding: -1,
    toBuilding: -1,
    connectionType: 'FIBER',
    description: '',
    distance: 0,
    notes: '',
  });

  // Update parent whenever local state changes
  const updateParent = (newBuildings: Building[], newConnections: BuildingConnection[]) => {
    setLocalBuildings(newBuildings);
    setLocalConnections(newConnections);
    onUpdate({ buildings: newBuildings, buildingConnections: newConnections });
  };

  // Building CRUD
  const openBuildingDialog = (index?: number) => {
    if (index !== undefined) {
      const building = localBuildings[index];
      setBuildingForm({
        name: building.name,
        code: building.code || '',
        address: building.address || '',
        notes: building.notes || '',
      });
      setEditingBuilding(index);
    } else {
      setBuildingForm({ name: '', code: '', address: '', notes: '' });
      setEditingBuilding(null);
    }
    setBuildingDialog(true);
  };

  const saveBuildingDialog = () => {
    if (!buildingForm.name.trim()) {
      toast.error("Building name is required");
      return;
    }

    const newBuildings = [...localBuildings];
    if (editingBuilding !== null) {
      newBuildings[editingBuilding] = {
        ...newBuildings[editingBuilding],
        ...buildingForm,
      };
      toast.success("Building updated");
    } else {
      newBuildings.push({
        ...buildingForm,
        floors: [],
        centralRacks: [],
      });
      toast.success("Building added");
    }

    updateParent(newBuildings, localConnections);
    setBuildingDialog(false);
  };

  const deleteBuilding = (index: number) => {
    if (confirm("Are you sure you want to delete this building?")) {
      const newBuildings = localBuildings.filter((_, i) => i !== index);
      // Remove connections involving this building
      const newConnections = localConnections.filter(
        conn => conn.fromBuilding !== index && conn.toBuilding !== index
      );
      updateParent(newBuildings, newConnections);
      toast.success("Building deleted");
    }
  };

  // Floor CRUD
  const openFloorDialog = (buildingIndex: number, floorIndex?: number) => {
    if (floorIndex !== undefined) {
      const floor = localBuildings[buildingIndex].floors[floorIndex];
      setFloorForm({
        name: floor.name,
        level: floor.level || 0,
        notes: floor.notes || '',
      });
      setEditingFloor({ building: buildingIndex, floor: floorIndex });
    } else {
      setFloorForm({ name: '', level: 0, notes: '' });
      setEditingFloor({ building: buildingIndex, floor: -1 });
    }
    setFloorDialog(true);
  };

  const saveFloorDialog = () => {
    if (!floorForm.name.trim()) {
      toast.error("Floor name is required");
      return;
    }

    if (!editingFloor) return;

    const newBuildings = [...localBuildings];
    const building = newBuildings[editingFloor.building];

    if (editingFloor.floor >= 0) {
      building.floors[editingFloor.floor] = {
        ...building.floors[editingFloor.floor],
        ...floorForm,
      };
      toast.success("Floor updated");
    } else {
      building.floors.push({
        ...floorForm,
        racks: [],
        rooms: [],
      });
      toast.success("Floor added");
    }

    updateParent(newBuildings, localConnections);
    setFloorDialog(false);
  };

  const deleteFloor = (buildingIndex: number, floorIndex: number) => {
    if (confirm("Are you sure you want to delete this floor?")) {
      const newBuildings = [...localBuildings];
      newBuildings[buildingIndex].floors = newBuildings[buildingIndex].floors.filter((_, i) => i !== floorIndex);
      updateParent(newBuildings, localConnections);
      toast.success("Floor deleted");
    }
  };

  // Rack CRUD
  const openRackDialog = (buildingIndex: number, type: 'central' | 'floor', floorIndex?: number, rackIndex?: number) => {
    if (rackIndex !== undefined) {
      let rack: Rack;
      if (type === 'central') {
        rack = localBuildings[buildingIndex].centralRacks[rackIndex];
      } else {
        rack = localBuildings[buildingIndex].floors[floorIndex!].racks[rackIndex];
      }
      setRackForm({
        name: rack.name,
        code: rack.code || '',
        units: rack.units || 42,
        location: rack.location || '',
        notes: rack.notes || '',
      });
      setEditingRack({ building: buildingIndex, floor: floorIndex, rack: rackIndex, type });
    } else {
      setRackForm({ name: '', code: '', units: 42, location: '', notes: '' });
      setEditingRack({ building: buildingIndex, floor: floorIndex, rack: -1, type });
    }
    setRackDialog(true);
  };

  const saveRackDialog = () => {
    if (!rackForm.name.trim()) {
      toast.error("Rack name is required");
      return;
    }

    if (!editingRack) return;

    const newBuildings = [...localBuildings];
    const building = newBuildings[editingRack.building];

    if (editingRack.type === 'central') {
      if (editingRack.rack >= 0) {
        building.centralRacks[editingRack.rack] = { ...rackForm };
        toast.success("Central rack updated");
      } else {
        building.centralRacks.push({ ...rackForm });
        toast.success("Central rack added");
      }
    } else {
      const floor = building.floors[editingRack.floor!];
      if (editingRack.rack >= 0) {
        floor.racks[editingRack.rack] = { ...rackForm };
        toast.success("Floor rack updated");
      } else {
        floor.racks.push({ ...rackForm });
        toast.success("Floor rack added");
      }
    }

    updateParent(newBuildings, localConnections);
    setRackDialog(false);
  };

  const deleteRack = (buildingIndex: number, type: 'central' | 'floor', floorIndex?: number, rackIndex?: number) => {
    if (confirm("Are you sure you want to delete this rack?")) {
      const newBuildings = [...localBuildings];
      if (type === 'central') {
        newBuildings[buildingIndex].centralRacks = newBuildings[buildingIndex].centralRacks.filter((_, i) => i !== rackIndex);
      } else {
        newBuildings[buildingIndex].floors[floorIndex!].racks = newBuildings[buildingIndex].floors[floorIndex!].racks.filter((_, i) => i !== rackIndex);
      }
      updateParent(newBuildings, localConnections);
      toast.success("Rack deleted");
    }
  };

  // Room CRUD
  const openRoomDialog = (buildingIndex: number, floorIndex: number, roomIndex?: number) => {
    if (roomIndex !== undefined) {
      const room = localBuildings[buildingIndex].floors[floorIndex].rooms[roomIndex];
      setRoomForm({
        name: room.name,
        type: room.type,
        notes: room.notes || '',
      });
      setEditingRoom({ building: buildingIndex, floor: floorIndex, room: roomIndex });
    } else {
      setRoomForm({ name: '', type: 'OFFICE', notes: '' });
      setEditingRoom({ building: buildingIndex, floor: floorIndex, room: -1 });
    }
    setRoomDialog(true);
  };

  const saveRoomDialog = () => {
    if (!roomForm.name.trim()) {
      toast.error("Room name is required");
      return;
    }

    if (!editingRoom) return;

    const newBuildings = [...localBuildings];
    const floor = newBuildings[editingRoom.building].floors[editingRoom.floor];

    if (editingRoom.room >= 0) {
      floor.rooms[editingRoom.room] = { ...roomForm };
      toast.success("Room updated");
    } else {
      floor.rooms.push({ ...roomForm });
      toast.success("Room added");
    }

    updateParent(newBuildings, localConnections);
    setRoomDialog(false);
  };

  const deleteRoom = (buildingIndex: number, floorIndex: number, roomIndex: number) => {
    if (confirm("Are you sure you want to delete this room?")) {
      const newBuildings = [...localBuildings];
      newBuildings[buildingIndex].floors[floorIndex].rooms = newBuildings[buildingIndex].floors[floorIndex].rooms.filter((_, i) => i !== roomIndex);
      updateParent(newBuildings, localConnections);
      toast.success("Room deleted");
    }
  };

  // Building Connection CRUD
  const openConnectionDialog = () => {
    setConnectionForm({
      fromBuilding: -1,
      toBuilding: -1,
      connectionType: 'FIBER',
      description: '',
      distance: 0,
      notes: '',
    });
    setConnectionDialog(true);
  };

  const saveConnectionDialog = () => {
    if (connectionForm.fromBuilding < 0 || connectionForm.toBuilding < 0) {
      toast.error("Please select both buildings");
      return;
    }
    if (connectionForm.fromBuilding === connectionForm.toBuilding) {
      toast.error("Cannot connect building to itself");
      return;
    }

    const newConnections = [
      ...localConnections,
      {
        id: `conn-${Date.now()}`,
        ...connectionForm,
      },
    ];

    updateParent(localBuildings, newConnections);
    setConnectionDialog(false);
    toast.success("Building connection added");
  };

  const deleteConnection = (id: string) => {
    if (confirm("Are you sure you want to delete this connection?")) {
      const newConnections = localConnections.filter(conn => conn.id !== id);
      updateParent(localBuildings, newConnections);
      toast.success("Connection deleted");
    }
  };

  const toggleBuilding = (index: number) => {
    setExpandedBuilding(expandedBuilding === index ? null : index);
  };

  const toggleFloor = (buildingIndex: number, floorIndex: number) => {
    if (expandedFloor?.building === buildingIndex && expandedFloor?.floor === floorIndex) {
      setExpandedFloor(null);
    } else {
      setExpandedFloor({ building: buildingIndex, floor: floorIndex });
    }
  };

  // Generate Infrastructure File
  const handleGenerateInfrastructureFile = async () => {
    if (localBuildings.length === 0) {
      toast.error("Please add at least one building before generating the infrastructure file");
      return;
    }

    setGeneratingFile(true);
    try {
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-infrastructure-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildings: localBuildings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate file');
      }

      if (data.success) {
        toast.success(
          data.message || `Successfully generated ${data.files.length} infrastructure file(s)`,
          {
            description: data.files.map((f: any) => `${f.filename} (v${f.version})`).join(', '),
            duration: 5000,
          }
        );
        
        if (data.errors && data.errors.length > 0) {
          toast.warning(
            `Some files had errors`,
            {
              description: data.errors.map((e: any) => `${e.buildingName}: ${e.error}`).join(', '),
              duration: 5000,
            }
          );
        }
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Error generating infrastructure file:', error);
      toast.error(
        'Failed to generate infrastructure file',
        {
          description: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } finally {
      setGeneratingFile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">INFRASTRUCTURE SETUP</h3>
          <p className="text-sm text-muted-foreground">
            Define your site infrastructure including buildings, floors, racks, and rooms
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateInfrastructureFile}
            disabled={localBuildings.length === 0 || generatingFile}
            variant="default"
          >
            {generatingFile ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Generate Infrastructure File
              </>
            )}
          </Button>
          <Button onClick={() => openBuildingDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Building
          </Button>
          {localBuildings.length >= 2 && (
            <Button onClick={openConnectionDialog} variant="outline">
              <Link2 className="h-4 w-4 mr-2" />
              Connect Buildings
            </Button>
          )}
        </div>
      </div>

      {localBuildings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Buildings Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding your first building to the infrastructure
            </p>
            <Button onClick={() => openBuildingDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Building
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localBuildings.map((building, bIdx) => (
            <Card key={bIdx}>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => toggleBuilding(bIdx)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedBuilding === bIdx ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{building.name}</CardTitle>
                      {building.code && (
                        <p className="text-sm text-muted-foreground">Code: {building.code}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="secondary">
                      {building.floors.length} Floor{building.floors.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="secondary">
                      {building.centralRacks.length} Central Rack{building.centralRacks.length !== 1 ? 's' : ''}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Building Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openBuildingDialog(bIdx)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setBuildingImageDialog({ buildingIndex: bIdx, type: 'image' })}>
                          <FileImage className="h-4 w-4 mr-2" />
                          Upload Images
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setBuildingImageDialog({ buildingIndex: bIdx, type: 'blueprint' })}>
                          <MapPin className="h-4 w-4 mr-2" />
                          Upload Blueprints
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteBuilding(bIdx)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Building
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {expandedBuilding === bIdx && (
                <CardContent className="space-y-4 pt-0">
                  {/* Central Racks */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Central Racks
                      </h4>
                      <Button size="sm" variant="outline" onClick={() => openRackDialog(bIdx, 'central')}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Central Rack
                      </Button>
                    </div>
                    {building.centralRacks.length > 0 ? (
                      <div className="space-y-2 ml-6">
                        {building.centralRacks.map((rack, rIdx) => (
                          <div key={rIdx} className="flex items-center justify-between p-2 bg-accent rounded">
                            <span className="text-sm">{rack.name} {rack.code && `(${rack.code})`}</span>
                            <div className="flex gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openRackDialog(bIdx, 'central', undefined, rIdx)}>
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setCentralRackImageDialog({ buildingIndex: bIdx, rackIndex: rIdx })}>
                                    <FileImage className="h-3 w-3 mr-2" />
                                    Upload Images
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => deleteRack(bIdx, 'central', undefined, rIdx)} className="text-red-600">
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete Rack
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground ml-6">No central racks</p>
                    )}
                  </div>

                  {/* Floors */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Layers3 className="h-4 w-4" />
                        Floors
                      </h4>
                      <Button size="sm" variant="outline" onClick={() => openFloorDialog(bIdx)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Floor
                      </Button>
                    </div>
                    {building.floors.length > 0 ? (
                      <div className="space-y-2 ml-6">
                        {building.floors.map((floor, fIdx) => (
                          <Card key={fIdx}>
                            <CardHeader className="p-3 cursor-pointer hover:bg-accent/50" onClick={() => toggleFloor(bIdx, fIdx)}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {expandedFloor?.building === bIdx && expandedFloor?.floor === fIdx ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <span className="font-medium text-sm">{floor.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {floor.racks.length} Racks
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {floor.rooms.length} Rooms
                                  </Badge>
                                </div>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button size="sm" variant="ghost" onClick={() => openFloorDialog(bIdx, fIdx)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => deleteFloor(bIdx, fIdx)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            {expandedFloor?.building === bIdx && expandedFloor?.floor === fIdx && (
                              <CardContent className="p-3 pt-0 space-y-3">
                                {/* Floor Racks */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-semibold flex items-center gap-1">
                                      <Server className="h-3 w-3" />
                                      Floor Racks
                                    </h5>
                                    <Button size="sm" variant="outline" onClick={() => openRackDialog(bIdx, 'floor', fIdx)}>
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Rack
                                    </Button>
                                  </div>
                                  {floor.racks.length > 0 ? (
                                    <div className="space-y-1 ml-4">
                                      {floor.racks.map((rack, rIdx) => (
                                        <div key={rIdx} className="flex items-center justify-between p-2 bg-accent rounded text-xs">
                                          <span>{rack.name} {rack.code && `(${rack.code})`}</span>
                                          <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => openRackDialog(bIdx, 'floor', fIdx, rIdx)}>
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => deleteRack(bIdx, 'floor', fIdx, rIdx)}>
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground ml-4">No racks</p>
                                  )}
                                </div>

                                {/* Rooms */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-semibold flex items-center gap-1">
                                      <Home className="h-3 w-3" />
                                      Rooms
                                    </h5>
                                    <Button size="sm" variant="outline" onClick={() => openRoomDialog(bIdx, fIdx)}>
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Room
                                    </Button>
                                  </div>
                                  {floor.rooms.length > 0 ? (
                                    <div className="space-y-1 ml-4">
                                      {floor.rooms.map((room, roomIdx) => (
                                        <div key={roomIdx} className="flex items-center justify-between p-2 bg-accent rounded text-xs">
                                          <div>
                                            <span>{room.name}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">{room.type}</Badge>
                                          </div>
                                          <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => openRoomDialog(bIdx, fIdx, roomIdx)}>
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => deleteRoom(bIdx, fIdx, roomIdx)}>
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground ml-4">No rooms</p>
                                  )}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground ml-6">No floors added</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Building Connections */}
          {localConnections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Building Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {localConnections.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-3 bg-accent rounded">
                      <div>
                        <p className="font-medium text-sm">
                          {localBuildings[conn.fromBuilding]?.name} ↔ {localBuildings[conn.toBuilding]?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conn.connectionType} - {conn.description}
                          {conn.distance && ` (${conn.distance}m)`}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteConnection(conn.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Building Dialog */}
      <Dialog open={buildingDialog} onOpenChange={setBuildingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBuilding !== null ? 'Edit Building' : 'Add Building'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Building Name *</Label>
              <Input
                value={buildingForm.name}
                onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                placeholder="e.g., Main Building"
              />
            </div>
            <div>
              <Label>Building Code</Label>
              <Input
                value={buildingForm.code}
                onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                placeholder="e.g., BLD-01"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={buildingForm.address}
                onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })}
                placeholder="Building address"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={buildingForm.notes}
                onChange={(e) => setBuildingForm({ ...buildingForm, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuildingDialog(false)}>Cancel</Button>
            <Button onClick={saveBuildingDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floor Dialog */}
      <Dialog open={floorDialog} onOpenChange={setFloorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFloor && editingFloor.floor >= 0 ? 'Edit Floor' : 'Add Floor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Floor Name *</Label>
              <Input
                value={floorForm.name}
                onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
                placeholder="e.g., Ground Floor"
              />
            </div>
            <div>
              <Label>Floor Level</Label>
              <Input
                type="number"
                value={floorForm.level}
                onChange={(e) => setFloorForm({ ...floorForm, level: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={floorForm.notes}
                onChange={(e) => setFloorForm({ ...floorForm, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFloorDialog(false)}>Cancel</Button>
            <Button onClick={saveFloorDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rack Dialog */}
      <Dialog open={rackDialog} onOpenChange={setRackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRack && editingRack.rack >= 0 ? 'Edit' : 'Add'} {editingRack?.type === 'central' ? 'Central' : 'Floor'} Rack
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rack Name *</Label>
              <Input
                value={rackForm.name}
                onChange={(e) => setRackForm({ ...rackForm, name: e.target.value })}
                placeholder="e.g., Main Rack"
              />
            </div>
            <div>
              <Label>Rack Code</Label>
              <Input
                value={rackForm.code}
                onChange={(e) => setRackForm({ ...rackForm, code: e.target.value })}
                placeholder="e.g., RK-01"
              />
            </div>
            <div>
              <Label>Rack Units (U)</Label>
              <Input
                type="number"
                value={rackForm.units}
                onChange={(e) => setRackForm({ ...rackForm, units: parseInt(e.target.value) || 42 })}
                placeholder="42"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={rackForm.location}
                onChange={(e) => setRackForm({ ...rackForm, location: e.target.value })}
                placeholder="Physical location within building/floor"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={rackForm.notes}
                onChange={(e) => setRackForm({ ...rackForm, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRackDialog(false)}>Cancel</Button>
            <Button onClick={saveRackDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom && editingRoom.room >= 0 ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Room Name *</Label>
              <Input
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                placeholder="e.g., Conference Room A"
              />
            </div>
            <div>
              <Label>Room Type</Label>
              <Select value={roomForm.type} onValueChange={(value: any) => setRoomForm({ ...roomForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFICE">Office</SelectItem>
                  <SelectItem value="MEETING_ROOM">Meeting Room</SelectItem>
                  <SelectItem value="CLOSET">Closet</SelectItem>
                  <SelectItem value="CORRIDOR">Corridor</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={roomForm.notes}
                onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialog(false)}>Cancel</Button>
            <Button onClick={saveRoomDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection Dialog */}
      <Dialog open={connectionDialog} onOpenChange={setConnectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Building Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>From Building *</Label>
              <Select
                value={connectionForm.fromBuilding.toString()}
                onValueChange={(value) => setConnectionForm({ ...connectionForm, fromBuilding: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {localBuildings.map((building, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Building *</Label>
              <Select
                value={connectionForm.toBuilding.toString()}
                onValueChange={(value) => setConnectionForm({ ...connectionForm, toBuilding: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {localBuildings.map((building, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Connection Type</Label>
              <Select
                value={connectionForm.connectionType}
                onValueChange={(value) => setConnectionForm({ ...connectionForm, connectionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIBER">Fiber Optic</SelectItem>
                  <SelectItem value="COAXIAL">Coaxial</SelectItem>
                  <SelectItem value="CAT6">CAT6</SelectItem>
                  <SelectItem value="WIRELESS">Wireless</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={connectionForm.description}
                onChange={(e) => setConnectionForm({ ...connectionForm, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label>Distance (meters)</Label>
              <Input
                type="number"
                value={connectionForm.distance}
                onChange={(e) => setConnectionForm({ ...connectionForm, distance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={connectionForm.notes}
                onChange={(e) => setConnectionForm({ ...connectionForm, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectionDialog(false)}>Cancel</Button>
            <Button onClick={saveConnectionDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Building Image Upload Dialog */}
      {buildingImageDialog && (
        <Dialog open={true} onOpenChange={() => setBuildingImageDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Upload Building {buildingImageDialog.type === 'image' ? 'Images' : 'Blueprints'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload {buildingImageDialog.type === 'image' ? 'photos of the site or equipment' : 'floor plans or architectural blueprints'} for {localBuildings[buildingImageDialog.buildingIndex]?.name}
              </p>
              <ImageUploadButton
                entityType="building"
                entityId={`building-${buildingImageDialog.buildingIndex}-${buildingImageDialog.type}`}
                onUploadSuccess={(url) => {
                  const newBuildings = [...localBuildings];
                  if (buildingImageDialog.type === 'image') {
                    newBuildings[buildingImageDialog.buildingIndex] = {
                      ...newBuildings[buildingImageDialog.buildingIndex],
                      images: [...(newBuildings[buildingImageDialog.buildingIndex].images || []), url],
                    };
                  } else {
                    newBuildings[buildingImageDialog.buildingIndex] = {
                      ...newBuildings[buildingImageDialog.buildingIndex],
                      blueprints: [...(newBuildings[buildingImageDialog.buildingIndex].blueprints || []), url],
                    };
                  }
                  updateParent(newBuildings, localConnections);
                  toast.success(`${buildingImageDialog.type === 'image' ? 'Image' : 'Blueprint'} uploaded successfully`);
                }}
                label={`Choose ${buildingImageDialog.type === 'image' ? 'Image' : 'Blueprint'}`}
                variant="outline"
                size="default"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Central Rack Image Upload Dialog */}
      {centralRackImageDialog && (
        <Dialog open={true} onOpenChange={() => setCentralRackImageDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Central Rack Images</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload photos of the central rack equipment
              </p>
              <ImageUploadButton
                entityType="rack"
                entityId={`central-rack-${centralRackImageDialog.buildingIndex}-${centralRackImageDialog.rackIndex}`}
                onUploadSuccess={(url) => {
                  const newBuildings = [...localBuildings];
                  newBuildings[centralRackImageDialog.buildingIndex].centralRacks[centralRackImageDialog.rackIndex] = {
                    ...newBuildings[centralRackImageDialog.buildingIndex].centralRacks[centralRackImageDialog.rackIndex],
                    images: [...(newBuildings[centralRackImageDialog.buildingIndex].centralRacks[centralRackImageDialog.rackIndex].images || []), url],
                  };
                  updateParent(newBuildings, localConnections);
                  toast.success("Image uploaded successfully");
                }}
                label="Choose Image"
                variant="outline"
                size="default"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floor Image Upload Dialog */}
      {floorImageDialog && (
        <Dialog open={true} onOpenChange={() => setFloorImageDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Upload Floor {floorImageDialog.type === 'image' ? 'Images' : 'Blueprints'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload {floorImageDialog.type === 'image' ? 'photos' : 'floor plan'} for {localBuildings[floorImageDialog.buildingIndex]?.floors[floorImageDialog.floorIndex]?.name}
              </p>
              <ImageUploadButton
                entityType="floor"
                entityId={`floor-${floorImageDialog.buildingIndex}-${floorImageDialog.floorIndex}-${floorImageDialog.type}`}
                onUploadSuccess={(url) => {
                  const newBuildings = [...localBuildings];
                  if (floorImageDialog.type === 'image') {
                    newBuildings[floorImageDialog.buildingIndex].floors[floorImageDialog.floorIndex] = {
                      ...newBuildings[floorImageDialog.buildingIndex].floors[floorImageDialog.floorIndex],
                      images: [...(newBuildings[floorImageDialog.buildingIndex].floors[floorImageDialog.floorIndex].images || []), url],
                    };
                  } else {
                    newBuildings[floorImageDialog.buildingIndex].floors[floorImageDialog.floorIndex] = {
                      ...newBuildings[floorImageDialog.buildingIndex].floors[floorImageDialog.floorIndex],
                      blueprints: [...(newBuildings[floorImageDialog.buildingIndex].floors[floorImageDialog.floorIndex].blueprints || []), url],
                    };
                  }
                  updateParent(newBuildings, localConnections);
                  toast.success(`${floorImageDialog.type === 'image' ? 'Image' : 'Blueprint'} uploaded successfully`);
                }}
                label={`Choose ${floorImageDialog.type === 'image' ? 'Image' : 'Blueprint'}`}
                variant="outline"
                size="default"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

