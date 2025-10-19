"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { BuildingData } from "../comprehensive-infrastructure-wizard";
import { BuildingTreeView } from "./building-tree-view";

interface BuildingsStepProps {
  buildings: BuildingData[];
  onUpdate: (buildings: BuildingData[]) => void;
  siteSurveyId: string;
}

export function BuildingsStep({
  buildings,
  onUpdate,
  siteSurveyId,
}: BuildingsStepProps) {
  const [localBuildings, setLocalBuildings] = useState<BuildingData[]>(buildings);

  useEffect(() => {
    setLocalBuildings(buildings);
  }, [buildings]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (JSON.stringify(localBuildings) !== JSON.stringify(buildings)) {
        onUpdate(localBuildings);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [localBuildings, buildings, onUpdate]);

  const addBuilding = () => {
    const newBuilding: BuildingData = {
      id: `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Building ${localBuildings.length + 1}`,
      floors: [],
    };
    setLocalBuildings([...localBuildings, newBuilding]);
    toast.success("Building added successfully");
  };

  const updateBuilding = (buildingId: string, updatedBuilding: BuildingData) => {
    setLocalBuildings(prev =>
      prev.map(b => (b.id === buildingId ? updatedBuilding : b))
    );
  };

  const deleteBuilding = (buildingId: string) => {
    setLocalBuildings(prev => prev.filter(b => b.id !== buildingId));
    toast.success("Building deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Buildings & Infrastructure</h3>
          <p className="text-sm text-muted-foreground">
            Define buildings with hierarchical structure: Building → Central Rack & Floors
          </p>
        </div>
        <Button onClick={addBuilding}>
          <Plus className="h-4 w-4 mr-2" />
          Add Building
        </Button>
      </div>

      {localBuildings.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Buildings Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first building to define the infrastructure hierarchy
              </p>
              <Button onClick={addBuilding}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Building
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localBuildings.map((building) => (
            <BuildingTreeView
              key={building.id}
              building={building}
              onUpdate={(updatedBuilding) => updateBuilding(building.id, updatedBuilding)}
              onDelete={() => deleteBuilding(building.id)}
            />
          ))}
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Infrastructure Hierarchy
        </h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">├─</span>
            <span><strong>Layer 0:</strong> Building (basic info, images, blueprints)</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="font-mono text-xs">├─</span>
            <span><strong>Layer 1.1:</strong> Central Rack (ISP, terminations, switches, routers, PBX, etc.)</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="font-mono text-xs">└─</span>
            <span><strong>Layer 1.2:</strong> Floors (typical floors, racks, rooms, devices)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

