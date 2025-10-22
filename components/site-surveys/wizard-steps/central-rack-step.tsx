"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  FileImage,
  Wifi,
  Phone,
  Camera,
  Router,
  Cable,
  HardDrive
} from "lucide-react";
import { toast } from "sonner";
import { BuildingData, CentralRackData, SwitchData, RouterData, PBXData, ATAData, NVRData, ServerData, PhoneLineData, VLANData, PortData, ConnectionData } from "../comprehensive-infrastructure-wizard";

interface CentralRackStepProps {
  buildings: BuildingData[];
  onUpdate: (buildings: BuildingData[]) => void;
  siteSurveyId: string;
}

export function CentralRackStep({
  buildings,
  onUpdate,
  siteSurveyId,
}: CentralRackStepProps) {
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

  const updateCentralRack = (buildingId: string, updates: Partial<CentralRackData>) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const updatedCentralRack = { ...(building.centralRack || {}), ...updates };
    updateBuilding(buildingId, { centralRack: updatedCentralRack as CentralRackData });
  };

  const addCentralRack = (buildingId: string) => {
    const newCentralRack: CentralRackData = {
      id: `central-rack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "Central Rack",
      code: "",
      units: 42,
      location: "",
      notes: "",
      images: [],
      cableTerminations: [], // Use cableTerminations instead of counts
      switches: [],
      routers: [],
      servers: [],
      phoneLines: [],
      connections: [],
    };
    updateBuilding(buildingId, { centralRack: newCentralRack });
    toast.success("Central rack added");
  };

  const addSwitch = (buildingId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building?.centralRack) return;

    const newSwitch: SwitchData = {
      id: `switch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      brand: "",
      model: "",
      ip: "",
      vlans: [],
      ports: [],
      poeEnabled: false,
      poePortsCount: 0,
      connections: [],
      services: [], // Add services array
    };

    const updatedSwitches = [...(building.centralRack.switches || []), newSwitch];
    updateCentralRack(buildingId, { switches: updatedSwitches });
    toast.success("Switch added");
  };

  const addRouter = (buildingId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building?.centralRack) return;

    const newRouter: RouterData = {
      id: `router-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      brand: "",
      model: "",
      ip: "",
      vlans: [],
      interfaces: [],
      connections: [],
      services: [], // Add services array
    };

    const updatedRouters = [...(building.centralRack.routers || []), newRouter];
    updateCentralRack(buildingId, { routers: updatedRouters });
    toast.success("Router added");
  };

  const addPBX = (buildingId: string) => {
    const newPBX: PBXData = {
      id: `pbx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      brand: "",
      type: 'SIP',
      extensions: [],
      trunkLines: [],
    };

    updateCentralRack(buildingId, { pbx: newPBX });
    toast.success("PBX added");
  };

  const addATA = (buildingId: string) => {
    const newATA: ATAData = {
      id: `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ports: 0,
      connection: {
        id: `conn-${Date.now()}`,
        fromDevice: "",
        toDevice: "",
        connectionType: "",
        notes: "",
      },
    };

    updateCentralRack(buildingId, { ata: newATA });
    toast.success("ATA added");
  };

  const addNVR = (buildingId: string) => {
    const newNVR: NVRData = {
      id: `nvr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channels: 0,
      vms: "",
    };

    updateCentralRack(buildingId, { nvr: newNVR });
    toast.success("NVR added");
  };

  const addServer = (buildingId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building?.centralRack) return;

    const newServer: ServerData = {
      id: `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      type: "",
      brand: "",
      model: "",
      ip: "",
      notes: "",
      virtualMachines: [],
      services: [], // Add services array
    };

    const updatedServers = [...(building.centralRack.servers || []), newServer];
    updateCentralRack(buildingId, { servers: updatedServers });
    toast.success("Server added");
  };

  const addPhoneLine = (buildingId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building?.centralRack) return;

    const newPhoneLine: PhoneLineData = {
      id: `phone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'SIP',
      channels: 0,
      phoneNumbers: [],
    };

    const updatedPhoneLines = [...(building.centralRack.phoneLines || []), newPhoneLine];
    updateCentralRack(buildingId, { phoneLines: updatedPhoneLines });
    toast.success("Phone line added");
  };

  const removeDevice = (buildingId: string, deviceType: string, deviceId: string) => {
    const building = localBuildings.find(b => b.id === buildingId);
    if (!building?.centralRack) return;

    switch (deviceType) {
      case 'switch':
        const updatedSwitches = building.centralRack.switches?.filter(s => s.id !== deviceId) || [];
        updateCentralRack(buildingId, { switches: updatedSwitches });
        break;
      case 'router':
        const updatedRouters = building.centralRack.routers?.filter(r => r.id !== deviceId) || [];
        updateCentralRack(buildingId, { routers: updatedRouters });
        break;
      case 'server':
        const updatedServers = building.centralRack.servers?.filter(s => s.id !== deviceId) || [];
        updateCentralRack(buildingId, { servers: updatedServers });
        break;
      case 'phoneLine':
        const updatedPhoneLines = building.centralRack.phoneLines?.filter(p => p.id !== deviceId) || [];
        updateCentralRack(buildingId, { phoneLines: updatedPhoneLines });
        break;
    }
    toast.success("Device removed");
  };

  if (localBuildings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Server className="h-12 w-12 text-muted-foreground mb-4" />
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
            <Server className="h-5 w-5" />
            Central Rack Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure central rack equipment and connections for each building
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
                <Server className="h-5 w-5" />
                {selectedBuilding.name} - Central Rack
              </CardTitle>
              {!selectedBuilding.centralRack && (
                <Button onClick={() => addCentralRack(selectedBuilding.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Central Rack
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedBuilding.centralRack ? (
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="isp">ISP Connection</TabsTrigger>
                  <TabsTrigger value="switches">Switches</TabsTrigger>
                  <TabsTrigger value="routers">Routers</TabsTrigger>
                  <TabsTrigger value="pbx">PBX</TabsTrigger>
                  <TabsTrigger value="ata">ATA</TabsTrigger>
                  <TabsTrigger value="nvr">NVR</TabsTrigger>
                  <TabsTrigger value="servers">Servers</TabsTrigger>
                  <TabsTrigger value="phones">Phone Lines</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                </TabsList>

                {/* Basic Information */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Rack Name</Label>
                      <Input
                        value={selectedBuilding.centralRack.name}
                        onChange={(e) => updateCentralRack(selectedBuilding.id, { name: e.target.value })}
                        placeholder="Enter rack name"
                      />
                    </div>
                    <div>
                      <Label>Rack Code</Label>
                      <Input
                        value={selectedBuilding.centralRack.code || ''}
                        onChange={(e) => updateCentralRack(selectedBuilding.id, { code: e.target.value })}
                        placeholder="Enter rack code"
                      />
                    </div>
                    <div>
                      <Label>Units</Label>
                      <Input
                        type="number"
                        value={selectedBuilding.centralRack.units || ''}
                        onChange={(e) => updateCentralRack(selectedBuilding.id, { units: parseInt(e.target.value) || 0 })}
                        placeholder="Number of units"
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={selectedBuilding.centralRack.location || ''}
                        onChange={(e) => updateCentralRack(selectedBuilding.id, { location: e.target.value })}
                        placeholder="Rack location"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={selectedBuilding.centralRack.notes || ''}
                        onChange={(e) => updateCentralRack(selectedBuilding.id, { notes: e.target.value })}
                        placeholder="Additional notes"
                        rows={3}
                      />
                    </div>
                    {/* Terminated cables/fiber now tracked via cableTerminations in BuildingsStep */}
                  </div>
                </TabsContent>

                {/* ISP Connection */}
                <TabsContent value="isp" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>ISP Name</Label>
                      <Input
                        value={selectedBuilding.centralRack.ispConnection?.ispName || ''}
                        onChange={(e) => updateCentralRack(selectedBuilding.id, { 
                          ispConnection: { 
                            ispName: e.target.value,
                            connectionType: selectedBuilding.centralRack?.ispConnection?.connectionType || "",
                            router: selectedBuilding.centralRack?.ispConnection?.router,
                          } 
                        })}
                        placeholder="Enter ISP name"
                      />
                    </div>
                    <div>
                      <Label>Connection Type</Label>
                      <Input
                        value={selectedBuilding.centralRack.ispConnection?.connectionType || ''}
                        onChange={(e) => updateCentralRack(selectedBuilding.id, { 
                          ispConnection: { 
                            ispName: selectedBuilding.centralRack?.ispConnection?.ispName || "",
                            connectionType: e.target.value,
                            router: selectedBuilding.centralRack?.ispConnection?.router,
                          } 
                        })}
                        placeholder="e.g., Fiber, DSL, Cable"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Switches */}
                <TabsContent value="switches" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Switches</h4>
                    <Button onClick={() => addSwitch(selectedBuilding.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Switch
                    </Button>
                  </div>
                  
                  {selectedBuilding.centralRack.switches?.map((switchDevice) => (
                    <Card key={switchDevice.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Switch</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDevice(selectedBuilding.id, 'switch', switchDevice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Brand</Label>
                            <Input
                              value={switchDevice.brand}
                              onChange={(e) => {
                                const updatedSwitches = selectedBuilding.centralRack?.switches?.map(s => 
                                  s.id === switchDevice.id ? { ...s, brand: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { switches: updatedSwitches });
                              }}
                              placeholder="Switch brand"
                            />
                          </div>
                          <div>
                            <Label>Model</Label>
                            <Input
                              value={switchDevice.model}
                              onChange={(e) => {
                                const updatedSwitches = selectedBuilding.centralRack?.switches?.map(s => 
                                  s.id === switchDevice.id ? { ...s, model: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { switches: updatedSwitches });
                              }}
                              placeholder="Switch model"
                            />
                          </div>
                          <div>
                            <Label>IP Address</Label>
                            <Input
                              value={switchDevice.ip}
                              onChange={(e) => {
                                const updatedSwitches = selectedBuilding.centralRack?.switches?.map(s => 
                                  s.id === switchDevice.id ? { ...s, ip: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { switches: updatedSwitches });
                              }}
                              placeholder="IP address"
                            />
                          </div>
                          <div>
                            <Label>PoE Ports</Label>
                            <Input
                              type="number"
                              value={switchDevice.poePortsCount || 0}
                              onChange={(e) => {
                                const updatedSwitches = selectedBuilding.centralRack?.switches?.map(s => 
                                  s.id === switchDevice.id ? { ...s, poePortsCount: parseInt(e.target.value) || 0 } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { switches: updatedSwitches });
                              }}
                              placeholder="Number of PoE ports"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Routers */}
                <TabsContent value="routers" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Routers</h4>
                    <Button onClick={() => addRouter(selectedBuilding.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Router
                    </Button>
                  </div>
                  
                  {selectedBuilding.centralRack.routers?.map((router) => (
                    <Card key={router.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Router</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDevice(selectedBuilding.id, 'router', router.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Brand</Label>
                            <Input
                              value={router.brand}
                              onChange={(e) => {
                                const updatedRouters = selectedBuilding.centralRack?.routers?.map(r => 
                                  r.id === router.id ? { ...r, brand: e.target.value } : r
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { routers: updatedRouters });
                              }}
                              placeholder="Router brand"
                            />
                          </div>
                          <div>
                            <Label>Model</Label>
                            <Input
                              value={router.model}
                              onChange={(e) => {
                                const updatedRouters = selectedBuilding.centralRack?.routers?.map(r => 
                                  r.id === router.id ? { ...r, model: e.target.value } : r
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { routers: updatedRouters });
                              }}
                              placeholder="Router model"
                            />
                          </div>
                          <div>
                            <Label>IP Address</Label>
                            <Input
                              value={router.ip}
                              onChange={(e) => {
                                const updatedRouters = selectedBuilding.centralRack?.routers?.map(r => 
                                  r.id === router.id ? { ...r, ip: e.target.value } : r
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { routers: updatedRouters });
                              }}
                              placeholder="IP address"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* PBX */}
                <TabsContent value="pbx" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">PBX System</h4>
                    {!selectedBuilding.centralRack.pbx && (
                      <Button onClick={() => addPBX(selectedBuilding.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add PBX
                      </Button>
                    )}
                  </div>
                  
                  {selectedBuilding.centralRack.pbx && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">PBX</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateCentralRack(selectedBuilding.id, { pbx: undefined })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Brand</Label>
                            <Input
                              value={selectedBuilding.centralRack.pbx.brand}
                              onChange={(e) => updateCentralRack(selectedBuilding.id, { 
                                pbx: { 
                                  id: selectedBuilding.centralRack?.pbx?.id || `pbx-${Date.now()}`,
                                  brand: e.target.value,
                                  type: selectedBuilding.centralRack?.pbx?.type || 'SIP',
                                  extensions: selectedBuilding.centralRack?.pbx?.extensions || [],
                                  trunkLines: selectedBuilding.centralRack?.pbx?.trunkLines || []
                                }
                              })}
                              placeholder="PBX brand"
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <select
                              value={selectedBuilding.centralRack.pbx.type}
                              onChange={(e) => updateCentralRack(selectedBuilding.id, { 
                                pbx: { 
                                  id: selectedBuilding.centralRack?.pbx?.id || `pbx-${Date.now()}`,
                                  brand: selectedBuilding.centralRack?.pbx?.brand || '',
                                  type: e.target.value as 'SIP' | 'ANALOG' | 'DIGITAL',
                                  extensions: selectedBuilding.centralRack?.pbx?.extensions || [],
                                  trunkLines: selectedBuilding.centralRack?.pbx?.trunkLines || []
                                }
                              })}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="SIP">SIP</option>
                              <option value="ANALOG">Analog</option>
                              <option value="DIGITAL">Digital</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ATA */}
                <TabsContent value="ata" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">ATA (Analog Telephone Adapter)</h4>
                    {!selectedBuilding.centralRack.ata && (
                      <Button onClick={() => addATA(selectedBuilding.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add ATA
                      </Button>
                    )}
                  </div>
                  
                  {selectedBuilding.centralRack.ata && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">ATA</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateCentralRack(selectedBuilding.id, { ata: undefined })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Number of Ports</Label>
                            <Input
                              type="number"
                              value={selectedBuilding.centralRack.ata.ports}
                              onChange={(e) => updateCentralRack(selectedBuilding.id, { 
                                ata: { 
                                  id: selectedBuilding.centralRack?.ata?.id || `ata-${Date.now()}`,
                                  ports: parseInt(e.target.value) || 0,
                                  connection: selectedBuilding.centralRack?.ata?.connection || {
                                    id: `connection-${Date.now()}`,
                                    fromDevice: '',
                                    toDevice: '',
                                    connectionType: 'Ethernet',
                                    cableType: 'CAT6',
                                    notes: ''
                                  }
                                }
                              })}
                              placeholder="Number of ports"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* NVR */}
                <TabsContent value="nvr" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">NVR (Network Video Recorder)</h4>
                    {!selectedBuilding.centralRack.nvr && (
                      <Button onClick={() => addNVR(selectedBuilding.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add NVR
                      </Button>
                    )}
                  </div>
                  
                  {selectedBuilding.centralRack.nvr && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">NVR</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateCentralRack(selectedBuilding.id, { nvr: undefined })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Channels</Label>
                            <Input
                              type="number"
                              value={selectedBuilding.centralRack.nvr.channels}
                              onChange={(e) => updateCentralRack(selectedBuilding.id, { 
                                nvr: { 
                                  id: selectedBuilding.centralRack?.nvr?.id || `nvr-${Date.now()}`,
                                  channels: parseInt(e.target.value) || 0,
                                  vms: selectedBuilding.centralRack?.nvr?.vms || ''
                                }
                              })}
                              placeholder="Number of channels"
                            />
                          </div>
                          <div>
                            <Label>VMS</Label>
                            <Input
                              value={selectedBuilding.centralRack.nvr.vms}
                              onChange={(e) => updateCentralRack(selectedBuilding.id, { 
                                nvr: { 
                                  id: selectedBuilding.centralRack?.nvr?.id || `nvr-${Date.now()}`,
                                  channels: selectedBuilding.centralRack?.nvr?.channels || 0,
                                  vms: e.target.value
                                }
                              })}
                              placeholder="Video Management System"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Servers */}
                <TabsContent value="servers" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Servers</h4>
                    <Button onClick={() => addServer(selectedBuilding.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Server
                    </Button>
                  </div>
                  
                  {selectedBuilding.centralRack.servers?.map((server) => (
                    <Card key={server.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Server</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDevice(selectedBuilding.id, 'server', server.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={server.name}
                              onChange={(e) => {
                                const updatedServers = selectedBuilding.centralRack?.servers?.map(s => 
                                  s.id === server.id ? { ...s, name: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { servers: updatedServers });
                              }}
                              placeholder="Server name"
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Input
                              value={server.type}
                              onChange={(e) => {
                                const updatedServers = selectedBuilding.centralRack?.servers?.map(s => 
                                  s.id === server.id ? { ...s, type: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { servers: updatedServers });
                              }}
                              placeholder="Server type"
                            />
                          </div>
                          <div>
                            <Label>Brand</Label>
                            <Input
                              value={server.brand || ''}
                              onChange={(e) => {
                                const updatedServers = selectedBuilding.centralRack?.servers?.map(s => 
                                  s.id === server.id ? { ...s, brand: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { servers: updatedServers });
                              }}
                              placeholder="Server brand"
                            />
                          </div>
                          <div>
                            <Label>Model</Label>
                            <Input
                              value={server.model || ''}
                              onChange={(e) => {
                                const updatedServers = selectedBuilding.centralRack?.servers?.map(s => 
                                  s.id === server.id ? { ...s, model: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { servers: updatedServers });
                              }}
                              placeholder="Server model"
                            />
                          </div>
                          <div>
                            <Label>IP Address</Label>
                            <Input
                              value={server.ip || ''}
                              onChange={(e) => {
                                const updatedServers = selectedBuilding.centralRack?.servers?.map(s => 
                                  s.id === server.id ? { ...s, ip: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { servers: updatedServers });
                              }}
                              placeholder="IP address"
                            />
                          </div>
                          <div>
                            <Label>Notes</Label>
                            <Input
                              value={server.notes || ''}
                              onChange={(e) => {
                                const updatedServers = selectedBuilding.centralRack?.servers?.map(s => 
                                  s.id === server.id ? { ...s, notes: e.target.value } : s
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { servers: updatedServers });
                              }}
                              placeholder="Additional notes"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Phone Lines */}
                <TabsContent value="phones" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Phone Lines</h4>
                    <Button onClick={() => addPhoneLine(selectedBuilding.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Phone Line
                    </Button>
                  </div>
                  
                  {selectedBuilding.centralRack.phoneLines?.map((phoneLine) => (
                    <Card key={phoneLine.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Phone Line</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDevice(selectedBuilding.id, 'phoneLine', phoneLine.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Type</Label>
                            <select
                              value={phoneLine.type}
                              onChange={(e) => {
                                const updatedPhoneLines = selectedBuilding.centralRack?.phoneLines?.map(p => 
                                  p.id === phoneLine.id ? { ...p, type: e.target.value as 'PSTN' | 'ISDN' | 'SIP' } : p
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { phoneLines: updatedPhoneLines });
                              }}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="PSTN">PSTN</option>
                              <option value="ISDN">ISDN</option>
                              <option value="SIP">SIP</option>
                            </select>
                          </div>
                          <div>
                            <Label>Channels (Concurrent Calls)</Label>
                            <Input
                              type="number"
                              value={phoneLine.channels}
                              onChange={(e) => {
                                const updatedPhoneLines = selectedBuilding.centralRack?.phoneLines?.map(p => 
                                  p.id === phoneLine.id ? { ...p, channels: parseInt(e.target.value) || 0 } : p
                                ) || [];
                                updateCentralRack(selectedBuilding.id, { phoneLines: updatedPhoneLines });
                              }}
                              placeholder="Number of channels"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Connections */}
                <TabsContent value="connections" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Connections</h4>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Connection
                    </Button>
                  </div>
                  
                  <div className="text-center py-8 text-muted-foreground">
                    <Cable className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Connection management coming soon</p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Central Rack Configured</p>
                <p className="text-sm mb-4">Add a central rack to configure equipment and connections</p>
                <Button onClick={() => addCentralRack(selectedBuilding.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Central Rack
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
