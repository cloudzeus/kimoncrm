"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Wifi, 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  FileImage,
  MapPin,
  Copy,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { BuildingData, FloorData, FloorRackData } from "../comprehensive-infrastructure-wizard";

interface FloorsStepProps {
  buildings: BuildingData[];
  onUpdate: (buildings: BuildingData[]) => void;
  siteSurveyId: string;
}

export function FloorsStep({
  buildings,
  onUpdate,
  siteSurveyId,
}: FloorsStepProps) {
  const [localBuildings, setLocalBuildings] = useState<BuildingData[]>(buildings);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");

  useEffect(() => {
    setLocalBuildings(buildings);
    if (buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [buildings, selectedBuildingId]);

  const selectedBuilding = localBuildings.find(b => b.id === selectedBuildingId);

  const updateBuilding = (buildingId: string, updates: Partial<BuildingData>) => {
    const updatedBuildings = localBuildings.map(building => 
      building.id === buildingId ? { ...building, ...updates } : building
    );
    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
  };

  const addFloor = (buildingId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const newFloor: FloorData = {
      id: `floor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Floor ${(building.floors?.length || 0) + 1}`,
      level: building.floors?.length || 0,
      notes: "",
      isTypical: false,
      repeatCount: 1,
      images: [],
      blueprints: [],
      racks: [],
      rooms: [],
    };

    const updatedFloors = [...(building.floors || []), newFloor];
    updateBuilding(buildingId, { floors: updatedFloors });
    toast.success("Floor added");
  };

  const removeFloor = (buildingId: string, floorId: string) => {
    if (confirm("Are you sure you want to remove this floor?")) {
      const building = localBuildings.find(b => b.id === buildingId);
      if (!building) return;

      const updatedFloors = building.floors?.filter(f => f.id !== floorId) || [];
      updateBuilding(buildingId, { floors: updatedFloors });
      toast.success("Floor removed");
    }
  };

  const updateFloor = (buildingId: string, floorId: string, updates: Partial<FloorData>) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const updatedFloors = building.floors?.map(floor => 
      floor.id === floorId ? { ...floor, ...updates } : floor
    ) || [];
    updateBuilding(buildingId, { floors: updatedFloors });
  };

  const duplicateFloor = (buildingId: string, floorId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floorToDuplicate = building.floors?.find(f => f.id === floorId);
    if (!floorToDuplicate) return;

    const newFloor: FloorData = {
      ...floorToDuplicate,
      id: `floor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${floorToDuplicate.name} (Copy)`,
      images: [],
      blueprints: [],
      racks: [],
      rooms: [],
    };

    const updatedFloors = [...(building.floors || []), newFloor];
    updateBuilding(buildingId, { floors: updatedFloors });
    toast.success("Floor duplicated");
  };

  const addFloorRack = (buildingId: string, floorId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const newRack: FloorRackData = {
      id: `floor-rack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Rack ${(floor.racks?.length || 0) + 1}`,
      code: "",
      units: 42,
      location: "",
      notes: "",
      connections: [],
      ata: undefined,
      switches: [],
    };

    const updatedRacks = [...(floor.racks || []), newRack];
    updateFloor(buildingId, floorId, { racks: updatedRacks });
    toast.success("Floor rack added");
  };

  const removeFloorRack = (buildingId: string, floorId: string, rackId: string) => {
    if (confirm("Are you sure you want to remove this floor rack?")) {
      const building = localBuildings.find(b => b.id === buildingId);
      if (!building) return;

      const floor = building.floors?.find(f => f.id === floorId);
      if (!floor) return;

      const updatedRacks = floor.racks?.filter(r => r.id !== rackId) || [];
      updateFloor(buildingId, floorId, { racks: updatedRacks });
      toast.success("Floor rack removed");
    }
  };

  const updateFloorRack = (buildingId: string, floorId: string, rackId: string, updates: Partial<FloorRackData>) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find(f => f.id === floorId);
    if (!floor) return;

    const updatedRacks = floor.racks?.map(rack => 
      rack.id === rackId ? { ...rack, ...updates } : rack
    ) || [];
    updateFloor(buildingId, floorId, { racks: updatedRacks });
  };

  const handleImageUpload = async (buildingId: string, floorId: string, files: FileList) => {
    try {
      // TODO: Implement actual file upload to BunnyCDN
      const newImages = Array.from(files).map(file => ({
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: 'IMAGE' as const,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }));

      const building = localBuildings.find(b => b.id === buildingId);
      const floor = building?.floors?.find(f => f.id === floorId);
      if (floor) {
        const updatedImages = [...(floor.images || []), ...newImages];
        updateFloor(buildingId, floorId, { images: updatedImages });
        toast.success(`${files.length} image(s) uploaded`);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    }
  };

  const handleBlueprintUpload = async (buildingId: string, floorId: string, files: FileList) => {
    try {
      // TODO: Implement actual file upload to BunnyCDN
      const newBlueprints = Array.from(files).map(file => ({
        id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: 'BLUEPRINT' as const,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }));

      const building = localBuildings.find(b => b.id === buildingId);
      const floor = building?.floors?.find(f => f.id === floorId);
      if (floor) {
        const updatedBlueprints = [...(floor.blueprints || []), ...newBlueprints];
        updateFloor(buildingId, floorId, { blueprints: updatedBlueprints });
        toast.success(`${files.length} blueprint(s) uploaded`);
      }
    } catch (error) {
      console.error("Error uploading blueprints:", error);
      toast.error("Failed to upload blueprints");
    }
  };

  if (localBuildings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
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
            <Wifi className="h-5 w-5" />
            Floors Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure floors with typical floor support and floor racks
          </p>
        </div>
      </div>

      {/* Building Selection */}
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
                onClick={() => setSelectedBuildingId(building.id)}
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedBuilding.name} - Floors
              </CardTitle>
              <Button onClick={() => addFloor(selectedBuilding.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Floor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedBuilding.floors && selectedBuilding.floors.length > 0 ? (
              <div className="space-y-6">
                {selectedBuilding.floors.map((floor, index) => (
                  <Card key={floor.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {floor.name}
                          {floor.isTypical && (
                            <Badge variant="secondary">Typical Floor</Badge>
                          )}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => duplicateFloor(selectedBuilding.id, floor.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFloor(selectedBuilding.id, floor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Floor Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Floor Name</Label>
                          <Input
                            value={floor.name}
                            onChange={(e) => updateFloor(selectedBuilding.id, floor.id, { name: e.target.value })}
                            placeholder="Enter floor name"
                          />
                        </div>
                        <div>
                          <Label>Level</Label>
                          <Input
                            type="number"
                            value={floor.level || ''}
                            onChange={(e) => updateFloor(selectedBuilding.id, floor.id, { level: parseInt(e.target.value) || 0 })}
                            placeholder="Floor level"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`typical-${floor.id}`}
                              checked={floor.isTypical}
                              onCheckedChange={(checked) => updateFloor(selectedBuilding.id, floor.id, { isTypical: !!checked })}
                            />
                            <Label htmlFor={`typical-${floor.id}`}>This is a typical floor</Label>
                          </div>
                        </div>
                        {floor.isTypical && (
                          <div>
                            <Label>Repeat Count</Label>
                            <Input
                              type="number"
                              value={floor.repeatCount || 1}
                              onChange={(e) => updateFloor(selectedBuilding.id, floor.id, { repeatCount: parseInt(e.target.value) || 1 })}
                              placeholder="How many similar floors"
                              min="1"
                            />
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={floor.notes || ''}
                            onChange={(e) => updateFloor(selectedBuilding.id, floor.id, { notes: e.target.value })}
                            placeholder="Additional notes about this floor"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Floor Images */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <FileImage className="h-4 w-4" />
                            Floor Images
                          </h4>
                          <div className="relative">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => e.target.files && handleImageUpload(selectedBuilding.id, floor.id, e.target.files)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button size="sm" variant="outline">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Images
                            </Button>
                          </div>
                        </div>
                        
                        {floor.images && floor.images.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {floor.images.map((image) => (
                              <div key={image.id} className="relative group">
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  className="w-full h-24 object-cover rounded-lg border"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      const updatedImages = floor.images?.filter(img => img.id !== image.id) || [];
                                      updateFloor(selectedBuilding.id, floor.id, { images: updatedImages });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {image.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No images uploaded yet</p>
                          </div>
                        )}
                      </div>

                      {/* Floor Blueprints */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Floor Blueprints
                          </h4>
                          <div className="relative">
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.dwg,.dxf,.jpg,.png"
                              onChange={(e) => e.target.files && handleBlueprintUpload(selectedBuilding.id, floor.id, e.target.files)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button size="sm" variant="outline">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Blueprints
                            </Button>
                          </div>
                        </div>
                        
                        {floor.blueprints && floor.blueprints.length > 0 ? (
                          <div className="space-y-2">
                            {floor.blueprints.map((blueprint) => (
                              <div key={blueprint.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <MapPin className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium">{blueprint.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {blueprint.size ? `${(blueprint.size / 1024 / 1024).toFixed(2)} MB` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(blueprint.url, '_blank')}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const updatedBlueprints = floor.blueprints?.filter(bp => bp.id !== blueprint.id) || [];
                                      updateFloor(selectedBuilding.id, floor.id, { blueprints: updatedBlueprints });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No blueprints uploaded yet</p>
                          </div>
                        )}
                      </div>

                      {/* Floor Racks */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Floor Racks</h4>
                          <Button
                            size="sm"
                            onClick={() => addFloorRack(selectedBuilding.id, floor.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Floor Rack
                          </Button>
                        </div>
                        
                        {floor.racks && floor.racks.length > 0 ? (
                          <div className="space-y-4">
                            {floor.racks.map((rack) => (
                              <Card key={rack.id}>
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">Floor Rack</CardTitle>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeFloorRack(selectedBuilding.id, floor.id, rack.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Rack Name</Label>
                                      <Input
                                        value={rack.name}
                                        onChange={(e) => updateFloorRack(selectedBuilding.id, floor.id, rack.id, { name: e.target.value })}
                                        placeholder="Rack name"
                                      />
                                    </div>
                                    <div>
                                      <Label>Rack Code</Label>
                                      <Input
                                        value={rack.code || ''}
                                        onChange={(e) => updateFloorRack(selectedBuilding.id, floor.id, rack.id, { code: e.target.value })}
                                        placeholder="Rack code"
                                      />
                                    </div>
                                    <div>
                                      <Label>Units</Label>
                                      <Input
                                        type="number"
                                        value={rack.units || ''}
                                        onChange={(e) => updateFloorRack(selectedBuilding.id, floor.id, rack.id, { units: parseInt(e.target.value) || 0 })}
                                        placeholder="Number of units"
                                      />
                                    </div>
                                    <div>
                                      <Label>Location</Label>
                                      <Input
                                        value={rack.location || ''}
                                        onChange={(e) => updateFloorRack(selectedBuilding.id, floor.id, rack.id, { location: e.target.value })}
                                        placeholder="Rack location"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <Label>Notes</Label>
                                      <Textarea
                                        value={rack.notes || ''}
                                        onChange={(e) => updateFloorRack(selectedBuilding.id, floor.id, rack.id, { notes: e.target.value })}
                                        placeholder="Additional notes"
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No floor racks added yet</p>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {floor.images?.length || 0} Images
                        </Badge>
                        <Badge variant="outline">
                          {floor.blueprints?.length || 0} Blueprints
                        </Badge>
                        <Badge variant="outline">
                          {floor.racks?.length || 0} Racks
                        </Badge>
                        <Badge variant="outline">
                          {floor.rooms?.length || 0} Rooms
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Floors Added</p>
                <p className="text-sm mb-4">Add floors to configure the building structure</p>
                <Button onClick={() => addFloor(selectedBuilding.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Floor
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
