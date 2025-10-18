"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Building2, 
  Layers3, 
  Home, 
  Server, 
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
  Link2,
  Save,
  Eye,
  EyeOff,
  Camera,
  FileImage,
  X,
  Network,
  Package,
  Hash,
  Euro,
  CheckCircle,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUploadButton } from "./image-upload-button";
import { ImagePreviewTooltip } from "@/components/ui/image-preview-tooltip";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { NetworkDiagramModal } from "./network-diagram-modal";
import { EquipmentSelection } from "./equipment-selection";
import { BOMManagerEnhanced } from "./bom-manager-enhanced";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SelectedElement, EquipmentItem } from "@/types/equipment-selection";
import { 
  ProposedInfrastructure, 
  ProposedFloorRack, 
  ProposedRoom,
  ProposedOutlet,
  getAllProposedEquipment 
} from "@/types/proposed-infrastructure";
import { 
  ProposedRackDialog, 
  ProposedRoomDialog, 
  ProposedOutletDialog 
} from "./proposed-infrastructure-dialog";

interface CablingHierarchyFormProps {
  siteSurveyId: string;
  onSuccess?: () => void;
  onEquipmentUpdate?: (equipment: EquipmentItem[]) => void;
}

// Extended Device interface to include equipment properties
interface DeviceWithEquipment {
  name: string;
  type: string;
  brand?: string;
  model?: string;
  quantity?: number;
  notes?: string;
  itemType?: string; // 'product' or 'service'
  equipmentId?: string; // Reference to equipment item
  ipAddress?: string; // For network devices
  phoneNumber?: string; // For phones
}

interface Building {
  id?: string;
  name: string;
  code?: string;
  address?: string;
  notes?: string;
  centralRack?: CentralRack;
  floors: Floor[];
  images?: string[];
}

interface CableTermination {
  type: string; // CAT6, CAT6A, Fiber, Telephone, etc.
  count: number;
}

interface FiberTermination {
  type: string; // OS2, OM3, OM4, OM5
  totalStrands: number; // Total fiber strands in cable (e.g., 12, 24, 48)
  terminatedStrands: number; // How many are actually terminated
}

interface CentralRack {
  id?: string;
  name: string;
  code?: string;
  units?: number;
  location?: string;
  notes?: string;
  images?: string[];
  cableTerminations?: CableTermination[];
  fiberTerminations?: FiberTermination[];
  devices?: DeviceWithEquipment[];
}

interface Floor {
  id?: string;
  name: string;
  level?: number;
  blueprintUrl?: string;
  similarToFloorId?: string;
  notes?: string;
  floorRacks?: FloorRack[]; // Changed to array for multiple racks
  rooms: Room[];
  expanded?: boolean;
  images?: string[];
}

interface FloorRack {
  id?: string;
  name: string;
  code?: string;
  units?: number;
  location?: string;
  notes?: string;
  images?: string[];
  cableTerminations?: CableTermination[];
  fiberTerminations?: FiberTermination[];
  devices?: DeviceWithEquipment[];
}

interface Device {
  id?: string;
  type: "ROUTER" | "SWITCH" | "ACCESS_POINT" | "PHONE" | "TV" | "OTHER";
  name: string;
  brand?: string;
  model?: string;
  ipAddress?: string;
  phoneNumber?: string;
  notes?: string;
}

// Local EquipmentItem was removed - using the one from @/types/equipment-selection

interface Room {
  id?: string;
  name: string;
  number?: string;
  type: string;
  connectionType: string;
  selectedRackId?: string;
  floorPlanUrl?: string;
  notes?: string;
  outlets: number;
  images?: string[];
  devices?: DeviceWithEquipment[];
  isTypicalRoom?: boolean;
  identicalRoomsCount?: number;
}

