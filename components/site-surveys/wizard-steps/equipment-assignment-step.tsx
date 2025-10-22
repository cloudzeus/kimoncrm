"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { BuildingData, FloorData, CableTerminationData, ServiceAssociationData } from "../comprehensive-infrastructure-wizard";
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
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [expandedRacks, setExpandedRacks] = useState<Set<string>>(new Set());
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  
  // Products and Services
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Dialog state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isAddNewRackDialogOpen, setIsAddNewRackDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{
    type: 'termination' | 'switch' | 'router' | 'server' | 'device' | 'outlet' | 'rack';
    buildingId: string;
    floorId?: string;
    rackId?: string;
    roomId?: string;
    elementId: string;
  } | null>(null);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  
  // New rack form
  const [newRackName, setNewRackName] = useState("");
  const [newRackLocation, setNewRackLocation] = useState("");
  const [newRackUnits, setNewRackUnits] = useState(42);
  const [selectedFloorForNewRack, setSelectedFloorForNewRack] = useState<{
    buildingId: string;
    floorId: string;
  } | null>(null);
  
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
  const toggleBuilding = (buildingId: string) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      if (next.has(buildingId)) {
        next.delete(buildingId);
      } else {
        next.add(buildingId);
      }
      return next;
    });
  };

  const toggleFloor = (floorId: string) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      if (next.has(floorId)) {
        next.delete(floorId);
      } else {
        next.add(floorId);
      }
      return next;
    });
  };

  const toggleRack = (rackId: string) => {
    setExpandedRacks(prev => {
      const next = new Set(prev);
      if (next.has(rackId)) {
        next.delete(rackId);
      } else {
        next.add(rackId);
      }
      return next;
    });
  };

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  // Open dialogs
  const openProductDialog = (elementInfo: typeof selectedElement) => {
    setSelectedElement(elementInfo);
    setSelectedProductId("");
    setProductQuantity(1);
    setIsProductDialogOpen(true);
  };

  const openServiceDialog = (elementInfo: typeof selectedElement) => {
    setSelectedElement(elementInfo);
    setSelectedServiceId("");
    setServiceQuantity(1);
    setIsServiceDialogOpen(true);
  };

  // Add product to element
  const handleAddProduct = () => {
    if (!selectedElement || !selectedProductId) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== selectedElement.buildingId) return building;

      // Handle different element types
      if (selectedElement.type === 'termination' && building.centralRack) {
        const updatedTerminations = building.centralRack.cableTerminations.map(term => {
          if (term.id === selectedElement.elementId) {
            return {
              ...term,
              isFutureProposal: true,
              productId: selectedProductId,
              quantity: productQuantity,
            };
          }
          return term;
        });
        return {
          ...building,
          centralRack: {
            ...building.centralRack,
            cableTerminations: updatedTerminations,
          },
        };
      }

      // Handle floor-level elements
      if (selectedElement.floorId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== selectedElement.floorId) return floor;

          // Handle rack elements
          if (selectedElement.rackId) {
            const updatedRacks = (floor.racks || []).map(rack => {
              if (rack.id !== selectedElement.rackId) return rack;

              if (selectedElement.type === 'termination' && rack.cableTerminations) {
                const updatedTerminations = rack.cableTerminations.map(term => {
                  if (term.id === selectedElement.elementId) {
                    return {
                      ...term,
                      isFutureProposal: true,
                      productId: selectedProductId,
                      quantity: productQuantity,
                    };
                  }
                  return term;
                });
                return { ...rack, cableTerminations: updatedTerminations };
              }

              return rack;
            });
            return { ...floor, racks: updatedRacks };
          }

          return floor;
        });
        return { ...building, floors: updatedFloors };
      }

      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    setIsProductDialogOpen(false);
    
    // Auto-save
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    }
    
    toast({ title: "Success", description: `Product "${product.name}" assigned and saved` });
  };

  // Open new rack dialog
  const openNewRackDialog = (buildingId: string, floorId: string) => {
    setSelectedFloorForNewRack({ buildingId, floorId });
    setNewRackName("");
    setNewRackLocation("");
    setNewRackUnits(42);
    setIsAddNewRackDialogOpen(true);
  };

  // Add new floor rack (marked as future proposal)
  const handleAddNewRack = () => {
    if (!selectedFloorForNewRack || !newRackName) {
      toast({ title: "Error", description: "Please enter a rack name", variant: "destructive" });
      return;
    }

    const newRack = {
      id: `rack-proposal-${Date.now()}`,
      name: newRackName,
      location: newRackLocation,
      units: newRackUnits,
      code: `RACK-NEW-${Date.now()}`,
      isFutureProposal: true, // Mark as future proposal
      cableTerminations: [],
      connections: [],
      switches: [],
      routers: [],
      servers: [],
      notes: "⚡ NEW - Future Proposal",
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== selectedFloorForNewRack.buildingId) return building;

      const updatedFloors = building.floors.map(floor => {
        if (floor.id !== selectedFloorForNewRack.floorId) return floor;

        return {
          ...floor,
          racks: [...(floor.racks || []), newRack],
        };
      });

      return { ...building, floors: updatedFloors };
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    setIsAddNewRackDialogOpen(false);
    
    // Auto-save the new infrastructure
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    }
    
    toast({ 
      title: "Success", 
      description: `New rack "${newRackName}" added as future proposal and saved` 
    });
  };

  // Add service to element
  const handleAddService = () => {
    if (!selectedElement || !selectedServiceId) return;

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;

    const newService: ServiceAssociationData = {
      id: `service-${Date.now()}`,
      serviceId: selectedServiceId,
      quantity: serviceQuantity,
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== selectedElement.buildingId) return building;

      // Handle central rack terminations
      if (selectedElement.type === 'termination' && building.centralRack) {
        const updatedTerminations = building.centralRack.cableTerminations.map(term => {
          if (term.id === selectedElement.elementId) {
            return {
              ...term,
              services: [...(term.services || []), newService],
            };
          }
          return term;
        });
        return {
          ...building,
          centralRack: {
            ...building.centralRack,
            cableTerminations: updatedTerminations,
          },
        };
      }

      // Handle floor rack terminations
      if (selectedElement.floorId && selectedElement.rackId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== selectedElement.floorId) return floor;

          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== selectedElement.rackId) return rack;

            if (selectedElement.type === 'termination' && rack.cableTerminations) {
              const updatedTerminations = rack.cableTerminations.map(term => {
                if (term.id === selectedElement.elementId) {
                  return {
                    ...term,
                    services: [...(term.services || []), newService],
                  };
                }
                return term;
              });
              return { ...rack, cableTerminations: updatedTerminations };
            }

            return rack;
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }

      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    setIsServiceDialogOpen(false);
    
    // Auto-save
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    }
    
    toast({ title: "Success", description: `Service "${service.name}" assigned and saved` });
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
            <h3 className="font-semibold text-sm mb-1">How This Step Works</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Review</strong> your infrastructure from Step 1 (automatically synced)</li>
              <li>• <strong>Add NEW elements</strong> (marked as ⚡ Future Proposals) using "Add New Rack" buttons</li>
              <li>• <strong>Assign products</strong> from catalog to existing or new elements</li>
              <li>• <strong>Assign services</strong> (installation, cabling, etc.) to any element</li>
              <li>• <strong>Changes auto-save</strong> - Go back to Step 1 anytime to modify infrastructure</li>
            </ul>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment & Product Assignment
            <Badge variant="secondary" className="ml-2">
              {localBuildings.length} Building{localBuildings.length !== 1 ? 's' : ''}
            </Badge>
            {lastSyncTime && (
              <Badge variant="outline" className="text-xs text-green-600">
                ✓ Synced {lastSyncTime.toLocaleTimeString()}
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review your infrastructure and assign products/services to each element. 
            Mark items as future proposals and associate them with your product catalog.
          </p>
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
                <Card key={building.id} className="border-2">
                  <div className="p-4">
                    {/* Building Header */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBuilding(building.id)}
                        className="flex items-center gap-2"
                      >
                        {expandedBuildings.has(building.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-lg">{building.name}</span>
                      </Button>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {building.floors.length} Floor{building.floors.length !== 1 ? 's' : ''}
                        </Badge>
                        {building.centralRack && (
                          <Badge variant="secondary">Has Central Rack</Badge>
                        )}
                      </div>
                    </div>

                    {/* Building Content */}
                    {expandedBuildings.has(building.id) && (
                      <div className="pl-6 space-y-4 border-l-2 border-blue-200">
                        {/* Central Rack */}
                        {building.centralRack && (
                          <Card className="bg-blue-50/50 dark:bg-blue-950/20">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                Central Rack
                                <Badge variant="secondary" className="ml-2">
                                  {building.centralRack.cableTerminations?.length || 0} Terminations
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {/* Cable Terminations */}
                              {building.centralRack.cableTerminations && building.centralRack.cableTerminations.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold">Cable Terminations</Label>
                                  {building.centralRack.cableTerminations.map((termination) => (
                                    <div key={termination.id} className="p-3 bg-white dark:bg-slate-900 rounded border">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Cable className="h-4 w-4" />
                                          <span className="text-sm font-medium">
                                            {termination.cableType} × {termination.quantity}
                                          </span>
                                          {termination.isFutureProposal && (
                                            <Badge variant="default" className="text-xs">🔮 Proposal</Badge>
                                          )}
                                          {termination.productId && (
                                            <Badge variant="outline" className="text-xs">
                                              <Package className="h-3 w-3 mr-1" />
                                              Product Assigned
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs"
                                            onClick={() => openProductDialog({
                                              type: 'termination',
                                              buildingId: building.id,
                                              elementId: termination.id,
                                            })}
                                          >
                                            <Package className="h-3 w-3 mr-1" />
                                            Assign Product
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs"
                                            onClick={() => openServiceDialog({
                                              type: 'termination',
                                              buildingId: building.id,
                                              elementId: termination.id,
                                            })}
                                          >
                                            <Wrench className="h-3 w-3 mr-1" />
                                            Add Service
                                          </Button>
                                        </div>
                                      </div>
                                      {/* Show assigned services */}
                                      {termination.services && termination.services.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                          <Label className="text-xs">Associated Services:</Label>
                                          <div className="flex gap-1 flex-wrap mt-1">
                                            {termination.services.map((service) => (
                                              <Badge key={service.id} variant="secondary" className="text-xs">
                                                {service.serviceId} × {service.quantity}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Floors */}
                        {building.floors.map((floor) => (
                          <Card key={floor.id} className="bg-green-50/50 dark:bg-green-950/20">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFloor(floor.id)}
                                  className="flex items-center gap-2"
                                >
                                  {expandedFloors.has(floor.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <Layers className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-sm">{floor.name}</span>
                                </Button>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {floor.racks?.length || 0} Rack{floor.racks?.length !== 1 ? 's' : ''}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {floor.rooms?.length || 0} Room{floor.rooms?.length !== 1 ? 's' : ''}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs"
                                    onClick={() => openNewRackDialog(building.id, floor.id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add New Rack
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            {expandedFloors.has(floor.id) && (
                              <CardContent className="space-y-3">
                                {/* Floor Racks */}
                                {floor.racks && floor.racks.map((rack) => (
                                  <div key={rack.id} className={`p-3 rounded border ${
                                    rack.isFutureProposal 
                                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 border-2' 
                                      : 'bg-white dark:bg-slate-900'
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => toggleRack(rack.id)}>
                                          {expandedRacks.has(rack.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        </Button>
                                        <Server className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm font-medium">{rack.name || 'Floor Rack'}</span>
                                        {rack.isFutureProposal ? (
                                          <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">{rack.cableTerminations?.length || 0} Terms</Badge>
                                        <Badge variant="outline" className="text-xs">{rack.switches?.length || 0} SW</Badge>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button size="sm" variant="outline" className="h-7 text-xs">
                                            <Plus className="h-3 w-3 mr-1" />Add
                                            <ChevronDown className="h-3 w-3 ml-1" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Add to {rack.name || 'Rack'}</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => addNewSwitchToRack(building.id, floor.id, rack.id)}>
                                            <Network className="h-4 w-4 mr-2" />New Switch
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    
                                    {/* Rack Details */}
                                    {expandedRacks.has(rack.id) && (
                                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-purple-200">
                                        {/* Terminations */}
                                        {rack.cableTerminations && rack.cableTerminations.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Cable Terminations</Label>
                                            <div className="space-y-1">
                                              {rack.cableTerminations.map((termination) => (
                                                <div key={termination.id} className="p-2 bg-muted/30 rounded flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Cable className="h-3 w-3" />
                                                    <span className="text-xs">{termination.cableType} × {termination.quantity}</span>
                                                    {isNewElement(termination) ? (
                                                      <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                    ) : (
                                                      <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" className="h-6 px-2"
                                                      onClick={() => openProductDialog({ type: 'termination', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: termination.id })}>
                                                      <Package className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-6 px-2"
                                                      onClick={() => openServiceDialog({ type: 'termination', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: termination.id })}>
                                                      <Wrench className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Switches */}
                                        {rack.switches && rack.switches.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Switches</Label>
                                            <div className="space-y-1">
                                              {rack.switches.map((sw) => (
                                                <div key={sw.id} className="p-2 bg-muted/30 rounded flex items-center justify-between">
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
                                                    <Button size="sm" variant="ghost" className="h-6 px-2"
                                                      onClick={() => openProductDialog({ type: 'switch', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: sw.id })}>
                                                      <Package className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-6 px-2"
                                                      onClick={() => openServiceDialog({ type: 'switch', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: sw.id })}>
                                                      <Wrench className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Connections */}
                                        {rack.connections && rack.connections.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Connections</Label>
                                            <div className="space-y-1">
                                              {rack.connections.map((conn) => (
                                                <div key={conn.id} className="p-2 bg-muted/30 rounded flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Cable className="h-3 w-3" />
                                                    <span className="text-xs text-muted-foreground">{conn.fromDevice} → {conn.toDevice}</span>
                                                    {isNewElement(conn) ? (
                                                      <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                    ) : (
                                                      <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                    )}
                                                  </div>
                                                  <Button size="sm" variant="ghost" className="h-6 px-2"
                                                    onClick={() => openServiceDialog({ type: 'connection', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: conn.id })}>
                                                    <Wrench className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Rooms */}
                                {floor.rooms && floor.rooms.map((room) => (
                                  <div key={room.id} className="p-3 bg-white dark:bg-slate-900 rounded border">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => toggleRoom(room.id)}>
                                          {expandedRooms.has(room.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        </Button>
                                        <Home className="h-4 w-4" />
                                        <span className="text-sm font-medium">{room.name || 'Room'}</span>
                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                        <Badge variant="outline" className="text-xs">{room.devices?.length || 0} Devices</Badge>
                                        <Badge variant="outline" className="text-xs">{room.outlets?.length || 0} Outlets</Badge>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button size="sm" variant="outline" className="h-7 text-xs">
                                            <Plus className="h-3 w-3 mr-1" />Add New
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
                                    
                                    {/* Room Details */}
                                    {expandedRooms.has(room.id) && (
                                      <div className="mt-2 space-y-3 pl-4 border-l-2 border-amber-200">
                                        {/* Devices */}
                                        {room.devices && room.devices.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Devices</Label>
                                            <div className="space-y-1">
                                              {room.devices.map((device) => (
                                                <div key={device.id} className="p-2 bg-muted/30 rounded flex items-center justify-between">
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
                                                    <Button size="sm" variant="ghost" className="h-6 px-2"
                                                      onClick={() => openProductDialog({ type: 'device', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: device.id })}>
                                                      <Package className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-6 px-2"
                                                      onClick={() => openServiceDialog({ type: 'device', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: device.id })}>
                                                      <Wrench className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Outlets */}
                                        {room.outlets && room.outlets.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Outlets</Label>
                                            <div className="space-y-1">
                                              {room.outlets.map((outlet) => (
                                                <div key={outlet.id} className="p-2 bg-muted/30 rounded flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Cable className="h-3 w-3" />
                                                    <span className="text-xs">{outlet.type} {outlet.label} × {outlet.quantity}</span>
                                                    {isNewElement(outlet) ? (
                                                      <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                    ) : (
                                                      <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button size="sm" variant="ghost" className="h-6 px-2"
                                                      onClick={() => openServiceDialog({ type: 'outlet', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: outlet.id })}>
                                                      <Wrench className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Connections */}
                                        {room.connections && room.connections.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Connections</Label>
                                            <div className="space-y-1">
                                              {room.connections.map((conn) => (
                                                <div key={conn.id} className="p-2 bg-muted/30 rounded flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Cable className="h-3 w-3" />
                                                    <span className="text-xs text-muted-foreground">{conn.fromDevice} → {conn.toDevice}</span>
                                                    {isNewElement(conn) ? (
                                                      <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                    ) : (
                                                      <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                    )}
                                                  </div>
                                                  <Button size="sm" variant="ghost" className="h-6 px-2"
                                                    onClick={() => openServiceDialog({ type: 'connection', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: conn.id })}>
                                                    <Wrench className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
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
              Select a product from your catalog to assign to this element. This will mark it as a future proposal.
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
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={!selectedProductId}>
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
              Select a service from your catalog to associate with this element.
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
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService} disabled={!selectedServiceId}>
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Rack Dialog */}
      <Dialog open={isAddNewRackDialogOpen} onOpenChange={setIsAddNewRackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              Add New Floor Rack (Future Proposal)
            </DialogTitle>
            <DialogDescription>
              Add a new rack that will be part of your infrastructure upgrade proposal. 
              This rack will be marked as "NEW" and you can assign products and services to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ⚡ This will create a <strong>NEW</strong> rack marked as a future proposal
              </p>
            </div>
            <div>
              <Label>Rack Name *</Label>
              <Input
                value={newRackName}
                onChange={(e) => setNewRackName(e.target.value)}
                placeholder="e.g., Distribution Rack A"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={newRackLocation}
                onChange={(e) => setNewRackLocation(e.target.value)}
                placeholder="e.g., Server Room, Corner A"
              />
            </div>
            <div>
              <Label>Rack Units (U)</Label>
              <Input
                type="number"
                min="1"
                value={newRackUnits}
                onChange={(e) => setNewRackUnits(parseInt(e.target.value) || 42)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNewRackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewRack} disabled={!newRackName}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Rack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

