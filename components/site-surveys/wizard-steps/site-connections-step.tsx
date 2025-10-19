"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Cable, 
  Plus, 
  Trash2, 
  Edit, 
  Wifi,
  Zap,
  WifiIcon
} from "lucide-react";
import { toast } from "sonner";
import { SiteConnectionData, BuildingData } from "../comprehensive-infrastructure-wizard";

interface SiteConnectionsStepProps {
  siteConnections: SiteConnectionData[];
  buildings: BuildingData[];
  onUpdate: (siteConnections: SiteConnectionData[]) => void;
  siteSurveyId: string;
}

export function SiteConnectionsStep({
  siteConnections,
  buildings,
  onUpdate,
  siteSurveyId,
}: SiteConnectionsStepProps) {
  const [localSiteConnections, setLocalSiteConnections] = useState<SiteConnectionData[]>(siteConnections);

  useEffect(() => {
    setLocalSiteConnections(siteConnections);
  }, [siteConnections]);

  const addSiteConnection = () => {
    const newConnection: SiteConnectionData = {
      id: `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromBuilding: "",
      toBuilding: "",
      connectionType: "FIBER",
      details: "",
      notes: "",
    };
    const updatedConnections = [...localSiteConnections, newConnection];
    setLocalSiteConnections(updatedConnections);
    onUpdate(updatedConnections);
    toast.success("Site connection added");
  };

  const removeSiteConnection = (id: string) => {
    if (confirm("Are you sure you want to remove this site connection?")) {
      const updatedConnections = localSiteConnections.filter(conn => conn.id !== id);
      setLocalSiteConnections(updatedConnections);
      onUpdate(updatedConnections);
      toast.success("Site connection removed");
    }
  };

  const updateSiteConnection = (id: string, updates: Partial<SiteConnectionData>) => {
    const updatedConnections = localSiteConnections.map(conn => 
      conn.id === id ? { ...conn, ...updates } : conn
    );
    setLocalSiteConnections(updatedConnections);
    onUpdate(updatedConnections);
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'WIRELESS':
        return Wifi;
      case 'FIBER':
        return Cable;
      case 'ETHERNET':
        return Zap;
      default:
        return Cable;
    }
  };

  const getConnectionColor = (type: string) => {
    switch (type) {
      case 'WIRELESS':
        return 'text-blue-600';
      case 'FIBER':
        return 'text-green-600';
      case 'ETHERNET':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Cable className="h-5 w-5" />
            Site Connections
          </h3>
          <p className="text-sm text-muted-foreground">
            Define inter-building connections for the site
          </p>
        </div>
        <Button onClick={addSiteConnection}>
          <Plus className="h-4 w-4 mr-2" />
          Add Site Connection
        </Button>
      </div>

      {localSiteConnections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Cable className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Site Connections Defined</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add connections between buildings to complete the infrastructure survey
            </p>
            <Button onClick={addSiteConnection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Site Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localSiteConnections.map((connection, index) => {
            const ConnectionIcon = getConnectionIcon(connection.connectionType);
            const iconColor = getConnectionColor(connection.connectionType);
            
            return (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ConnectionIcon className={`h-5 w-5 ${iconColor}`} />
                      Connection {index + 1}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSiteConnection(connection.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>From Building</Label>
                      <select
                        value={connection.fromBuilding}
                        onChange={(e) => updateSiteConnection(connection.id, { fromBuilding: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Select source building</option>
                        {buildings.map((building) => (
                          <option key={building.id} value={building.name}>
                            {building.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>To Building</Label>
                      <select
                        value={connection.toBuilding}
                        onChange={(e) => updateSiteConnection(connection.id, { toBuilding: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Select destination building</option>
                        {buildings.map((building) => (
                          <option key={building.id} value={building.name}>
                            {building.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Connection Type</Label>
                      <select
                        value={connection.connectionType}
                        onChange={(e) => updateSiteConnection(connection.id, { connectionType: e.target.value as 'WIRELESS' | 'FIBER' | 'ETHERNET' })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="FIBER">Fiber</option>
                        <option value="WIRELESS">Wireless</option>
                        <option value="ETHERNET">Ethernet</option>
                      </select>
                    </div>
                    <div>
                      <Label>Details</Label>
                      <Input
                        value={connection.details || ''}
                        onChange={(e) => updateSiteConnection(connection.id, { details: e.target.value })}
                        placeholder="Connection details (e.g., fiber count, wireless specs)"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={connection.notes || ''}
                        onChange={(e) => updateSiteConnection(connection.id, { notes: e.target.value })}
                        placeholder="Additional notes about this connection"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Connection Summary */}
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className={`${iconColor} border-current`}>
                      <ConnectionIcon className="h-3 w-3 mr-1" />
                      {connection.connectionType}
                    </Badge>
                    {connection.fromBuilding && connection.toBuilding && (
                      <span className="text-muted-foreground">
                        {connection.fromBuilding} → {connection.toBuilding}
                      </span>
                    )}
                    {connection.details && (
                      <span className="text-muted-foreground">
                        {connection.details}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {localSiteConnections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {localSiteConnections.filter(c => c.connectionType === 'WIRELESS').length}
                </div>
                <div className="text-sm text-muted-foreground">Wireless</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {localSiteConnections.filter(c => c.connectionType === 'FIBER').length}
                </div>
                <div className="text-sm text-muted-foreground">Fiber</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {localSiteConnections.filter(c => c.connectionType === 'ETHERNET').length}
                </div>
                <div className="text-sm text-muted-foreground">Ethernet</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