export function CablingHierarchyForm({
  siteSurveyId,
  onSuccess,
  onEquipmentUpdate,
}: CablingHierarchyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<{ building: number; floor: number } | null>(null);
  const [selectedRack, setSelectedRack] = useState<{ building: number; floor: number; rack: number } | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ building: number; floor: number; room: number } | null>(null);
  
  // Dialog states
  const [buildingDialog, setBuildingDialog] = useState(false);
  const [centralRackDialog, setCentralRackDialog] = useState(false);
  const [floorDialog, setFloorDialog] = useState(false);
  const [floorRackDialog, setFloorRackDialog] = useState(false);
  const [roomDialog, setRoomDialog] = useState(false);
  const [deviceDialog, setDeviceDialog] = useState(false);
  
  // Device management state
  const [deviceForm, setDeviceForm] = useState<Device>({
    type: "ROUTER",
    name: "",
  });
  const [deviceTarget, setDeviceTarget] = useState<{
    type: 'central' | 'floor' | 'room';
    buildingIdx?: number;
    floorIdx?: number;
    rackIdx?: number;
    roomIdx?: number;
    deviceIdx?: number;
  } | null>(null);

  // Building connections
  const [buildingConnectionDialog, setBuildingConnectionDialog] = useState(false);
  const [selectedBuildingForConnection, setSelectedBuildingForConnection] = useState<number | null>(null);
  const [buildingConnections, setBuildingConnections] = useState<Array<{
    id: string;
    fromBuilding: number;
    toBuilding: number;
    connectionType: string;
    description: string;
    distance?: number;
    notes?: string;
  }>>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [equipmentSelectionOpen, setEquipmentSelectionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'equipment'>('infrastructure');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [siteSurveyData, setSiteSurveyData] = useState<any>(null);
  
  // Proposed Infrastructure State
  const [proposedInfrastructure, setProposedInfrastructure] = useState<ProposedInfrastructure>({
    proposedCentralRacks: [],
    proposedFloorRacks: [],
    proposedRooms: [],
    proposedConnections: [],
  });
  const [proposedRackDialog, setProposedRackDialog] = useState(false);
  const [proposedRoomDialog, setProposedRoomDialog] = useState(false);
  const [proposedOutletDialog, setProposedOutletDialog] = useState(false);
  const [selectedProposedContext, setSelectedProposedContext] = useState<{
    buildingIndex: number;
    floorIndex: number;
    buildingName: string;
    floorName: string;
    roomId?: string;
  } | null>(null);
  const [connectionForm, setConnectionForm] = useState({
    toBuilding: "",
    connectionType: "WIRELESS",
    description: "",
    distance: "",
    notes: "",
  });

  // Network Diagram Modal
  const [networkDiagramOpen, setNetworkDiagramOpen] = useState(false);

  // Cable type options
  const cableTypeOptions = [
    // Copper Ethernet
    { value: "CAT5E", label: "CAT5E - 1000BASE-T" },
    { value: "CAT6", label: "CAT6 - 1000BASE-T" },
    { value: "CAT6A", label: "CAT6A - 10GBASE-T" },
    { value: "CAT7", label: "CAT7 - 10GBASE-T" },
    { value: "CAT8", label: "CAT8 - 40GBASE-T" },
    // Fiber Single-Mode
    { value: "OS2", label: "OS2 - Single-Mode Fiber" },
    // Fiber Multi-Mode
    { value: "OM3", label: "OM3 - Multi-Mode Fiber (50/125)" },
    { value: "OM4", label: "OM4 - Multi-Mode Fiber (50/125)" },
    { value: "OM5", label: "OM5 - Multi-Mode Fiber (50/125)" },
    // Coaxial Cables
    { value: "RG6", label: "RG6 - Coaxial Cable (Digital)" },
    { value: "RG11", label: "RG11 - Coaxial Cable (Long Run)" },
    { value: "RG59", label: "RG59 - Coaxial Cable (Analog)" },
    { value: "QUAD_SHIELD_RG6", label: "Quad Shield RG6 - Enhanced Digital" },
    // Telephone
    { value: "RJ11", label: "RJ11 - Telephone Line" },
    { value: "RJ45", label: "RJ45 - Ethernet" },
    // Other
    { value: "OTHER", label: "Other" },
  ];

  // Load existing data on mount
  // Save equipment function
  const saveEquipment = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/save-equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposedInfrastructure,
          equipment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save equipment');
      }

      toast.success('Equipment saved successfully');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast.error('Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  // Load saved equipment on mount
  useEffect(() => {
    const loadSavedEquipment = async () => {
      try {
        const response = await fetch(`/api/site-surveys/${siteSurveyId}/save-equipment`);
        if (response.ok) {
          const data = await response.json();
          if (data.equipment) {
            setEquipment(data.equipment);
          }
          if (data.proposedInfrastructure) {
            setProposedInfrastructure(data.proposedInfrastructure);
          }
          console.log('Loaded saved equipment:', data);
        }
      } catch (error) {
        console.error('Error loading saved equipment:', error);
      }
    };

    if (!initialLoad) {
      loadSavedEquipment();
    }
  }, [siteSurveyId, initialLoad]);

  // Notify parent of equipment changes
  useEffect(() => {
    if (onEquipmentUpdate) {
      onEquipmentUpdate(equipment);
    }
  }, [equipment, onEquipmentUpdate]);

  useEffect(() => {
    const loadData = async () => {
      if (!initialLoad) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/site-surveys/${siteSurveyId}/cabling`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Loaded cabling data:", data);
          
          // Store site survey data for BOM and document generation
          if (data.siteSurvey) {
            setSiteSurveyData(data.siteSurvey);
          }
          
          // Transform the data to match our Building interface
          if (data.siteSurvey?.buildings) {
            const transformedBuildings = data.siteSurvey.buildings.map((b: any) => ({
              id: b.id,
              name: b.name,
              code: b.code,
              address: b.address,
              notes: b.notes,
              images: b.images?.map((img: any) => img.url) || [],
              centralRack: b.centralRack ? {
                id: b.centralRack.id,
                name: b.centralRack.name,
                code: b.centralRack.code,
                units: b.centralRack.units,
                location: b.centralRack.location,
                notes: b.centralRack.notes,
                images: b.centralRack.images?.map((img: any) => img.url) || [],
                cableTerminations: b.centralRack.cableTerminations as any || [],
                fiberTerminations: b.centralRack.fiberTerminations as any || [],
                devices: b.centralRack.devices?.map((d: any) => ({
                  id: d.id,
                  type: d.type,
                  name: d.label || d.name,
                  brand: d.vendor,
                  model: d.model,
                  ipAddress: d.mgmtIp,
                  phoneNumber: d.notes?.includes('Phone:') ? d.notes.replace('Phone: ', '') : undefined,
                  notes: d.notes,
                })) || [],
              } : undefined,
              floors: b.floors?.map((f: any) => ({
                id: f.id,
                name: f.name,
                level: f.level,
                blueprintUrl: f.blueprintUrl,
                similarToFloorId: f.similarToFloorId,
                notes: f.notes,
                images: f.images?.map((img: any) => img.url) || [],
                expanded: false,
                floorRacks: f.floorRacks?.map((rack: any) => ({
                  id: rack.id,
                  name: rack.name,
                  code: rack.code,
                  units: rack.units,
                  location: rack.location,
                  notes: rack.notes,
                  images: rack.images?.map((img: any) => img.url) || [],
                  cableTerminations: rack.cableTerminations as any || [],
                  fiberTerminations: rack.fiberTerminations as any || [],
                  devices: rack.devices?.map((d: any) => ({
                    id: d.id,
                    type: d.type,
                    name: d.label || d.name,
                    brand: d.vendor,
                    model: d.model,
                    ipAddress: d.mgmtIp,
                    phoneNumber: d.notes?.includes('Phone:') ? d.notes.replace('Phone: ', '') : undefined,
                    notes: d.notes,
                  })) || [],
                })) || [],
                rooms: f.rooms?.map((r: any) => ({
                  id: r.id,
                  name: r.name,
                  number: r.number,
                  type: r.type,
                  connectionType: r.connectionType,
                  floorPlanUrl: r.floorPlanUrl,
                  notes: r.notes,
                  outlets: r.outlets?.length || 0,
                  isTypicalRoom: r.isTypicalRoom || false,
                  identicalRoomsCount: r.identicalRoomsCount || 1,
                  images: r.images?.map((img: any) => img.url) || [],
                  devices: r.devices?.map((d: any) => ({
                    id: d.id,
                    type: d.type,
                    name: d.label || d.name,
                    brand: d.vendor,
                    model: d.model,
                    ipAddress: d.mgmtIp,
                    phoneNumber: d.notes?.includes('Phone:') ? d.notes.replace('Phone: ', '') : undefined,
                    notes: d.notes,
                  })) || [],
                })) || [],
              })) || [],
            }));
            
            setBuildings(transformedBuildings);
            console.log("Transformed buildings:", transformedBuildings);
          }
        } else if (response.status === 404) {
          // No existing data, start fresh
          console.log("No existing cabling data found");
        }
      } catch (error) {
        console.error("Error loading cabling data:", error);
        toast.error("Failed to load existing cabling data");
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    
    loadData();
  }, [siteSurveyId, initialLoad]);
  
  // Form states
  const [buildingForm, setBuildingForm] = useState<Building>({
    name: "",
    floors: []
  });
  const [centralRackForm, setCentralRackForm] = useState<CentralRack>({
    name: "Central Rack",
  });
  const [floorForm, setFloorForm] = useState<Floor>({
    name: "",
    rooms: []
  });
  const [floorRackForm, setFloorRackForm] = useState<FloorRack>({
    name: "Floor Rack",
  });
  const [roomForm, setRoomForm] = useState<Room>({
    name: "",
    type: "ROOM",
    connectionType: "FLOOR_RACK",
    outlets: 0,
    isTypicalRoom: false,
    identicalRoomsCount: 1,
  });

  const addBuilding = () => {
    setBuildingForm({ name: "", floors: [] });
    setSelectedBuilding(null);
    setBuildingDialog(true);
  };

  const editBuilding = (buildingIdx: number) => {
    const building = buildings[buildingIdx];
    setBuildingForm({ ...building });
    setSelectedBuilding(buildingIdx);
    setBuildingDialog(true);
  };

  const saveBuilding = () => {
    if (!buildingForm.name) {
      toast.error("Building name is required");
      return;
    }
    
    const newBuildings = [...buildings];
    if (selectedBuilding !== null) {
      // Edit existing building
      newBuildings[selectedBuilding] = { ...buildingForm, floors: newBuildings[selectedBuilding].floors };
      toast.success("Building updated!");
    } else {
      // Add new building
      newBuildings.push({ ...buildingForm, floors: [] });
      toast.success("Building added! Now add a Central Rack and Floors.");
    }
    
    setBuildings(newBuildings);
    setBuildingDialog(false);
    setSelectedBuilding(null);
  };

  const deleteBuilding = (index: number) => {
    const newBuildings = buildings.filter((_, i) => i !== index);
    setBuildings(newBuildings);
    toast.success("Building deleted");
  };

  const deleteFloor = (buildingIndex: number, floorIndex: number) => {
    const newBuildings = [...buildings];
    newBuildings[buildingIndex].floors = newBuildings[buildingIndex].floors.filter((_, i) => i !== floorIndex);
    setBuildings(newBuildings);
    toast.success("Floor deleted");
  };

  const deleteRoom = (buildingIndex: number, floorIndex: number, roomIndex: number) => {
    const newBuildings = [...buildings];
    newBuildings[buildingIndex].floors[floorIndex].rooms = 
      newBuildings[buildingIndex].floors[floorIndex].rooms.filter((_, i) => i !== roomIndex);
    setBuildings(newBuildings);
    toast.success("Room deleted");
  };

  const addCentralRack = (buildingIndex: number) => {
    setCentralRackForm({ name: "Central Rack", cableTerminations: [], fiberTerminations: [], devices: [] });
    setSelectedBuilding(buildingIndex);
    setCentralRackDialog(true);
  };

  const editCentralRack = (buildingIndex: number) => {
    const rack = buildings[buildingIndex].centralRack;
    if (rack) {
      setCentralRackForm({ ...rack });
      setSelectedBuilding(buildingIndex);
      setCentralRackDialog(true);
    }
  };

  const addFiberTermination = (rackType: 'central' | 'floor') => {
    if (rackType === 'central') {
      const current = centralRackForm.fiberTerminations || [];
      setCentralRackForm({
        ...centralRackForm,
        fiberTerminations: [...current, { type: "OS2", totalStrands: 12, terminatedStrands: 0 }],
      });
    } else {
      const current = floorRackForm.fiberTerminations || [];
      setFloorRackForm({
        ...floorRackForm,
        fiberTerminations: [...current, { type: "OS2", totalStrands: 12, terminatedStrands: 0 }],
      });
    }
  };

  const removeFiberTermination = (rackType: 'central' | 'floor', index: number) => {
    if (rackType === 'central') {
      const current = centralRackForm.fiberTerminations || [];
      setCentralRackForm({
        ...centralRackForm,
        fiberTerminations: current.filter((_, i) => i !== index),
      });
    } else {
      const current = floorRackForm.fiberTerminations || [];
      setFloorRackForm({
        ...floorRackForm,
        fiberTerminations: current.filter((_, i) => i !== index),
      });
    }
  };

  const updateFiberTermination = (
    rackType: 'central' | 'floor',
    index: number,
    field: 'type' | 'totalStrands' | 'terminatedStrands',
    value: string | number
  ) => {
    if (rackType === 'central') {
      const current = [...(centralRackForm.fiberTerminations || [])];
      current[index] = { ...current[index], [field]: value };
      setCentralRackForm({ ...centralRackForm, fiberTerminations: current });
    } else {
      const current = [...(floorRackForm.fiberTerminations || [])];
      current[index] = { ...current[index], [field]: value };
      setFloorRackForm({ ...floorRackForm, fiberTerminations: current });
    }
  };

  const addCableTermination = (rackType: 'central' | 'floor') => {
    if (rackType === 'central') {
      const current = centralRackForm.cableTerminations || [];
      setCentralRackForm({
        ...centralRackForm,
        cableTerminations: [...current, { type: "CAT6", count: 0 }],
      });
    } else {
      const current = floorRackForm.cableTerminations || [];
      setFloorRackForm({
        ...floorRackForm,
        cableTerminations: [...current, { type: "CAT6", count: 0 }],
      });
    }
  };

  const removeCableTermination = (rackType: 'central' | 'floor', index: number) => {
    if (rackType === 'central') {
      const current = centralRackForm.cableTerminations || [];
      setCentralRackForm({
        ...centralRackForm,
        cableTerminations: current.filter((_, i) => i !== index),
      });
    } else {
      const current = floorRackForm.cableTerminations || [];
      setFloorRackForm({
        ...floorRackForm,
        cableTerminations: current.filter((_, i) => i !== index),
      });
    }
  };

  const updateCableTermination = (
    rackType: 'central' | 'floor',
    index: number,
    field: 'type' | 'count',
    value: string | number
  ) => {
    if (rackType === 'central') {
      const current = [...(centralRackForm.cableTerminations || [])];
      current[index] = { ...current[index], [field]: value };
      setCentralRackForm({ ...centralRackForm, cableTerminations: current });
    } else {
      const current = [...(floorRackForm.cableTerminations || [])];
      current[index] = { ...current[index], [field]: value };
      setFloorRackForm({ ...floorRackForm, cableTerminations: current });
    }
  };

  const saveCentralRack = () => {
    if (selectedBuilding === null) return;
    if (!centralRackForm.name) {
      toast.error("Rack name is required");
      return;
    }
    const newBuildings = [...buildings];
    const existingRack = newBuildings[selectedBuilding].centralRack;
    
    // Preserve existing data if editing
    newBuildings[selectedBuilding].centralRack = {
      ...centralRackForm,
      // Ensure arrays are preserved
      cableTerminations: centralRackForm.cableTerminations || [],
      fiberTerminations: centralRackForm.fiberTerminations || [],
      devices: centralRackForm.devices || existingRack?.devices || [],
      images: centralRackForm.images || existingRack?.images || [],
    };
    
    setBuildings(newBuildings);
    setCentralRackDialog(false);
    toast.success(existingRack ? "Central Rack updated" : "Central Rack added");
  };

  const addFloor = (buildingIndex: number) => {
    setFloorForm({ name: "", rooms: [], floorRacks: [] });
    setSelectedBuilding(buildingIndex);
    setSelectedFloor(null);
    setFloorDialog(true);
  };

  const editFloor = (buildingIndex: number, floorIndex: number) => {
    const floor = buildings[buildingIndex].floors[floorIndex];
    setFloorForm({ ...floor });
    setSelectedBuilding(buildingIndex);
    setSelectedFloor({ building: buildingIndex, floor: floorIndex });
    setFloorDialog(true);
  };

  const saveFloor = () => {
    if (selectedBuilding === null) return;
    if (!floorForm.name) {
      toast.error("Floor name is required");
      return;
    }
    const newBuildings = [...buildings];
    if (selectedFloor) {
      // Edit existing floor
      newBuildings[selectedFloor.building].floors[selectedFloor.floor] = { 
        ...floorForm, 
        expanded: newBuildings[selectedFloor.building].floors[selectedFloor.floor].expanded,
        rooms: newBuildings[selectedFloor.building].floors[selectedFloor.floor].rooms,
        floorRacks: newBuildings[selectedFloor.building].floors[selectedFloor.floor].floorRacks
      };
      toast.success("Floor updated!");
    } else {
      // Add new floor
      newBuildings[selectedBuilding].floors.push({ ...floorForm, expanded: true, rooms: [], floorRacks: [] });
      toast.success("Floor added! Now add Floor Rack(s) and Rooms.");
    }
    setBuildings(newBuildings);
    setFloorDialog(false);
    setSelectedFloor(null);
  };

  const addFloorRack = (buildingIndex: number, floorIndex: number) => {
    setFloorRackForm({ name: "Floor Rack", cableTerminations: [], fiberTerminations: [], devices: [] });
    setSelectedFloor({ building: buildingIndex, floor: floorIndex });
    setSelectedRack(null);
    setFloorRackDialog(true);
  };

  const editFloorRack = (buildingIndex: number, floorIndex: number, rackIndex: number) => {
    const rack = buildings[buildingIndex].floors[floorIndex].floorRacks?.[rackIndex];
    if (rack) {
      setFloorRackForm({ ...rack });
      setSelectedFloor({ building: buildingIndex, floor: floorIndex });
      setSelectedRack({ building: buildingIndex, floor: floorIndex, rack: rackIndex });
      setFloorRackDialog(true);
    }
  };

  const saveFloorRack = () => {
    if (!selectedFloor) return;
    if (!floorRackForm.name) {
      toast.error("Rack name is required");
      return;
    }
    
    const newBuildings = [...buildings];
    const floor = newBuildings[selectedFloor.building].floors[selectedFloor.floor];
    
    if (selectedRack) {
      // Edit existing rack - preserve devices and images
      if (floor.floorRacks) {
        const existingRack = floor.floorRacks[selectedRack.rack];
        floor.floorRacks[selectedRack.rack] = {
          ...floorRackForm,
          cableTerminations: floorRackForm.cableTerminations || [],
          fiberTerminations: floorRackForm.fiberTerminations || [],
          devices: floorRackForm.devices || existingRack?.devices || [],
          images: floorRackForm.images || existingRack?.images || [],
        };
      }
      toast.success("Floor Rack updated");
    } else {
      // Add new rack
      if (!floor.floorRacks) {
        floor.floorRacks = [];
      }
      floor.floorRacks.push({
        ...floorRackForm,
        cableTerminations: floorRackForm.cableTerminations || [],
        fiberTerminations: floorRackForm.fiberTerminations || [],
        devices: floorRackForm.devices || [],
        images: floorRackForm.images || [],
      });
      toast.success("Floor Rack added");
    }
    
    setBuildings(newBuildings);
    setFloorRackDialog(false);
    setSelectedRack(null);
  };

  const addRoom = (buildingIndex: number, floorIndex: number) => {
    setRoomForm({
      name: "",
      type: "ROOM",
      connectionType: "FLOOR_RACK",
      outlets: 0,
      isTypicalRoom: false,
      identicalRoomsCount: 1,
    });
    setSelectedFloor({ building: buildingIndex, floor: floorIndex });
    setSelectedRoom(null);
    setRoomDialog(true);
  };

  // Building connection functions
  const openBuildingConnections = (buildingIdx: number) => {
    setSelectedBuildingForConnection(buildingIdx);
    setConnectionForm({
      toBuilding: "",
      connectionType: "WIRELESS",
      description: "",
      distance: "",
      notes: "",
    });
    setBuildingConnectionDialog(true);
  };

  const saveBuildingConnection = () => {
    if (selectedBuildingForConnection === null || !connectionForm.toBuilding) return;

    const newConnection = {
      id: `conn_${Date.now()}`,
      fromBuilding: selectedBuildingForConnection,
      toBuilding: parseInt(connectionForm.toBuilding),
      connectionType: connectionForm.connectionType,
      description: connectionForm.description,
      distance: connectionForm.distance ? parseFloat(connectionForm.distance) : undefined,
      notes: connectionForm.notes,
    };

    setBuildingConnections([...buildingConnections, newConnection]);
    toast.success(`Connected ${buildings[selectedBuildingForConnection].name} to ${buildings[parseInt(connectionForm.toBuilding)].name}`);

    setConnectionForm({
      toBuilding: "",
      connectionType: "WIRELESS",
      description: "",
      distance: "",
      notes: "",
    });
  };

  const deleteBuildingConnection = (connectionId: string) => {
    setBuildingConnections(buildingConnections.filter(conn => conn.id !== connectionId));
  };

  const editRoom = (buildingIndex: number, floorIndex: number, roomIndex: number) => {
    const room = buildings[buildingIndex].floors[floorIndex].rooms[roomIndex];
    setRoomForm({ ...room });
    setSelectedFloor({ building: buildingIndex, floor: floorIndex });
    setSelectedRoom({ building: buildingIndex, floor: floorIndex, room: roomIndex });
    setRoomDialog(true);
  };

  const addDevice = (type: 'central' | 'floor' | 'room', buildingIdx: number, floorIdx?: number, rackIdx?: number, roomIdx?: number) => {
    setDeviceForm({ type: "ROUTER", name: "" });
    setDeviceTarget({ type, buildingIdx, floorIdx, rackIdx, roomIdx });
    setDeviceDialog(true);
  };

  const saveDevice = () => {
    if (!deviceTarget || !deviceForm.name) {
      toast.error("Device name is required");
      return;
    }

    const newBuildings = [...buildings];
    const device = { ...deviceForm };

    if (deviceTarget.type === 'central' && deviceTarget.buildingIdx !== undefined) {
      const building = newBuildings[deviceTarget.buildingIdx];
      if (building.centralRack) {
        if (!building.centralRack.devices) building.centralRack.devices = [];
        building.centralRack.devices.push(device);
      }
    } else if (deviceTarget.type === 'floor' && deviceTarget.buildingIdx !== undefined && 
               deviceTarget.floorIdx !== undefined && deviceTarget.rackIdx !== undefined) {
      const rack = newBuildings[deviceTarget.buildingIdx].floors[deviceTarget.floorIdx].floorRacks?.[deviceTarget.rackIdx];
      if (rack) {
        if (!rack.devices) rack.devices = [];
        rack.devices.push(device);
      }
    } else if (deviceTarget.type === 'room' && deviceTarget.buildingIdx !== undefined && 
               deviceTarget.floorIdx !== undefined && deviceTarget.roomIdx !== undefined) {
      const room = newBuildings[deviceTarget.buildingIdx].floors[deviceTarget.floorIdx].rooms[deviceTarget.roomIdx];
      if (room) {
        if (!room.devices) room.devices = [];
        room.devices.push(device);
      }
    }

    setBuildings(newBuildings);
    setDeviceDialog(false);
    toast.success("Device added");
  };

  const deleteDevice = (type: 'central' | 'floor' | 'room', buildingIdx: number, deviceIdx: number, 
                        floorIdx?: number, rackIdx?: number, roomIdx?: number) => {
    const newBuildings = [...buildings];

    if (type === 'central') {
      const rack = newBuildings[buildingIdx].centralRack;
      if (rack?.devices) {
        rack.devices = rack.devices.filter((_, i) => i !== deviceIdx);
      }
    } else if (type === 'floor' && floorIdx !== undefined && rackIdx !== undefined) {
      const rack = newBuildings[buildingIdx].floors[floorIdx].floorRacks?.[rackIdx];
      if (rack?.devices) {
        rack.devices = rack.devices.filter((_, i) => i !== deviceIdx);
      }
    } else if (type === 'room' && floorIdx !== undefined && roomIdx !== undefined) {
      const room = newBuildings[buildingIdx].floors[floorIdx].rooms[roomIdx];
      if (room?.devices) {
        room.devices = room.devices.filter((_, i) => i !== deviceIdx);
      }
    }

    setBuildings(newBuildings);
    toast.success("Device deleted");
  };

  const saveRoom = () => {
    if (!selectedFloor) return;
    if (!roomForm.name) {
      toast.error("Room name is required");
      return;
    }
    const newBuildings = [...buildings];
    
    if (selectedRoom) {
      // Edit existing room
      newBuildings[selectedRoom.building].floors[selectedRoom.floor].rooms[selectedRoom.room] = {
        ...roomForm,
        devices: newBuildings[selectedRoom.building].floors[selectedRoom.floor].rooms[selectedRoom.room].devices
      };
      toast.success("Room updated");
    } else {
      // Add new room
      newBuildings[selectedFloor.building].floors[selectedFloor.floor].rooms.push({ ...roomForm });
      toast.success("Room added");
    }
    
    setBuildings(newBuildings);
    setRoomDialog(false);
    setSelectedRoom(null);
  };

  const toggleFloorExpanded = (buildingIndex: number, floorIndex: number) => {
    const newBuildings = [...buildings];
    newBuildings[buildingIndex].floors[floorIndex].expanded = 
      !newBuildings[buildingIndex].floors[floorIndex].expanded;
    setBuildings(newBuildings);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Clean the data before saving - remove null values from arrays
      const cleanedBuildings = buildings.map(building => ({
        ...building,
        images: building.images?.filter(img => img) || [],
        centralRack: building.centralRack ? {
          ...building.centralRack,
          images: building.centralRack.images?.filter(img => img) || [],
          cableTerminations: building.centralRack.cableTerminations || [],
          fiberTerminations: building.centralRack.fiberTerminations || [],
          devices: building.centralRack.devices || [],
        } : undefined,
        floors: building.floors.map(floor => ({
          ...floor,
          images: floor.images?.filter(img => img) || [],
          floorRacks: floor.floorRacks?.map(rack => ({
            ...rack,
            images: rack.images?.filter(img => img) || [],
            cableTerminations: rack.cableTerminations || [],
            fiberTerminations: rack.fiberTerminations || [],
            devices: rack.devices || [],
          })) || [],
          rooms: floor.rooms.map(room => ({
            ...room,
            images: room.images?.filter(img => img) || [],
            devices: room.devices || [],
          })),
        })),
      }));

      console.log("Saving cabling survey:", cleanedBuildings);
      
      // Save to database via API
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/cabling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildings: cleanedBuildings,
          buildingConnections: buildingConnections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Save failed:", errorData);
        throw new Error(errorData.error || 'Failed to save cabling survey');
      }

      const result = await response.json();
      console.log("Save result:", result);
      
      toast.success("Infrastructure saved successfully! Now add equipment and services.");
      setShowSaveSuccess(true);
      setActiveTab('equipment'); // Switch to equipment tab
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving cabling survey:", error);
      toast.error(error.message || "Failed to save cabling survey");
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "ROUTER":
        return "🌐";
      case "SWITCH":
        return "🔀";
      case "ACCESS_POINT":
        return "📡";
      case "PHONE":
        return "☎️";
      case "TV":
        return "📺";
      default:
        return "🔌";
    }
  };

  const getTotalStats = () => {
    let totalFloors = 0;
    let totalRooms = 0;
    let totalOutlets = 0;
    let totalRacks = 0;
    let totalDevices = 0;
    let totalCableTerminations = 0;
    let totalFiberStrands = 0;
    let totalTerminatedFiberStrands = 0;

    buildings.forEach((building) => {
      if (building.centralRack) {
        totalRacks++;
        if (building.centralRack.devices) totalDevices += building.centralRack.devices.length;
        if (building.centralRack.cableTerminations) {
          building.centralRack.cableTerminations.forEach(ct => totalCableTerminations += ct.count);
        }
        if (building.centralRack.fiberTerminations) {
          building.centralRack.fiberTerminations.forEach(ft => {
            totalFiberStrands += ft.totalStrands;
            totalTerminatedFiberStrands += ft.terminatedStrands;
          });
        }
      }
      
      building.floors.forEach((floor) => {
        totalFloors++;
        if (floor.floorRacks) {
          totalRacks += floor.floorRacks.length;
          floor.floorRacks.forEach(rack => {
            if (rack.devices) totalDevices += rack.devices.length;
            if (rack.cableTerminations) {
              rack.cableTerminations.forEach(ct => totalCableTerminations += ct.count);
            }
            if (rack.fiberTerminations) {
              rack.fiberTerminations.forEach(ft => {
                totalFiberStrands += ft.totalStrands;
                totalTerminatedFiberStrands += ft.terminatedStrands;
              });
            }
          });
        }
        
        floor.rooms.forEach((room) => {
          totalRooms++;
          
          // For typical rooms, multiply by the count of identical rooms
          const roomMultiplier = room.isTypicalRoom ? (room.identicalRoomsCount || 1) : 1;
          
          totalOutlets += (room.outlets || 0) * roomMultiplier;
          if (room.devices) totalDevices += room.devices.length * roomMultiplier;
        });
      });
    });

    return { 
      totalFloors, 
      totalRooms, 
      totalOutlets, 
      totalRacks, 
      totalDevices,
      totalCableTerminations,
      totalFiberStrands,
      totalTerminatedFiberStrands
    };
  };

  const stats = getTotalStats();

  if (initialLoad && loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cabling survey data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveEquipment}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              SAVE EQUIPMENT
            </>
          )}
        </Button>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">`
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="infrastructure" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            INFRASTRUCTURE
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            EQUIPMENT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infrastructure" className="space-y-6">
          {/* Stats Summary */}
      {buildings.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <Building2 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xl font-bold">{buildings.length}</p>
                <p className="text-xs text-muted-foreground">Buildings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Server className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <p className="text-xl font-bold">{stats.totalRacks}</p>
                <p className="text-xs text-muted-foreground">Racks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Layers3 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-xl font-bold">{stats.totalFloors}</p>
                <p className="text-xs text-muted-foreground">Floors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Home className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <p className="text-xl font-bold">{stats.totalRooms}</p>
                <p className="text-xs text-muted-foreground">Rooms</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <Link2 className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                <p className="text-xl font-bold">{stats.totalOutlets}</p>
                <p className="text-xs text-muted-foreground">Outlets</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-4 text-center">
                <span className="text-xl">🔌</span>
                <p className="text-xl font-bold">{stats.totalDevices}</p>
                <p className="text-xs text-muted-foreground">Devices</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="pt-4 text-center">
                <span className="text-xl">🔗</span>
                <p className="text-xl font-bold">{stats.totalCableTerminations}</p>
                <p className="text-xs text-muted-foreground">Cable Drops</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100">
              <CardContent className="pt-4 text-center">
                <span className="text-xl">💠</span>
                <p className="text-xl font-bold">{stats.totalTerminatedFiberStrands}/{stats.totalFiberStrands}</p>
                <p className="text-xs text-muted-foreground">Fiber Strands</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Visual Hierarchy */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              CABLING INFRASTRUCTURE
            </CardTitle>
            <Button 
              onClick={() => {
                console.log("ADD BUILDING BUTTON CLICKED!");
                addBuilding();
              }} 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              ADD BUILDING
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {buildings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No buildings added yet</p>
              <p className="text-sm">Start by adding a building to your survey</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buildings.map((building, bIdx) => (
                <Card key={bIdx} className="border-2">
                  <CardContent className="pt-6">
                    {/* Building */}
                    <div className="flex items-start gap-3 mb-4">
                      <AvatarGroup
                        images={building.images}
                        fallbackIcon={
                          <div className="bg-blue-100 flex items-center justify-center w-full h-full rounded-full">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                        }
                        size="h-12 w-12"
                        maxDisplay={4}
                        previewSize={500}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold">{building.name}</h3>
                            {building.code && (
                              <p className="text-sm text-muted-foreground">Code: {building.code}</p>
                            )}
                            {building.address && (
                              <p className="text-sm text-muted-foreground">{building.address}</p>
                            )}
                            {building.images && building.images.length > 0 && (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                {building.images.length} image{building.images.length > 1 ? 's' : ''}
                              </p>
                            )}
                            {building.notes && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Notes available
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addFloor(bIdx)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Floor
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBuildingConnections(bIdx)}
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              Connect
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editBuilding(bIdx)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <ImageUploadButton
                              entityType="building"
                              entityId={building.id || `temp-${bIdx}`}
                              onUploadSuccess={(url) => {
                                const newBuildings = [...buildings];
                                if (!newBuildings[bIdx].images) {
                                  newBuildings[bIdx].images = [];
                                }
                                newBuildings[bIdx].images!.push(url);
                                setBuildings(newBuildings);
                              }}
                              label="Images"
                              variant="outline"
                              size="sm"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBuilding(bIdx)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Central Rack */}
                    <div className="ml-9 mb-4">
                      {building.centralRack ? (
                        <>
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <AvatarGroup
                            images={building.centralRack.images}
                            fallbackIcon={
                              <div className="bg-orange-200 flex items-center justify-center w-full h-full rounded-full">
                                <Server className="h-5 w-5 text-orange-700" />
                              </div>
                            }
                            size="h-10 w-10"
                            maxDisplay={4}
                            previewSize={500}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">🔌 {building.centralRack.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {building.centralRack.location || "Central Distribution"}
                              {building.centralRack.units && ` • ${building.centralRack.units}U`}
                              {building.centralRack.code && ` • ${building.centralRack.code}`}
                            </p>
                            {building.centralRack.cableTerminations && building.centralRack.cableTerminations.length > 0 && (
                              <div className="text-xs text-orange-700 mt-1 flex flex-wrap gap-1">
                                {building.centralRack.cableTerminations.map((term, idx) => (
                                  <span key={idx} className="bg-orange-100 px-2 py-0.5 rounded">
                                    {term.count}x {term.type}
                                  </span>
                                ))}
                              </div>
                            )}
                            {building.centralRack.fiberTerminations && building.centralRack.fiberTerminations.length > 0 && (
                              <div className="text-xs text-blue-700 mt-1 flex flex-wrap gap-1">
                                {building.centralRack.fiberTerminations.map((fiber, idx) => (
                                  <span key={idx} className="bg-blue-100 px-2 py-0.5 rounded">
                                    {fiber.type}: {fiber.terminatedStrands}/{fiber.totalStrands} strands
                                  </span>
                                ))}
                              </div>
                            )}
                            {building.centralRack.images && building.centralRack.images.length > 0 && (
                              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                {building.centralRack.images.length} image{building.centralRack.images.length > 1 ? 's' : ''}
                              </p>
                            )}
                            {building.centralRack.notes && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Notes available
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editCentralRack(bIdx)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addDevice('central', bIdx)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Device
                            </Button>
                            <ImageUploadButton
                              entityType="rack"
                              entityId={building.centralRack.id || `temp-central-${bIdx}`}
                              onUploadSuccess={(url) => {
                                const newBuildings = [...buildings];
                                if (newBuildings[bIdx].centralRack) {
                                  if (!newBuildings[bIdx].centralRack!.images) {
                                    newBuildings[bIdx].centralRack!.images = [];
                                  }
                                  newBuildings[bIdx].centralRack!.images!.push(url);
                                  setBuildings(newBuildings);
                                }
                              }}
                              label=""
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newBuildings = [...buildings];
                                newBuildings[bIdx].centralRack = undefined;
                                setBuildings(newBuildings);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Devices in Central Rack (Infrastructure only - no equipment) */}
                        {building.centralRack.devices && building.centralRack.devices.filter(d => !d.itemType).length > 0 && (
                          <div className="mt-2 ml-11 space-y-1">
                            {building.centralRack.devices.filter(d => !d.itemType).map((device, dIdx) => (
                              <div key={dIdx} className="flex items-center gap-2 p-1.5 bg-white rounded border text-xs group">
                                <span className="text-base">{getDeviceIcon(device.type)}</span>
                                <div className="flex-1">
                                  <p className="font-medium">{device.name}</p>
                                  <p className="text-muted-foreground">
                                    {device.type}
                                    {device.ipAddress && ` • ${device.ipAddress}`}
                                    {device.phoneNumber && ` • ${device.phoneNumber}`}
                                  </p>
                                  {device.notes && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1" title={device.notes}>
                                      <FileText className="h-3 w-3" />
                                      {device.notes.substring(0, 50)}{device.notes.length > 50 ? '...' : ''}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={() => deleteDevice('central', bIdx, building.centralRack!.devices!.filter(d => !d.itemType).findIndex(d => d === device))}
                                >
                                  <X className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        </>
                      ) : (
                        <div className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-300 border-dashed">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Server className="h-5 w-5 text-yellow-600" />
                              <div>
                                <p className="font-medium text-sm text-yellow-900">⚠️ Central Rack Required</p>
                                <p className="text-xs text-yellow-700">
                                  Add the main distribution rack for this building
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addCentralRack(bIdx)}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Now
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Floors */}
                    {building.floors.length === 0 ? (
                      <div className="ml-9 text-center py-6 text-sm text-muted-foreground bg-gray-50 rounded border-2 border-dashed">
                        <Layers3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>No floors added yet</p>
                        <p className="text-xs">Click "Add Floor" above to add floors to this building</p>
                      </div>
                    ) : (
                      building.floors.map((floor, fIdx) => (
                        <div key={fIdx} className="ml-9 mb-3 border-l-2 border-gray-300 pl-4">
                          <div className="space-y-2">
                          {/* Floor Header */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleFloorExpanded(bIdx, fIdx)}
                            >
                              {floor.expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <AvatarGroup
                              images={floor.blueprintUrl ? [floor.blueprintUrl, ...(floor.images || [])] : floor.images}
                              fallbackIcon={
                                <div className="bg-green-100 flex items-center justify-center w-full h-full rounded-full">
                                  <Layers3 className="h-4 w-4 text-green-600" />
                                </div>
                              }
                              size="h-8 w-8"
                              maxDisplay={4}
                              previewSize={500}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{floor.name}</p>
                              {floor.level !== undefined && (
                                <p className="text-xs text-muted-foreground">Level {floor.level}</p>
                              )}
                              {(floor.blueprintUrl || (floor.images && floor.images.length > 0)) && (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                  {floor.blueprintUrl && <FileImage className="h-3 w-3" />}
                                  {floor.images && floor.images.length > 0 && (
                                    <>
                                      <Camera className="h-3 w-3" />
                                      {floor.images.length}
                                    </>
                                  )}
                                </p>
                              )}
                              {floor.notes && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Notes available
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editFloor(bIdx, fIdx)}
                                className="text-xs h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addFloorRack(bIdx, fIdx)}
                                className="text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Rack
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addRoom(bIdx, fIdx)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Room
                              </Button>
                              <ImageUploadButton
                                entityType="floor"
                                entityId={floor.id || `temp-${bIdx}-${fIdx}`}
                                onUploadSuccess={(url) => {
                                  const newBuildings = [...buildings];
                                  newBuildings[bIdx].floors[fIdx].blueprintUrl = url;
                                  setBuildings(newBuildings);
                                }}
                                label="Blueprint"
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                              />
                              <ImageUploadButton
                                entityType="floor"
                                entityId={floor.id || `temp-${bIdx}-${fIdx}`}
                                onUploadSuccess={(url) => {
                                  const newBuildings = [...buildings];
                                  if (!newBuildings[bIdx].floors[fIdx].images) {
                                    newBuildings[bIdx].floors[fIdx].images = [];
                                  }
                                  newBuildings[bIdx].floors[fIdx].images!.push(url);
                                  setBuildings(newBuildings);
                                }}
                                label="Images"
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteFloor(bIdx, fIdx)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          {floor.expanded && (
                            <div className="ml-8 space-y-2">
                              {/* Floor Racks */}
                              {floor.floorRacks && floor.floorRacks.length > 0 ? (
                                floor.floorRacks.map((floorRack, frIdx) => (
                                <div key={frIdx} className="mb-2">
                                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200">
                                  <Link2 className="h-3 w-3 text-purple-600" />
                                  <AvatarGroup
                                    images={floorRack.images}
                                    fallbackIcon={
                                      <div className="bg-purple-200 flex items-center justify-center w-full h-full rounded-full">
                                        <Server className="h-4 w-4 text-purple-700" />
                                      </div>
                                    }
                                    size="h-8 w-8"
                                    maxDisplay={4}
                                    previewSize={500}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-xs">🔌 {floorRack.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      ↑ Connected to Central Rack
                                      {floorRack.units && ` • ${floorRack.units}U`}
                                      {floorRack.code && ` • ${floorRack.code}`}
                                    </p>
                                    {floorRack.cableTerminations && floorRack.cableTerminations.length > 0 && (
                                      <div className="text-xs text-purple-700 mt-1 flex flex-wrap gap-1">
                                        {floorRack.cableTerminations.map((term, idx) => (
                                          <span key={idx} className="bg-purple-100 px-2 py-0.5 rounded">
                                            {term.count}x {term.type}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {floorRack.fiberTerminations && floorRack.fiberTerminations.length > 0 && (
                                      <div className="text-xs text-blue-700 mt-1 flex flex-wrap gap-1">
                                        {floorRack.fiberTerminations.map((fiber, idx) => (
                                          <span key={idx} className="bg-blue-100 px-2 py-0.5 rounded">
                                            {fiber.type}: {fiber.terminatedStrands}/{fiber.totalStrands} strands
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {floorRack.images && floorRack.images.length > 0 && (
                                      <p className="text-xs text-purple-600 flex items-center gap-1">
                                        <Camera className="h-3 w-3" />
                                        {floorRack.images.length}
                                      </p>
                                    )}
                                    {floorRack.notes && (
                                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        Notes available
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => editFloorRack(bIdx, fIdx, frIdx)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => addDevice('floor', bIdx, fIdx, frIdx)}
                                      title="Add Device"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <ImageUploadButton
                                      entityType="rack"
                                      entityId={floorRack.id || `temp-floor-rack-${bIdx}-${fIdx}-${frIdx}`}
                                      onUploadSuccess={(url) => {
                                        const newBuildings = [...buildings];
                                        const rack = newBuildings[bIdx].floors[fIdx].floorRacks?.[frIdx];
                                        if (rack) {
                                          if (!rack.images) rack.images = [];
                                          rack.images.push(url);
                                          setBuildings(newBuildings);
                                        }
                                      }}
                                      label=""
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        const newBuildings = [...buildings];
                                        newBuildings[bIdx].floors[fIdx].floorRacks = 
                                          newBuildings[bIdx].floors[fIdx].floorRacks?.filter((_, i) => i !== frIdx) || [];
                                        setBuildings(newBuildings);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Devices in Floor Rack (Infrastructure only - no equipment) */}
                                {floorRack.devices && floorRack.devices.filter(d => !d.itemType).length > 0 && (
                                  <div className="mt-1 ml-11 space-y-1">
                                    {floorRack.devices.filter(d => !d.itemType).map((device, dIdx) => (
                                      <div key={dIdx} className="flex items-center gap-2 p-1.5 bg-white rounded border text-xs group">
                                        <span className="text-base">{getDeviceIcon(device.type)}</span>
                                        <div className="flex-1">
                                          <p className="font-medium">{device.name}</p>
                                          <p className="text-muted-foreground">
                                            {device.type}
                                            {device.ipAddress && ` • ${device.ipAddress}`}
                                            {device.phoneNumber && ` • ${device.phoneNumber}`}
                                          </p>
                                          {device.notes && (
                                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1" title={device.notes}>
                                              <FileText className="h-3 w-3" />
                                              {device.notes.substring(0, 50)}{device.notes.length > 50 ? '...' : ''}
                                            </p>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                          onClick={() => deleteDevice('floor', bIdx, floorRack.devices!.filter(d => !d.itemType).findIndex(d => d === device), fIdx, frIdx)}
                                        >
                                          <X className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                </div>
                                ))
                              ) : (
                                <div className="p-2 bg-yellow-50 rounded border border-yellow-300 border-dashed">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Server className="h-4 w-4 text-yellow-600" />
                                      <p className="text-xs text-yellow-900">⚠️ Add Floor Rack</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addFloorRack(bIdx, fIdx)}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Rooms */}
                              {floor.rooms.length > 0 ? (
                                <div className="space-y-1 mt-2">
                                  {floor.rooms.map((room, rIdx) => (
                                    <div key={rIdx} className="space-y-1">
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border group hover:bg-gray-100"
                                    >
                                      <Link2 className="h-3 w-3 text-gray-400" />
                                      <AvatarGroup
                                        images={room.floorPlanUrl ? [room.floorPlanUrl, ...(room.images || [])] : room.images}
                                        fallbackIcon={
                                          <div className="bg-gray-200 flex items-center justify-center w-full h-full rounded-full">
                                            <Home className="h-3 w-3 text-gray-600" />
                                          </div>
                                        }
                                        size="h-7 w-7"
                                        maxDisplay={4}
                                        previewSize={500}
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium text-xs flex items-center gap-1 flex-wrap">
                                          <span>{room.type === "ROOM" ? "🚪" : room.type === "CLOSET" ? "🗄️" : room.type === "CORRIDOR" ? "🚶" : "📦"} {room.name}</span>
                                          {room.number && <span className="text-muted-foreground">(#{room.number})</span>}
                                          {room.isTypicalRoom && room.identicalRoomsCount && room.identicalRoomsCount > 1 && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                                              ×{room.identicalRoomsCount} rooms
                                            </Badge>
                                          )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {room.connectionType === "FLOOR_RACK" ? (
                                            <>↑ Floor Rack</>
                                          ) : (
                                            <>↑↑ Central Rack (Direct)</>
                                          )}
                                          {(room.outlets || 0) > 0 && (
                                            <span>
                                              {` • ${room.outlets || 0} outlets`}
                                              {room.isTypicalRoom && room.identicalRoomsCount && room.identicalRoomsCount > 1 && (
                                                <span className="text-blue-600 font-semibold"> (Total: {(room.outlets || 0) * room.identicalRoomsCount})</span>
                                              )}
                                            </span>
                                          )}
                                        </p>
                                        {(room.floorPlanUrl || (room.images && room.images.length > 0)) && (
                                          <p className="text-xs text-gray-600 flex items-center gap-1">
                                            {room.floorPlanUrl && <FileImage className="h-3 w-3" />}
                                            {room.images && room.images.length > 0 && (
                                              <>
                                                <Camera className="h-3 w-3" />
                                                {room.images.length}
                                              </>
                                            )}
                                          </p>
                                        )}
                                        {room.notes && (
                                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            Notes available
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => editRoom(bIdx, fIdx, rIdx)}
                                          title="Edit Room"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => addDevice('room', bIdx, fIdx, undefined, rIdx)}
                                          title="Add Device"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                        <ImageUploadButton
                                          entityType="room"
                                          entityId={room.id || `temp-${bIdx}-${fIdx}-${rIdx}`}
                                          onUploadSuccess={(url) => {
                                            const newBuildings = [...buildings];
                                            if (!newBuildings[bIdx].floors[fIdx].rooms[rIdx].images) {
                                              newBuildings[bIdx].floors[fIdx].rooms[rIdx].images = [];
                                            }
                                            newBuildings[bIdx].floors[fIdx].rooms[rIdx].images!.push(url);
                                            setBuildings(newBuildings);
                                          }}
                                          label=""
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                        />
                                        <ImageUploadButton
                                          entityType="room"
                                          entityId={room.id || `temp-${bIdx}-${fIdx}-${rIdx}`}
                                          onUploadSuccess={(url) => {
                                            const newBuildings = [...buildings];
                                            newBuildings[bIdx].floors[fIdx].rooms[rIdx].floorPlanUrl = url;
                                            setBuildings(newBuildings);
                                          }}
                                          label=""
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => deleteRoom(bIdx, fIdx, rIdx)}
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Devices in Room (Infrastructure only - no equipment) */}
                                    {room.devices && room.devices.filter(d => !d.itemType).length > 0 && (
                                      <div className="mt-1 ml-5 space-y-1">
                                        {room.devices.filter(d => !d.itemType).map((device, dIdx) => (
                                          <div key={dIdx} className="flex items-center gap-2 p-1.5 bg-white rounded border text-xs group">
                                            <span className="text-base">{getDeviceIcon(device.type)}</span>
                                            <div className="flex-1">
                                              <p className="font-medium">{device.name}</p>
                                              <p className="text-muted-foreground">
                                                {device.type}
                                                {device.ipAddress && ` • ${device.ipAddress}`}
                                                {device.phoneNumber && ` • ${device.phoneNumber}`}
                                              </p>
                                              {device.notes && (
                                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1" title={device.notes}>
                                                  <FileText className="h-3 w-3" />
                                                  {device.notes.substring(0, 50)}{device.notes.length > 50 ? '...' : ''}
                                                </p>
                                              )}
                                            </div>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                                onClick={() => deleteDevice('room', bIdx, room.devices!.filter(d => !d.itemType).findIndex(d => d === device), fIdx, undefined, rIdx)}
                                              >
                                                <X className="h-3 w-3 text-destructive" />
                                              </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-xs text-muted-foreground">
                                  No rooms added yet. Click "Add Room" above.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Guide */}
      {buildings.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-2">🏗️ QUICK GUIDE</h4>
                <ol className="text-xs space-y-1 text-muted-foreground">
                  <li>1. Add a <strong>Central Rack</strong> to your building (main distribution point)</li>
                  <li>2. Add <strong>Floors</strong> to the building</li>
                  <li>3. Add a <strong>Floor Rack</strong> to each floor (connects to Central Rack)</li>
                  <li>4. Add <strong>Rooms</strong> to each floor</li>
                  <li>5. Choose room connection: <strong>Floor Rack</strong> (typical) or <strong>Central Rack</strong> (direct)</li>
                  <li>6. Click <strong>SAVE</strong> when done</li>
                </ol>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-2">🔗 CONNECTION FLOW</h4>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span>Central Rack (Main)</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-purple-600">↓</span>
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span>Floor Rack (IDF)</span>
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    <span className="text-gray-600">↓</span>
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span>Room → Outlets</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4 mt-2">
                    <span className="text-orange-600">↓↓ (or Direct)</span>
                    <div className="w-3 h-3 rounded bg-gray-400"></div>
                    <span>Room → Outlets</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setNetworkDiagramOpen(true)}
          disabled={buildings.length === 0}
        >
          <Network className="h-4 w-4 mr-2" />
          SHOW DIAGRAM
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            CANCEL
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('equipment')}
            className="flex items-center gap-2"
          >
            <Server className="h-4 w-4" />
            ADD EQUIPMENT
          </Button>
          <Button onClick={handleSave} disabled={loading || buildings.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "SAVING..." : "SAVE STRUCTURE"}
          </Button>
        </div>
      </div>

      {/* Building Dialog */}
      <Dialog open={buildingDialog} onOpenChange={setBuildingDialog}>
        <DialogContent className="max-w-2xl z-[9999]">
          <DialogHeader>
            <DialogTitle>{selectedBuilding !== null ? "EDIT BUILDING" : "ADD BUILDING"}</DialogTitle>
            <DialogDescription>
              {selectedBuilding !== null 
                ? "Update building information." 
                : "Add a new building to your cabling infrastructure survey."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>BUILDING NAME *</Label>
                <Input
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  placeholder="Main Building"
                />
              </div>
              <div>
                <Label>CODE</Label>
                <Input
                  value={buildingForm.code || ""}
                  onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                  placeholder="MB-001"
                />
              </div>
            </div>
            <div>
              <Label>ADDRESS</Label>
              <Input
                value={buildingForm.address || ""}
                onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <Label>NOTES</Label>
              <Textarea
                value={buildingForm.notes || ""}
                onChange={(e) => setBuildingForm({ ...buildingForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBuildingDialog(false)}>
                CANCEL
              </Button>
              <Button onClick={saveBuilding}>
                {selectedBuilding !== null ? "UPDATE BUILDING" : "ADD BUILDING"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Central Rack Dialog */}
      <Dialog open={centralRackDialog} onOpenChange={setCentralRackDialog}>
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>{centralRackForm.id ? "EDIT CENTRAL RACK" : "ADD CENTRAL RACK"}</DialogTitle>
            <DialogDescription>
              {centralRackForm.id ? "Update the central rack information." : "Add the main distribution rack for this building."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>NAME</Label>
              <Input
                value={centralRackForm.name}
                onChange={(e) => setCentralRackForm({ ...centralRackForm, name: e.target.value })}
                placeholder="Central Rack"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CODE</Label>
                <Input
                  value={centralRackForm.code || ""}
                  onChange={(e) => setCentralRackForm({ ...centralRackForm, code: e.target.value })}
                  placeholder="CR-001"
                />
              </div>
              <div>
                <Label>UNITS (U)</Label>
                <Input
                  type="number"
                  value={centralRackForm.units || ""}
                  onChange={(e) => setCentralRackForm({ ...centralRackForm, units: parseInt(e.target.value) })}
                  placeholder="42"
                />
              </div>
            </div>
            <div>
              <Label>LOCATION</Label>
              <Input
                value={centralRackForm.location || ""}
                onChange={(e) => setCentralRackForm({ ...centralRackForm, location: e.target.value })}
                placeholder="Basement Comms Room"
              />
            </div>

            {/* Cable Terminations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>CABLE TERMINATIONS</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCableTermination('central')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Cable Type
                </Button>
              </div>
              {(centralRackForm.cableTerminations || []).map((term, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <Select
                      value={term.type}
                      onValueChange={(value) => updateCableTermination('central', idx, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cable type" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="CAT5E">CAT5E - 1000BASE-T</SelectItem>
                        <SelectItem value="CAT6">CAT6 - 1000BASE-T</SelectItem>
                        <SelectItem value="CAT6A">CAT6A - 10GBASE-T</SelectItem>
                        <SelectItem value="CAT7">CAT7 - 10GBASE-T</SelectItem>
                        <SelectItem value="CAT8">CAT8 - 40GBASE-T</SelectItem>
                        <SelectItem value="OS2">OS2 - Single-Mode Fiber</SelectItem>
                        <SelectItem value="OM3">OM3 - Multi-Mode Fiber</SelectItem>
                        <SelectItem value="OM4">OM4 - Multi-Mode Fiber</SelectItem>
                        <SelectItem value="OM5">OM5 - Multi-Mode Fiber</SelectItem>
                        <SelectItem value="RJ11">RJ11 - Telephone</SelectItem>
                        <SelectItem value="RJ45">RJ45 - Ethernet</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Count"
                      value={term.count || ""}
                      onChange={(e) => updateCableTermination('central', idx, 'count', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCableTermination('central', idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(!centralRackForm.cableTerminations || centralRackForm.cableTerminations.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No cable terminations added yet
                </p>
              )}
            </div>

            {/* Fiber Terminations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>FIBER TERMINATIONS</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFiberTermination('central')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Fiber Cable
                </Button>
              </div>
              {(centralRackForm.fiberTerminations || []).map((fiber, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={fiber.type}
                      onValueChange={(value) => updateFiberTermination('central', idx, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fiber type" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="OS2">OS2 - Single-Mode Fiber</SelectItem>
                        <SelectItem value="OM3">OM3 - Multi-Mode Fiber (50/125)</SelectItem>
                        <SelectItem value="OM4">OM4 - Multi-Mode Fiber (50/125)</SelectItem>
                        <SelectItem value="OM5">OM5 - Multi-Mode Fiber (50/125)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Total Strands</Label>
                        <Input
                          type="number"
                          placeholder="12"
                          value={fiber.totalStrands || ""}
                          onChange={(e) => updateFiberTermination('central', idx, 'totalStrands', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Terminated</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={fiber.terminatedStrands || ""}
                          onChange={(e) => updateFiberTermination('central', idx, 'terminatedStrands', parseInt(e.target.value) || 0)}
                          min="0"
                          max={fiber.totalStrands || 999}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fiber.terminatedStrands || 0} of {fiber.totalStrands || 0} strands terminated 
                      ({fiber.totalStrands && fiber.terminatedStrands ? 
                        Math.round((fiber.terminatedStrands / fiber.totalStrands) * 100) : 0}%)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFiberTermination('central', idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(!centralRackForm.fiberTerminations || centralRackForm.fiberTerminations.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No fiber terminations added yet
                </p>
              )}
            </div>

            <div>
              <Label>NOTES</Label>
              <Textarea
                value={centralRackForm.notes || ""}
                onChange={(e) => setCentralRackForm({ ...centralRackForm, notes: e.target.value })}
                placeholder="Additional rack information..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCentralRackDialog(false)}>
                CANCEL
              </Button>
              <Button onClick={saveCentralRack}>
                {centralRackForm.id ? "UPDATE RACK" : "ADD RACK"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floor Dialog */}
      <Dialog open={floorDialog} onOpenChange={setFloorDialog}>
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>{selectedFloor ? "EDIT FLOOR" : "ADD FLOOR"}</DialogTitle>
            <DialogDescription>
              {selectedFloor ? "Update floor information." : "Add a new floor to this building."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>FLOOR NAME *</Label>
                <Input
                  value={floorForm.name}
                  onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
                  placeholder="Ground Floor"
                />
              </div>
              <div>
                <Label>LEVEL</Label>
                <Input
                  type="number"
                  value={floorForm.level || ""}
                  onChange={(e) => setFloorForm({ ...floorForm, level: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>NOTES</Label>
              <Textarea
                value={floorForm.notes || ""}
                onChange={(e) => setFloorForm({ ...floorForm, notes: e.target.value })}
                placeholder="Floor notes..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFloorDialog(false)}>
                CANCEL
              </Button>
              <Button onClick={saveFloor}>
                {selectedFloor ? "UPDATE FLOOR" : "ADD FLOOR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floor Rack Dialog */}
      <Dialog open={floorRackDialog} onOpenChange={setFloorRackDialog}>
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>{selectedRack ? "EDIT FLOOR RACK" : "ADD FLOOR RACK"}</DialogTitle>
            <DialogDescription>
              {selectedRack ? "Update floor rack information." : "Add a floor rack that connects to the central rack."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>NAME</Label>
              <Input
                value={floorRackForm.name}
                onChange={(e) => setFloorRackForm({ ...floorRackForm, name: e.target.value })}
                placeholder="Floor Rack"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CODE</Label>
                <Input
                  value={floorRackForm.code || ""}
                  onChange={(e) => setFloorRackForm({ ...floorRackForm, code: e.target.value })}
                  placeholder="FR-1"
                />
              </div>
              <div>
                <Label>UNITS (U)</Label>
                <Input
                  type="number"
                  value={floorRackForm.units || ""}
                  onChange={(e) => setFloorRackForm({ ...floorRackForm, units: parseInt(e.target.value) })}
                  placeholder="24"
                />
              </div>
            </div>
            <div>
              <Label>LOCATION</Label>
              <Input
                value={floorRackForm.location || ""}
                onChange={(e) => setFloorRackForm({ ...floorRackForm, location: e.target.value })}
                placeholder="Floor closet"
              />
            </div>

            {/* Cable Terminations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>CABLE TERMINATIONS</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCableTermination('floor')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Cable Type
                </Button>
              </div>
              {(floorRackForm.cableTerminations || []).map((term, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <Select
                      value={term.type}
                      onValueChange={(value) => updateCableTermination('floor', idx, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cable type" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="CAT5E">CAT5E - 1000BASE-T</SelectItem>
                        <SelectItem value="CAT6">CAT6 - 1000BASE-T</SelectItem>
                        <SelectItem value="CAT6A">CAT6A - 10GBASE-T</SelectItem>
                        <SelectItem value="CAT7">CAT7 - 10GBASE-T</SelectItem>
                        <SelectItem value="CAT8">CAT8 - 40GBASE-T</SelectItem>
                        <SelectItem value="OS2">OS2 - Single-Mode Fiber</SelectItem>
                        <SelectItem value="OM3">OM3 - Multi-Mode Fiber</SelectItem>
                        <SelectItem value="OM4">OM4 - Multi-Mode Fiber</SelectItem>
                        <SelectItem value="OM5">OM5 - Multi-Mode Fiber</SelectItem>
                        <SelectItem value="RJ11">RJ11 - Telephone</SelectItem>
                        <SelectItem value="RJ45">RJ45 - Ethernet</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Count"
                      value={term.count || ""}
                      onChange={(e) => updateCableTermination('floor', idx, 'count', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCableTermination('floor', idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(!floorRackForm.cableTerminations || floorRackForm.cableTerminations.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No cable terminations added yet
                </p>
              )}
            </div>

            {/* Fiber Terminations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>FIBER TERMINATIONS</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFiberTermination('floor')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Fiber Cable
                </Button>
              </div>
              {(floorRackForm.fiberTerminations || []).map((fiber, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={fiber.type}
                      onValueChange={(value) => updateFiberTermination('floor', idx, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fiber type" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="OS2">OS2 - Single-Mode Fiber</SelectItem>
                        <SelectItem value="OM3">OM3 - Multi-Mode Fiber (50/125)</SelectItem>
                        <SelectItem value="OM4">OM4 - Multi-Mode Fiber (50/125)</SelectItem>
                        <SelectItem value="OM5">OM5 - Multi-Mode Fiber (50/125)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Total Strands</Label>
                        <Input
                          type="number"
                          placeholder="12"
                          value={fiber.totalStrands || ""}
                          onChange={(e) => updateFiberTermination('floor', idx, 'totalStrands', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Terminated</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={fiber.terminatedStrands || ""}
                          onChange={(e) => updateFiberTermination('floor', idx, 'terminatedStrands', parseInt(e.target.value) || 0)}
                          min="0"
                          max={fiber.totalStrands || 999}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fiber.terminatedStrands || 0} of {fiber.totalStrands || 0} strands terminated 
                      ({fiber.totalStrands && fiber.terminatedStrands ? 
                        Math.round((fiber.terminatedStrands / fiber.totalStrands) * 100) : 0}%)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFiberTermination('floor', idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(!floorRackForm.fiberTerminations || floorRackForm.fiberTerminations.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No fiber terminations added yet
                </p>
              )}
            </div>

            <div>
              <Label>NOTES</Label>
              <Textarea
                value={floorRackForm.notes || ""}
                onChange={(e) => setFloorRackForm({ ...floorRackForm, notes: e.target.value })}
                placeholder="Additional floor rack information..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFloorRackDialog(false)}>
                CANCEL
              </Button>
              <Button onClick={saveFloorRack}>
                {selectedRack ? "UPDATE RACK" : "ADD RACK"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>{selectedRoom ? "EDIT ROOM" : "ADD ROOM"}</DialogTitle>
            <DialogDescription>
              {selectedRoom ? "Update room information." : "Add a room or space to this floor."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ROOM NAME *</Label>
                <Input
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="Room 101"
                />
              </div>
              <div>
                <Label>NUMBER</Label>
                <Input
                  value={roomForm.number || ""}
                  onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
                  placeholder="101"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>TYPE</Label>
                <Select
                  value={roomForm.type}
                  onValueChange={(value) => setRoomForm({ ...roomForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROOM">ROOM</SelectItem>
                    <SelectItem value="CLOSET">CLOSET</SelectItem>
                    <SelectItem value="CORRIDOR">CORRIDOR</SelectItem>
                    <SelectItem value="LOBBY">LOBBY</SelectItem>
                    <SelectItem value="OUTDOOR">OUTDOOR</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CONNECTION</Label>
                <Select
                  value={roomForm.connectionType}
                  onValueChange={(value) => setRoomForm({ ...roomForm, connectionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLOOR_RACK">FLOOR RACK</SelectItem>
                    <SelectItem value="CENTRAL_RACK">CENTRAL RACK (Direct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>NUMBER OF OUTLETS</Label>
              <Input
                type="number"
                value={roomForm.outlets}
                onChange={(e) => setRoomForm({ ...roomForm, outlets: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            {/* Typical Room Configuration */}
            <div className="space-y-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isTypicalRoom"
                  checked={roomForm.isTypicalRoom || false}
                  onChange={(e) => setRoomForm({ ...roomForm, isTypicalRoom: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isTypicalRoom" className="cursor-pointer font-semibold">
                  🏠 Mark as Typical Room
                </Label>
              </div>
              
              {roomForm.isTypicalRoom && (
                <div>
                  <Label>NUMBER OF IDENTICAL ROOMS ON THIS FLOOR</Label>
                  <Input
                    type="number"
                    min="1"
                    value={roomForm.identicalRoomsCount || 1}
                    onChange={(e) => setRoomForm({ ...roomForm, identicalRoomsCount: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will multiply outlets and devices by this number in totals
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>NOTES</Label>
              <Textarea
                value={roomForm.notes || ""}
                onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                placeholder="Additional room information..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRoomDialog(false)}>
                CANCEL
              </Button>
              <Button onClick={saveRoom}>
                {selectedRoom ? "UPDATE ROOM" : "ADD ROOM"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Device Dialog */}
      <Dialog open={deviceDialog} onOpenChange={setDeviceDialog}>
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>ADD DEVICE</DialogTitle>
            <DialogDescription>
              Add a network device, phone, TV, or equipment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>DEVICE NAME *</Label>
                <Input
                  value={deviceForm.name}
                  onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                  placeholder="Main Router"
                />
              </div>
              <div>
                <Label>DEVICE TYPE *</Label>
                <Select
                  value={deviceForm.type}
                  onValueChange={(value: any) => setDeviceForm({ ...deviceForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="ROUTER">🌐 Router</SelectItem>
                    <SelectItem value="SWITCH">🔀 Switch</SelectItem>
                    <SelectItem value="ACCESS_POINT">📡 Access Point</SelectItem>
                    <SelectItem value="PHONE">☎️ Phone</SelectItem>
                    <SelectItem value="TV">📺 TV</SelectItem>
                    <SelectItem value="OTHER">🔌 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>BRAND</Label>
                <Input
                  value={deviceForm.brand || ""}
                  onChange={(e) => setDeviceForm({ ...deviceForm, brand: e.target.value })}
                  placeholder="Cisco, Ubiquiti, etc."
                />
              </div>
              <div>
                <Label>MODEL</Label>
                <Input
                  value={deviceForm.model || ""}
                  onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
                  placeholder="Model number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>IP ADDRESS</Label>
                <Input
                  value={deviceForm.ipAddress || ""}
                  onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <Label>PHONE NUMBER</Label>
                <Input
                  value={deviceForm.phoneNumber || ""}
                  onChange={(e) => setDeviceForm({ ...deviceForm, phoneNumber: e.target.value })}
                  placeholder="Extension or number"
                />
              </div>
            </div>
            <div>
              <Label>NOTES</Label>
              <Textarea
                value={deviceForm.notes || ""}
                onChange={(e) => setDeviceForm({ ...deviceForm, notes: e.target.value })}
                placeholder="Additional device information..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeviceDialog(false)}>
                CANCEL
              </Button>
              <Button onClick={saveDevice}>ADD DEVICE</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Building Connection Dialog */}
      <Dialog open={buildingConnectionDialog} onOpenChange={setBuildingConnectionDialog}>
        <DialogContent className="max-w-2xl z-[9999]">
          <DialogHeader>
            <DialogTitle>CONNECT BUILDINGS</DialogTitle>
            <DialogDescription>
              Create connections between buildings using wireless, fiber, or cable links
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>FROM BUILDING</Label>
              <div className="p-3 bg-muted rounded-md font-semibold">
                {selectedBuildingForConnection !== null && buildings[selectedBuildingForConnection]?.name}
              </div>
            </div>
            
            <div>
              <Label>TO BUILDING</Label>
              {buildings.length <= 1 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                  ⚠️ You need at least 2 buildings to create connections. Please add more buildings first.
                </div>
              ) : (
                <Select
                  value={connectionForm.toBuilding}
                  onValueChange={(value) => setConnectionForm({ ...connectionForm, toBuilding: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target building" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {buildings
                      .map((building, idx) => ({ building, idx }))
                      .filter(({ idx }) => idx !== selectedBuildingForConnection)
                      .map(({ building, idx }) => (
                        <SelectItem key={`building-${idx}`} value={idx.toString()}>
                          {building.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>CONNECTION TYPE</Label>
              <Select
                value={connectionForm.connectionType}
                onValueChange={(value) => setConnectionForm({ ...connectionForm, connectionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="WIRELESS">📡 Wireless (WiFi/WiMAX)</SelectItem>
                  <SelectItem value="FIBER">🔗 Fiber Optic</SelectItem>
                  <SelectItem value="COAXIAL">📺 Coaxial Cable</SelectItem>
                  <SelectItem value="ETHERNET">🌐 Ethernet Cable</SelectItem>
                  <SelectItem value="POWERLINE">⚡ Powerline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>DISTANCE (meters)</Label>
                <Input
                  type="number"
                  value={connectionForm.distance}
                  onChange={(e) => setConnectionForm({ ...connectionForm, distance: e.target.value })}
                  placeholder="Distance"
                />
              </div>
              <div>
                <Label>DESCRIPTION</Label>
                <Input
                  value={connectionForm.description}
                  onChange={(e) => setConnectionForm({ ...connectionForm, description: e.target.value })}
                  placeholder="e.g., Backbone link"
                />
              </div>
            </div>

            {/* Existing Connections */}
            {selectedBuildingForConnection !== null && buildingConnections.filter(conn => 
              conn.fromBuilding === selectedBuildingForConnection || 
              conn.toBuilding === selectedBuildingForConnection
            ).length > 0 && (
              <div className="mt-4">
                <Label>EXISTING CONNECTIONS FOR THIS BUILDING</Label>
                <div className="space-y-2 mt-2">
                  {buildingConnections
                    .filter(conn => 
                      conn.fromBuilding === selectedBuildingForConnection || 
                      conn.toBuilding === selectedBuildingForConnection
                    )
                    .map(connection => {
                      const isOutgoing = connection.fromBuilding === selectedBuildingForConnection;
                      const connectedBuildingIdx = isOutgoing ? connection.toBuilding : connection.fromBuilding;
                      const direction = isOutgoing ? "→" : "←";
                      
                      return (
                        <div key={connection.id} className="flex items-center justify-between p-3 bg-muted rounded border-l-4 border-blue-500">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {direction} {buildings[connectedBuildingIdx]?.name}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {connection.connectionType}
                              </span>
                            </div>
                            {connection.distance && (
                              <p className="text-xs text-muted-foreground">Distance: {connection.distance}m</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBuildingConnection(connection.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBuildingConnectionDialog(false)}>
                CANCEL
              </Button>
              <Button onClick={saveBuildingConnection} disabled={!connectionForm.toBuilding}>
                ADD CONNECTION
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          {showSaveSuccess && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Infrastructure Complete!</h3>
                    <p className="text-sm text-green-700">
                      Now assign future equipment requirements to each infrastructure element below.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveSuccess(false)}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">FUTURE REQUIREMENTS - ASSIGN TO INFRASTRUCTURE</CardTitle>
              <p className="text-sm text-blue-700">
                Review your infrastructure and add products/services to specific locations for installation.
              </p>
            </CardHeader>
          </Card>

          {/* Infrastructure View with Equipment Assignment */}
          <div className="space-y-4">
            {buildings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No infrastructure defined</p>
                  <p className="text-sm">Go to Infrastructure tab to add buildings first</p>
                </CardContent>
              </Card>
            ) : (
              buildings.map((building, bIdx) => (
                <Card key={bIdx} className="border-2 border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Building2 className="h-5 w-5" />
                        {building.name}
                        {building.code && <span className="text-sm text-blue-600">({building.code})</span>}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedElement({ 
                            type: 'building', 
                            buildingIndex: bIdx,
                            buildingName: building.name
                          });
                          setEquipmentSelectionOpen(true);
                        }}
                        className="text-blue-600 border-blue-300 hover:bg-blue-100"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        ADD EQUIPMENT
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {/* Show equipment assigned to building */}
                    {equipment.filter(eq => 
                      eq.infrastructureElement?.type === 'building' && 
                      eq.infrastructureElement?.buildingIndex === bIdx
                    ).length > 0 && (
                      <div className="mb-3 p-2 bg-blue-100 rounded border border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 mb-2">ASSIGNED EQUIPMENT:</p>
                        <div className="space-y-1">
                          {equipment.filter(eq => 
                            eq.infrastructureElement?.type === 'building' && 
                            eq.infrastructureElement?.buildingIndex === bIdx
                          ).map((item, idx) => (
                            <div key={`building-${bIdx}-eq-${idx}`} className="text-xs bg-white p-2 rounded flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {item.type === 'product' ? <Package className="h-3 w-3 text-blue-600" /> : <Settings className="h-3 w-3 text-green-600" />}
                                <span className="font-medium">{item.name}</span>
                                <span className="text-muted-foreground">Qty: {item.quantity}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEquipment(equipment.filter(eq => eq.id !== item.id))}
                                className="h-5 w-5 p-0"
                              >
                                <X className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Central Rack */}
                    {building.centralRack && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-orange-800 flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            {building.centralRack.name}
                          </h4>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedElement({ 
                                  type: 'centralRack', 
                                  buildingIndex: bIdx,
                                  buildingName: building.name,
                                  rackName: building.centralRack?.name || 'Central Rack'
                                });
                                setEquipmentSelectionOpen(true);
                              }}
                              className="text-orange-600 border-orange-300 hover:bg-orange-100"
                            >
                              <Package className="h-3 w-3 mr-1" />
                              ADD EQUIPMENT
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProposedContext({ 
                                  buildingIndex: bIdx, 
                                  floorIndex: -1,
                                  buildingName: building.name,
                                  floorName: 'Building'
                                });
                                setProposedRackDialog(true);
                              }}
                              className="text-green-600 border-green-300 hover:bg-green-100"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              ADD RACK
                            </Button>
                          </div>
                        </div>
                        {/* Show equipment assigned to central rack */}
                        {equipment.filter(eq => 
                          eq.infrastructureElement?.type === 'centralRack' && 
                          eq.infrastructureElement?.buildingIndex === bIdx
                        ).length > 0 && (
                          <div className="space-y-1 mt-2">
                            <p className="text-xs font-semibold text-orange-700">ASSIGNED EQUIPMENT:</p>
                            {equipment.filter(eq => 
                              eq.infrastructureElement?.type === 'centralRack' && 
                              eq.infrastructureElement?.buildingIndex === bIdx
                            ).map((item, idx) => (
                              <div key={`centralrack-${bIdx}-eq-${idx}`} className="text-xs bg-white p-2 rounded flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {item.type === 'product' ? <Package className="h-3 w-3 text-blue-600" /> : <Settings className="h-3 w-3 text-green-600" />}
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-muted-foreground">Qty: {item.quantity}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEquipment(equipment.filter(eq => eq.id !== item.id))}
                                  className="h-5 w-5 p-0"
                                >
                                  <X className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Floors */}
                    {building.floors && building.floors.map((floor, fIdx) => (
                      <div key={fIdx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-green-800 flex items-center gap-2">
                            <Layers3 className="h-4 w-4" />
                            {floor.name}
                          </h4>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedElement({ 
                                  type: 'floor', 
                                  buildingIndex: bIdx, 
                                  floorIndex: fIdx,
                                  buildingName: building.name,
                                  floorName: floor.name
                                });
                                setEquipmentSelectionOpen(true);
                              }}
                              className="text-green-600 border-green-300 hover:bg-green-100"
                            >
                              <Package className="h-3 w-3 mr-1" />
                              ADD EQUIPMENT
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProposedContext({ 
                                  buildingIndex: bIdx, 
                                  floorIndex: fIdx,
                                  buildingName: building.name,
                                  floorName: floor.name
                                });
                                setProposedRoomDialog(true);
                              }}
                              className="text-purple-600 border-purple-300 hover:bg-purple-100"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              ADD ROOM
                            </Button>
                          </div>
                        </div>
                        {/* Show equipment assigned to floor */}
                        {equipment.filter(eq => 
                          eq.infrastructureElement?.type === 'floor' && 
                          eq.infrastructureElement?.buildingIndex === bIdx &&
                          eq.infrastructureElement?.floorIndex === fIdx
                        ).length > 0 && (
                          <div className="space-y-1 mb-3">
                            <p className="text-xs font-semibold text-green-700">ASSIGNED EQUIPMENT:</p>
                            {equipment.filter(eq => 
                              eq.infrastructureElement?.type === 'floor' && 
                              eq.infrastructureElement?.buildingIndex === bIdx &&
                              eq.infrastructureElement?.floorIndex === fIdx
                            ).map((item, idx) => (
                              <div key={`floor-${bIdx}-${fIdx}-eq-${idx}`} className="text-xs bg-white p-2 rounded flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {item.type === 'product' ? <Package className="h-3 w-3 text-blue-600" /> : <Settings className="h-3 w-3 text-green-600" />}
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-muted-foreground">Qty: {item.quantity}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEquipment(equipment.filter(eq => eq.id !== item.id))}
                                  className="h-5 w-5 p-0"
                                >
                                  <X className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Floor Racks */}
                        {floor.floorRacks && floor.floorRacks.map((rack, rIdx) => (
                          <div key={rIdx} className="ml-4 mb-2 p-2 bg-purple-50 border border-purple-200 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-xs text-purple-800 flex items-center gap-1">
                                <Server className="h-3 w-3" />
                                {rack.name}
                              </h5>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedElement({ 
                                      type: 'floorRack', 
                                      buildingIndex: bIdx, 
                                      floorIndex: fIdx, 
                                      rackIndex: rIdx,
                                      buildingName: building.name,
                                      floorName: floor.name,
                                      rackName: rack.name
                                    });
                                    setEquipmentSelectionOpen(true);
                                  }}
                                  className="text-purple-600 border-purple-300 hover:bg-purple-100 h-6"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  ADD EQUIPMENT
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProposedContext({ 
                                      buildingIndex: bIdx, 
                                      floorIndex: fIdx,
                                      buildingName: building.name,
                                      floorName: floor.name
                                    });
                                    setProposedRackDialog(true);
                                  }}
                                  className="text-green-600 border-green-300 hover:bg-green-100 h-6"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  ADD RACK
                                </Button>
                              </div>
                            </div>
                            {/* Show equipment assigned to floor rack */}
                            {equipment.filter(eq => 
                              eq.infrastructureElement?.type === 'floorRack' && 
                              eq.infrastructureElement?.buildingIndex === bIdx &&
                              eq.infrastructureElement?.floorIndex === fIdx &&
                              eq.infrastructureElement?.rackIndex === rIdx
                            ).length > 0 && (
                              <div className="space-y-1 mt-1">
                                {equipment.filter(eq => 
                                  eq.infrastructureElement?.type === 'floorRack' && 
                                  eq.infrastructureElement?.buildingIndex === bIdx &&
                                  eq.infrastructureElement?.floorIndex === fIdx &&
                                  eq.infrastructureElement?.rackIndex === rIdx
                                ).map((item, idx) => (
                                  <div key={`rack-${bIdx}-${fIdx}-${rIdx}-eq-${idx}`} className="text-xs bg-white p-1.5 rounded flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      {item.type === 'product' ? <Package className="h-3 w-3 text-blue-600" /> : <Settings className="h-3 w-3 text-green-600" />}
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-muted-foreground">×{item.quantity}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEquipment(equipment.filter(eq => eq.id !== item.id))}
                                      className="h-4 w-4 p-0"
                                    >
                                      <X className="h-2.5 w-2.5 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Rooms */}
                        {floor.rooms && floor.rooms.map((room, rIdx) => (
                          <div key={rIdx} className="ml-4 mb-2 p-2 bg-gray-50 border border-gray-200 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-xs text-gray-800 flex items-center gap-1">
                                <Home className="h-3 w-3" />
                                {room.name}
                                {room.isTypicalRoom && room.identicalRoomsCount && room.identicalRoomsCount > 1 && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700">
                                    ×{room.identicalRoomsCount}
                                  </Badge>
                                )}
                              </h5>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedElement({ 
                                      type: 'room', 
                                      buildingIndex: bIdx, 
                                      floorIndex: fIdx, 
                                      roomIndex: rIdx,
                                      buildingName: building.name,
                                      floorName: floor.name,
                                      roomName: room.name
                                    });
                                    setEquipmentSelectionOpen(true);
                                  }}
                                  className="text-gray-600 border-gray-300 hover:bg-gray-100 h-6"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  ADD EQUIPMENT
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProposedContext({ 
                                      buildingIndex: bIdx, 
                                      floorIndex: fIdx,
                                      buildingName: building.name,
                                      floorName: floor.name
                                    });
                                    setProposedRoomDialog(true);
                                  }}
                                  className="text-purple-600 border-purple-300 hover:bg-purple-100 h-6"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  ADD ROOM
                                </Button>
                              </div>
                            </div>
                            {/* Show equipment assigned to room */}
                            {equipment.filter(eq => 
                              eq.infrastructureElement?.type === 'room' && 
                              eq.infrastructureElement?.buildingIndex === bIdx &&
                              eq.infrastructureElement?.floorIndex === fIdx &&
                              eq.infrastructureElement?.roomIndex === rIdx
                            ).length > 0 && (
                              <div className="space-y-1 mt-1">
                                {equipment.filter(eq => 
                                  eq.infrastructureElement?.type === 'room' && 
                                  eq.infrastructureElement?.buildingIndex === bIdx &&
                                  eq.infrastructureElement?.floorIndex === fIdx &&
                                  eq.infrastructureElement?.roomIndex === rIdx
                                ).map((item, idx) => (
                                  <div key={`room-${bIdx}-${fIdx}-${rIdx}-eq-${idx}`} className="text-xs bg-white p-1.5 rounded flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      {item.type === 'product' ? <Package className="h-3 w-3 text-blue-600" /> : <Settings className="h-3 w-3 text-green-600" />}
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-muted-foreground">×{item.quantity}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEquipment(equipment.filter(eq => eq.id !== item.id))}
                                      className="h-4 w-4 p-0"
                                    >
                                      <X className="h-2.5 w-2.5 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}

            {/* Building Connections */}
            {buildingConnections.length > 0 && (
              <Card className="border-2 border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2 text-green-800 text-sm">
                    <Link2 className="h-4 w-4" />
                    BUILDING CONNECTIONS
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {buildingConnections.map((connection, cIdx) => (
                      <div key={cIdx} className="flex items-center justify-between p-2 bg-green-100 rounded">
                        <div className="text-sm">
                          <span className="font-medium">
                            {buildings[connection.fromBuilding]?.name || `Building ${connection.fromBuilding}`} ↔ {buildings[connection.toBuilding]?.name || `Building ${connection.toBuilding}`}
                          </span>
                          <span className="text-xs text-green-700 ml-2">
                            ({connection.connectionType})
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedElement({ 
                              type: 'buildingConnection', 
                              connectionIndex: cIdx,
                              connectionName: `Connection ${cIdx + 1}`
                            });
                            setEquipmentSelectionOpen(true);
                          }}
                          className="text-green-600 border-green-300 hover:bg-green-100"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          ADD
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Equipment Selection Modal */}
      <EquipmentSelection
        open={equipmentSelectionOpen}
        onClose={() => {
          setEquipmentSelectionOpen(false);
          setSelectedElement(null);
        }}
        onSave={(newEquipment) => {
          // Add to equipment list only (not to infrastructure)
          console.log('Adding equipment to BOM:', newEquipment);
          console.log('Current equipment count:', equipment.length);
          setEquipment([...equipment, ...newEquipment]);
          console.log('New equipment count:', equipment.length + newEquipment.length);
          setEquipmentSelectionOpen(false);
          setSelectedElement(null);
          toast.success(`Added ${newEquipment.length} item(s) to equipment requirements`);
        }}
        existingEquipment={equipment}
        selectedElement={selectedElement}
      />

      {/* Proposed Infrastructure Dialogs */}
      <ProposedRackDialog
        open={proposedRackDialog}
        onOpenChange={setProposedRackDialog}
        buildingIndex={selectedProposedContext?.buildingIndex || 0}
        floorIndex={selectedProposedContext?.floorIndex || 0}
        buildingName={buildings[selectedProposedContext?.buildingIndex || 0]?.name || 'Building'}
        floorName={selectedProposedContext?.floorIndex && selectedProposedContext.floorIndex >= 0 ? buildings[selectedProposedContext?.buildingIndex || 0]?.floors[selectedProposedContext?.floorIndex || 0]?.name || 'Floor' : 'Building'}
        onAdd={(rack) => {
          // Add to proposed infrastructure
          setProposedInfrastructure(prev => ({
            ...prev,
            proposedFloorRacks: [...prev.proposedFloorRacks, rack]
          }));
          toast.success('Proposed rack added');
        }}
      />

      <ProposedRoomDialog
        open={proposedRoomDialog}
        onOpenChange={setProposedRoomDialog}
        buildingIndex={selectedProposedContext?.buildingIndex || 0}
        floorIndex={selectedProposedContext?.floorIndex || 0}
        buildingName={buildings[selectedProposedContext?.buildingIndex || 0]?.name || 'Building'}
        floorName={buildings[selectedProposedContext?.buildingIndex || 0]?.floors[selectedProposedContext?.floorIndex || 0]?.name || 'Floor'}
        onAdd={(room) => {
          // Add to proposed infrastructure
          setProposedInfrastructure(prev => ({
            ...prev,
            proposedRooms: [...prev.proposedRooms, room]
          }));
          toast.success('Proposed room added');
        }}
      />

      <ProposedOutletDialog
        open={proposedOutletDialog}
        onOpenChange={setProposedOutletDialog}
        roomName="Selected Room"
        onAdd={(outlet) => {
          // Add outlet to the first proposed room or create a new room
          setProposedInfrastructure(prev => {
            const updatedRooms = [...prev.proposedRooms];
            if (updatedRooms.length > 0) {
              updatedRooms[0] = {
                ...updatedRooms[0],
                proposedOutlets: [...updatedRooms[0].proposedOutlets, outlet]
              };
            } else {
              // Create a new room with this outlet
              updatedRooms.push({
                id: `proposed-room-${Date.now()}`,
                name: 'New Room',
                type: 'OFFICE',
                isNew: true,
                notes: '',
                proposedOutlets: [outlet],
                proposedDevices: [],
                buildingIndex: selectedProposedContext?.buildingIndex || 0,
                floorIndex: selectedProposedContext?.floorIndex || 0,
              });
            }
            return {
              ...prev,
              proposedRooms: updatedRooms
            };
          });
          toast.success('Proposed outlet added');
        }}
        onSelectProducts={(outlet) => {
          // Open equipment selection for this outlet
          setSelectedElement({
            type: 'room',
            buildingIndex: selectedProposedContext?.buildingIndex || 0,
            floorIndex: selectedProposedContext?.floorIndex || 0,
            roomIndex: 0,
            buildingName: buildings[selectedProposedContext?.buildingIndex || 0]?.name || 'Building',
            floorName: buildings[selectedProposedContext?.buildingIndex || 0]?.floors[selectedProposedContext?.floorIndex || 0]?.name || 'Floor',
            roomName: outlet.name
          });
          setEquipmentSelectionOpen(true);
        }}
      />

      {/* Network Diagram Modal */}
      <NetworkDiagramModal
        open={networkDiagramOpen}
        onClose={() => setNetworkDiagramOpen(false)}
        buildings={buildings}
        buildingConnections={buildingConnections}
      />
    </div>
  );
}

