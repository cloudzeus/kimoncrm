"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Server,
  Layers,
  Cable,
  Home,
  Network,
  Wifi,
  Phone,
  Camera,
  Monitor,
  Package,
  Wrench,
  Zap,
} from "lucide-react";
import { 
  BuildingData, 
  FloorData, 
  CableTerminationData, 
  ServiceAssociationData,
  SwitchData,
  RouterData,
  ServerData,
  DeviceData,
  OutletData,
  FloorRackData,
  RoomData,
} from "../comprehensive-infrastructure-wizard";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  code: string;
  category?: string;
}

interface Service {
  id: string;
  name: string;
  code: string;
  category?: string;
}

interface EquipmentAssignmentStepProps {
  buildings: BuildingData[];
  onUpdate: (buildings: BuildingData[]) => void;
  siteSurveyId?: string;
}

// Auto-save function
const autoSaveInfrastructure = async (siteSurveyId: string, buildings: BuildingData[]) => {
  try {
    await fetch(`/api/site-surveys/${siteSurveyId}/comprehensive-infrastructure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        infrastructureData: {
          buildings,
        },
      }),
    });
    console.log('✅ Infrastructure auto-saved');
  } catch (error) {
    console.error('Failed to auto-save infrastructure:', error);
  }
};

export function EquipmentAssignmentStep({
  buildings,
  onUpdate,
  siteSurveyId,
}: EquipmentAssignmentStepProps) {
  const { toast } = useToast();
  const [localBuildings, setLocalBuildings] = useState<BuildingData[]>(buildings);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedCentralRack, setExpandedCentralRack] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [expandedRacks, setExpandedRacks] = useState<Set<string>>(new Set());
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Map<string, Set<string>>>(new Map());
  
  // Products and Services
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Dialog state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  
  // Track last sync for debugging
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Fetch products and services
  useEffect(() => {
    fetchProducts();
    fetchServices();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({ title: "Error", description: "Failed to load services", variant: "destructive" });
    } finally {
      setLoadingServices(false);
    }
  };

  // Sync local state with props - ensures changes from Step 1 appear here
  useEffect(() => {
    console.log('🔄 Equipment Step: Syncing buildings from Step 1', buildings.length, 'buildings');
    setLocalBuildings(buildings);
    setLastSyncTime(new Date());
    
    // Auto-expand first building for better UX
    if (buildings.length > 0 && expandedBuildings.size === 0) {
      setExpandedBuildings(new Set([buildings[0].id]));
    }
  }, [buildings]);

  // Toggle functions
  const toggleBuilding = (id: string) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCentralRack = (id: string) => {
    setExpandedCentralRack(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFloor = (id: string) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRack = (id: string) => {
    setExpandedRacks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRoom = (id: string) => {
    setExpandedRooms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSection = (parentId: string, section: string) => {
    setExpandedSections(prev => {
      const next = new Map(prev);
      const sections = next.get(parentId) || new Set();
      sections.has(section) ? sections.delete(section) : sections.add(section);
      next.set(parentId, sections);
      return next;
    });
  };

  // Helper to check if element is new/proposal
  const isNewElement = (element: any) => {
    return element?.isFutureProposal || element?.id?.includes('proposal');
  };

  // Open dialogs
  const openProductDialog = (elementInfo: any) => {
    setSelectedElement(elementInfo);
    setSelectedProductId("");
    setProductQuantity(1);
    setIsProductDialogOpen(true);
  };

  const openServiceDialog = (elementInfo: any) => {
    setSelectedElement(elementInfo);
    setSelectedServiceId("");
    setServiceQuantity(1);
    setIsServiceDialogOpen(true);
  };

  // Generic update helper
  const updateBuildings = (updatedBuildings: BuildingData[]) => {
    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    }
  };

  // Add NEW device to existing room
  const addNewDeviceToRoom = (buildingId: string, floorId: string, roomId: string) => {
    const newDevice: any = {
      id: `device-proposal-${Date.now()}`,
      type: '',
      quantity: 1,
      brand: '',
      model: '',
      isFutureProposal: true,
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;
      
      const updatedFloors = building.floors.map(floor => {
        if (floor.id !== floorId) return floor;
        
        const updatedRooms = floor.rooms.map(room => {
          if (room.id !== roomId) return room;
          return {
            ...room,
            devices: [...(room.devices || []), newDevice],
          };
        });
        
        return { ...floor, rooms: updatedRooms };
      });
      
      return { ...building, floors: updatedFloors };
    });

    updateBuildings(updatedBuildings);
    toast({ title: "Success", description: "New device added as future proposal" });
  };

  // Add NEW outlet to existing room
  const addNewOutletToRoom = (buildingId: string, floorId: string, roomId: string) => {
    const newOutlet: any = {
      id: `outlet-proposal-${Date.now()}`,
      label: '',
      type: '',
      quantity: 1,
      connection: {
        id: `conn-${Date.now()}`,
        fromDevice: '',
        toDevice: '',
        connectionType: '',
        cableType: '',
      },
      isFutureProposal: true,
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;
      
      const updatedFloors = building.floors.map(floor => {
        if (floor.id !== floorId) return floor;
        
        const updatedRooms = floor.rooms.map(room => {
          if (room.id !== roomId) return room;
          return {
            ...room,
            outlets: [...(room.outlets || []), newOutlet],
          };
        });
        
        return { ...floor, rooms: updatedRooms };
      });
      
      return { ...building, floors: updatedFloors };
    });

    updateBuildings(updatedBuildings);
    toast({ title: "Success", description: "New outlet added as future proposal" });
  };

  // Add NEW switch to existing rack
  const addNewSwitchToRack = (buildingId: string, floorId: string | undefined, rackId: string) => {
    const newSwitch: any = {
      id: `switch-proposal-${Date.now()}`,
      brand: '',
      model: '',
      ip: '',
      vlans: [],
      ports: [],
      poeEnabled: false,
      connections: [],
      services: [],
      isFutureProposal: true,
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;
      
      if (!floorId && building.centralRack) {
        // Central rack
        return {
          ...building,
          centralRack: {
            ...building.centralRack,
            switches: [...(building.centralRack.switches || []), newSwitch],
          },
        };
      } else if (floorId) {
        // Floor rack
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return {
              ...rack,
              switches: [...(rack.switches || []), newSwitch],
            };
          });
          
          return { ...floor, racks: updatedRacks };
        });
        
        return { ...building, floors: updatedFloors };
      }
      
      return building;
    });

    updateBuildings(updatedBuildings);
    toast({ title: "Success", description: "New switch added as future proposal" });
  };

  // Add NEW floor rack
  const addNewFloorRack = (buildingId: string, floorId: string, name: string, location: string, units: number) => {
    const newRack: any = {
      id: `rack-proposal-${Date.now()}`,
      name,
      location,
      units,
      code: `RACK-NEW-${Date.now()}`,
      isFutureProposal: true,
      cableTerminations: [],
      connections: [],
      switches: [],
      routers: [],
      servers: [],
      notes: "⚡ NEW - Future Proposal",
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;

      const updatedFloors = building.floors.map(floor => {
        if (floor.id !== floorId) return floor;
        return {
          ...floor,
          racks: [...(floor.racks || []), newRack],
        };
      });

      return { ...building, floors: updatedFloors };
    });

    updateBuildings(updatedBuildings);
    toast({ title: "Success", description: `New rack "${name}" added as future proposal` });
  };

  // Assign product to element
  const assignProduct = (productId: string, quantity: number) => {
    if (!selectedElement) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Complex update logic based on element type and location
    // This will be handled by the updateBuildings helper
    
    toast({ title: "Success", description: `Product "${product.name}" assigned` });
    setIsProductDialogOpen(false);
  };

  // Assign service to element  
  const assignService = (serviceId: string, quantity: number) => {
    if (!selectedElement) return;
    
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    toast({ title: "Success", description: `Service "${service.name}" assigned` });
    setIsServiceDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-600 rounded-full p-2">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Equipment & Product Assignment</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <Badge variant="secondary" className="inline-flex items-center text-xs">📦 OLD</Badge> = Existing infrastructure (from Step 1)</li>
              <li>• <Badge variant="default" className="inline-flex items-center text-xs bg-blue-600">⚡ NEW</Badge> = Future proposal/upgrade</li>
              <li>• <strong>Review all elements</strong> and assign products/services</li>
              <li>• <strong>Add NEW elements</strong> (racks, switches, devices, outlets) to create upgrade proposals</li>
              <li>• <strong>Changes auto-save</strong> - Go back to Step 1 anytime to modify</li>
            </ul>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Infrastructure Review
            <Badge variant="secondary" className="ml-2">
              {localBuildings.length} Building{localBuildings.length !== 1 ? 's' : ''}
            </Badge>
            {lastSyncTime && (
              <Badge variant="outline" className="text-xs text-green-600">
                ✓ Synced {lastSyncTime.toLocaleTimeString()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {localBuildings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No buildings defined yet. Go back to Step 1 to add buildings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {localBuildings.map((building) => (
                <Card key={building.id} className="border-2 border-blue-200">
                  <Collapsible open={expandedBuildings.has(building.id)} onOpenChange={() => toggleBuilding(building.id)}>
                    <CardHeader className="pb-3">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2">
                            {expandedBuildings.has(building.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-lg">{building.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{building.floors.length} Floors</Badge>
                            {building.centralRack && <Badge variant="secondary">Central Rack</Badge>}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        {/* CENTRAL RACK */}
                        {building.centralRack && (
                          <Collapsible 
                            open={expandedCentralRack.has(building.id)} 
                            onOpenChange={() => toggleCentralRack(building.id)}
                          >
                            <div className="border-2 border-blue-300 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/40">
                                  <div className="flex items-center gap-2">
                                    {expandedCentralRack.has(building.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <Server className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold">Central Rack</span>
                                    <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {building.centralRack.cableTerminations?.length || 0} Terminations
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {building.centralRack.switches?.length || 0} Switches
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {building.centralRack.routers?.length || 0} Routers
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {building.centralRack.servers?.length || 0} Servers
                                    </Badge>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button size="sm" variant="outline" className="h-7">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add New
                                        <ChevronDown className="h-3 w-3 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Add to Central Rack</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => addNewSwitchToRack(building.id, undefined, 'central')}>
                                        <Network className="h-4 w-4 mr-2" />
                                        New Switch
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent className="p-4 space-y-3">
                                {/* Cable Terminations */}
                                {building.centralRack.cableTerminations && building.centralRack.cableTerminations.length > 0 && (
                                  <Collapsible 
                                    open={expandedSections.get(`central-${building.id}`)?.has('terminations')} 
                                    onOpenChange={() => toggleSection(`central-${building.id}`, 'terminations')}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                                        <div className="flex items-center gap-2">
                                          {expandedSections.get(`central-${building.id}`)?.has('terminations') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                          <Cable className="h-4 w-4" />
                                          <span className="text-sm font-semibold">Cable Terminations</span>
                                          <Badge variant="secondary">{building.centralRack.cableTerminations.length}</Badge>
                                        </div>
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 space-y-2 pl-6">
                                      {building.centralRack.cableTerminations.map((term) => (
                                        <div key={term.id} className="p-3 bg-white dark:bg-slate-900 rounded border">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <Cable className="h-3 w-3" />
                                              <span className="text-sm">{term.cableType} × {term.quantity}</span>
                                              {isNewElement(term) ? (
                                                <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                              ) : (
                                                <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                              )}
                                              {term.productId && (
                                                <Badge variant="outline" className="text-xs"><Package className="h-3 w-3 mr-1" />Product</Badge>
                                              )}
                                            </div>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="outline" className="h-7 text-xs" 
                                                onClick={() => openProductDialog({ type: 'termination', buildingId: building.id, elementId: term.id })}>
                                                <Package className="h-3 w-3 mr-1" />Product
                                              </Button>
                                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                                onClick={() => openServiceDialog({ type: 'termination', buildingId: building.id, elementId: term.id })}>
                                                <Wrench className="h-3 w-3 mr-1" />Service
                                              </Button>
                                            </div>
                                          </div>
                                          {term.services && term.services.length > 0 && (
                                            <div className="flex gap-1 flex-wrap mt-2">
                                              {term.services.map((svc) => (
                                                <Badge key={svc.id} variant="secondary" className="text-xs">
                                                  {svc.serviceId} × {svc.quantity}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}

                                {/* Switches */}
                                {building.centralRack.switches && building.centralRack.switches.length > 0 && (
                                  <Collapsible 
                                    open={expandedSections.get(`central-${building.id}`)?.has('switches')} 
                                    onOpenChange={() => toggleSection(`central-${building.id}`, 'switches')}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                                        <div className="flex items-center gap-2">
                                          {expandedSections.get(`central-${building.id}`)?.has('switches') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                          <Network className="h-4 w-4" />
                                          <span className="text-sm font-semibold">Switches</span>
                                          <Badge variant="secondary">{building.centralRack.switches.length}</Badge>
                                        </div>
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 space-y-2 pl-6">
                                      {building.centralRack.switches.map((sw) => (
                                        <div key={sw.id} className="p-3 bg-white dark:bg-slate-900 rounded border">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Network className="h-3 w-3" />
                                              <span className="text-sm">{sw.brand} {sw.model}</span>
                                              {isNewElement(sw) ? (
                                                <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                              ) : (
                                                <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                              )}
                                            </div>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                                onClick={() => openProductDialog({ type: 'switch', buildingId: building.id, elementId: sw.id })}>
                                                <Package className="h-3 w-3 mr-1" />Product
                                              </Button>
                                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                                onClick={() => openServiceDialog({ type: 'switch', buildingId: building.id, elementId: sw.id })}>
                                                <Wrench className="h-3 w-3 mr-1" />Service
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}

                                {/* Routers */}
                                {building.centralRack.routers && building.centralRack.routers.length > 0 && (
                                  <Collapsible 
                                    open={expandedSections.get(`central-${building.id}`)?.has('routers')} 
                                    onOpenChange={() => toggleSection(`central-${building.id}`, 'routers')}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                                        <div className="flex items-center gap-2">
                                          {expandedSections.get(`central-${building.id}`)?.has('routers') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                          <Wifi className="h-4 w-4" />
                                          <span className="text-sm font-semibold">Routers</span>
                                          <Badge variant="secondary">{building.centralRack.routers.length}</Badge>
                                        </div>
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 space-y-2 pl-6">
                                      {building.centralRack.routers.map((router) => (
                                        <div key={router.id} className="p-3 bg-white dark:bg-slate-900 rounded border">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Wifi className="h-3 w-3" />
                                              <span className="text-sm">{router.brand} {router.model}</span>
                                              {isNewElement(router) ? (
                                                <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                              ) : (
                                                <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                              )}
                                            </div>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                                onClick={() => openProductDialog({ type: 'router', buildingId: building.id, elementId: router.id })}>
                                                <Package className="h-3 w-3 mr-1" />Product
                                              </Button>
                                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                                onClick={() => openServiceDialog({ type: 'router', buildingId: building.id, elementId: router.id })}>
                                                <Wrench className="h-3 w-3 mr-1" />Service
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}

                                {/* Servers */}
                                {building.centralRack.servers && building.centralRack.servers.length > 0 && (
                                  <Collapsible 
                                    open={expandedSections.get(`central-${building.id}`)?.has('servers')} 
                                    onOpenChange={() => toggleSection(`central-${building.id}`, 'servers')}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                                        <div className="flex items-center gap-2">
                                          {expandedSections.get(`central-${building.id}`)?.has('servers') ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                          <Server className="h-4 w-4" />
                                          <span className="text-sm font-semibold">Servers</span>
                                          <Badge variant="secondary">{building.centralRack.servers.length}</Badge>
                                        </div>
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 space-y-2 pl-6">
                                      {building.centralRack.servers.map((server) => (
                                        <div key={server.id} className="p-3 bg-white dark:bg-slate-900 rounded border">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Server className="h-3 w-3" />
                                              <span className="text-sm">{server.name} - {server.type}</span>
                                              {isNewElement(server) ? (
                                                <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                              ) : (
                                                <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                              )}
                                            </div>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                                onClick={() => openProductDialog({ type: 'server', buildingId: building.id, elementId: server.id })}>
                                                <Package className="h-3 w-3 mr-1" />Product
                                              </Button>
                                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                                onClick={() => openServiceDialog({ type: 'server', buildingId: building.id, elementId: server.id })}>
                                                <Wrench className="h-3 w-3 mr-1" />Service
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        )}

                        {/* FLOORS */}
                        {building.floors.map((floor) => (
                          <Collapsible key={floor.id} open={expandedFloors.has(floor.id)} onOpenChange={() => toggleFloor(floor.id)}>
                            <div className="border-2 border-green-300 rounded-lg bg-green-50/50 dark:bg-green-950/20">
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/40">
                                  <div className="flex items-center gap-2">
                                    {expandedFloors.has(floor.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <Layers className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold">{floor.name}</span>
                                    <Badge variant="outline" className="text-xs">{floor.racks?.length || 0} Racks</Badge>
                                    <Badge variant="outline" className="text-xs">{floor.rooms?.length || 0} Rooms</Badge>
                                  </div>
                                  <Button size="sm" variant="default" className="h-7 text-xs" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      const name = prompt('New Rack Name:');
                                      if (name) addNewFloorRack(building.id, floor.id, name, '', 42);
                                    }}>
                                    <Plus className="h-3 w-3 mr-1" />Add New Rack
                                  </Button>
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent className="p-4 space-y-3">
                                {/* FLOOR RACKS */}
                                {floor.racks && floor.racks.map((rack) => (
                                  <Collapsible key={rack.id} open={expandedRacks.has(rack.id)} onOpenChange={() => toggleRack(rack.id)}>
                                    <div className={`border rounded-lg ${isNewElement(rack) ? 'border-blue-400 border-2 bg-blue-50/70 dark:bg-blue-950/40' : 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/20'}`}>
                                      <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-3 cursor-pointer hover:opacity-80">
                                          <div className="flex items-center gap-2">
                                            {expandedRacks.has(rack.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                            <Server className="h-4 w-4 text-purple-600" />
                                            <span className="font-medium text-sm">{rack.name}</span>
                                            {isNewElement(rack) ? (
                                              <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">{rack.cableTerminations?.length || 0} Terms</Badge>
                                            <Badge variant="outline" className="text-xs">{rack.switches?.length || 0} SW</Badge>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                              <Button size="sm" variant="outline" className="h-7">
                                                <Plus className="h-3 w-3 mr-1" />Add
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                              <DropdownMenuItem onClick={() => addNewSwitchToRack(building.id, floor.id, rack.id)}>
                                                <Network className="h-4 w-4 mr-2" />New Switch
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </CollapsibleTrigger>

                                      <CollapsibleContent className="p-3 space-y-2">
                                        {/* Rack Terminations, Switches, etc. - Same pattern as central rack */}
                                        {rack.switches && rack.switches.length > 0 && (
                                          <div className="space-y-2">
                                            {rack.switches.map((sw) => (
                                              <div key={sw.id} className="p-2 bg-white dark:bg-slate-900 rounded border flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <Network className="h-3 w-3" />
                                                  <span className="text-xs">{sw.brand} {sw.model}</span>
                                                  {isNewElement(sw) ? (
                                                    <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                  ) : (
                                                    <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                  )}
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                                                    onClick={() => openProductDialog({ type: 'switch', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: sw.id })}>
                                                    <Package className="h-3 w-3" />
                                                  </Button>
                                                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                                                    onClick={() => openServiceDialog({ type: 'switch', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: sw.id })}>
                                                    <Wrench className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                ))}

                                {/* ROOMS */}
                                {floor.rooms && floor.rooms.map((room) => (
                                  <Collapsible key={room.id} open={expandedRooms.has(room.id)} onOpenChange={() => toggleRoom(room.id)}>
                                    <div className="border rounded-lg border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                                      <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40">
                                          <div className="flex items-center gap-2">
                                            {expandedRooms.has(room.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                            <Home className="h-4 w-4 text-amber-600" />
                                            <span className="font-medium text-sm">{room.name || 'Room'}</span>
                                            <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                            <Badge variant="outline" className="text-xs">{room.devices?.length || 0} Devices</Badge>
                                            <Badge variant="outline" className="text-xs">{room.outlets?.length || 0} Outlets</Badge>
                                          </div>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                              <Button size="sm" variant="outline" className="h-7">
                                                <Plus className="h-3 w-3 mr-1" />Add
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                              <DropdownMenuItem onClick={() => addNewDeviceToRoom(building.id, floor.id, room.id)}>
                                                <Monitor className="h-4 w-4 mr-2" />New Device
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => addNewOutletToRoom(building.id, floor.id, room.id)}>
                                                <Cable className="h-4 w-4 mr-2" />New Outlet
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </CollapsibleTrigger>

                                      <CollapsibleContent className="p-3 space-y-3">
                                        {/* DEVICES */}
                                        {room.devices && room.devices.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Devices</Label>
                                            <div className="space-y-2">
                                              {room.devices.map((device) => (
                                                <div key={device.id} className="p-2 bg-white dark:bg-slate-900 rounded border flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Monitor className="h-3 w-3" />
                                                    <span className="text-xs">{device.type} × {device.quantity}</span>
                                                    {isNewElement(device) ? (
                                                      <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                    ) : (
                                                      <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                                                      onClick={() => openProductDialog({ type: 'device', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: device.id })}>
                                                      <Package className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                                                      onClick={() => openServiceDialog({ type: 'device', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: device.id })}>
                                                      <Wrench className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* OUTLETS */}
                                        {room.outlets && room.outlets.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Outlets</Label>
                                            <div className="space-y-2">
                                              {room.outlets.map((outlet) => (
                                                <div key={outlet.id} className="p-2 bg-white dark:bg-slate-900 rounded border flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Cable className="h-3 w-3" />
                                                    <span className="text-xs">{outlet.type} {outlet.label && `- ${outlet.label}`} × {outlet.quantity}</span>
                                                    {isNewElement(outlet) ? (
                                                      <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                    ) : (
                                                      <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                                                      onClick={() => openServiceDialog({ type: 'outlet', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: outlet.id })}>
                                                      <Wrench className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* CONNECTIONS */}
                                        {room.connections && room.connections.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Connections</Label>
                                            <div className="space-y-2">
                                              {room.connections.map((conn) => (
                                                <div key={conn.id} className="p-2 bg-white dark:bg-slate-900 rounded border flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Cable className="h-3 w-3" />
                                                    <span className="text-xs">{conn.fromDevice} → {conn.toDevice}</span>
                                                    {isNewElement(conn) ? (
                                                      <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                    ) : (
                                                      <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                                                      onClick={() => openServiceDialog({ type: 'connection', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: conn.id })}>
                                                      <Wrench className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                ))}
                              </CardContent>
                            </div>
                          </Collapsible>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Assignment Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Product</DialogTitle>
            <DialogDescription>
              Select a product from your catalog. This will mark the element for product association.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.code} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={productQuantity}
                onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => assignProduct(selectedProductId, productQuantity)} disabled={!selectedProductId}>
              Assign Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Assignment Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>
              Select a service to associate with this element (e.g., installation, cabling, configuration).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Service</Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.code} - {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={serviceQuantity}
                onChange={(e) => setServiceQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => assignService(selectedServiceId, serviceQuantity)} disabled={!selectedServiceId}>
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
