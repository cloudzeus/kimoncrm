// @ts-nocheck
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
  Sparkles,
  FileText,
  Upload,
  Image as ImageIcon,
  X,
  Tv,
  Cpu,
  Box,
} from "lucide-react";
import { BuildingData, FloorData, CableTerminationData, ServiceAssociationData } from "@/types/building-data";
import { useToast } from "@/hooks/use-toast";
import ProductSpecificationsDialog from "@/components/products/product-specifications-dialog";
import ProductTranslationsDialog from "@/components/products/product-translations-dialog";
import ProductImagesDialog from "@/components/products/product-images-dialog";

interface Product {
  id: string;
  name: string;
  code: string;
  category?: string;
  description?: string;
  images?: any[];
  specifications?: any[];
  translations?: any[];
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
  const [localBuildings, setLocalBuildings] = useState<BuildingData[]>([]);
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
    type: 'termination' | 'switch' | 'router' | 'server' | 'device' | 'outlet' | 'rack' | 'connection' | 'voipPbx' | 'headend' | 'nvr';
    buildingId: string;
    floorId?: string;
    rackId?: string;
    roomId?: string;
    elementId: string;
  } | null>(null);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  
  // Product enhancement dialogs
  const [specificationsDialogOpen, setSpecificationsDialogOpen] = useState(false);
  const [translationsDialogOpen, setTranslationsDialogOpen] = useState(false);
  const [imagesDialogOpen, setImagesDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Device type selection dialog
  const [deviceTypeDialogOpen, setDeviceTypeDialogOpen] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState<'PHONE' | 'VOIP_PHONE' | 'PC' | 'TV' | 'AP' | 'CAMERA' | 'IOT' | 'OTHER'>('PC');
  const [pendingRoomInfo, setPendingRoomInfo] = useState<{ buildingId: string; floorId: string; roomId: string } | null>(null);
  
  // Cable termination modal state
  const [cableTerminationModalOpen, setCableTerminationModalOpen] = useState(false);
  const [pendingTerminationData, setPendingTerminationData] = useState<{
    buildingId: string;
    floorId?: string;
    rackId: string;
  } | null>(null);
  
  // Cable termination form data
  const [terminationForm, setTerminationForm] = useState({
    cableType: 'CAT6',
    quantity: 1,
    totalFibers: undefined as number | undefined,
    terminatedFibers: undefined as number | undefined,
    fromLocation: '',
    toLocation: ''
  });
  
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
      const response = await fetch('/api/products?limit=999999'); // Load all products
      if (response.ok) {
        const result = await response.json();
        console.log('📦 Products loaded:', result.data?.length || 0);
        // Products already include images, specifications, translations from API
        setProducts(result.data || []); // API returns { success: true, data: [...] }
      } else {
        console.error('Failed to fetch products:', response.status);
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
      const response = await fetch('/api/services?limit=1000'); // Get more services for selection
      if (response.ok) {
        const result = await response.json();
        console.log('🔧 Services loaded:', result.data?.length || 0);
        setServices(result.data || []); // API returns { success: true, data: [...] }
      } else {
        console.error('Failed to fetch services:', response.status);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({ title: "Error", description: "Failed to load services", variant: "destructive" });
    } finally {
      setLoadingServices(false);
    }
  };

  // Sync local state with props - ensures changes from Step 1 appear here
  // IMPORTANT: Only sync ONCE on mount, never overwrite after that
  useEffect(() => {
    // Only sync if localBuildings is empty (initial mount)
    if (localBuildings.length === 0 && buildings.length > 0) {
      console.log('🔄 Equipment Step: Initial sync from Step 1', buildings.length, 'buildings');
      setLocalBuildings(buildings);
      setLastSyncTime(new Date());
      
      // Auto-expand first building for better UX
      setExpandedBuildings(new Set([buildings[0].id]));
    } else {
      console.log('🔄 Equipment Step: Skipping sync - already have local data');
    }
  }, []); // Empty deps - only run once on mount

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

  // Helper to check if element is new/proposal
  const isNewElement = (element: any) => {
    return element?.isFutureProposal || element?.id?.includes('proposal');
  };

  // Delete handlers for products and services
  const handleDeleteProduct = (buildingId: string, elementInfo: any, productId: string) => {
    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;

      // Central rack elements
      if (elementInfo.location === 'central' && building.centralRack) {
        if (elementInfo.type === 'termination' && building.centralRack.cableTerminations) {
          const updated = building.centralRack.cableTerminations.map(term => {
            if (term.id === elementInfo.elementId) {
              return {
                ...term,
                products: term.products?.filter(p => p.productId !== productId) || [],
                productId: term.productId === productId ? undefined : term.productId
              };
            }
            return term;
          });
          return { ...building, centralRack: { ...building.centralRack, cableTerminations: updated } };
        }

        if (elementInfo.type === 'switch' && building.centralRack.switches) {
          const updated = building.centralRack.switches.map(sw => {
            if (sw.id === elementInfo.elementId) {
              return {
                ...sw,
                products: sw.products?.filter(p => p.productId !== productId) || [],
                productId: sw.productId === productId ? undefined : sw.productId
              };
            }
            return sw;
          });
          return { ...building, centralRack: { ...building.centralRack, switches: updated } };
        }

        if (elementInfo.type === 'router' && building.centralRack.routers) {
          const updated = building.centralRack.routers.map(router => {
            if (router.id === elementInfo.elementId) {
              return {
                ...router,
                products: router.products?.filter(p => p.productId !== productId) || [],
                productId: router.productId === productId ? undefined : router.productId
              };
            }
            return router;
          });
          return { ...building, centralRack: { ...building.centralRack, routers: updated } };
        }

        // Add similar logic for servers, voipPbx, headend, nvr, ata
        const deviceTypes = ['servers', 'voipPbx', 'headend', 'nvr', 'ata', 'connections'];
        for (const deviceType of deviceTypes) {
          if (elementInfo.type === deviceType.slice(0, -1) && building.centralRack[deviceType]) {
            const updated = building.centralRack[deviceType].map((device: any) => {
              if (device.id === elementInfo.elementId) {
                return {
                  ...device,
                  products: device.products?.filter((p: any) => p.productId !== productId) || [],
                  productId: device.productId === productId ? undefined : device.productId
                };
              }
              return device;
            });
            return { ...building, centralRack: { ...building.centralRack, [deviceType]: updated } };
          }
        }
      }

      // Floor rack elements
      if (elementInfo.floorId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== elementInfo.floorId) return floor;

          if (elementInfo.rackId && floor.racks) {
            const updatedRacks = floor.racks.map(rack => {
              if (rack.id !== elementInfo.rackId) return rack;

              const elementTypes = ['cableTerminations', 'switches', 'routers', 'servers', 'voipPbx', 'headend', 'nvr', 'ata', 'connections'];
              for (const elType of elementTypes) {
                if (rack[elType]) {
                  const updated = rack[elType].map((el: any) => {
                    if (el.id === elementInfo.elementId) {
                      return {
                        ...el,
                        products: el.products?.filter((p: any) => p.productId !== productId) || [],
                        productId: el.productId === productId ? undefined : el.productId
                      };
                    }
                    return el;
                  });
                  return { ...rack, [elType]: updated };
                }
              }
              return rack;
            });
            return { ...floor, racks: updatedRacks };
          }

          // Room devices
          const updatedRooms = floor.rooms.map(room => {
            if (elementInfo.roomId && room.id === elementInfo.roomId) {
              const roomElementTypes = ['devices', 'outlets', 'connections'];
              for (const elType of roomElementTypes) {
                if (room[elType]) {
                  const updated = room[elType].map((el: any) => {
                    if (el.id === elementInfo.elementId) {
                      return {
                        ...el,
                        products: el.products?.filter((p: any) => p.productId !== productId) || [],
                        productId: el.productId === productId ? undefined : el.productId
                      };
                    }
                    return el;
                  });
                  return { ...room, [elType]: updated };
                }
              }
            }
            return room;
          });
          return { ...floor, rooms: updatedRooms };
        });
        return { ...building, floors: updatedFloors };
      }

      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
  };

  const handleDeleteService = (buildingId: string, elementInfo: any, serviceId: string) => {
    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;

      // Central rack elements
      if (elementInfo.location === 'central' && building.centralRack) {
        const elementTypes = ['cableTerminations', 'switches', 'routers', 'servers', 'voipPbx', 'headend', 'nvr', 'ata', 'connections'];
        for (const elType of elementTypes) {
          if (building.centralRack[elType]) {
            const updated = building.centralRack[elType].map((el: any) => {
              if (el.id === elementInfo.elementId) {
                return {
                  ...el,
                  services: el.services?.filter((s: any) => s.serviceId !== serviceId) || []
                };
              }
              return el;
            });
            return { ...building, centralRack: { ...building.centralRack, [elType]: updated } };
          }
        }
      }

      // Floor rack elements
      if (elementInfo.floorId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== elementInfo.floorId) return floor;

          if (elementInfo.rackId && floor.racks) {
            const updatedRacks = floor.racks.map(rack => {
              if (rack.id !== elementInfo.rackId) return rack;

              const elementTypes = ['cableTerminations', 'switches', 'routers', 'servers', 'voipPbx', 'headend', 'nvr', 'ata', 'connections'];
              for (const elType of elementTypes) {
                if (rack[elType]) {
                  const updated = rack[elType].map((el: any) => {
                    if (el.id === elementInfo.elementId) {
                      return {
                        ...el,
                        services: el.services?.filter((s: any) => s.serviceId !== serviceId) || []
                      };
                    }
                    return el;
                  });
                  return { ...rack, [elType]: updated };
                }
              }
              return rack;
            });
            return { ...floor, racks: updatedRacks };
          }

          // Room devices
          const updatedRooms = floor.rooms.map(room => {
            if (elementInfo.roomId && room.id === elementInfo.roomId) {
              const roomElementTypes = ['devices', 'outlets', 'connections'];
              for (const elType of roomElementTypes) {
                if (room[elType]) {
                  const updated = room[elType].map((el: any) => {
                    if (el.id === elementInfo.elementId) {
                      return {
                        ...el,
                        services: el.services?.filter((s: any) => s.serviceId !== serviceId) || []
                      };
                    }
                    return el;
                  });
                  return { ...room, [elType]: updated };
                }
              }
            }
            return room;
          });
          return { ...floor, rooms: updatedRooms };
        });
        return { ...building, floors: updatedFloors };
      }

      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
  };

  // Pricing helper functions
  const updateProductPricing = (productId: string, field: 'unitPrice' | 'margin', value: number) => {
    const current = productPricing.get(productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
    const updated = { ...current, [field]: value };
    updated.totalPrice = updated.unitPrice * (1 + updated.margin / 100);
    setProductPricing(new Map(productPricing.set(productId, updated)));
  };

  const updateServicePricing = (serviceId: string, field: 'unitPrice' | 'margin', value: number) => {
    const current = servicePricing.get(serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
    const updated = { ...current, [field]: value };
    updated.totalPrice = updated.unitPrice * (1 + updated.margin / 100);
    setServicePricing(new Map(servicePricing.set(serviceId, updated)));
  };

  // Collect all assigned products and services for pricing
  const collectAssignedItems = () => {
    const assignedProducts = new Map();
    const assignedServices = new Map();

    buildings.forEach(building => {
      // Central rack
      if (building.centralRack) {
        building.centralRack.cableTerminations?.forEach(term => {
          if (term.productId) {
            const key = term.productId;
            if (!assignedProducts.has(key)) {
              assignedProducts.set(key, {
                id: term.productId,
                name: products.find(p => p.id === term.productId)?.name || term.productId,
                quantity: 0,
                type: 'Cable Termination'
              });
            }
            assignedProducts.get(key).quantity += term.quantity || 1;
          }
          
          term.services?.forEach(svc => {
            const key = svc.serviceId;
            if (!assignedServices.has(key)) {
              assignedServices.set(key, {
                id: svc.serviceId,
                name: services.find(s => s.id === svc.serviceId)?.name || svc.serviceId,
                quantity: 0,
                type: 'Cable Termination Service'
              });
            }
            assignedServices.get(key).quantity += svc.quantity;
          });
        });

        building.centralRack.switches?.forEach(sw => {
          if (sw.productId) {
            const key = sw.productId;
            if (!assignedProducts.has(key)) {
              assignedProducts.set(key, {
                id: sw.productId,
                name: products.find(p => p.id === sw.productId)?.name || sw.productId,
                quantity: 0,
                type: 'Network Switch'
              });
            }
            assignedProducts.get(key).quantity += 1;
          }
          
          sw.services?.forEach(svc => {
            const key = svc.serviceId;
            if (!assignedServices.has(key)) {
              assignedServices.set(key, {
                id: svc.serviceId,
                name: services.find(s => s.id === svc.serviceId)?.name || svc.serviceId,
                quantity: 0,
                type: 'Switch Service'
              });
            }
            assignedServices.get(key).quantity += svc.quantity;
          });
        });
      }

      // Floors
      building.floors.forEach(floor => {
        floor.racks?.forEach(rack => {
          rack.cableTerminations?.forEach(term => {
            if (term.productId) {
              const key = term.productId;
              if (!assignedProducts.has(key)) {
                assignedProducts.set(key, {
                  id: term.productId,
                  name: products.find(p => p.id === term.productId)?.name || term.productId,
                  quantity: 0,
                  type: 'Cable Termination'
                });
              }
              assignedProducts.get(key).quantity += term.quantity || 1;
            }
          });

          rack.switches?.forEach(sw => {
            if (sw.productId) {
              const key = sw.productId;
              if (!assignedProducts.has(key)) {
                assignedProducts.set(key, {
                  id: sw.productId,
                  name: products.find(p => p.id === sw.productId)?.name || sw.productId,
                  quantity: 0,
                  type: 'Network Switch'
                });
              }
              assignedProducts.get(key).quantity += 1;
            }
          });
        });

        floor.rooms.forEach(room => {
          room.devices?.forEach(device => {
            if (device.productId) {
              const key = device.productId;
              if (!assignedProducts.has(key)) {
                assignedProducts.set(key, {
                  id: device.productId,
                  name: products.find(p => p.id === device.productId)?.name || device.productId,
                  quantity: 0,
                  type: device.type
                });
              }
              assignedProducts.get(key).quantity += device.quantity || 1;
            }
          });
        });
      });
    });

    return { assignedProducts, assignedServices };
  };

  // Helper to calculate multiplier for typical floors/rooms
  const getFloorMultiplier = (floor: FloorData) => {
    return floor.isTypical && floor.repeatCount ? floor.repeatCount : 1;
  };

  // Helper to calculate multiplier for typical rooms
  const getRoomMultiplier = (room: RoomData) => {
    return room.isTypical && room.repeatCount ? room.repeatCount : 1;
  };

  // Helper to calculate total multiplier (floor × room)
  const getTotalMultiplier = (floor: FloorData, room: RoomData) => {
    return getFloorMultiplier(floor) * getRoomMultiplier(room);
  };

  // Delete NEW element
  const deleteNewElement = (buildingId: string, floorId: string | undefined, rackId: string | undefined, roomId: string | undefined, elementType: string, elementId: string) => {
    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;

      // Handle central rack
      if (!floorId && building.centralRack) {
        if (elementType === 'switch') {
          return { ...building, centralRack: { ...building.centralRack, switches: building.centralRack.switches.filter(sw => sw.id !== elementId) } };
        }
        if (elementType === 'router') {
          return { ...building, centralRack: { ...building.centralRack, routers: building.centralRack.routers.filter(r => r.id !== elementId) } };
        }
        if (elementType === 'server') {
          return { ...building, centralRack: { ...building.centralRack, servers: (building.centralRack.servers || []).filter(s => s.id !== elementId) } };
        }
        if (elementType === 'termination') {
          return { ...building, centralRack: { ...building.centralRack, cableTerminations: building.centralRack.cableTerminations.filter(t => t.id !== elementId) } };
        }
      }

      // Handle floor-level elements
      if (floorId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;

          // Handle rack elements
          if (rackId) {
            const updatedRacks = (floor.racks || []).map(rack => {
              if (rack.id !== rackId) return rack;
              if (elementType === 'switch') return { ...rack, switches: rack.switches.filter(sw => sw.id !== elementId) };
              if (elementType === 'router') return { ...rack, routers: (rack.routers || []).filter(r => r.id !== elementId) };
              if (elementType === 'server') return { ...rack, servers: (rack.servers || []).filter(s => s.id !== elementId) };
              if (elementType === 'voipPbx') return { ...rack, voipPbx: (rack.voipPbx || []).filter(p => p.id !== elementId) };
              if (elementType === 'headend') return { ...rack, headend: (rack.headend || []).filter(h => h.id !== elementId) };
              if (elementType === 'nvr') return { ...rack, nvr: (rack.nvr || []).filter(n => n.id !== elementId) };
              if (elementType === 'ata') return { ...rack, ata: (rack.ata || []).filter(a => a.id !== elementId) };
              if (elementType === 'termination') return { ...rack, cableTerminations: (rack.cableTerminations || []).filter(t => t.id !== elementId) };
              if (elementType === 'connection') return { ...rack, connections: rack.connections.filter(c => c.id !== elementId) };
              return rack;
            });
            return { ...floor, racks: updatedRacks };
          }

          // Handle room elements
          if (roomId) {
            const updatedRooms = floor.rooms.map(room => {
              if (room.id !== roomId) return room;
              if (elementType === 'device') return { ...room, devices: room.devices.filter(d => d.id !== elementId) };
              if (elementType === 'outlet') return { ...room, outlets: room.outlets.filter(o => o.id !== elementId) };
              return room;
            });
            return { ...floor, rooms: updatedRooms };
          }

          return floor;
        });
        return { ...building, floors: updatedFloors };
      }

      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    toast({ title: "Success", description: "Element deleted" });
  };

  // Update NEW element properties
  const updateNewElement = (buildingId: string, floorId: string | undefined, rackId: string | undefined, roomId: string | undefined, elementType: string, elementId: string, updates: any) => {
    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;

      if (floorId && rackId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            if (elementType === 'termination') {
              return { ...rack, cableTerminations: (rack.cableTerminations || []).map(t => t.id === elementId ? { ...t, ...updates } : t) };
            }
            return rack;
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }

      return building;
    });

    console.log('🔄 Element updated:', { buildingId, floorId, rackId, roomId, elementType, elementId, updates, updatedBuildings });
    
    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
  };

  // Add NEW device to existing room
  const addNewDeviceToRoom = (buildingId: string, floorId: string, roomId: string, deviceType: 'PHONE' | 'VOIP_PHONE' | 'PC' | 'TV' | 'AP' | 'CAMERA' | 'IOT' | 'OTHER') => {
    const newDevice: any = {
      id: `device-proposal-${Date.now()}`,
      type: deviceType,
      quantity: 1,
      brand: '',
      model: '',
      isFutureProposal: true,
      services: [],
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

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    }
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

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    }
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
      poePortsCount: 0,
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

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    }
    toast({ title: "Success", description: "New switch added as future proposal" });
  };

  // Add NEW router to rack
  const addNewRouterToRack = (buildingId: string, floorId: string | undefined, rackId: string) => {
    const newRouter: any = {
      id: `router-proposal-${Date.now()}`,
      brand: '',
      model: '',
      ip: '',
      vlans: [],
      interfaces: [],
      connections: [],
      services: [],
      isFutureProposal: true,
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;
      
      if (!floorId && building.centralRack) {
        return {
          ...building,
          centralRack: {
            ...building.centralRack,
            routers: [...(building.centralRack.routers || []), newRouter],
          },
        };
      } else if (floorId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return { ...rack, routers: [...(rack.routers || []), newRouter] };
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }
      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    toast({ title: "Success", description: "New router added as future proposal" });
  };

  // Add NEW server to rack
  const addNewServerToRack = (buildingId: string, floorId: string | undefined = undefined, rackId: string | undefined = undefined) => {
    const newServer: any = {
      id: `server-proposal-${Date.now()}`,
      name: '',
      type: '',
      brand: '',
      model: '',
      virtualMachines: [],
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
            servers: [...(building.centralRack.servers || []), newServer],
          },
        };
      } else if (floorId && rackId) {
        // Floor rack
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return { ...rack, servers: [...(rack.servers || []), newServer] };
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }
      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    toast({ title: "Success", description: "New server added as future proposal" });
  };

  // Add NEW VoIP PBX to rack
  const addNewVoipPbxToRack = (buildingId: string, floorId: string | undefined = undefined, rackId: string | undefined = undefined) => {
    const newVoipPbx: any = {
      id: `voippbx-proposal-${Date.now()}`,
      brand: '',
      model: '',
      extensions: 0,
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
            voipPbx: [...(building.centralRack.voipPbx || []), newVoipPbx],
          },
        };
      } else if (floorId && rackId) {
        // Floor rack
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return { ...rack, voipPbx: [...(rack.voipPbx || []), newVoipPbx] };
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }
      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    toast({ title: "Success", description: "New VoIP PBX added as future proposal" });
  };

  // Add NEW Headend to rack
  const addNewHeadendToRack = (buildingId: string, floorId: string | undefined = undefined, rackId: string | undefined = undefined) => {
    const newHeadend: any = {
      id: `headend-proposal-${Date.now()}`,
      brand: '',
      model: '',
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
            headend: [...(building.centralRack.headend || []), newHeadend],
          },
        };
      } else if (floorId && rackId) {
        // Floor rack
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return { ...rack, headend: [...(rack.headend || []), newHeadend] };
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }
      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    toast({ title: "Success", description: "New Headend added as future proposal" });
  };

  // Add NEW NVR to rack
  const addNewNvrToRack = (buildingId: string, floorId: string | undefined = undefined, rackId: string | undefined = undefined) => {
    const newNvr: any = {
      id: `nvr-proposal-${Date.now()}`,
      brand: '',
      model: '',
      channels: 0,
      storageCapacity: '',
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
            nvr: [...(building.centralRack.nvr || []), newNvr],
          },
        };
      } else if (floorId && rackId) {
        // Floor rack
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return { ...rack, nvr: [...(rack.nvr || []), newNvr] };
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }
      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    toast({ title: "Success", description: "New NVR added as future proposal" });
  };

  // Add NEW ATA to rack
  const addNewAtaToRack = (buildingId: string, floorId: string | undefined = undefined, rackId: string | undefined = undefined) => {
    const newAta: any = {
      id: `ata-proposal-${Date.now()}`,
      brand: '',
      model: '',
      ports: 0,
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
            ata: [...(building.centralRack.ata || []), newAta],
          },
        };
      } else if (floorId && rackId) {
        // Floor rack
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return { ...rack, ata: [...(rack.ata || []), newAta] };
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }
      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    toast({ title: "Success", description: "New ATA added as future proposal" });
  };

  // Add NEW cable termination to rack - opens modal for configuration
  const addNewTerminationToRack = (buildingId: string, floorId: string | undefined, rackId: string) => {
    setPendingTerminationData({ buildingId, floorId, rackId });
    setCableTerminationModalOpen(true);
  };

  // Create termination from modal data
  const createTerminationFromModal = () => {
    if (!pendingTerminationData) return;

    const { buildingId, floorId, rackId } = pendingTerminationData;
    
    const newTermination: any = {
      id: `termination-proposal-${Date.now()}`,
      cableType: terminationForm.cableType,
      quantity: terminationForm.quantity,
      services: [],
      isFutureProposal: true,
      ...(terminationForm.cableType === 'FIBER_SM' || terminationForm.cableType === 'FIBER_MM' ? {
        totalFibers: terminationForm.totalFibers,
        terminatedFibers: terminationForm.terminatedFibers,
      } : {}),
      fromLocation: terminationForm.fromLocation,
      toLocation: terminationForm.toLocation,
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;
      
      if (!floorId && building.centralRack) {
        return {
          ...building,
          centralRack: {
            ...building.centralRack,
            cableTerminations: [...(building.centralRack.cableTerminations || []), newTermination],
          },
        };
      } else if (floorId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return { ...rack, cableTerminations: [...(rack.cableTerminations || []), newTermination] };
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }
      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    
    // Reset form and close modal
    setTerminationForm({
      cableType: 'CAT6',
      quantity: 1,
      totalFibers: undefined,
      terminatedFibers: undefined,
      fromLocation: '',
      toLocation: ''
    });
    setCableTerminationModalOpen(false);
    setPendingTerminationData(null);
    
    toast({ title: "Success", description: "New cable termination added as future proposal" });
  };

  // Add NEW connection to rack
  const addNewConnectionToRack = (buildingId: string, floorId: string | undefined, rackId: string) => {
    const newConnection: any = {
      id: `connection-proposal-${Date.now()}`,
      fromDevice: '',
      toDevice: '',
      connectionType: 'ETHERNET',
      cableType: '',
      length: 0,
      isFutureProposal: true,
    };

    const updatedBuildings = localBuildings.map(building => {
      if (building.id !== buildingId) return building;
      
      if (!floorId && building.centralRack) {
        return {
          ...building,
          centralRack: {
            ...building.centralRack,
            connections: [...(building.centralRack.connections || []), newConnection],
          },
        };
      } else if (floorId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          const updatedRacks = (floor.racks || []).map(rack => {
            if (rack.id !== rackId) return rack;
            return { ...rack, connections: [...(rack.connections || []), newConnection] };
          });
          return { ...floor, racks: updatedRacks };
        });
        return { ...building, floors: updatedFloors };
      }
      return building;
    });

    setLocalBuildings(updatedBuildings);
    onUpdate(updatedBuildings);
    if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
    toast({ title: "Success", description: "New connection added as future proposal" });
  };

  // Open dialogs
  const openProductDialog = (elementInfo: typeof selectedElement) => {
    console.log('🔍 Opening product dialog for:', elementInfo);
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

      // Handle floor-level elements FIRST (before central rack)
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
                    // Add to products array instead of replacing single productId
                    const existingProducts = term.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      // Update existing product quantity
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      // Add new product
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...term,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return term;
                });
                return { ...rack, cableTerminations: updatedTerminations };
              }

              if (selectedElement.type === 'switch' && rack.switches) {
                const updatedSwitches = rack.switches.map(sw => {
                  if (sw.id === selectedElement.elementId) {
                    // Add to products array instead of replacing single productId
                    const existingProducts = sw.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      // Update existing product quantity
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      // Add new product
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...sw,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return sw;
                });
                return { ...rack, switches: updatedSwitches };
              }

              if (selectedElement.type === 'router' && rack.routers) {
                const updatedRouters = rack.routers.map(router => {
                  if (router.id === selectedElement.elementId) {
                    // Add to products array instead of replacing single productId
                    const existingProducts = router.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      // Update existing product quantity
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      // Add new product
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...router,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return router;
                });
                return { ...rack, routers: updatedRouters };
              }

              if (selectedElement.type === 'connection' && rack.connections) {
                const updatedConnections = rack.connections.map(conn => {
                  if (conn.id === selectedElement.elementId) {
                    // Add to products array instead of replacing single productId
                    const existingProducts = conn.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      // Update existing product quantity
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      // Add new product
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...conn,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return conn;
                });
                return { ...rack, connections: updatedConnections };
              }

              if (selectedElement.type === 'server' && rack.servers) {
                const updatedServers = rack.servers.map(server => {
                  if (server.id === selectedElement.elementId) {
                    const existingProducts = server.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...server,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return server;
                });
                return { ...rack, servers: updatedServers };
              }

              if (selectedElement.type === 'voipPbx' && rack.voipPbx) {
                const updatedVoipPbx = rack.voipPbx.map(pbx => {
                  if (pbx.id === selectedElement.elementId) {
                    const existingProducts = pbx.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...pbx,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return pbx;
                });
                return { ...rack, voipPbx: updatedVoipPbx };
              }

              if (selectedElement.type === 'headend' && rack.headend) {
                const updatedHeadend = rack.headend.map(he => {
                  if (he.id === selectedElement.elementId) {
                    const existingProducts = he.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...he,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return he;
                });
                return { ...rack, headend: updatedHeadend };
              }

              if (selectedElement.type === 'nvr' && rack.nvr) {
                const updatedNvr = rack.nvr.map(nvr => {
                  if (nvr.id === selectedElement.elementId) {
                    const existingProducts = nvr.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...nvr,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return nvr;
                });
                return { ...rack, nvr: updatedNvr };
              }

              if (selectedElement.type === 'ata' && rack.ata) {
                const updatedAta = rack.ata.map(ata => {
                  if (ata.id === selectedElement.elementId) {
                    const existingProducts = ata.products || [];
                    const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
                    
                    let updatedProducts;
                    if (existingIndex >= 0) {
                      updatedProducts = [...existingProducts];
                      updatedProducts[existingIndex] = {
                        ...updatedProducts[existingIndex],
                        quantity: updatedProducts[existingIndex].quantity + productQuantity,
                      };
                    } else {
                      updatedProducts = [
                        ...existingProducts,
                        { productId: selectedProductId, quantity: productQuantity },
                      ];
                    }
                    
                    return {
                      ...ata,
                      isFutureProposal: true,
                      products: updatedProducts,
                    };
                  }
                  return ata;
                });
                return { ...rack, ata: updatedAta };
              }

              return rack;
            });
            return { ...floor, racks: updatedRacks };
          }

          // Handle room elements
          if (selectedElement.roomId) {
            const updatedRooms = floor.rooms.map(room => {
              if (room.id !== selectedElement.roomId) return room;

              if (selectedElement.type === 'device') {
                const updatedDevices = room.devices.map(device => {
                  if (device.id === selectedElement.elementId) {
                    return {
                      ...device,
                      isFutureProposal: true,
                      productId: selectedProductId,
                      quantity: productQuantity,
                    };
                  }
                  return device;
                });
                return { ...room, devices: updatedDevices };
              }

              if (selectedElement.type === 'connection' && room.connections) {
                const updatedConnections = room.connections.map(conn => {
                  if (conn.id === selectedElement.elementId) {
                    return {
                      ...conn,
                      isFutureProposal: true,
                      productId: selectedProductId,
                      quantity: productQuantity,
                    };
                  }
                  return conn;
                });
                return { ...room, connections: updatedConnections };
              }

              return room;
            });
            return { ...floor, rooms: updatedRooms };
          }

          return floor;
        });
        return { ...building, floors: updatedFloors };
      }

      // Handle central rack elements (only if no floorId)
      if (building.centralRack) {
        if (selectedElement.type === 'termination') {
          const updatedTerminations = building.centralRack.cableTerminations.map(term => {
            if (term.id === selectedElement.elementId) {
              // Add to products array instead of replacing single productId
              const existingProducts = term.products || [];
              const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
              
              let updatedProducts;
              if (existingIndex >= 0) {
                // Update existing product quantity
                updatedProducts = [...existingProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  quantity: updatedProducts[existingIndex].quantity + productQuantity,
                };
              } else {
                // Add new product
                updatedProducts = [
                  ...existingProducts,
                  { productId: selectedProductId, quantity: productQuantity },
                ];
              }
              
              return {
                ...term,
                isFutureProposal: true,
                products: updatedProducts,
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

        if (selectedElement.type === 'switch') {
          const updatedSwitches = (building.centralRack.switches || []).map(sw => {
            if (sw.id === selectedElement.elementId) {
              // Add to products array instead of replacing single productId
              const existingProducts = sw.products || [];
              const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
              
              let updatedProducts;
              if (existingIndex >= 0) {
                // Update existing product quantity
                updatedProducts = [...existingProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  quantity: updatedProducts[existingIndex].quantity + productQuantity,
                };
              } else {
                // Add new product
                updatedProducts = [
                  ...existingProducts,
                  { productId: selectedProductId, quantity: productQuantity },
                ];
              }
              
              return {
                ...sw,
                isFutureProposal: true,
                products: updatedProducts,
              };
            }
            return sw;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              switches: updatedSwitches,
            },
          };
        }

        if (selectedElement.type === 'router') {
          const updatedRouters = (building.centralRack.routers || []).map(router => {
            if (router.id === selectedElement.elementId) {
              // Add to products array instead of replacing single productId
              const existingProducts = router.products || [];
              const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
              
              let updatedProducts;
              if (existingIndex >= 0) {
                // Update existing product quantity
                updatedProducts = [...existingProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  quantity: updatedProducts[existingIndex].quantity + productQuantity,
                };
              } else {
                // Add new product
                updatedProducts = [
                  ...existingProducts,
                  { productId: selectedProductId, quantity: productQuantity },
                ];
              }
              
              return {
                ...router,
                isFutureProposal: true,
                products: updatedProducts,
              };
            }
            return router;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              routers: updatedRouters,
            },
          };
        }

        if (selectedElement.type === 'server') {
          const updatedServers = (building.centralRack.servers || []).map(server => {
            if (server.id === selectedElement.elementId) {
              // Add to products array instead of replacing single productId
              const existingProducts = server.products || [];
              const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
              
              let updatedProducts;
              if (existingIndex >= 0) {
                // Update existing product quantity
                updatedProducts = [...existingProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  quantity: updatedProducts[existingIndex].quantity + productQuantity,
                };
              } else {
                // Add new product
                updatedProducts = [
                  ...existingProducts,
                  { productId: selectedProductId, quantity: productQuantity },
                ];
              }
              
              return {
                ...server,
                isFutureProposal: true,
                products: updatedProducts,
              };
            }
            return server;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              servers: updatedServers,
            },
          };
        }

        if (selectedElement.type === 'voipPbx') {
          const updatedVoipPbx = (building.centralRack.voipPbx || []).map(pbx => {
            if (pbx.id === selectedElement.elementId) {
              // Add to products array instead of replacing single productId
              const existingProducts = pbx.products || [];
              const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
              
              let updatedProducts;
              if (existingIndex >= 0) {
                // Update existing product quantity
                updatedProducts = [...existingProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  quantity: updatedProducts[existingIndex].quantity + productQuantity,
                };
              } else {
                // Add new product
                updatedProducts = [
                  ...existingProducts,
                  { productId: selectedProductId, quantity: productQuantity },
                ];
              }
              
              return {
                ...pbx,
                isFutureProposal: true,
                products: updatedProducts,
              };
            }
            return pbx;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              voipPbx: updatedVoipPbx,
            },
          };
        }

        if (selectedElement.type === 'headend') {
          const updatedHeadend = (building.centralRack.headend || []).map(he => {
            if (he.id === selectedElement.elementId) {
              // Add to products array instead of replacing single productId
              const existingProducts = he.products || [];
              const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
              
              let updatedProducts;
              if (existingIndex >= 0) {
                // Update existing product quantity
                updatedProducts = [...existingProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  quantity: updatedProducts[existingIndex].quantity + productQuantity,
                };
              } else {
                // Add new product
                updatedProducts = [
                  ...existingProducts,
                  { productId: selectedProductId, quantity: productQuantity },
                ];
              }
              
              return {
                ...he,
                isFutureProposal: true,
                products: updatedProducts,
              };
            }
            return he;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              headend: updatedHeadend,
            },
          };
        }

        if (selectedElement.type === 'nvr') {
          const updatedNvr = (building.centralRack.nvr || []).map(nvr => {
            if (nvr.id === selectedElement.elementId) {
              // Add to products array instead of replacing single productId
              const existingProducts = nvr.products || [];
              const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
              
              let updatedProducts;
              if (existingIndex >= 0) {
                // Update existing product quantity
                updatedProducts = [...existingProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  quantity: updatedProducts[existingIndex].quantity + productQuantity,
                };
              } else {
                // Add new product
                updatedProducts = [
                  ...existingProducts,
                  { productId: selectedProductId, quantity: productQuantity },
                ];
              }
              
              return {
                ...nvr,
                isFutureProposal: true,
                products: updatedProducts,
              };
            }
            return nvr;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              nvr: updatedNvr,
            },
          };
        }

        if (selectedElement.type === 'connection') {
          const updatedConnections = (building.centralRack.connections || []).map(conn => {
            if (conn.id === selectedElement.elementId) {
              // Add to products array instead of replacing single productId
              const existingProducts = conn.products || [];
              const existingIndex = existingProducts.findIndex(p => p.productId === selectedProductId);
              
              let updatedProducts;
              if (existingIndex >= 0) {
                // Update existing product quantity
                updatedProducts = [...existingProducts];
                updatedProducts[existingIndex] = {
                  ...updatedProducts[existingIndex],
                  quantity: updatedProducts[existingIndex].quantity + productQuantity,
                };
              } else {
                // Add new product
                updatedProducts = [
                  ...existingProducts,
                  { productId: selectedProductId, quantity: productQuantity },
                ];
              }
              
              return {
                ...conn,
                isFutureProposal: true,
                products: updatedProducts,
              };
            }
            return conn;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              connections: updatedConnections,
            },
          };
        }

        if (selectedElement.type === 'ata') {
          const ata = (building.centralRack as any).ata;
          if (ata && ata.id === selectedElement.elementId) {
            const existingProducts = ata.products || [];
            const existingIndex = existingProducts.findIndex((p: any) => p.productId === selectedProductId);
            
            let updatedProducts;
            if (existingIndex >= 0) {
              updatedProducts = [...existingProducts];
              updatedProducts[existingIndex] = {
                ...updatedProducts[existingIndex],
                quantity: updatedProducts[existingIndex].quantity + productQuantity,
              };
            } else {
              updatedProducts = [
                ...existingProducts,
                { productId: selectedProductId, quantity: productQuantity },
              ];
            }
            
            return {
              ...building,
              centralRack: {
                ...building.centralRack,
                ata: {
                  ...ata,
                  isFutureProposal: true,
                  products: updatedProducts,
                },
              },
            };
          }
        }

        if (selectedElement.type === 'pbx') {
          const pbx = (building.centralRack as any).pbx;
          if (pbx && pbx.id === selectedElement.elementId) {
            const existingProducts = pbx.products || [];
            const existingIndex = existingProducts.findIndex((p: any) => p.productId === selectedProductId);
            
            let updatedProducts;
            if (existingIndex >= 0) {
              updatedProducts = [...existingProducts];
              updatedProducts[existingIndex] = {
                ...updatedProducts[existingIndex],
                quantity: updatedProducts[existingIndex].quantity + productQuantity,
              };
            } else {
              updatedProducts = [
                ...existingProducts,
                { productId: selectedProductId, quantity: productQuantity },
              ];
            }
            
            return {
              ...building,
              centralRack: {
                ...building.centralRack,
                pbx: {
                  ...pbx,
                  isFutureProposal: true,
                  products: updatedProducts,
                },
              },
            };
          }
        }
      }

      return building;
    });

    // Force deep copy to ensure React detects the change
    const deepCopy = JSON.parse(JSON.stringify(updatedBuildings));
    
    setLocalBuildings(deepCopy);
    onUpdate(deepCopy);
    setIsProductDialogOpen(false);
    
    // Auto-save
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, deepCopy);
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

      // Handle floor-level elements FIRST (before central rack)
      if (selectedElement.floorId) {
        const updatedFloors = building.floors.map(floor => {
          if (floor.id !== selectedElement.floorId) return floor;

          // Handle rack elements
          if (selectedElement.rackId) {
            const updatedRacks = (floor.racks || []).map(rack => {
              console.log('🔍 DEBUG - Rack structure:', {
                rackId: rack.id,
                elementType: selectedElement.type,
                hasCableTerminations: !!rack.cableTerminations,
                cableTerminationsLength: rack.cableTerminations?.length || 0,
                cableTerminations: rack.cableTerminations?.map(t => ({ id: t.id, services: t.services?.length || 0 })) || []
              });
              
              if (rack.id !== selectedElement.rackId) return rack;

              if (selectedElement.type === 'termination' && rack.cableTerminations) {
                const updatedTerminations = rack.cableTerminations.map(term => {
                  if (term.id === selectedElement.elementId) {
                    const updated = {
                      ...term,
                      services: [...(term.services || []), newService],
                    };
                    return updated;
                  }
                  return term;
                });
                return { ...rack, cableTerminations: updatedTerminations };
              }

              if (selectedElement.type === 'switch' && rack.switches) {
                const updatedSwitches = rack.switches.map(sw => {
                  if (sw.id === selectedElement.elementId) {
                    return {
                      ...sw,
                      services: [...(sw.services || []), newService],
                    };
                  }
                  return sw;
                });
                return { ...rack, switches: updatedSwitches };
              }

              if (selectedElement.type === 'router' && rack.routers) {
                const updatedRouters = rack.routers.map(router => {
                  if (router.id === selectedElement.elementId) {
                    return {
                      ...router,
                      services: [...(router.services || []), newService],
                    };
                  }
                  return router;
                });
                return { ...rack, routers: updatedRouters };
              }

              if (selectedElement.type === 'connection' && rack.connections) {
                const updatedConnections = rack.connections.map(conn => {
                  if (conn.id === selectedElement.elementId) {
                    return {
                      ...conn,
                      services: [...(conn.services || []), newService],
                    };
                  }
                  return conn;
                });
                return { ...rack, connections: updatedConnections };
              }

              if (selectedElement.type === 'server' && rack.servers) {
                const updatedServers = rack.servers.map(server => {
                  if (server.id === selectedElement.elementId) {
                    return {
                      ...server,
                      services: [...(server.services || []), newService],
                    };
                  }
                  return server;
                });
                return { ...rack, servers: updatedServers };
              }

              if (selectedElement.type === 'voipPbx' && rack.voipPbx) {
                const updatedVoipPbx = rack.voipPbx.map(pbx => {
                  if (pbx.id === selectedElement.elementId) {
                    return {
                      ...pbx,
                      services: [...(pbx.services || []), newService],
                    };
                  }
                  return pbx;
                });
                return { ...rack, voipPbx: updatedVoipPbx };
              }

              if (selectedElement.type === 'headend' && rack.headend) {
                const updatedHeadend = rack.headend.map(he => {
                  if (he.id === selectedElement.elementId) {
                    return {
                      ...he,
                      services: [...(he.services || []), newService],
                    };
                  }
                  return he;
                });
                return { ...rack, headend: updatedHeadend };
              }

              if (selectedElement.type === 'nvr' && rack.nvr) {
                const updatedNvr = rack.nvr.map(nvr => {
                  if (nvr.id === selectedElement.elementId) {
                    return {
                      ...nvr,
                      services: [...(nvr.services || []), newService],
                    };
                  }
                  return nvr;
                });
                return { ...rack, nvr: updatedNvr };
              }

              if (selectedElement.type === 'ata' && rack.ata) {
                const updatedAta = rack.ata.map(ata => {
                  if (ata.id === selectedElement.elementId) {
                    return {
                      ...ata,
                      services: [...(ata.services || []), newService],
                    };
                  }
                  return ata;
                });
                return { ...rack, ata: updatedAta };
              }

              return rack;
            });
            return { ...floor, racks: updatedRacks };
          }

          // Handle room elements
          if (selectedElement.roomId) {
            const updatedRooms = floor.rooms.map(room => {
              if (room.id !== selectedElement.roomId) return room;

              if (selectedElement.type === 'device') {
                const updatedDevices = room.devices.map(device => {
                  if (device.id === selectedElement.elementId) {
                    return {
                      ...device,
                      services: [...(device.services || []), newService],
                    };
                  }
                  return device;
                });
                return { ...room, devices: updatedDevices };
              }

              if (selectedElement.type === 'connection' && room.connections) {
                const updatedConnections = room.connections.map(conn => {
                  if (conn.id === selectedElement.elementId) {
                    return {
                      ...conn,
                      services: [...(conn.services || []), newService],
                    };
                  }
                  return conn;
                });
                return { ...room, connections: updatedConnections };
              }

              return room;
            });
            return { ...floor, rooms: updatedRooms };
          }

          return floor;
        });
        return { ...building, floors: updatedFloors };
      }

      // Handle central rack elements (only if no floorId)
      if (building.centralRack) {
        if (selectedElement.type === 'termination') {
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

        if (selectedElement.type === 'switch') {
          const updatedSwitches = (building.centralRack.switches || []).map(sw => {
            if (sw.id === selectedElement.elementId) {
              return {
                ...sw,
                services: [...(sw.services || []), newService],
              };
            }
            return sw;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              switches: updatedSwitches,
            },
          };
        }

        if (selectedElement.type === 'router') {
          const updatedRouters = (building.centralRack.routers || []).map(router => {
            if (router.id === selectedElement.elementId) {
              return {
                ...router,
                services: [...(router.services || []), newService],
              };
            }
            return router;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              routers: updatedRouters,
            },
          };
        }

        if (selectedElement.type === 'server') {
          const updatedServers = (building.centralRack.servers || []).map(server => {
            if (server.id === selectedElement.elementId) {
              return {
                ...server,
                services: [...(server.services || []), newService],
              };
            }
            return server;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              servers: updatedServers,
            },
          };
        }

        if (selectedElement.type === 'voipPbx') {
          const updatedVoipPbx = (building.centralRack.voipPbx || []).map(pbx => {
            if (pbx.id === selectedElement.elementId) {
              return {
                ...pbx,
                services: [...(pbx.services || []), newService],
              };
            }
            return pbx;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              voipPbx: updatedVoipPbx,
            },
          };
        }

        if (selectedElement.type === 'headend') {
          const updatedHeadend = (building.centralRack.headend || []).map(he => {
            if (he.id === selectedElement.elementId) {
              return {
                ...he,
                services: [...(he.services || []), newService],
              };
            }
            return he;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              headend: updatedHeadend,
            },
          };
        }

        if (selectedElement.type === 'nvr') {
          const updatedNvr = (building.centralRack.nvr || []).map(nvr => {
            if (nvr.id === selectedElement.elementId) {
              return {
                ...nvr,
                services: [...(nvr.services || []), newService],
              };
            }
            return nvr;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              nvr: updatedNvr,
            },
          };
        }

        if (selectedElement.type === 'connection') {
          const updatedConnections = (building.centralRack.connections || []).map(conn => {
            if (conn.id === selectedElement.elementId) {
              return {
                ...conn,
                services: [...(conn.services || []), newService],
              };
            }
            return conn;
          });
          return {
            ...building,
            centralRack: {
              ...building.centralRack,
              connections: updatedConnections,
            },
          };
        }
      }

      // Handle floor-level elements
      if (selectedElement.floorId) {
        console.log('🔍 DEBUG - Floor check:', {
          selectedFloorId: selectedElement.floorId,
          availableFloors: building.floors.map(f => f.id)
        });
        
        const updatedFloors = building.floors.map(floor => {
          console.log('🔍 DEBUG - Floor mapping:', {
            floorId: floor.id,
            selectedFloorId: selectedElement.floorId,
            matches: floor.id === selectedElement.floorId
          });
          
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
                      services: [...(term.services || []), newService],
                    };
                  }
                  return term;
                });
                return { ...rack, cableTerminations: updatedTerminations };
              }

              if (selectedElement.type === 'switch' && rack.switches) {
                const updatedSwitches = rack.switches.map(sw => {
                  if (sw.id === selectedElement.elementId) {
                    return {
                      ...sw,
                      services: [...(sw.services || []), newService],
                    };
                  }
                  return sw;
                });
                return { ...rack, switches: updatedSwitches };
              }

              if (selectedElement.type === 'connection' && rack.connections) {
                const updatedConnections = rack.connections.map(conn => {
                  if (conn.id === selectedElement.elementId) {
                    return {
                      ...conn,
                      services: [...(conn.services || []), newService],
                    };
                  }
                  return conn;
                });
                return { ...rack, connections: updatedConnections };
              }

              return rack;
            });
            return { ...floor, racks: updatedRacks };
          }

          // Handle room elements
          if (selectedElement.roomId) {
            const updatedRooms = floor.rooms.map(room => {
              if (room.id !== selectedElement.roomId) return room;

              if (selectedElement.type === 'device') {
                const updatedDevices = room.devices.map(device => {
                  if (device.id === selectedElement.elementId) {
                    return {
                      ...device,
                      services: [...(device.services || []), newService],
                    };
                  }
                  return device;
                });
                return { ...room, devices: updatedDevices };
              }

              if (selectedElement.type === 'connection' && room.connections) {
                const updatedConnections = room.connections.map(conn => {
                  if (conn.id === selectedElement.elementId) {
                    return {
                      ...conn,
                      services: [...(conn.services || []), newService],
                    };
                  }
                  return conn;
                });
                return { ...room, connections: updatedConnections };
              }

              return room;
            });
            return { ...floor, rooms: updatedRooms };
          }

          return floor;
        });
        return { ...building, floors: updatedFloors };
      }

      return building;
    });

    // Force deep copy to ensure React detects the change
    const deepCopy = JSON.parse(JSON.stringify(updatedBuildings));
    
    setLocalBuildings(deepCopy);
    onUpdate(deepCopy);
    setIsServiceDialogOpen(false);
    
    // Auto-save
    if (siteSurveyId) {
      autoSaveInfrastructure(siteSurveyId, deepCopy);
    }
    
    toast({ title: "Success", description: `Service "${service.name}" assigned and saved` });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-800/50 border border-blue-200 dark:border-blue-600 rounded-lg p-4">
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
                      <div className="pl-6 space-y-4 border-l-2 border-blue-200 bg-white p-4 rounded-md">
                        {/* Central Rack */}
                        {building.centralRack && (
                          <Card className="bg-white border-2 border-blue-300">
                            <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Server className="h-4 w-4" />
                                  <span className="font-semibold text-sm">Central Rack</span>
                                  <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {building.centralRack.cableTerminations?.length || 0} Terms
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {building.centralRack.switches?.length || 0} SW
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {building.centralRack.routers?.length || 0} Routers
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {building.centralRack.servers?.length || 0} Servers
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {building.centralRack.voipPbx?.length || 0} PBX
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {building.centralRack.headend?.length || 0} Headend
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {building.centralRack.nvr?.length || 0} NVR
                                  </Badge>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                      <Plus className="h-3 w-3 mr-1" />Add New
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Add to Central Rack</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => addNewTerminationToRack(building.id, undefined, 'central')}>
                                      <Cable className="h-4 w-4 mr-2" />Cable Termination
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addNewSwitchToRack(building.id, undefined, 'central')}>
                                      <Network className="h-4 w-4 mr-2" />Switch
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addNewRouterToRack(building.id, undefined, 'central')}>
                                      <Wifi className="h-4 w-4 mr-2" />Router
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addNewServerToRack(building.id)}>
                                      <Server className="h-4 w-4 mr-2" />Server
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addNewVoipPbxToRack(building.id)}>
                                      <Phone className="h-4 w-4 mr-2" />VoIP PBX
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addNewHeadendToRack(building.id)}>
                                      <Tv className="h-4 w-4 mr-2" />Headend
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addNewNvrToRack(building.id)}>
                                      <Camera className="h-4 w-4 mr-2" />NVR
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => addNewConnectionToRack(building.id, undefined, 'central')}>
                                      <Cable className="h-4 w-4 mr-2" />Connection
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="bg-white">
                              {/* Cable Terminations */}
                              {building.centralRack.cableTerminations && building.centralRack.cableTerminations.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold">Cable Terminations</Label>
                                  {building.centralRack.cableTerminations.map((termination) => (
                                    <div key={termination.id} className="p-3 bg-white dark:bg-slate-300 rounded border">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Cable className="h-4 w-4" />
                                          <span className="text-sm font-medium">
                                            {termination.cableType} × {termination.quantity}
                                          </span>
                                          {termination.isFutureProposal && (
                                            <Badge variant="default" className="text-xs">🔮 Proposal</Badge>
                                          )}
                                          {((termination.products && termination.products.length > 0) || termination.productId) && (
                                  <Badge variant="outline" className="text-xs">
                                              <Package className="h-3 w-3 mr-1" />
                                              {termination.products && termination.products.length > 1 ? `${termination.products.length} Products` : 'Product Assigned'}
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
                                      {/* Show assigned products */}
                                      {((termination.products && termination.products.length > 0) || termination.productId) && (
                                        <div className="mt-2 pt-2 border-t">
                                          <Label className="text-xs font-semibold">Assigned Products:</Label>
                                          <div className="space-y-1 mt-1">
                                            {/* Handle new products array format */}
                                            {termination.products && termination.products.length > 0 ? (
                                              termination.products.map((productAssignment, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                  <Package className="h-4 w-4 text-blue-600" />
                                                  <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                      {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                    </div>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'termination', elementId: termination.id }, productAssignment.productId)}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              ))
                                            ) : termination.productId ? (
                                              /* Handle legacy single productId format */
                                              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                <Package className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium">
                                                    {products.find(p => p.id === termination.productId)?.name || termination.productId}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                    {products.find(p => p.id === termination.productId)?.code} × {termination.quantity || 1}
                                                  </div>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'termination', elementId: termination.id }, termination.productId)}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Show assigned services */}
                                      {termination.services && termination.services.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                          <Label className="text-xs font-semibold">Associated Services:</Label>
                                          <div className="space-y-1 mt-1">
                                            {termination.services.map((svc) => (
                                              <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                                <Wrench className="h-3 w-3 text-green-600" />
                                                <div className="flex-1">
                                                  <div className="text-xs font-medium">
                                                    {services.find(s => s.id === svc.serviceId)?.name || svc.serviceId}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                    Qty: {svc.quantity}
                                                  </div>
                                                                <Button
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                  onClick={() => handleDeleteService(building.id, { location: 'central', type: 'termination', elementId: termination.id }, svc.serviceId)}
                                                                >
                                                                  <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  onClick={() => handleDeleteService(building.id, { location: 'central', type: 'termination', elementId: termination.id }, svc.serviceId)}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                      ))}
                    </div>
                  </div>
                                      )}
                                    </div>
                      ))}
                  </div>
                              )}

                              {/* Switches */}
                              {building.centralRack.switches && building.centralRack.switches.length > 0 && (
                                <Collapsible className="mt-4">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4" />
                                      <Label className="text-xs font-semibold cursor-pointer">Switches ({building.centralRack.switches.length})</Label>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 space-y-1">
                                    {building.centralRack.switches.map((sw) => (
                                      <div key={sw.id} className="p-3 bg-white dark:bg-slate-300 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Network className="h-4 w-4" />
                                            <span className="text-sm">{sw.brand} {sw.model}</span>
                                            {isNewElement(sw) ? (
                                              <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs"
                                              onClick={() => openProductDialog({
                                                type: 'switch',
                                                buildingId: building.id,
                                                elementId: sw.id,
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
                                                type: 'switch',
                                                buildingId: building.id,
                                                elementId: sw.id,
                                              })}
                                            >
                                              <Wrench className="h-3 w-3 mr-1" />
                                              Add Service
                                            </Button>
                                          </div>
                                        </div>
                                        {/* Show assigned products */}
                                        {((sw.products && sw.products.length > 0) || sw.productId) && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Assigned Products:</Label>
                                            <div className="space-y-1 mt-1">
                                              {sw.products && sw.products.length > 0 ? (
                                                sw.products.map((productAssignment, idx) => (
                                                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    <div className="flex-1">
                                                      <div className="text-sm font-medium">
                                                        {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                      </div>
                                                    </div>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                      onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'switch', elementId: sw.id }, productAssignment.productId)}
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                ))
                                              ) : sw.productId ? (
                                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                  <Package className="h-4 w-4 text-blue-600" />
                                                  <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                      {products.find(p => p.id === sw.productId)?.name || 'Product Not Found'}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        )}
                                        {/* Show assigned services */}
                                        {sw.services && sw.services.length > 0 && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Associated Services:</Label>
                                            <div className="space-y-1 mt-1">
                                              {sw.services.map((svc) => (
                                                <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                                  <Wrench className="h-3 w-3 text-green-600" />
                                                  <div className="flex-1">
                                                    <div className="text-xs font-medium">
                                                      {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      Qty: {svc.quantity}
                                                    </div>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                                  >
                                                                    <Trash2 className="h-3 w-3" />
                                                                  </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              {/* Routers */}
                              {building.centralRack.routers && building.centralRack.routers.length > 0 && (
                                <Collapsible className="mt-4">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4" />
                                      <Label className="text-xs font-semibold cursor-pointer">Routers ({building.centralRack.routers.length})</Label>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 space-y-1">
                                    {building.centralRack.routers.map((router) => (
                                      <div key={router.id} className="p-3 bg-white dark:bg-slate-300 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Wifi className="h-4 w-4" />
                                            <span className="text-sm">{router.brand} {router.model}</span>
                                            {isNewElement(router) ? (
                                              <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            {isNewElement(router) && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-destructive"
                                                onClick={() => deleteNewElement(building.id, undefined, undefined, undefined, 'router', router.id)}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs"
                                              onClick={() => openProductDialog({
                                                type: 'router',
                                                buildingId: building.id,
                                                elementId: router.id,
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
                                                type: 'router',
                                                buildingId: building.id,
                                                elementId: router.id,
                                              })}
                                            >
                                              <Wrench className="h-3 w-3 mr-1" />
                                              Add Service
                                            </Button>
                                          </div>
                                        </div>
                                        {/* Show assigned products */}
                                        {((router.products && router.products.length > 0) || router.productId) && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Assigned Products:</Label>
                                            <div className="space-y-1 mt-1">
                                              {router.products && router.products.length > 0 ? (
                                                router.products.map((productAssignment, idx) => (
                                                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    <div className="flex-1">
                                                      <div className="text-sm font-medium">
                                                        {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                      </div>
                                                    </div>
                                                                    <Button
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                      onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'unknown', elementId: element.id }, productAssignment.productId)}
                                                                    >
                                                                      <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                  </div>
                                                ))
                                              ) : router.productId ? (
                                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                  <Package className="h-4 w-4 text-blue-600" />
                                                  <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                      {products.find(p => p.id === router.productId)?.name || 'Product Not Found'}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        )}
                                        {/* Show assigned services */}
                                        {router.services && router.services.length > 0 && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Associated Services:</Label>
                                            <div className="space-y-1 mt-1">
                                              {router.services.map((svc) => (
                                                <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                                  <Wrench className="h-3 w-3 text-green-600" />
                                                  <div className="flex-1">
                                                    <div className="text-xs font-medium">
                                                      {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      Qty: {svc.quantity}
                                                    </div>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                                  >
                                                                    <Trash2 className="h-3 w-3" />
                                                                  </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              {/* Servers */}
                              {building.centralRack.servers && building.centralRack.servers.length > 0 && (
                                <Collapsible className="mt-4">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4" />
                                      <Label className="text-xs font-semibold cursor-pointer">Servers ({building.centralRack.servers.length})</Label>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 space-y-1">
                                    {building.centralRack.servers.map((server) => (
                                      <div key={server.id} className="p-3 bg-white dark:bg-slate-300 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Server className="h-4 w-4" />
                                            <span className="text-sm">{server.brand} {server.model}</span>
                                            {isNewElement(server) ? (
                                              <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            {isNewElement(server) && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-destructive"
                                                onClick={() => deleteNewElement(building.id, undefined, undefined, undefined, 'server', server.id)}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs"
                                              onClick={() => openProductDialog({
                                                type: 'server',
                                                buildingId: building.id,
                                                elementId: server.id,
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
                                                type: 'server',
                                                buildingId: building.id,
                                                elementId: server.id,
                                              })}
                                            >
                                              <Wrench className="h-3 w-3 mr-1" />
                                              Add Service
                                            </Button>
                                          </div>
                                        </div>
                                        {/* Show assigned products */}
                                        {((server.products && server.products.length > 0) || server.productId) && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Assigned Products:</Label>
                                            <div className="space-y-1 mt-1">
                                              {server.products && server.products.length > 0 ? (
                                                server.products.map((productAssignment, idx) => (
                                                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    <div className="flex-1">
                                                      <div className="text-sm font-medium">
                                                        {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                      </div>
                                                    </div>
                                                                    <Button
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                      onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'unknown', elementId: element.id }, productAssignment.productId)}
                                                                    >
                                                                      <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                  </div>
                                                ))
                                              ) : server.productId ? (
                                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                  <Package className="h-4 w-4 text-blue-600" />
                                                  <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                      {products.find(p => p.id === server.productId)?.name || 'Product Not Found'}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        )}
                                        {/* Show assigned services */}
                                        {server.services && server.services.length > 0 && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Associated Services:</Label>
                                            <div className="space-y-1 mt-1">
                                              {server.services.map((svc) => (
                                                <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                                  <Wrench className="h-3 w-3 text-green-600" />
                                                  <div className="flex-1">
                                                    <div className="text-xs font-medium">
                                                      {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      Qty: {svc.quantity}
                                                    </div>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                                  >
                                                                    <Trash2 className="h-3 w-3" />
                                                                  </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              {/* VoIP PBX */}
                              {building.centralRack.voipPbx && building.centralRack.voipPbx.length > 0 && (
                                <Collapsible className="mt-4">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4" />
                                      <Label className="text-xs font-semibold cursor-pointer">VoIP PBX ({building.centralRack.voipPbx.length})</Label>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 space-y-1">
                                    {building.centralRack.voipPbx.map((pbx) => (
                                      <div key={pbx.id} className="p-3 bg-white dark:bg-slate-300 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span className="text-sm">{pbx.brand} {pbx.model}</span>
                                            {pbx.extensions && <span className="text-xs text-muted-foreground">({pbx.extensions} ext)</span>}
                                            {pbx.isFutureProposal ? (
                                              <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            {pbx.isFutureProposal && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-destructive"
                                                onClick={() => {
                                                  const updatedBuildings = localBuildings.map(b => {
                                                    if (b.id !== building.id || !b.centralRack) return b;
                                                    return {
                                                      ...b,
                                                      centralRack: {
                                                        ...b.centralRack,
                                                        voipPbx: b.centralRack.voipPbx?.filter(p => p.id !== pbx.id) || []
                                                      }
                                                    };
                                                  });
                                                  setLocalBuildings(updatedBuildings);
                                                  onUpdate(updatedBuildings);
                                                  if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs"
                                              onClick={() => openProductDialog({
                                                type: 'voipPbx',
                                                buildingId: building.id,
                                                elementId: pbx.id,
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
                                                type: 'voipPbx',
                                                buildingId: building.id,
                                                elementId: pbx.id,
                                              })}
                                            >
                                              <Wrench className="h-3 w-3 mr-1" />
                                              Add Service
                                            </Button>
                                          </div>
                                        </div>
                                        {/* Show assigned products */}
                                        {((pbx.products && pbx.products.length > 0) || pbx.productId) && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Assigned Products:</Label>
                                            <div className="space-y-1 mt-1">
                                              {pbx.products && pbx.products.length > 0 ? (
                                                pbx.products.map((productAssignment, idx) => (
                                                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    <div className="flex-1">
                                                      <div className="text-sm font-medium">
                                                        {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                      </div>
                                                    </div>
                                                                    <Button
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                      onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'unknown', elementId: element.id }, productAssignment.productId)}
                                                                    >
                                                                      <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                  </div>
                                                ))
                                              ) : pbx.productId ? (
                                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                  <Package className="h-4 w-4 text-blue-600" />
                                                  <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                      {products.find(p => p.id === pbx.productId)?.name || 'Product Not Found'}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        )}
                                        {pbx.services && pbx.services.length > 0 && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Associated Services:</Label>
                                            <div className="space-y-1 mt-1">
                                              {pbx.services.map((svc) => (
                                                <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                                  <Wrench className="h-3 w-3 text-green-600" />
                                                  <div className="flex-1">
                                                    <div className="text-xs font-medium">
                                                      {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Qty: {svc.quantity}</div>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                                  >
                                                                    <Trash2 className="h-3 w-3" />
                                                                  </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              {/* Headend */}
                              {building.centralRack.headend && building.centralRack.headend.length > 0 && (
                                <Collapsible className="mt-4">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4" />
                                      <Label className="text-xs font-semibold cursor-pointer">Headend ({building.centralRack.headend.length})</Label>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 space-y-1">
                                    {building.centralRack.headend.map((headend) => (
                                      <div key={headend.id} className="p-3 bg-white dark:bg-slate-300 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Tv className="h-4 w-4" />
                                            <span className="text-sm">{headend.brand} {headend.model}</span>
                                            {headend.isFutureProposal ? (
                                              <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            {headend.isFutureProposal && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-destructive"
                                                onClick={() => {
                                                  const updatedBuildings = localBuildings.map(b => {
                                                    if (b.id !== building.id || !b.centralRack) return b;
                                                    return {
                                                      ...b,
                                                      centralRack: {
                                                        ...b.centralRack,
                                                        headend: b.centralRack.headend?.filter(h => h.id !== headend.id) || []
                                                      }
                                                    };
                                                  });
                                                  setLocalBuildings(updatedBuildings);
                                                  onUpdate(updatedBuildings);
                                                  if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs"
                                              onClick={() => openProductDialog({
                                                type: 'headend',
                                                buildingId: building.id,
                                                elementId: headend.id,
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
                                                type: 'headend',
                                                buildingId: building.id,
                                                elementId: headend.id,
                                              })}
                                            >
                                              <Wrench className="h-3 w-3 mr-1" />
                                              Add Service
                                            </Button>
                                          </div>
                                        </div>
                                        {/* Show assigned products */}
                                        {((headend.products && headend.products.length > 0) || headend.productId) && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Assigned Products:</Label>
                                            <div className="space-y-1 mt-1">
                                              {headend.products && headend.products.length > 0 ? (
                                                headend.products.map((productAssignment, idx) => (
                                                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    <div className="flex-1">
                                                      <div className="text-sm font-medium">
                                                        {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                      </div>
                                                    </div>
                                                                    <Button
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                      onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'unknown', elementId: element.id }, productAssignment.productId)}
                                                                    >
                                                                      <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                  </div>
                                                ))
                                              ) : headend.productId ? (
                                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                  <Package className="h-4 w-4 text-blue-600" />
                                                  <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                      {products.find(p => p.id === headend.productId)?.name || 'Product Not Found'}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        )}
                                        {headend.services && headend.services.length > 0 && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Associated Services:</Label>
                                            <div className="space-y-1 mt-1">
                                              {headend.services.map((svc) => (
                                                <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                                  <Wrench className="h-3 w-3 text-green-600" />
                                                  <div className="flex-1">
                                                    <div className="text-xs font-medium">
                                                      {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Qty: {svc.quantity}</div>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                                  >
                                                                    <Trash2 className="h-3 w-3" />
                                                                  </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              {/* NVR */}
                              {building.centralRack.nvr && building.centralRack.nvr.length > 0 && (
                                <Collapsible className="mt-4">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4" />
                                      <Label className="text-xs font-semibold cursor-pointer">NVR ({building.centralRack.nvr.length})</Label>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 space-y-1">
                                    {building.centralRack.nvr.map((nvr) => (
                                      <div key={nvr.id} className="p-3 bg-white dark:bg-slate-300 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Camera className="h-4 w-4" />
                                            <span className="text-sm">{nvr.brand} {nvr.model}</span>
                                            {nvr.channels && <span className="text-xs text-muted-foreground">({nvr.channels} ch)</span>}
                                            {nvr.storageCapacity && <span className="text-xs text-muted-foreground">{nvr.storageCapacity}</span>}
                                            {nvr.isFutureProposal ? (
                                              <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            {nvr.isFutureProposal && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-2 text-destructive"
                                                onClick={() => {
                                                  const updatedBuildings = localBuildings.map(b => {
                                                    if (b.id !== building.id || !b.centralRack) return b;
                                                    return {
                                                      ...b,
                                                      centralRack: {
                                                        ...b.centralRack,
                                                        nvr: b.centralRack.nvr?.filter(n => n.id !== nvr.id) || []
                                                      }
                                                    };
                                                  });
                                                  setLocalBuildings(updatedBuildings);
                                                  onUpdate(updatedBuildings);
                                                  if (siteSurveyId) autoSaveInfrastructure(siteSurveyId, updatedBuildings);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs"
                                              onClick={() => openProductDialog({
                                                type: 'nvr',
                                                buildingId: building.id,
                                                elementId: nvr.id,
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
                                                type: 'nvr',
                                                buildingId: building.id,
                                                elementId: nvr.id,
                                              })}
                                            >
                                              <Wrench className="h-3 w-3 mr-1" />
                                              Add Service
                                            </Button>
                                          </div>
                                        </div>
                                        {/* Show assigned products */}
                                        {((nvr.products && nvr.products.length > 0) || nvr.productId) && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Assigned Products:</Label>
                                            <div className="space-y-1 mt-1">
                                              {nvr.products && nvr.products.length > 0 ? (
                                                nvr.products.map((productAssignment, idx) => (
                                                  <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                    <Package className="h-4 w-4 text-blue-600" />
                                                    <div className="flex-1">
                                                      <div className="text-sm font-medium">
                                                        {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                      </div>
                                                    </div>
                                                                    <Button
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                      onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'unknown', elementId: element.id }, productAssignment.productId)}
                                                                    >
                                                                      <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                  </div>
                                                ))
                                              ) : nvr.productId ? (
                                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                  <Package className="h-4 w-4 text-blue-600" />
                                                  <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                      {products.find(p => p.id === nvr.productId)?.name || 'Product Not Found'}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        )}
                                        {nvr.services && nvr.services.length > 0 && (
                                          <div className="mt-2 pt-2 border-t">
                                            <Label className="text-xs font-semibold">Associated Services:</Label>
                                            <div className="space-y-1 mt-1">
                                              {nvr.services.map((svc) => (
                                                <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                                  <Wrench className="h-3 w-3 text-green-600" />
                                                  <div className="flex-1">
                                                    <div className="text-xs font-medium">
                                                      {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Qty: {svc.quantity}</div>
                                                                  <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                                  >
                                                                    <Trash2 className="h-3 w-3" />
                                                                  </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              {/* PBX System */}
                              {(building.centralRack as any).pbx && (
                                <div className="mt-4">
                                  <Label className="text-xs font-semibold mb-2 block">PBX System</Label>
                                  <div className="p-3 bg-white dark:bg-slate-300 rounded border">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span className="text-sm">{(building.centralRack as any).pbx.brand} {(building.centralRack as any).pbx.model}</span>
                                        <Badge variant="secondary" className="text-xs">{(building.centralRack as any).pbx.type}</Badge>
                                        {isNewElement((building.centralRack as any).pbx) ? (
                                          <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => openProductDialog({
                                            type: 'pbx',
                                            buildingId: building.id,
                                            elementId: (building.centralRack as any).pbx.id,
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
                                            type: 'pbx',
                                            buildingId: building.id,
                                            elementId: (building.centralRack as any).pbx.id,
                                          })}
                                        >
                                          <Wrench className="h-3 w-3 mr-1" />
                                          Add Service
                                        </Button>
                                      </div>
                                    </div>
                                    {/* Show assigned products */}
                                    {(((building.centralRack as any).pbx.products && (building.centralRack as any).pbx.products.length > 0) || (building.centralRack as any).pbx.productId) && (
                                      <div className="mt-2 pt-2 border-t">
                                        <Label className="text-xs font-semibold">Assigned Products:</Label>
                                        <div className="space-y-1 mt-1">
                                          {(building.centralRack as any).pbx.products && (building.centralRack as any).pbx.products.length > 0 ? (
                                            (building.centralRack as any).pbx.products.map((productAssignment: any, idx: number) => (
                                              <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                <Package className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium">
                                                    {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                    {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                  </div>
                                                </div>
                                                                <Button
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                  onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'unknown', elementId: element.id }, productAssignment.productId)}
                                                                >
                                                                  <Trash2 className="h-3 w-3" />
                                                                </Button>
                                              </div>
                                            ))
                                          ) : (building.centralRack as any).pbx.productId ? (
                                            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                              <Package className="h-4 w-4 text-blue-600" />
                                              <div className="flex-1">
                                                <div className="text-sm font-medium">
                                                  {products.find(p => p.id === (building.centralRack as any).pbx.productId)?.name || 'Product Not Found'}
                                                </div>
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    )}
                                    {/* Show assigned services */}
                                    {(building.centralRack as any).pbx.services && (building.centralRack as any).pbx.services.length > 0 && (
                                      <div className="mt-2 pt-2 border-t">
                                        <Label className="text-xs font-semibold">Associated Services:</Label>
                                        <div className="space-y-1 mt-1">
                                          {(building.centralRack as any).pbx.services.map((svc: any) => (
                                            <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                              <Wrench className="h-3 w-3 text-green-600" />
                                              <div className="flex-1">
                                                <div className="text-xs font-medium">
                                                  {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                  Qty: {svc.quantity}
                                                </div>
                                                              <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                              >
                                                                <Trash2 className="h-3 w-3" />
                                                              </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* ATA */}
                              {(building.centralRack as any).ata && (
                                <div className="mt-4">
                                  <Label className="text-xs font-semibold mb-2 block">ATA (Analog Telephone Adapter)</Label>
                                  <div className="p-3 bg-white dark:bg-slate-300 rounded border">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span className="text-sm">{(building.centralRack as any).ata.brand} {(building.centralRack as any).ata.model}</span>
                                        {isNewElement((building.centralRack as any).ata) ? (
                                          <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => openProductDialog({
                                            type: 'ata',
                                            buildingId: building.id,
                                            elementId: (building.centralRack as any).ata.id,
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
                                            type: 'ata',
                                            buildingId: building.id,
                                            elementId: (building.centralRack as any).ata.id,
                                          })}
                                        >
                                          <Wrench className="h-3 w-3 mr-1" />
                                          Add Service
                                        </Button>
                                      </div>
                                    </div>
                                    {/* Show assigned products */}
                                    {(((building.centralRack as any).ata.products && (building.centralRack as any).ata.products.length > 0) || (building.centralRack as any).ata.productId) && (
                                      <div className="mt-2 pt-2 border-t">
                                        <Label className="text-xs font-semibold">Assigned Products:</Label>
                                        <div className="space-y-1 mt-1">
                                          {(building.centralRack as any).ata.products && (building.centralRack as any).ata.products.length > 0 ? (
                                            (building.centralRack as any).ata.products.map((productAssignment: any, idx: number) => (
                                              <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                <Package className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium">
                                                    {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                    {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                  </div>
                                                </div>
                                                                <Button
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                  onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'unknown', elementId: element.id }, productAssignment.productId)}
                                                                >
                                                                  <Trash2 className="h-3 w-3" />
                                                                </Button>
                                              </div>
                                            ))
                                          ) : (building.centralRack as any).ata.productId ? (
                                            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                              <Package className="h-4 w-4 text-blue-600" />
                                              <div className="flex-1">
                                                <div className="text-sm font-medium">
                                                  {products.find(p => p.id === (building.centralRack as any).ata.productId)?.name || 'Product Not Found'}
                                                </div>
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    )}
                                    {/* Show assigned services */}
                                    {(building.centralRack as any).ata.services && (building.centralRack as any).ata.services.length > 0 && (
                                      <div className="mt-2 pt-2 border-t">
                                        <Label className="text-xs font-semibold">Associated Services:</Label>
                                        <div className="space-y-1 mt-1">
                                          {(building.centralRack as any).ata.services.map((svc: any) => (
                                            <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                              <Wrench className="h-3 w-3 text-green-600" />
                                              <div className="flex-1">
                                                <div className="text-xs font-medium">
                                                  {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                  Qty: {svc.quantity}
                                                </div>
                                                              <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                              >
                                                                <Trash2 className="h-3 w-3" />
                                                              </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* NVR */}
                              {(building.centralRack as any).nvr && (
                                <div className="mt-4">
                                  <Label className="text-xs font-semibold mb-2 block">NVR (Network Video Recorder)</Label>
                                  <div className="p-3 bg-white dark:bg-slate-300 rounded border">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4" />
                                        <span className="text-sm">Channels: {(building.centralRack as any).nvr.channels}</span>
                                        {isNewElement((building.centralRack as any).nvr) ? (
                                          <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => openProductDialog({
                                            type: 'nvr',
                                            buildingId: building.id,
                                            elementId: (building.centralRack as any).nvr.id,
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
                                            type: 'nvr',
                                            buildingId: building.id,
                                            elementId: (building.centralRack as any).nvr.id,
                                          })}
                                        >
                                          <Wrench className="h-3 w-3 mr-1" />
                                          Add Service
                                        </Button>
                                      </div>
                                    </div>
                                    {/* Show assigned products */}
                                    {(((building.centralRack as any).nvr.products && (building.centralRack as any).nvr.products.length > 0) || (building.centralRack as any).nvr.productId) && (
                                      <div className="mt-2 pt-2 border-t">
                                        <Label className="text-xs font-semibold">Assigned Products:</Label>
                                        <div className="space-y-1 mt-1">
                                          {(building.centralRack as any).nvr.products && (building.centralRack as any).nvr.products.length > 0 ? (
                                            (building.centralRack as any).nvr.products.map((productAssignment: any, idx: number) => (
                                              <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                                <Package className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium">
                                                    {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                    {products.find(p => p.id === productAssignment.productId)?.code} × {productAssignment.quantity}
                                                  </div>
                                                </div>
                                                                <Button
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                  onClick={() => handleDeleteProduct(building.id, { location: 'central', type: 'unknown', elementId: element.id }, productAssignment.productId)}
                                                                >
                                                                  <Trash2 className="h-3 w-3" />
                                                                </Button>
                                              </div>
                                            ))
                                          ) : (building.centralRack as any).nvr.productId ? (
                                            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded">
                                              <Package className="h-4 w-4 text-blue-600" />
                                              <div className="flex-1">
                                                <div className="text-sm font-medium">
                                                  {products.find(p => p.id === (building.centralRack as any).nvr.productId)?.name || 'Product Not Found'}
                                                </div>
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    )}
                                    {/* Show assigned services */}
                                    {(building.centralRack as any).nvr.services && (building.centralRack as any).nvr.services.length > 0 && (
                                      <div className="mt-2 pt-2 border-t">
                                        <Label className="text-xs font-semibold">Associated Services:</Label>
                                        <div className="space-y-1 mt-1">
                                          {(building.centralRack as any).nvr.services.map((svc: any) => (
                                            <div key={svc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-800/40 rounded">
                                              <Wrench className="h-3 w-3 text-green-600" />
                                              <div className="flex-1">
                                                <div className="text-xs font-medium">
                                                  {services.find(s => s.id === svc.serviceId)?.name || 'Service'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                  Qty: {svc.quantity}
                                                </div>
                                                              <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDeleteService(building.id, { location: 'central', type: 'unknown', elementId: element.id }, svc.serviceId)}
                                                              >
                                                                <Trash2 className="h-3 w-3" />
                                                              </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                )}

                {/* Floors */}
                        {building.floors.map((floor) => (
                          <Card key={floor.id} className="bg-white border-2 border-green-300">
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
                              <CardContent className="space-y-3 bg-white">
                              {/* Floor Racks */}
                                {floor.racks && floor.racks.map((rack) => (
                                  <div key={rack.id} className={`p-3 rounded border ${
                                    rack.isFutureProposal 
                                      ? 'bg-blue-50 dark:bg-blue-800/50 border-blue-300 border-2' 
                                      : 'bg-white dark:bg-slate-300'
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
                                          <DropdownMenuItem onClick={() => addNewTerminationToRack(building.id, floor.id, rack.id)}>
                                            <Cable className="h-4 w-4 mr-2" />Cable Termination
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => addNewSwitchToRack(building.id, floor.id, rack.id)}>
                                            <Network className="h-4 w-4 mr-2" />Switch
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => addNewRouterToRack(building.id, floor.id, rack.id)}>
                                            <Wifi className="h-4 w-4 mr-2" />Router
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => addNewServerToRack(building.id, floor.id, rack.id)}>
                                            <Server className="h-4 w-4 mr-2" />Server
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => addNewVoipPbxToRack(building.id, floor.id, rack.id)}>
                                            <Phone className="h-4 w-4 mr-2" />VoIP PBX
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => addNewHeadendToRack(building.id, floor.id, rack.id)}>
                                            <Tv className="h-4 w-4 mr-2" />Headend
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => addNewNvrToRack(building.id, floor.id, rack.id)}>
                                            <Camera className="h-4 w-4 mr-2" />NVR
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => addNewAtaToRack(building.id, floor.id, rack.id)}>
                                            <Box className="h-4 w-4 mr-2" />ATA
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => addNewConnectionToRack(building.id, floor.id, rack.id)}>
                                            <Cable className="h-4 w-4 mr-2" />Connection
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    
                                    {/* Rack Details */}
                                    {expandedRacks.has(rack.id) && (
                                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-purple-200 bg-white p-3 rounded-md">
                                        {/* Terminations */}
                                        {rack.cableTerminations && rack.cableTerminations.length > 0 && (
                                <div>
                                            <Label className="text-xs font-semibold mb-2 block">Cable Terminations</Label>
                                            <div className="space-y-1">
                                              {rack.cableTerminations.map((termination) => {
                                                const product = products.find(p => p.id === termination.productId);
                                                return (
                                                <div key={termination.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 flex-1">
                                                      <Cable className="h-3 w-3" />
                                                      {isNewElement(termination) ? (
                                                        <div className="flex-1">
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <select
                                                              value={termination.cableType}
                                                              onChange={(e) => updateNewElement(building.id, floor.id, rack.id, undefined, 'termination', termination.id, { cableType: e.target.value })}
                                                              className="h-6 text-xs border rounded px-1"
                                                            >
                                                              <option value="CAT6">CAT6</option>
                                                              <option value="CAT6A">CAT6A</option>
                                                              <option value="CAT5e">CAT5e</option>
                                                              <option value="FIBER_SM">Fiber SM</option>
                                                              <option value="FIBER_MM">Fiber MM</option>
                                                            </select>
                                                            <span className="text-xs">×</span>
                                                            <Input
                                                              type="number"
                                                              value={termination.quantity}
                                                              onChange={(e) => updateNewElement(building.id, floor.id, rack.id, undefined, 'termination', termination.id, { quantity: parseInt(e.target.value) || 0 })}
                                                              className="h-6 w-16 text-xs"
                                                              min="0"
                                                            />
                                                            <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                          </div>
                                                          {(termination.cableType === 'FIBER_SM' || termination.cableType === 'FIBER_MM') && (
                                                            <div className="grid grid-cols-2 gap-2 mb-2 p-2 bg-blue-50 dark:bg-blue-800/40 rounded border border-blue-200">
                                                              <div>
                                                                <Label className="text-xs">Total Fibers</Label>
                                                                <Input
                                                                  type="number"
                                                                  value={termination.totalFibers || ''}
                                                                  onChange={(e) => updateNewElement(building.id, floor.id, rack.id, undefined, 'termination', termination.id, { totalFibers: parseInt(e.target.value) || undefined })}
                                                                  placeholder="e.g., 12, 24, 48"
                                                                  className="h-6 text-xs"
                                                                  min="1"
                                                                />
                                                              </div>
                                                              <div>
                                                                <Label className="text-xs">Terminated</Label>
                                                                <Input
                                                                  type="number"
                                                                  value={termination.terminatedFibers || ''}
                                                                  onChange={(e) => updateNewElement(building.id, floor.id, rack.id, undefined, 'termination', termination.id, { terminatedFibers: parseInt(e.target.value) || undefined })}
                                                                  placeholder="e.g., 8"
                                                                  className="h-6 text-xs"
                                                                  min="0"
                                                                />
                                                              </div>
                                                            </div>
                                                          )}
                                                          <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                              <Label className="text-xs">From</Label>
                                                              <Input
                                                                value={termination.fromLocation || ''}
                                                                onChange={(e) => updateNewElement(building.id, floor.id, rack.id, undefined, 'termination', termination.id, { fromLocation: e.target.value })}
                                                                placeholder="Source location"
                                                                className="h-6 text-xs"
                                                              />
                                                            </div>
                                                            <div>
                                                              <Label className="text-xs">To</Label>
                                                              <Input
                                                                value={termination.toLocation || ''}
                                                                onChange={(e) => updateNewElement(building.id, floor.id, rack.id, undefined, 'termination', termination.id, { toLocation: e.target.value })}
                                                                placeholder="Destination"
                                                                className="h-6 text-xs"
                                                              />
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ) : (
                                                        <>
                                                          <span className="text-xs">{termination.cableType} × {termination.quantity}</span>
                                                          <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                        </>
                                                      )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      {isNewElement(termination) && (
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive"
                                                          onClick={() => deleteNewElement(building.id, floor.id, rack.id, undefined, 'termination', termination.id)}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
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
                                                  
                                                  {/* Show assigned products */}
                                                  {((termination.products && termination.products.length > 0) || termination.productId) && (
                                                    <div className="pl-4 mb-1 space-y-1">
                                                      {termination.products && termination.products.length > 0 ? (
                                                        termination.products.map((productAssignment: any, idx: number) => (
                                                          <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                            <Package className="h-3 w-3 text-blue-600" />
                                                            <span className="font-medium">
                                                              {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                            </span>
                                                            <span className="text-muted-foreground">× {productAssignment.quantity}</span>
                                                          </div>
                                                        ))
                                                      ) : termination.productId ? (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                          <Package className="h-3 w-3 text-blue-600" />
                                                          <span className="font-medium">{product?.name || 'Product Not Found'}</span>
                                                          <span className="text-muted-foreground">× {termination.quantity}</span>
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  )}
                                                  {/* Show assigned services */}
                                                  {termination.services && termination.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {termination.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                              })}
                                  </div>
                                </div>
                              )}

                                        {/* Switches */}
                                        {rack.switches && rack.switches.length > 0 && (
                                          <Collapsible>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                        <div className="flex items-center gap-2">
                                                <ChevronRight className="h-4 w-4" />
                                                <Label className="text-xs font-semibold cursor-pointer">Switches ({rack.switches.length})</Label>
                                        </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-1 bg-white p-2 rounded-md">
                                              {rack.switches.map((sw) => (
                                                <div key={sw.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
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
                                                      {isNewElement(sw) && (
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive"
                                                          onClick={() => deleteNewElement(building.id, floor.id, rack.id, undefined, 'switch', sw.id)}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
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
                                                  {/* Show assigned products */}
                                                  {((sw.products && sw.products.length > 0) || sw.productId) && (
                                                    <div className="pl-4 mb-1 space-y-1">
                                                      {sw.products && sw.products.length > 0 ? (
                                                        sw.products.map((productAssignment: any, idx: number) => (
                                                          <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                            <Package className="h-3 w-3 text-blue-600" />
                                                            <span className="font-medium">
                                                              {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                            </span>
                                                            <span className="text-muted-foreground">× {productAssignment.quantity}</span>
                                                          </div>
                                                        ))
                                                      ) : sw.productId ? (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                          <Package className="h-3 w-3 text-blue-600" />
                                                          <span className="font-medium">{products.find(p => p.id === sw.productId)?.name || 'Product'}</span>
                                                          <span className="text-muted-foreground">× {sw.quantity}</span>
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  )}
                                                  {/* Show assigned services */}
                                                  {sw.services && sw.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {sw.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                                  )}
                                </div>
                                              ))}
                                            </CollapsibleContent>
                                          </Collapsible>
                              )}

                                        {/* Connections */}
                                        {rack.connections && rack.connections.length > 0 && (
                                <div>
                                            <Label className="text-xs font-semibold mb-2 block">Connections</Label>
                                            <div className="space-y-1">
                                              {rack.connections.map((conn) => (
                                                <div key={conn.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <Cable className="h-3 w-3" />
                                                      <span className="text-xs text-muted-foreground">{conn.fromDevice} → {conn.toDevice}</span>
                                                      {isNewElement(conn) ? (
                                                        <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openProductDialog({ type: 'connection', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: conn.id })}>
                                                        <Package className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openServiceDialog({ type: 'connection', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: conn.id })}>
                                                        <Wrench className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  {/* Show assigned product */}
                                                  {conn.productId && (
                                                    <div className="pl-4 mb-1">
                                                      <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                        <Package className="h-3 w-3 text-blue-600" />
                                                        <span className="font-medium">{products.find(p => p.id === conn.productId)?.name || 'Product'}</span>
                                                        <span className="text-muted-foreground">× {conn.quantity}</span>
                                                      </div>
                                                    </div>
                                                  )}
                                                  {/* Show assigned services */}
                                                  {conn.services && conn.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {conn.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                    </div>
                  </div>
                )}

                                        {/* Servers */}
                                        {rack.servers && rack.servers.length > 0 && (
                                          <Collapsible>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                              <div className="flex items-center gap-2">
                                                <ChevronRight className="h-4 w-4" />
                                                <Label className="text-xs font-semibold cursor-pointer">Servers ({rack.servers.length})</Label>
                                              </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-1 bg-white p-2 rounded-md">
                                              {rack.servers.map((server) => (
                                                <div key={server.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <Server className="h-3 w-3" />
                                                      <span className="text-xs">{server.brand} {server.model}</span>
                                                      {isNewElement(server) ? (
                                                        <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                      )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      {isNewElement(server) && (
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive"
                                                          onClick={() => deleteNewElement(building.id, floor.id, rack.id, undefined, 'server', server.id)}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openProductDialog({ type: 'server', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: server.id })}>
                                                        <Package className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openServiceDialog({ type: 'server', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: server.id })}>
                                                        <Wrench className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  {((server.products && server.products.length > 0) || server.productId) && (
                                                    <div className="pl-4 mb-1 space-y-1">
                                                      {server.products && server.products.length > 0 ? (
                                                        server.products.map((productAssignment: any, idx: number) => (
                                                          <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                            <Package className="h-3 w-3 text-blue-600" />
                                                            <span className="font-medium">
                                                              {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                            </span>
                                                            <span className="text-muted-foreground">× {productAssignment.quantity}</span>
                                                          </div>
                                                        ))
                                                      ) : server.productId ? (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                          <Package className="h-3 w-3 text-blue-600" />
                                                          <span className="font-medium">{products.find(p => p.id === server.productId)?.name || 'Product'}</span>
                                                          <span className="text-muted-foreground">× {server.quantity}</span>
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  )}
                                                  {server.services && server.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {server.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )}

                                        {/* VoIP PBX */}
                                        {rack.voipPbx && rack.voipPbx.length > 0 && (
                                          <Collapsible>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                              <div className="flex items-center gap-2">
                                                <ChevronRight className="h-4 w-4" />
                                                <Label className="text-xs font-semibold cursor-pointer">VoIP PBX ({rack.voipPbx.length})</Label>
                                              </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-1 bg-white p-2 rounded-md">
                                              {rack.voipPbx.map((pbx) => (
                                                <div key={pbx.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <Phone className="h-3 w-3" />
                                                      <span className="text-xs">{pbx.brand} {pbx.model}</span>
                                                      {isNewElement(pbx) ? (
                                                        <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                      )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      {isNewElement(pbx) && (
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive"
                                                          onClick={() => deleteNewElement(building.id, floor.id, rack.id, undefined, 'voipPbx', pbx.id)}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openProductDialog({ type: 'voipPbx', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: pbx.id })}>
                                                        <Package className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openServiceDialog({ type: 'voipPbx', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: pbx.id })}>
                                                        <Wrench className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  {((pbx.products && pbx.products.length > 0) || pbx.productId) && (
                                                    <div className="pl-4 mb-1 space-y-1">
                                                      {pbx.products && pbx.products.length > 0 ? (
                                                        pbx.products.map((productAssignment: any, idx: number) => (
                                                          <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                            <Package className="h-3 w-3 text-blue-600" />
                                                            <span className="font-medium">
                                                              {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                            </span>
                                                            <span className="text-muted-foreground">× {productAssignment.quantity}</span>
                                                          </div>
                                                        ))
                                                      ) : pbx.productId ? (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                          <Package className="h-3 w-3 text-blue-600" />
                                                          <span className="font-medium">{products.find(p => p.id === pbx.productId)?.name || 'Product'}</span>
                                                          <span className="text-muted-foreground">× {pbx.quantity}</span>
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  )}
                                                  {pbx.services && pbx.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {pbx.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )}

                                        {/* Headend */}
                                        {rack.headend && rack.headend.length > 0 && (
                                          <Collapsible>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                              <div className="flex items-center gap-2">
                                                <ChevronRight className="h-4 w-4" />
                                                <Label className="text-xs font-semibold cursor-pointer">Headend ({rack.headend.length})</Label>
                                              </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-1 bg-white p-2 rounded-md">
                                              {rack.headend.map((he) => (
                                                <div key={he.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <Tv className="h-3 w-3" />
                                                      <span className="text-xs">{he.brand} {he.model}</span>
                                                      {isNewElement(he) ? (
                                                        <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                      )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      {isNewElement(he) && (
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive"
                                                          onClick={() => deleteNewElement(building.id, floor.id, rack.id, undefined, 'headend', he.id)}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openProductDialog({ type: 'headend', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: he.id })}>
                                                        <Package className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openServiceDialog({ type: 'headend', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: he.id })}>
                                                        <Wrench className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  {((he.products && he.products.length > 0) || he.productId) && (
                                                    <div className="pl-4 mb-1 space-y-1">
                                                      {he.products && he.products.length > 0 ? (
                                                        he.products.map((productAssignment: any, idx: number) => (
                                                          <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                            <Package className="h-3 w-3 text-blue-600" />
                                                            <span className="font-medium">
                                                              {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                            </span>
                                                            <span className="text-muted-foreground">× {productAssignment.quantity}</span>
                                                          </div>
                                                        ))
                                                      ) : he.productId ? (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                          <Package className="h-3 w-3 text-blue-600" />
                                                          <span className="font-medium">{products.find(p => p.id === he.productId)?.name || 'Product'}</span>
                                                          <span className="text-muted-foreground">× {he.quantity}</span>
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  )}
                                                  {he.services && he.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {he.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )}

                                        {/* NVR */}
                                        {rack.nvr && rack.nvr.length > 0 && (
                                          <Collapsible>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                              <div className="flex items-center gap-2">
                                                <ChevronRight className="h-4 w-4" />
                                                <Label className="text-xs font-semibold cursor-pointer">NVR ({rack.nvr.length})</Label>
                                              </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-1 bg-white p-2 rounded-md">
                                              {rack.nvr.map((nvr) => (
                                                <div key={nvr.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <Camera className="h-3 w-3" />
                                                      <span className="text-xs">{nvr.brand} {nvr.model}</span>
                                                      {isNewElement(nvr) ? (
                                                        <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                      )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      {isNewElement(nvr) && (
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive"
                                                          onClick={() => deleteNewElement(building.id, floor.id, rack.id, undefined, 'nvr', nvr.id)}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openProductDialog({ type: 'nvr', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: nvr.id })}>
                                                        <Package className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openServiceDialog({ type: 'nvr', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: nvr.id })}>
                                                        <Wrench className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  {((nvr.products && nvr.products.length > 0) || nvr.productId) && (
                                                    <div className="pl-4 mb-1 space-y-1">
                                                      {nvr.products && nvr.products.length > 0 ? (
                                                        nvr.products.map((productAssignment: any, idx: number) => (
                                                          <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                            <Package className="h-3 w-3 text-blue-600" />
                                                            <span className="font-medium">
                                                              {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                            </span>
                                                            <span className="text-muted-foreground">× {productAssignment.quantity}</span>
                                                          </div>
                                                        ))
                                                      ) : nvr.productId ? (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                          <Package className="h-3 w-3 text-blue-600" />
                                                          <span className="font-medium">{products.find(p => p.id === nvr.productId)?.name || 'Product'}</span>
                                                          <span className="text-muted-foreground">× {nvr.quantity}</span>
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  )}
                                                  {nvr.services && nvr.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {nvr.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )}

                                        {/* ATA */}
                                        {rack.ata && rack.ata.length > 0 && (
                                          <Collapsible>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded">
                                              <div className="flex items-center gap-2">
                                                <ChevronRight className="h-4 w-4" />
                                                <Label className="text-xs font-semibold cursor-pointer">ATA ({rack.ata.length})</Label>
                                              </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-1 bg-white p-2 rounded-md">
                                              {rack.ata.map((ata) => (
                                                <div key={ata.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <Box className="h-3 w-3" />
                                                      <span className="text-xs">{ata.brand} {ata.model}</span>
                                                      {isNewElement(ata) ? (
                                                        <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                      )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                      {isNewElement(ata) && (
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive"
                                                          onClick={() => deleteNewElement(building.id, floor.id, rack.id, undefined, 'ata', ata.id)}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openProductDialog({ type: 'ata', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: ata.id })}>
                                                        <Package className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openServiceDialog({ type: 'ata', buildingId: building.id, floorId: floor.id, rackId: rack.id, elementId: ata.id })}>
                                                        <Wrench className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  {((ata.products && ata.products.length > 0) || ata.productId) && (
                                                    <div className="pl-4 mb-1 space-y-1">
                                                      {ata.products && ata.products.length > 0 ? (
                                                        ata.products.map((productAssignment: any, idx: number) => (
                                                          <div key={idx} className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                            <Package className="h-3 w-3 text-blue-600" />
                                                            <span className="font-medium">
                                                              {products.find(p => p.id === productAssignment.productId)?.name || productAssignment.productId}
                                                            </span>
                                                            <span className="text-muted-foreground">× {productAssignment.quantity}</span>
                                                          </div>
                                                        ))
                                                      ) : ata.productId ? (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                          <Package className="h-3 w-3 text-blue-600" />
                                                          <span className="font-medium">{products.find(p => p.id === ata.productId)?.name || 'Product'}</span>
                                                          <span className="text-muted-foreground">× {ata.quantity}</span>
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  )}
                                                  {ata.services && ata.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {ata.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Rooms */}
                                {floor.rooms && floor.rooms.map((room) => (
                                  <div key={room.id} className="p-3 bg-white dark:bg-slate-300 rounded border">
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
                                          <DropdownMenuItem onClick={() => {
                                            setPendingRoomInfo({ buildingId: building.id, floorId: floor.id, roomId: room.id });
                                            setDeviceTypeDialogOpen(true);
                                          }}>
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
                                      <div className="mt-2 space-y-3 pl-4 border-l-2 border-amber-200 bg-white p-3 rounded-md">
                                        {/* Devices */}
                                        {room.devices && room.devices.length > 0 && (
                                          <div>
                                            <Label className="text-xs font-semibold mb-2 block">Devices</Label>
                                            <div className="space-y-1">
                                              {room.devices.map((device) => (
                                                <div key={device.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <Monitor className="h-3 w-3" />
                                                      <span className="text-xs">{device.type} × {device.quantity}</span>
                                                      {getTotalMultiplier(floor, room) > 1 && (
                                                        <Badge variant="outline" className="text-xs text-purple-600 font-semibold">
                                                          {getFloorMultiplier(floor) > 1 && `${getFloorMultiplier(floor)} floors`}
                                                          {getFloorMultiplier(floor) > 1 && getRoomMultiplier(room) > 1 && ' × '}
                                                          {getRoomMultiplier(room) > 1 && `${getRoomMultiplier(room)} rooms`}
                                                          = {device.quantity * getTotalMultiplier(floor, room)} total
                                          </Badge>
                                                      )}
                                                      {isNewElement(device) ? (
                                                        <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                      )}
                                        </div>
                                                    <div className="flex gap-1">
                                                      {isNewElement(device) && (
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive"
                                                          onClick={() => deleteNewElement(building.id, floor.id, undefined, room.id, 'device', device.id)}>
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
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
                                                  {/* Show assigned product */}
                                                  {device.productId && (
                                                    <div className="pl-4 mb-1">
                                                      <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                        <Package className="h-3 w-3 text-blue-600" />
                                                        <span className="font-medium">{products.find(p => p.id === device.productId)?.name || 'Product'}</span>
                                                        <span className="text-muted-foreground">× {device.quantity}</span>
                                                      </div>
                                                    </div>
                                                  )}
                                                  {/* Show assigned services */}
                                                  {device.services && device.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {device.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
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
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <Cable className="h-3 w-3" />
                                                    <span className="text-xs">{outlet.type} {outlet.label} × {outlet.quantity}</span>
                                                    {getTotalMultiplier(floor, room) > 1 && (
                                                      <Badge variant="outline" className="text-xs text-purple-600 font-semibold">
                                                        {getFloorMultiplier(floor) > 1 && `${getFloorMultiplier(floor)} floors`}
                                                        {getFloorMultiplier(floor) > 1 && getRoomMultiplier(room) > 1 && ' × '}
                                                        {getRoomMultiplier(room) > 1 && `${getRoomMultiplier(room)} rooms`}
                                                        = {outlet.quantity * getTotalMultiplier(floor, room)} total
                                                      </Badge>
                                                    )}
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
                                                <div key={conn.id} className="p-2 bg-muted/30 rounded">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <Cable className="h-3 w-3" />
                                                      <span className="text-xs text-muted-foreground">{conn.fromDevice} → {conn.toDevice}</span>
                                                      {isNewElement(conn) ? (
                                                        <Badge variant="default" className="text-xs bg-blue-600">⚡ NEW</Badge>
                                                      ) : (
                                                        <Badge variant="secondary" className="text-xs">📦 OLD</Badge>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openProductDialog({ type: 'connection', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: conn.id })}>
                                                        <Package className="h-3 w-3" />
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-6 px-2"
                                                        onClick={() => openServiceDialog({ type: 'connection', buildingId: building.id, floorId: floor.id, roomId: room.id, elementId: conn.id })}>
                                                        <Wrench className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                  {/* Show assigned product */}
                                                  {conn.productId && (
                                                    <div className="pl-4 mb-1">
                                                      <div className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-800/40 p-1 rounded">
                                                        <Package className="h-3 w-3 text-blue-600" />
                                                        <span className="font-medium">{products.find(p => p.id === conn.productId)?.name || 'Product'}</span>
                                                        <span className="text-muted-foreground">× {conn.quantity}</span>
                                                      </div>
                                                    </div>
                                                  )}
                                                  {/* Show assigned services */}
                                                  {conn.services && conn.services.length > 0 && (
                                                    <div className="pl-4 space-y-1">
                                                      {conn.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-800/40 p-1 rounded">
                                                          <Wrench className="h-3 w-3 text-green-600" />
                                                          <span>{services.find(s => s.id === svc.serviceId)?.name || 'Service'}</span>
                                                          <span className="text-muted-foreground">× {svc.quantity}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
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
            <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Search products by name or code..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                />
                {selectedProductId && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-800/50 rounded border border-blue-200 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{products.find(p => p.id === selectedProductId)?.code}</div>
                      <div className="text-xs text-muted-foreground">{products.find(p => p.id === selectedProductId)?.name}</div>
                  </div>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedProductId(''); setProductSearchTerm(''); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {!selectedProductId && (
                  <div className="max-h-60 overflow-y-auto border rounded-md bg-background">
                    {products
                      .filter(product => {
                        if (!productSearchTerm) return true;
                        const search = productSearchTerm.toLowerCase();
                        return product.name.toLowerCase().includes(search) || 
                               product.code.toLowerCase().includes(search);
                      })
                      .map((product) => (
                        <div
                          key={product.id}
                          className="p-2 cursor-pointer hover:bg-muted/50 border-b transition-colors"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setProductSearchTerm('');
                          }}
                        >
                          <div className="font-medium text-sm">{product.code}</div>
                          <div className="text-xs text-muted-foreground">{product.name}</div>
                        </div>
                      ))}
                    {products.filter(product => {
                      if (!productSearchTerm) return true;
                      const search = productSearchTerm.toLowerCase();
                      return product.name.toLowerCase().includes(search) || 
                             product.code.toLowerCase().includes(search);
                    }).length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Product Enhancement Icons */}
            {selectedProductId && (() => {
              const product = products.find(p => p.id === selectedProductId);
              if (!product) return null;
              
              const hasImages = product.images && product.images.length > 0;
              const hasSpecs = product.specifications && product.specifications.length > 0;
              const hasTranslations = product.translations && product.translations.length > 0;
              
              return (
                <div className="flex gap-2 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-xs font-semibold mb-2">Enhance Product Data:</p>
                    <div className="flex gap-2 flex-wrap">
                      {!hasImages && (
                  <Button
                          type="button"
                    size="sm"
                    variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedProduct(product);
                            setImagesDialogOpen(true);
                          }}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Add Images
                          <Badge variant="destructive" className="ml-2 text-xs">!</Badge>
                  </Button>
                      )}
                      {hasImages && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedProduct(product);
                            setImagesDialogOpen(true);
                          }}
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {product.images?.length || 0} Images
                        </Button>
                      )}
                      {!hasSpecs && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedProduct(product);
                            setSpecificationsDialogOpen(true);
                          }}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate Specs
                          <Badge variant="destructive" className="ml-2 text-xs">!</Badge>
                        </Button>
                      )}
                      {!hasTranslations && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedProduct(product);
                            setTranslationsDialogOpen(true);
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Generate Translations
                          <Badge variant="destructive" className="ml-2 text-xs">!</Badge>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
            
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
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Search services by name or code..."
                  value={serviceSearchTerm}
                  onChange={(e) => setServiceSearchTerm(e.target.value)}
                />
                {selectedServiceId && (
                  <div className="p-2 bg-green-50 dark:bg-green-800/50 rounded border border-green-200 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{services.find(s => s.id === selectedServiceId)?.code}</div>
                      <div className="text-xs text-muted-foreground">{services.find(s => s.id === selectedServiceId)?.name}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedServiceId(''); setServiceSearchTerm(''); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {!selectedServiceId && (
                  <div className="max-h-60 overflow-y-auto border rounded-md bg-background">
                    {services
                      .filter(service => {
                        if (!serviceSearchTerm) return true;
                        const search = serviceSearchTerm.toLowerCase();
                        return service.name.toLowerCase().includes(search) || 
                               service.code.toLowerCase().includes(search);
                      })
                      .map((service) => (
                        <div
                          key={service.id}
                          className="p-2 cursor-pointer hover:bg-muted/50 border-b transition-colors"
                          onClick={() => {
                            setSelectedServiceId(service.id);
                            setServiceSearchTerm('');
                          }}
                        >
                          <div className="font-medium text-sm">{service.code}</div>
                          <div className="text-xs text-muted-foreground">{service.name}</div>
                </div>
              ))}
                    {services.filter(service => {
                      if (!serviceSearchTerm) return true;
                      const search = serviceSearchTerm.toLowerCase();
                      return service.name.toLowerCase().includes(search) || 
                             service.code.toLowerCase().includes(search);
                    }).length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No services found
            </div>
                    )}
                  </div>
                )}
              </div>
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
            <div className="p-3 bg-blue-50 dark:bg-blue-800/50 rounded border border-blue-200">
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

      {/* Product Enhancement Dialogs */}
      {selectedProduct && (
        <>
          <ProductImagesDialog
            open={imagesDialogOpen}
            onOpenChange={setImagesDialogOpen}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
          />
          
          <ProductSpecificationsDialog
            open={specificationsDialogOpen}
            onOpenChange={setSpecificationsDialogOpen}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
          />
          
          <ProductTranslationsDialog
            open={translationsDialogOpen}
            onOpenChange={setTranslationsDialogOpen}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            onSuccess={() => {
              // Refresh products to get updated translations
              fetchProducts();
            }}
          />
        </>
      )}

      {/* Device Type Selection Dialog */}
      <Dialog open={deviceTypeDialogOpen} onOpenChange={setDeviceTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Device Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedDeviceType === 'PC' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedDeviceType('PC')}
              >
                <Monitor className="h-6 w-6" />
                <span>Computer / PC</span>
              </Button>
              <Button
                variant={selectedDeviceType === 'PHONE' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedDeviceType('PHONE')}
              >
                <Phone className="h-6 w-6" />
                <span>Phone</span>
              </Button>
              <Button
                variant={selectedDeviceType === 'VOIP_PHONE' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedDeviceType('VOIP_PHONE')}
              >
                <Phone className="h-6 w-6" />
                <span>VoIP Phone</span>
              </Button>
              <Button
                variant={selectedDeviceType === 'TV' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedDeviceType('TV')}
              >
                <Tv className="h-6 w-6" />
                <span>TV / Display</span>
              </Button>
              <Button
                variant={selectedDeviceType === 'AP' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedDeviceType('AP')}
              >
                <Wifi className="h-6 w-6" />
                <span>Access Point</span>
              </Button>
              <Button
                variant={selectedDeviceType === 'CAMERA' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedDeviceType('CAMERA')}
              >
                <Camera className="h-6 w-6" />
                <span>Camera</span>
              </Button>
              <Button
                variant={selectedDeviceType === 'IOT' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedDeviceType('IOT')}
              >
                <Cpu className="h-6 w-6" />
                <span>IoT / Sensor</span>
              </Button>
              <Button
                variant={selectedDeviceType === 'OTHER' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedDeviceType('OTHER')}
              >
                <Box className="h-6 w-6" />
                <span>Other Device</span>
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeviceTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (pendingRoomInfo) {
                addNewDeviceToRoom(
                  pendingRoomInfo.buildingId,
                  pendingRoomInfo.floorId,
                  pendingRoomInfo.roomId,
                  selectedDeviceType
                );
                setDeviceTypeDialogOpen(false);
                setPendingRoomInfo(null);
              }
            }}>
              Add Device
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cable Termination Configuration Modal */}
      <Dialog open={cableTerminationModalOpen} onOpenChange={setCableTerminationModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Cable Termination</DialogTitle>
            <DialogDescription>
              Set up the cable termination details before adding products and services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cableType">Cable Type</Label>
                <Select
                  value={terminationForm.cableType}
                  onValueChange={(value) => setTerminationForm(prev => ({ ...prev, cableType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAT6">CAT6</SelectItem>
                    <SelectItem value="CAT6A">CAT6A</SelectItem>
                    <SelectItem value="CAT5e">CAT5e</SelectItem>
                    <SelectItem value="FIBER_SM">Fiber SM</SelectItem>
                    <SelectItem value="FIBER_MM">Fiber MM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={terminationForm.quantity}
                  onChange={(e) => setTerminationForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            </div>

            {/* Fiber-specific fields */}
            {(terminationForm.cableType === 'FIBER_SM' || terminationForm.cableType === 'FIBER_MM') && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-800/40 rounded-lg border border-blue-200">
                <div>
                  <Label htmlFor="totalFibers">Total Fibers</Label>
                  <Input
                    id="totalFibers"
                    type="number"
                    value={terminationForm.totalFibers || ''}
                    onChange={(e) => setTerminationForm(prev => ({ ...prev, totalFibers: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g., 12, 24, 48"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="terminatedFibers">Terminated Fibers</Label>
                  <Input
                    id="terminatedFibers"
                    type="number"
                    value={terminationForm.terminatedFibers || ''}
                    onChange={(e) => setTerminationForm(prev => ({ ...prev, terminatedFibers: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g., 8"
                    min="0"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromLocation">From Location</Label>
                <Input
                  id="fromLocation"
                  value={terminationForm.fromLocation}
                  onChange={(e) => setTerminationForm(prev => ({ ...prev, fromLocation: e.target.value }))}
                  placeholder="Source location"
                />
              </div>
              <div>
                <Label htmlFor="toLocation">To Location</Label>
                <Input
                  id="toLocation"
                  value={terminationForm.toLocation}
                  onChange={(e) => setTerminationForm(prev => ({ ...prev, toLocation: e.target.value }))}
                  placeholder="Destination location"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setCableTerminationModalOpen(false);
              setPendingTerminationData(null);
            }}>
              Cancel
            </Button>
            <Button onClick={createTerminationFromModal}>
              Create Termination
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
