"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  Server,
  Layers,
  Cable,
  FileImage,
  MapPin,
  MoreVertical,
  Home,
  Network,
  Wifi,
  Phone,
  Camera,
  Monitor,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { BuildingData, FloorData, CentralRackData, CableTerminationData, TrunkLineData, RouterInterfaceData, RouterConnectionData, SwitchPortData, SwitchConnectionData, VirtualMachineData } from "../comprehensive-infrastructure-wizard";
import { generateBuildingExcelReport } from "@/lib/excel/building-report-excel";
import { ImageUploadButton } from "@/components/site-surveys/image-upload-button";

interface BuildingTreeViewProps {
  building: BuildingData;
  onUpdate: (building: BuildingData) => void;
  onDelete: () => void;
}

export function BuildingTreeView({ building, onUpdate, onDelete }: BuildingTreeViewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [centralRackOpen, setCentralRackOpen] = useState(false);
  const [floorsOpen, setFloorsOpen] = useState(false);
  const [isFutureMode, setIsFutureMode] = useState(false); // Toggle between existing and future proposal mode
  
  // Track which floors are expanded
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  
  // Track which sections are expanded within central rack
  const [expandedCentralRackSections, setExpandedCentralRackSections] = useState<Set<string>>(new Set(['terminations']));
  
  // Track which floor racks are expanded
  const [expandedFloorRacks, setExpandedFloorRacks] = useState<Set<string>>(new Set());
  
  // Track which sections are expanded within each floor rack (rackId -> Set of sectionIds)
  const [expandedFloorRackSections, setExpandedFloorRackSections] = useState<Map<string, Set<string>>>(new Map());
  
  // Track selected ports for bulk operations (switchId -> Set of portIds)
  const [selectedPorts, setSelectedPorts] = useState<Map<string, Set<string>>>(new Map());
  
  // Excel export state
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  
  // Excel export function
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const buffer = await generateBuildingExcelReport(building);
      
      // Create blob and download
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${building.name.replace(/[^a-z0-9]/gi, '_')}_Building_Report.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      alert('Error generating Excel report. Please try again.');
    } finally {
      setIsExportingExcel(false);
    }
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
  
  const toggleCentralRackSection = (section: string) => {
    setExpandedCentralRackSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };
  
  const toggleFloorRack = (rackId: string) => {
    setExpandedFloorRacks(prev => {
      const next = new Set(prev);
      if (next.has(rackId)) {
        next.delete(rackId);
      } else {
        next.add(rackId);
      }
      return next;
    });
  };
  
  const toggleFloorRackSection = (rackId: string, section: string) => {
    setExpandedFloorRackSections(prev => {
      const next = new Map(prev);
      const rackSections = next.get(rackId) || new Set();
      if (rackSections.has(section)) {
        rackSections.delete(section);
      } else {
        rackSections.add(section);
      }
      next.set(rackId, rackSections);
      return next;
    });
  };
  
  // Port selection helpers
  const togglePortSelection = (switchId: string, portId: string) => {
    setSelectedPorts(prev => {
      const next = new Map(prev);
      const switchPorts = next.get(switchId) || new Set();
      if (switchPorts.has(portId)) {
        switchPorts.delete(portId);
      } else {
        switchPorts.add(portId);
      }
      next.set(switchId, switchPorts);
      return next;
    });
  };
  
  const toggleAllPorts = (switchId: string, portIds: string[]) => {
    setSelectedPorts(prev => {
      const next = new Map(prev);
      const switchPorts = next.get(switchId) || new Set();
      const allSelected = portIds.every(id => switchPorts.has(id));
      next.set(switchId, allSelected ? new Set() : new Set(portIds));
      return next;
    });
  };
  
  const getSelectedPortsForSwitch = (switchId: string) => {
    return selectedPorts.get(switchId) || new Set();
  };

  // Add floor
  const addFloor = () => {
    const newFloor: FloorData = {
      id: `floor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Floor ${building.floors.length + 1}`,
      level: building.floors.length + 1,
      isTypical: false,
      racks: [],
      rooms: [],
    };
    onUpdate({ ...building, floors: [...building.floors, newFloor] });
  };

  // Copy floor with all components
  const copyFloor = (floorId: string) => {
    const floorToCopy = building.floors.find(f => f.id === floorId);
    if (!floorToCopy) return;

    // Deep copy the floor with all its components
    const copiedFloor: FloorData = {
      ...floorToCopy,
      id: `floor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${floorToCopy.name} (Copy)`,
      level: building.floors.length + 1,
      // Deep copy racks
      racks: floorToCopy.racks?.map(rack => ({
        ...rack,
        id: `rack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${rack.name} (Copy)`,
        // Deep copy any rack components if they exist
      })) || [],
      // Deep copy rooms
      rooms: floorToCopy.rooms.map(room => ({
        ...room,
        id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${room.name} (Copy)`,
        // Deep copy outlets
        outlets: room.outlets.map(outlet => ({
          ...outlet,
          id: `outlet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: `${outlet.label} (Copy)`,
          connection: {
            ...outlet.connection,
            id: `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }
        })),
        // Deep copy devices
        devices: room.devices.map(device => ({
          ...device,
          id: `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // Clear IP for copied devices
          ip: '',
          services: device.services.map(service => ({
            ...service,
            id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }))
        })),
        // Deep copy connections
        connections: room.connections.map(connection => ({
          ...connection,
          id: `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }))
      })),
    };

    onUpdate({ ...building, floors: [...building.floors, copiedFloor] });
  };

  // Update floor
  const updateFloor = (floorId: string, updates: Partial<FloorData>) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? { ...floor, ...updates } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Delete floor
  const deleteFloor = (floorId: string) => {
    const updatedFloors = building.floors.filter(floor => floor.id !== floorId);
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Add room to floor
  const addRoom = (floorId: string) => {
    const newRoom = {
      id: `room-${Date.now()}`,
      name: '',
      type: '',
      outlets: [],
      devices: [],
      connections: [],
    };
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? { ...floor, rooms: [...floor.rooms, newRoom] } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Add floor rack
  const addFloorRack = (floorId: string) => {
    const floor = building.floors.find(f => f.id === floorId);
    const newRack: any = {
      id: `rack-${Date.now()}`,
      name: `Rack ${(floor?.racks?.length || 0) + 1}`,
      units: 42,
      location: '',
      switches: [],
      connections: [],
    };
    const updatedFloors = building.floors.map(f =>
      f.id === floorId ? { ...f, racks: [...(f.racks || []), newRack] } : f
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Update floor rack
  const updateFloorRack = (floorId: string, rackId: string, updates: any) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        racks: (floor.racks || []).map(rack =>
          rack.id === rackId ? { ...rack, ...updates } : rack
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Delete floor rack
  const deleteFloorRack = (floorId: string, rackId: string) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        racks: (floor.racks || []).filter(rack => rack.id !== rackId)
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Add cable termination to floor rack
  const addFloorRackTermination = (floorId: string, rackId: string) => {
    const newTermination: CableTerminationData = {
      id: `termination-${Date.now()}`,
      cableType: 'CAT6',
      quantity: 0,
      services: [],
      isFutureProposal: isFutureMode,
    };
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        racks: (floor.racks || []).map(rack =>
          rack.id === rackId ? {
            ...rack,
            cableTerminations: [...(rack.cableTerminations || []), newTermination]
          } : rack
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
    
    // Auto-expand the terminations section
    toggleFloorRackSection(rackId, 'terminations');
  };

  // Update cable termination in floor rack
  const updateFloorRackTermination = (floorId: string, rackId: string, terminationId: string, updates: Partial<CableTerminationData>) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        racks: (floor.racks || []).map(rack =>
          rack.id === rackId ? {
            ...rack,
            cableTerminations: (rack.cableTerminations || []).map(term =>
              term.id === terminationId ? { ...term, ...updates } : term
            )
          } : rack
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Delete cable termination from floor rack
  const deleteFloorRackTermination = (floorId: string, rackId: string, terminationId: string) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        racks: (floor.racks || []).map(rack =>
          rack.id === rackId ? {
            ...rack,
            cableTerminations: (rack.cableTerminations || []).filter(term => term.id !== terminationId)
          } : rack
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Add switch to floor rack
  const addFloorRackSwitch = (floorId: string, rackId: string) => {
    const newSwitch: any = {
      id: `sw-${Date.now()}`,
      brand: '',
      model: '',
      ip: '',
      vlans: [],
      ports: [],
      poePorts: 0,
      poeEnabled: false,
      connections: [],
      services: [],
    };
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        racks: (floor.racks || []).map(rack =>
          rack.id === rackId ? {
            ...rack,
            switches: [...(rack.switches || []), newSwitch]
          } : rack
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
    
    // Auto-expand the switches section
    toggleFloorRackSection(rackId, 'switches');
  };

  // Add connection to floor rack
  const addFloorRackConnection = (floorId: string, rackId: string) => {
    const newConn: any = {
      id: `conn-${Date.now()}`,
      fromDevice: '',
      toDevice: '',
      connectionType: 'ETHERNET',
      cableType: '',
      length: 0,
    };
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        racks: (floor.racks || []).map(rack =>
          rack.id === rackId ? {
            ...rack,
            connections: [...(rack.connections || []), newConn]
          } : rack
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
    
    // Auto-expand the connections section
    toggleFloorRackSection(rackId, 'connections');
  };

  // Update room
  const updateRoom = (floorId: string, roomId: string, updates: any) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        rooms: floor.rooms.map(room =>
          room.id === roomId ? { ...room, ...updates } : room
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Delete room
  const deleteRoom = (floorId: string, roomId: string) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        rooms: floor.rooms.filter(room => room.id !== roomId)
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Add outlet to room
  const addOutlet = (floorId: string, roomId: string) => {
    const newOutlet = {
      id: `outlet-${Date.now()}`,
      label: '',
      type: '',
      quantity: 1,
      connection: {
        id: `connection-${Date.now()}`,
        fromDevice: '',
        toDevice: '',
        connectionType: '',
        cableType: '',
      },
    };
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        rooms: floor.rooms.map(room =>
          room.id === roomId ? { ...room, outlets: [...room.outlets, newOutlet] } : room
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Update outlet
  const updateOutlet = (floorId: string, roomId: string, outletId: string, updates: any) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        rooms: floor.rooms.map(room =>
          room.id === roomId ? {
            ...room,
            outlets: room.outlets.map(outlet =>
              outlet.id === outletId ? { ...outlet, ...updates } : outlet
            )
          } : room
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Delete outlet
  const deleteOutlet = (floorId: string, roomId: string, outletId: string) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        rooms: floor.rooms.map(room =>
          room.id === roomId ? {
            ...room,
            outlets: room.outlets.filter(outlet => outlet.id !== outletId)
          } : room
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Add device to room
  const addDevice = (floorId: string, roomId: string) => {
    const newDevice = {
      id: `device-${Date.now()}`,
      type: 'OTHER' as const,
      model: '',
      ip: '',
      quantity: 1,
      services: [],
    };
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        rooms: floor.rooms.map(room =>
          room.id === roomId ? { ...room, devices: [...room.devices, newDevice] } : room
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Duplicate device in room
  const duplicateDevice = (floorId: string, roomId: string, deviceId: string) => {
    const floor = building.floors.find(f => f.id === floorId);
    const room = floor?.rooms.find(r => r.id === roomId);
    const device = room?.devices.find(d => d.id === deviceId);
    
    if (device) {
      const duplicatedDevice = {
        ...device,
        id: `device-${Date.now()}`,
        ip: '', // Clear IP for the duplicate
      };
      
      const updatedFloors = building.floors.map(floor =>
        floor.id === floorId ? {
          ...floor,
          rooms: floor.rooms.map(room =>
            room.id === roomId ? { ...room, devices: [...room.devices, duplicatedDevice] } : room
          )
        } : floor
      );
      onUpdate({ ...building, floors: updatedFloors });
    }
  };

  // Duplicate outlet in room
  const duplicateOutlet = (floorId: string, roomId: string, outletId: string) => {
    const floor = building.floors.find(f => f.id === floorId);
    const room = floor?.rooms.find(r => r.id === roomId);
    const outlet = room?.outlets.find(o => o.id === outletId);
    
    if (outlet) {
      const duplicatedOutlet = {
        ...outlet,
        id: `outlet-${Date.now()}`,
        label: `${outlet.label} (Copy)`, // Add copy indicator
        connection: {
          ...outlet.connection,
          fromDevice: '', // Clear port number for the duplicate
        }
      };
      
      const updatedFloors = building.floors.map(floor =>
        floor.id === floorId ? {
          ...floor,
          rooms: floor.rooms.map(room =>
            room.id === roomId ? { ...room, outlets: [...room.outlets, duplicatedOutlet] } : room
          )
        } : floor
      );
      onUpdate({ ...building, floors: updatedFloors });
    }
  };

  // Update device
  const updateDevice = (floorId: string, roomId: string, deviceId: string, updates: any) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        rooms: floor.rooms.map(room =>
          room.id === roomId ? {
            ...room,
            devices: room.devices.map(device =>
              device.id === deviceId ? { ...device, ...updates } : device
            )
          } : room
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Delete device
  const deleteDevice = (floorId: string, roomId: string, deviceId: string) => {
    const updatedFloors = building.floors.map(floor =>
      floor.id === floorId ? {
        ...floor,
        rooms: floor.rooms.map(room =>
          room.id === roomId ? {
            ...room,
            devices: room.devices.filter(device => device.id !== deviceId)
          } : room
        )
      } : floor
    );
    onUpdate({ ...building, floors: updatedFloors });
  };

  // Add/Update Central Rack
  const updateCentralRack = (updates: Partial<CentralRackData>) => {
    const currentRack = building.centralRack || {
      id: `central-rack-${Date.now()}`,
      name: "Central Rack",
      cableTerminations: [],
      switches: [],
      routers: [],
      servers: [],
      phoneLines: [],
      connections: [],
    };
    onUpdate({ ...building, centralRack: { ...currentRack, ...updates } as CentralRackData });
  };

  // Add cable termination
  const addCableTermination = () => {
    if (!building.centralRack) {
      updateCentralRack({
        cableTerminations: [{
          id: `termination-${Date.now()}`,
          cableType: 'CAT6',
          quantity: 0,
          services: [], // Initialize empty services array
          isFutureProposal: isFutureMode, // Set based on current mode
        }],
      });
    } else {
      const newTermination: CableTerminationData = {
        id: `termination-${Date.now()}`,
        cableType: 'CAT6',
        quantity: 0,
        services: [], // Initialize empty services array
        isFutureProposal: isFutureMode, // Set based on current mode
      };
      updateCentralRack({
        cableTerminations: [...(building.centralRack.cableTerminations || []), newTermination],
      });
    }
  };

  // Add service to termination
  const addServiceToTermination = (terminationId: string) => {
    if (!building.centralRack) return;
    const updatedTerminations = building.centralRack.cableTerminations.map(term => {
      if (term.id === terminationId) {
        const newService = {
          id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          serviceId: '',
          quantity: 1,
        };
        return {
          ...term,
          services: [...(term.services || []), newService],
        };
      }
      return term;
    });
    updateCentralRack({ cableTerminations: updatedTerminations });
  };

  // Update service in termination
  const updateServiceInTermination = (
    terminationId: string,
    serviceId: string,
    updates: Partial<any>
  ) => {
    if (!building.centralRack) return;
    const updatedTerminations = building.centralRack.cableTerminations.map(term => {
      if (term.id === terminationId) {
        return {
          ...term,
          services: term.services.map(srv =>
            srv.id === serviceId ? { ...srv, ...updates } : srv
          ),
        };
      }
      return term;
    });
    updateCentralRack({ cableTerminations: updatedTerminations });
  };

  // Delete service from termination
  const deleteServiceFromTermination = (terminationId: string, serviceId: string) => {
    if (!building.centralRack) return;
    const updatedTerminations = building.centralRack.cableTerminations.map(term => {
      if (term.id === terminationId) {
        return {
          ...term,
          services: term.services.filter(srv => srv.id !== serviceId),
        };
      }
      return term;
    });
    updateCentralRack({ cableTerminations: updatedTerminations });
  };

  // Add equipment to central rack
  const addSwitch = () => {
    if (!building.centralRack) return;
    const newSwitch = {
      id: `switch-${Date.now()}`,
      name: '',
      brand: '',
      model: '',
      ip: '',
      vlans: [],
      ports: [],
      poeEnabled: false,
      poePortsCount: 0,
      connections: [],
      services: [],
    };
    updateCentralRack({
      switches: [...building.centralRack.switches, newSwitch],
    });
    toggleCentralRackSection('switches'); // Auto-expand switches section
  };

  const addRouter = () => {
    if (!building.centralRack) return;
    const newRouter = {
      id: `router-${Date.now()}`,
      name: '',
      brand: '',
      model: '',
      ip: '',
      interfaces: [],
      vlans: [],
      connections: [],
      services: [],
    };
    updateCentralRack({
      routers: [...building.centralRack.routers, newRouter],
    });
    toggleCentralRackSection('routers'); // Auto-expand routers section
  };

  const addPBX = () => {
    if (!building.centralRack) return;
    const newPBX = {
      id: `pbx-${Date.now()}`,
      brand: '',
      model: '',
      type: 'SIP' as const,
      ip: '',
      connection: '',
      pmsIntegration: false,
      pmsName: '',
      trunkLines: [],
      extensions: [],
    };
    updateCentralRack({ pbx: newPBX });
    toggleCentralRackSection('pbx'); // Auto-expand PBX section
  };

  const addServer = () => {
    if (!building.centralRack) return;
    const newServer = {
      id: `server-${Date.now()}`,
      name: '',
      type: '',
      isVirtualized: false,
      virtualMachines: [],
      services: [],
    };
    updateCentralRack({
      servers: [...building.centralRack.servers, newServer],
    });
  };

  const addConnection = () => {
    if (!building.centralRack) return;
    const newConnection = {
      id: `connection-${Date.now()}`,
      fromDevice: '',
      toDevice: '',
      connectionType: '',
    };
    updateCentralRack({
      connections: [...building.centralRack.connections, newConnection],
    });
  };

  // Update cable termination
  const updateCableTermination = (terminationId: string, updates: Partial<CableTerminationData>) => {
    if (!building.centralRack) return;
    const updatedTerminations = building.centralRack.cableTerminations.map(term =>
      term.id === terminationId ? { ...term, ...updates } : term
    );
    updateCentralRack({ cableTerminations: updatedTerminations });
  };

  // Delete cable termination
  const deleteCableTermination = (terminationId: string) => {
    if (!building.centralRack) return;
    const updatedTerminations = building.centralRack.cableTerminations.filter(
      term => term.id !== terminationId
    );
    updateCentralRack({ cableTerminations: updatedTerminations });
  };

  return (
    <Card className="mb-4 border-2 border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 h-8 w-8"
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Building2 className="h-5 w-5 text-primary" />
            <div className="flex-1 max-w-md" onClick={(e) => e.stopPropagation()}>
              <Input
                value={building.name}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdate({ ...building, name: e.target.value });
                }}
                className="h-8 font-semibold"
                placeholder="Building name..."
              />
            </div>
            <Badge variant="outline" className="ml-2">
              {building.floors.length} {building.floors.length === 1 ? 'Floor' : 'Floors'}
            </Badge>
            <div className="ml-4 flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-md border">
              <span className="text-xs font-medium text-muted-foreground">Mode:</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFutureMode(false);
                }}
                className={`text-xs px-2 py-1 rounded ${
                  !isFutureMode
                    ? 'bg-green-100 text-green-700 font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Existing
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFutureMode(true);
                }}
                className={`text-xs px-2 py-1 rounded ${
                  isFutureMode
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Future Proposal
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleExportExcel();
              }}
              disabled={isExportingExcel}
              className="h-8 text-green-600 hover:text-green-700"
              title="Export building report to Excel"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {isExportingExcel ? "Exporting..." : "Excel"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Add to Building</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!building.centralRack) {
                      updateCentralRack({
                        name: "Central Rack",
                        cableTerminations: [],
                      });
                    }
                    setCentralRackOpen(true);
                  }}
                >
                  <Server className="h-4 w-4 mr-2" />
                  Central Rack
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    addFloor();
                    setFloorsOpen(true);
                  }}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Floor
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add images functionality
                  }}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Images
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add blueprints functionality
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Blueprints
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive h-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-4">
          {/* Building Basic Info */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Building Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Building Code</Label>
                <Input
                  value={building.code || ''}
                  onChange={(e) => onUpdate({ ...building, code: e.target.value })}
                  placeholder="e.g., BLD-001"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input
                  value={building.address || ''}
                  onChange={(e) => onUpdate({ ...building, address: e.target.value })}
                  placeholder="Building address"
                  className="h-9"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={building.notes || ''}
                  onChange={(e) => onUpdate({ ...building, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="h-20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Layer 1: Central Rack */}
          <Collapsible open={centralRackOpen} onOpenChange={setCentralRackOpen} className="mb-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                <div className="flex items-center gap-2">
                  {centralRackOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Server className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-sm">Central Rack</span>
                  {building.centralRack && (
                    <Badge variant="secondary" className="ml-2">
                      {building.centralRack.cableTerminations?.length || 0} Terminations
                    </Badge>
                  )}
                </div>
                {building.centralRack ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Add to Central Rack</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addCableTermination(); }}>
                        <Cable className="h-4 w-4 mr-2" />
                        Cable Termination
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addSwitch(); }}>
                        <Network className="h-4 w-4 mr-2" />
                        Switch
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addRouter(); }}>
                        <Wifi className="h-4 w-4 mr-2" />
                        Router
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addPBX(); }}>
                        <Phone className="h-4 w-4 mr-2" />
                        PBX System
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addServer(); }}>
                        <Server className="h-4 w-4 mr-2" />
                        Server
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addConnection(); }}>
                        <Cable className="h-4 w-4 mr-2" />
                        Connection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCentralRack({
                        name: "Central Rack",
                        cableTerminations: [],
                      });
                      setCentralRackOpen(true);
                    }}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Central Rack
                  </Button>
                )}
              </div>
            </CollapsibleTrigger>

            {building.centralRack && (
              <CollapsibleContent className="mt-2 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  {/* Central Rack Basic Info */}
                  <div>
                    <Label className="text-xs">Rack Name</Label>
                    <Input
                      value={building.centralRack.name}
                      onChange={(e) => updateCentralRack({ name: e.target.value })}
                      placeholder="Rack name"
                      className="h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Code</Label>
                      <Input
                        value={building.centralRack.code || ''}
                        onChange={(e) => updateCentralRack({ code: e.target.value })}
                        placeholder="e.g., RACK-C01"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Units (U)</Label>
                      <Input
                        type="number"
                        value={building.centralRack.units || ''}
                        onChange={(e) => updateCentralRack({ units: parseInt(e.target.value) || undefined })}
                        placeholder="42"
                        className="h-9"
                      />
                    </div>
                  </div>

                  {/* Cable Terminations */}
                  <div className="mt-4">
                    <Collapsible 
                      open={expandedCentralRackSections.has('terminations')}
                      onOpenChange={() => toggleCentralRackSection('terminations')}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between mb-3 p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                          <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                            {expandedCentralRackSections.has('terminations') ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Cable className="h-4 w-4" />
                            Cable Terminations
                            <Badge variant="secondary" className="ml-2">
                              {building.centralRack.cableTerminations?.length || 0}
                            </Badge>
                          </Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              addCableTermination();
                              toggleCentralRackSection('terminations');
                            }}
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        {building.centralRack.cableTerminations?.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                        No cable terminations defined. Click "Add Termination" to add one.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {building.centralRack.cableTerminations?.map((termination) => (
                          <div 
                            key={termination.id} 
                            className={`p-2 rounded border ${
                              termination.isFutureProposal 
                                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' 
                                : 'bg-muted/30 border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                                <Badge 
                                  variant={termination.isFutureProposal ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {termination.isFutureProposal ? '🔮 Future Proposal' : '📦 Existing'}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCableTermination(termination.id)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            {termination.isFutureProposal ? (
                              /* Future Proposal: Show product selection */
                              <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-9">
                                  <Label className="text-xs">Product</Label>
                                  <Input
                                    value={termination.productId || ''}
                                    onChange={(e) => updateCableTermination(termination.id, {
                                      productId: e.target.value
                                    })}
                                    placeholder="Select product from catalog..."
                                    className="h-8"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Link to product catalog (services added below)
                                  </p>
                                </div>
                                <div className="col-span-3">
                                  <Label className="text-xs">Quantity</Label>
                                  <Input
                                    type="number"
                                    value={termination.quantity}
                                    onChange={(e) => updateCableTermination(termination.id, {
                                      quantity: parseInt(e.target.value) || 0
                                    })}
                                    className="h-8"
                                    min="0"
                                  />
                                </div>
                                <div className="col-span-12">
                                  <Label className="text-xs">Proposal Notes</Label>
                                  <Textarea
                                    value={termination.proposalNotes || ''}
                                    onChange={(e) => updateCableTermination(termination.id, {
                                      proposalNotes: e.target.value
                                    })}
                                    placeholder="Additional details for the proposal..."
                                    className="h-16 resize-none text-xs"
                                  />
                                </div>
                              </div>
                            ) : (
                              /* Existing: Show descriptive fields */
                              <>
                                <div className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-3">
                                    <Label className="text-xs">Cable Type</Label>
                                    <select
                                      value={termination.cableType}
                                      onChange={(e) => updateCableTermination(termination.id, {
                                        cableType: e.target.value as CableTerminationData['cableType']
                                      })}
                                      className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm"
                                    >
                                      <option value="CAT5e">CAT5e</option>
                                      <option value="CAT6">CAT6</option>
                                      <option value="CAT6A">CAT6A</option>
                                      <option value="CAT7">CAT7</option>
                                      <option value="FIBER_SM">Fiber (SM)</option>
                                      <option value="FIBER_MM">Fiber (MM)</option>
                                      <option value="COAX">Coax</option>
                                      <option value="RJ11">RJ11 (Phone)</option>
                                      <option value="OTHER">Other</option>
                                    </select>
                                  </div>
                                  <div className="col-span-2">
                                    <Label className="text-xs">Cables</Label>
                                    <Input
                                      type="number"
                                      value={termination.quantity}
                                      onChange={(e) => updateCableTermination(termination.id, {
                                        quantity: parseInt(e.target.value) || 0
                                      })}
                                      className="h-8"
                                      min="0"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <Label className="text-xs">From</Label>
                                    <Input
                                      value={termination.fromLocation || ''}
                                      onChange={(e) => updateCableTermination(termination.id, {
                                        fromLocation: e.target.value
                                      })}
                                      placeholder="Source location"
                                      className="h-8"
                                    />
                                  </div>
                                  <div className="col-span-4">
                                    <Label className="text-xs">To</Label>
                                    <Input
                                      value={termination.toLocation || ''}
                                      onChange={(e) => updateCableTermination(termination.id, {
                                        toLocation: e.target.value
                                      })}
                                      placeholder="Destination"
                                      className="h-8"
                                    />
                                  </div>
                                </div>

                                {/* Fiber Optic Specific Fields */}
                                {(termination.cableType === 'FIBER_SM' || termination.cableType === 'FIBER_MM') && (
                                  <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div>
                                      <Label className="text-xs font-semibold flex items-center gap-1">
                                        <Cable className="h-3 w-3" />
                                        Total Fibers per Cable
                                      </Label>
                                      <Input
                                        type="number"
                                        value={termination.totalFibers || ''}
                                        onChange={(e) => updateCableTermination(termination.id, {
                                          totalFibers: parseInt(e.target.value) || undefined
                                        })}
                                        placeholder="e.g., 12, 24, 48"
                                        className="h-8 mt-1"
                                        min="1"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Total strands in each cable
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-semibold flex items-center gap-1">
                                        <Network className="h-3 w-3" />
                                        Terminated Fibers
                                      </Label>
                                      <Input
                                        type="number"
                                        value={termination.terminatedFibers || ''}
                                        onChange={(e) => updateCableTermination(termination.id, {
                                          terminatedFibers: parseInt(e.target.value) || undefined
                                        })}
                                        placeholder="e.g., 8"
                                        className="h-8 mt-1"
                                        min="0"
                                        max={termination.totalFibers || undefined}
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        How many are terminated
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Services Section - Available for both existing and future */}
                            <div className="mt-4 border-t pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-semibold">Associated Services</Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addServiceToTermination(termination.id)}
                                  className="h-6 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Service
                                </Button>
                              </div>
                              
                              {termination.services && termination.services.length > 0 ? (
                                <div className="space-y-2">
                                  {termination.services.map((service) => (
                                    <div
                                      key={service.id}
                                      className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded items-center"
                                    >
                                      <div className="col-span-5">
                                        <Label className="text-xs">Service</Label>
                                        <Input
                                          value={service.serviceId}
                                          onChange={(e) =>
                                            updateServiceInTermination(termination.id, service.id, {
                                              serviceId: e.target.value,
                                            })
                                          }
                                          placeholder="Select service..."
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Qty</Label>
                                        <Input
                                          type="number"
                                          value={service.quantity || 1}
                                          onChange={(e) =>
                                            updateServiceInTermination(termination.id, service.id, {
                                              quantity: parseInt(e.target.value) || 1,
                                            })
                                          }
                                          className="h-7 text-xs"
                                          min="1"
                                        />
                                      </div>
                                      <div className="col-span-4">
                                        <Label className="text-xs">Notes</Label>
                                        <Input
                                          value={service.notes || ''}
                                          onChange={(e) =>
                                            updateServiceInTermination(termination.id, service.id, {
                                              notes: e.target.value,
                                            })
                                          }
                                          placeholder="Service notes..."
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="col-span-1 flex items-end justify-center">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            deleteServiceFromTermination(termination.id, service.id)
                                          }
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  No services added. Click "Add Service" to associate services like cable termination, installation, etc.
                                </p>
                              )}
                            </div>

                            {termination.notes && (
                              <div className="mt-2">
                                <Textarea
                                  value={termination.notes || ''}
                                  onChange={(e) => updateCableTermination(termination.id, {
                                    notes: e.target.value
                                  })}
                                  placeholder="Notes..."
                                  className="h-16 text-xs resize-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Additional Central Rack Components as Collapsible Sections */}
                  
                  {/* PBX */}
                  {building.centralRack?.pbx && building.centralRack && (
                    <div className="mt-4 pt-4 border-t">
                      <Collapsible 
                        open={expandedCentralRackSections.has('pbx')}
                        onOpenChange={() => toggleCentralRackSection('pbx')}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              {expandedCentralRackSections.has('pbx') ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <Phone className="h-3 w-3" />
                              <span className="text-xs font-semibold">PBX System</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {building.centralRack.pbx.type}
                              </Badge>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          {(() => {
                            const pbx = building.centralRack.pbx;
                            if (!pbx) return null;
                            
                            return (
                          <div className="pl-4 space-y-3">
                            {/* PBX Basic Info */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Brand</Label>
                                <Input
                                  value={pbx.brand || ''}
                                  onChange={(e) => updateCentralRack({
                                    pbx: { ...pbx, brand: e.target.value }
                                  })}
                                  placeholder="e.g., Cisco, Avaya"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Model</Label>
                                <Input
                                  value={pbx.model || ''}
                                  onChange={(e) => updateCentralRack({
                                    pbx: { ...pbx, model: e.target.value }
                                  })}
                                  placeholder="Model number"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Type</Label>
                                <select
                                  value={pbx.type}
                                  onChange={(e) => updateCentralRack({
                                    pbx: { ...pbx, type: e.target.value as 'SIP' | 'ANALOG' | 'DIGITAL' }
                                  })}
                                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                                >
                                  <option value="SIP">SIP</option>
                                  <option value="ANALOG">Analog</option>
                                  <option value="DIGITAL">Digital</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">IP Address</Label>
                                <Input
                                  value={pbx.ip || ''}
                                  onChange={(e) => updateCentralRack({
                                    pbx: { ...pbx, ip: e.target.value }
                                  })}
                                  placeholder="192.168.1.100"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Connection to Rack</Label>
                                <Input
                                  value={pbx.connection || ''}
                                  onChange={(e) => updateCentralRack({
                                    pbx: { ...pbx, connection: e.target.value }
                                  })}
                                  placeholder="Which rack/switch"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-3 pt-5">
                                <input
                                  type="checkbox"
                                  id="pms-integration"
                                  checked={pbx.pmsIntegration || false}
                                  onChange={(e) => updateCentralRack({
                                    pbx: { ...pbx, pmsIntegration: e.target.checked }
                                  })}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="pms-integration" className="text-xs cursor-pointer">
                                  PMS Integration
                                </Label>
                              </div>
                            </div>

                            {/* PMS Name if integration enabled */}
                            {pbx.pmsIntegration && (
                              <div>
                                <Label className="text-xs">PMS Name</Label>
                                <Input
                                  value={pbx.pmsName || ''}
                                  onChange={(e) => updateCentralRack({
                                    pbx: { ...pbx, pmsName: e.target.value }
                                  })}
                                  placeholder="e.g., Opera, Fidelio"
                                  className="h-8 text-xs"
                                />
                              </div>
                            )}

                            {/* Trunk Lines */}
                            <div className="pt-3 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-semibold">Trunk Lines (PSTN/ISDN/PRI/SIP)</Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newLine = {
                                      id: `line-${Date.now()}`,
                                      type: 'PSTN' as const,
                                      phoneNumbers: [],
                                    };
                                    updateCentralRack({
                                      pbx: {
                                        ...pbx,
                                        trunkLines: [...(pbx.trunkLines || []), newLine]
                                      }
                                    });
                                  }}
                                  className="h-6 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Line
                                </Button>
                              </div>

                              {pbx.trunkLines?.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  No trunk lines added. Click "Add Line" to add PSTN/ISDN/PRI/SIP lines.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {pbx.trunkLines?.map((line, idx) => (
                                    <Card key={line.id} className="p-2 bg-muted/50">
                                      <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-3">
                                          <Label className="text-xs">Type</Label>
                                          <select
                                            value={line.type}
                                            onChange={(e) => {
                                              const updatedLines = pbx.trunkLines.map(l =>
                                                l.id === line.id ? { ...l, type: e.target.value as TrunkLineData['type'] } : l
                                              );
                                              updateCentralRack({
                                                pbx: { ...pbx, trunkLines: updatedLines }
                                              });
                                            }}
                                            className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                          >
                                            <option value="PSTN">PSTN</option>
                                            <option value="ISDN">ISDN</option>
                                            <option value="PRI">PRI</option>
                                            <option value="SIP">SIP</option>
                                          </select>
                                        </div>
                                        <div className="col-span-3">
                                          <Label className="text-xs">Provider</Label>
                                          <Input
                                            value={line.provider || ''}
                                            onChange={(e) => {
                                              const updatedLines = pbx.trunkLines.map(l =>
                                                l.id === line.id ? { ...l, provider: e.target.value } : l
                                              );
                                              updateCentralRack({
                                                pbx: { ...pbx, trunkLines: updatedLines }
                                              });
                                            }}
                                            placeholder="Telecom provider"
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        {(line.type === 'ISDN' || line.type === 'PRI') && (
                                          <div className="col-span-2">
                                            <Label className="text-xs">Channels</Label>
                                            <Input
                                              type="number"
                                              value={line.channels || ''}
                                              onChange={(e) => {
                                                const updatedLines = pbx.trunkLines.map(l =>
                                                  l.id === line.id ? { ...l, channels: parseInt(e.target.value) || undefined } : l
                                                );
                                                updateCentralRack({
                                                  pbx: { ...pbx, trunkLines: updatedLines }
                                                });
                                              }}
                                              placeholder="# channels"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                        )}
                                        <div className={`${(line.type === 'ISDN' || line.type === 'PRI') ? 'col-span-3' : 'col-span-5'}`}>
                                          <Label className="text-xs">Phone Numbers (comma-separated)</Label>
                                          <Input
                                            value={line.phoneNumbers?.join(', ') || ''}
                                            onChange={(e) => {
                                              const numbers = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                                              const updatedLines = pbx.trunkLines.map(l =>
                                                l.id === line.id ? { ...l, phoneNumbers: numbers } : l
                                              );
                                              updateCentralRack({
                                                pbx: { ...pbx, trunkLines: updatedLines }
                                              });
                                            }}
                                            placeholder="e.g., 555-1234, 555-5678"
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        <div className="col-span-1 flex items-end">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              const updatedLines = pbx.trunkLines.filter(l => l.id !== line.id);
                                              updateCentralRack({
                                                pbx: { ...pbx, trunkLines: updatedLines }
                                              });
                                            }}
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Extensions Summary */}
                            <div className="pt-3 border-t">
                              <Label className="text-xs font-semibold">Extensions</Label>
                              <div className="text-xs text-muted-foreground mt-1">
                                {pbx.extensions?.length || 0} extensions configured
                              </div>
                            </div>
                          </div>
                          );
                          })()}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {/* Switches */}
                  {building.centralRack?.switches && building.centralRack.switches.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Collapsible 
                        open={expandedCentralRackSections.has('switches')}
                        onOpenChange={() => toggleCentralRackSection('switches')}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              {expandedCentralRackSections.has('switches') ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <Network className="h-3 w-3" />
                              <span className="text-xs font-semibold">Switches ({building.centralRack.switches.length})</span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          {(() => {
                            const centralRack = building.centralRack;
                            if (!centralRack) return null;
                            
                            return (
                          <div className="pl-4 space-y-3">
                            {centralRack.switches.map((sw, swIdx) => (
                              <Card key={sw.id} className="p-3 bg-muted/30">
                                {/* Switch Basic Info */}
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                  <div>
                                    <Label className="text-xs">Switch Name</Label>
                                    <Input
                                      value={sw.name ?? ''}
                                      onChange={(e) => {
                                        const updated = centralRack.switches.map((s, i) =>
                                          i === swIdx ? { ...s, name: e.target.value } : s
                                        );
                                        updateCentralRack({ switches: updated });
                                      }}
                                      placeholder="e.g., Access Switch 1"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Brand</Label>
                                    <Input
                                      value={sw.brand ?? ''}
                                      onChange={(e) => {
                                        const updated = centralRack.switches.map((s, i) =>
                                          i === swIdx ? { ...s, brand: e.target.value } : s
                                        );
                                        updateCentralRack({ switches: updated });
                                      }}
                                      placeholder="e.g., Cisco, HP"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Model</Label>
                                    <Input
                                      value={sw.model ?? ''}
                                      onChange={(e) => {
                                        const updated = centralRack.switches.map((s, i) =>
                                          i === swIdx ? { ...s, model: e.target.value } : s
                                        );
                                        updateCentralRack({ switches: updated });
                                      }}
                                      placeholder="Model number"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Port and PoE Configuration */}
                                <div className="grid grid-cols-4 gap-3 mb-3 pb-3 border-b">
                                  <div>
                                    <Label className="text-xs">Total Ports</Label>
                                    <div className="flex gap-1">
                                      <Input
                                        type="number"
                                        value={sw.ports.length}
                                        disabled
                                        className="h-8 text-xs bg-muted flex-1"
                                        title="Auto-calculated from ports below"
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const count = prompt('How many ports to add?', '24');
                                          if (!count) return;
                                          const numPorts = parseInt(count);
                                          if (isNaN(numPorts) || numPorts < 1 || numPorts > 96) {
                                            alert('Please enter a number between 1 and 96');
                                            return;
                                          }
                                          const newPorts = Array.from({ length: numPorts }, (_, i) => ({
                                            id: `port-${Date.now()}-${i}`,
                                            number: `${i + 1}`,
                                            type: 'ETHERNET' as const,
                                            speed: '1Gbps',
                                            isPoe: sw.poeEnabled,
                                          }));
                                          const updated = centralRack.switches.map((s, i) =>
                                            i === swIdx ? { ...s, ports: newPorts } : s
                                          );
                                          updateCentralRack({ switches: updated });
                                        }}
                                        className="h-8 px-2 text-xs"
                                        title="Bulk add ports"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 pt-5">
                                    <input
                                      type="checkbox"
                                      id={`poe-${sw.id}`}
                                      checked={sw.poeEnabled ?? false}
                                      onChange={(e) => {
                                        const updated = centralRack.switches.map((s, i) =>
                                          i === swIdx ? { ...s, poeEnabled: e.target.checked } : s
                                        );
                                        updateCentralRack({ switches: updated });
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor={`poe-${sw.id}`} className="text-xs cursor-pointer font-semibold">
                                      PoE Enabled
                                    </Label>
                                  </div>
                                  {sw.poeEnabled && (
                                    <div>
                                      <Label className="text-xs">PoE Ports Count</Label>
                                      <Input
                                        type="number"
                                        value={sw.poePortsCount ?? 0}
                                        onChange={(e) => {
                                          const updated = centralRack.switches.map((s, i) =>
                                            i === swIdx ? { ...s, poePortsCount: parseInt(e.target.value) || 0 } : s
                                          );
                                          updateCentralRack({ switches: updated });
                                        }}
                                        placeholder="e.g., 24"
                                        className="h-8 text-xs"
                                        min="0"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <Label className="text-xs">IP Address</Label>
                                    <Input
                                      value={sw.ip ?? ''}
                                      onChange={(e) => {
                                        const updated = centralRack.switches.map((s, i) =>
                                          i === swIdx ? { ...s, ip: e.target.value } : s
                                        );
                                        updateCentralRack({ switches: updated });
                                      }}
                                      placeholder="192.168.1.10"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Ports */}
                                <div className="mb-3 pb-3 border-b">
                                  <Collapsible>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <CollapsibleTrigger asChild>
                                          <button className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded transition-colors">
                                            <ChevronDown className="h-3 w-3" />
                                            <Label className="text-xs font-semibold cursor-pointer">
                                              Ports ({sw.ports.length})
                                            </Label>
                                          </button>
                                        </CollapsibleTrigger>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const newPort = {
                                            id: `port-${Date.now()}`,
                                            number: '',
                                            type: 'ETHERNET' as const,
                                            speed: '1Gbps',
                                            isPoe: false,
                                          };
                                          const updated = centralRack.switches.map((s, i) =>
                                            i === swIdx ? { ...s, ports: [...s.ports, newPort] } : s
                                          );
                                          updateCentralRack({ switches: updated });
                                        }}
                                        className="h-6 text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Port
                                      </Button>
                                    </div>
                                    
                                    <CollapsibleContent>
                                      {sw.ports.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-2">No ports configured</p>
                                      ) : (
                                        <>
                                          {/* Bulk Actions Toolbar */}
                                          {(() => {
                                            const selected = getSelectedPortsForSwitch(sw.id);
                                            const allPortIds = sw.ports.map(p => p.id);
                                            const allSelected = sw.ports.length > 0 && allPortIds.every(id => selected.has(id));
                                            
                                            return selected.size > 0 ? (
                                              <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded mb-2 flex items-center justify-between">
                                                <span className="text-xs font-medium">{selected.size} port(s) selected</span>
                                                <div className="flex gap-2">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      const type = prompt('Set type for selected ports:', 'ETHERNET');
                                                      if (!type) return;
                                                      const updated = centralRack.switches.map((s, i) =>
                                                        i === swIdx ? {
                                                          ...s,
                                                          ports: s.ports.map(p =>
                                                            selected.has(p.id) ? { ...p, type: type as any } : p
                                                          )
                                                        } : s
                                                      );
                                                      updateCentralRack({ switches: updated });
                                                    }}
                                                    className="h-6 text-xs"
                                                  >
                                                    Set Type
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      const speed = prompt('Set speed for selected ports:', '1Gbps');
                                                      if (!speed) return;
                                                      const updated = centralRack.switches.map((s, i) =>
                                                        i === swIdx ? {
                                                          ...s,
                                                          ports: s.ports.map(p =>
                                                            selected.has(p.id) ? { ...p, speed } : p
                                                          )
                                                        } : s
                                                      );
                                                      updateCentralRack({ switches: updated });
                                                    }}
                                                    className="h-6 text-xs"
                                                  >
                                                    Set Speed
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      const poe = confirm('Enable PoE for selected ports?');
                                                      const updated = centralRack.switches.map((s, i) =>
                                                        i === swIdx ? {
                                                          ...s,
                                                          ports: s.ports.map(p =>
                                                            selected.has(p.id) ? { ...p, isPoe: poe } : p
                                                          )
                                                        } : s
                                                      );
                                                      updateCentralRack({ switches: updated });
                                                    }}
                                                    className="h-6 text-xs"
                                                  >
                                                    Toggle PoE
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setSelectedPorts(new Map())}
                                                    className="h-6 text-xs"
                                                  >
                                                    Clear
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : null;
                                          })()}
                                          
                                          {/* Select All Checkbox */}
                                          <div className="flex items-center gap-2 mb-2 p-2 bg-muted/30 rounded">
                                            <input
                                              type="checkbox"
                                              id={`select-all-${sw.id}`}
                                              checked={(() => {
                                                const selected = getSelectedPortsForSwitch(sw.id);
                                                const allPortIds = sw.ports.map(p => p.id);
                                                return sw.ports.length > 0 && allPortIds.every(id => selected.has(id));
                                              })()}
                                              onChange={() => toggleAllPorts(sw.id, sw.ports.map(p => p.id))}
                                              className="h-4 w-4"
                                            />
                                            <Label htmlFor={`select-all-${sw.id}`} className="text-xs font-medium cursor-pointer">
                                              Select All Ports
                                            </Label>
                                          </div>
                                          
                                          <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {sw.ports.map((port, portIdx) => (
                                              <div key={port.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded items-center">
                                                <div className="col-span-1 flex items-center justify-center pt-5">
                                                  <input
                                                    type="checkbox"
                                                    checked={getSelectedPortsForSwitch(sw.id).has(port.id)}
                                                    onChange={() => togglePortSelection(sw.id, port.id)}
                                                    className="h-3 w-3"
                                                  />
                                                </div>
                                                <div className="col-span-2">
                                                  <Label className="text-xs">Port #</Label>
                                                  <Input
                                                    value={port.number}
                                                    onChange={(e) => {
                                                      const updated = centralRack.switches.map((s, i) =>
                                                        i === swIdx ? {
                                                          ...s,
                                                          ports: s.ports.map((p, j) =>
                                                            j === portIdx ? { ...p, number: e.target.value } : p
                                                          )
                                                        } : s
                                                      );
                                                      updateCentralRack({ switches: updated });
                                                    }}
                                                    placeholder="1"
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">Type</Label>
                                            <select
                                              value={port.type}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    ports: s.ports.map((p, j) =>
                                                      j === portIdx ? { ...p, type: e.target.value as any } : p
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                            >
                                              <option value="ETHERNET">Ethernet</option>
                                              <option value="FIBER">Fiber</option>
                                              <option value="SFP">SFP</option>
                                              <option value="SFP+">SFP+</option>
                                            </select>
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">Speed</Label>
                                            <Input
                                              value={port.speed}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    ports: s.ports.map((p, j) =>
                                                      j === portIdx ? { ...p, speed: e.target.value } : p
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              placeholder="1Gbps"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2 flex items-center gap-2 pt-5">
                                            <input
                                              type="checkbox"
                                              id={`port-poe-${port.id}`}
                                              checked={port.isPoe ?? false}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    ports: s.ports.map((p, j) =>
                                                      j === portIdx ? { ...p, isPoe: e.target.checked } : p
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              className="h-3 w-3"
                                            />
                                            <Label htmlFor={`port-poe-${port.id}`} className="text-xs cursor-pointer">
                                              PoE
                                            </Label>
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">VLAN</Label>
                                            <Input
                                              value={port.vlanId ?? ''}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    ports: s.ports.map((p, j) =>
                                                      j === portIdx ? { ...p, vlanId: e.target.value } : p
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              placeholder="10"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-end">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                ports: s.ports.filter((_, j) => j !== portIdx)
                                              } : s
                                            );
                                            updateCentralRack({ switches: updated });
                                          }}
                                          className="h-7 w-7 p-0 text-destructive"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      {/* Connections */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold">Connections</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newConnection = {
                                          id: `conn-${Date.now()}`,
                                          fromPort: '',
                                          toDevice: '',
                                        };
                                        const updated = centralRack.switches.map((s, i) =>
                                          i === swIdx ? { ...s, connections: [...s.connections, newConnection] } : s
                                        );
                                        updateCentralRack({ switches: updated });
                                      }}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Connection
                                    </Button>
                                  </div>
                                  {sw.connections.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">No connections configured</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {sw.connections.map((conn, connIdx) => (
                                        <div key={conn.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded">
                                          <div className="col-span-3">
                                            <Label className="text-xs">From Port</Label>
                                            <select
                                              value={conn.fromPort}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    connections: s.connections.map((c, j) =>
                                                      j === connIdx ? { ...c, fromPort: e.target.value } : c
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                            >
                                              <option value="">Select port</option>
                                              {sw.ports.map(port => (
                                                <option key={port.id} value={port.number}>
                                                  Port {port.number} ({port.type})
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">To Device</Label>
                                            <Input
                                              value={conn.toDevice}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    connections: s.connections.map((c, j) =>
                                                      j === connIdx ? { ...c, toDevice: e.target.value } : c
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              placeholder="Device name"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">To Port</Label>
                                            <Input
                                              value={conn.toPort || ''}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    connections: s.connections.map((c, j) =>
                                                      j === connIdx ? { ...c, toPort: e.target.value } : c
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              placeholder="Port"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">Type</Label>
                                            <Input
                                              value={conn.connectionType || ''}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    connections: s.connections.map((c, j) =>
                                                      j === connIdx ? { ...c, connectionType: e.target.value } : c
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              placeholder="Fiber"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-end">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    connections: s.connections.filter((_, j) => j !== connIdx)
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              className="h-7 w-7 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Services */}
                                <div className="mb-3 pb-3 border-b">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold">Services</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newService = {
                                          id: `service-${Date.now()}`,
                                          serviceId: '',
                                          quantity: 1,
                                        };
                                        const updated = centralRack.switches.map((s, i) =>
                                          i === swIdx ? { ...s, services: [...s.services, newService] } : s
                                        );
                                        updateCentralRack({ switches: updated });
                                      }}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Service
                                    </Button>
                                  </div>
                                  {sw.services.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">No services associated</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {sw.services.map((service, svcIdx) => (
                                        <div key={service.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded">
                                          <div className="col-span-6">
                                            <Label className="text-xs">Service</Label>
                                            <Input
                                              value={service.serviceId ?? ''}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    services: s.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, serviceId: e.target.value } : srv
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              placeholder="Select service..."
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">Qty</Label>
                                            <Input
                                              type="number"
                                              value={service.quantity ?? 1}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    services: s.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, quantity: parseInt(e.target.value) || 1 } : srv
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              className="h-7 text-xs"
                                              min="1"
                                            />
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">Notes</Label>
                                            <Input
                                              value={service.notes ?? ''}
                                              onChange={(e) => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    services: s.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, notes: e.target.value } : srv
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              placeholder="Notes..."
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-end">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const updated = centralRack.switches.map((s, i) =>
                                                  i === swIdx ? {
                                                    ...s,
                                                    services: s.services.filter((_, j) => j !== svcIdx)
                                                  } : s
                                                );
                                                updateCentralRack({ switches: updated });
                                              }}
                                              className="h-7 w-7 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Delete Switch Button */}
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const updated = centralRack.switches.filter((_, i) => i !== swIdx);
                                      updateCentralRack({ switches: updated });
                                    }}
                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete Switch
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                          );
                          })()}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {building.centralRack?.routers && building.centralRack.routers.length > 0 && (
                    <div className="mt-2">
                      <Collapsible 
                        open={expandedCentralRackSections.has('routers')}
                        onOpenChange={() => toggleCentralRackSection('routers')}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              {expandedCentralRackSections.has('routers') ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <Wifi className="h-3 w-3" />
                              <span className="text-xs font-semibold">Routers ({building.centralRack.routers.length})</span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          {(() => {
                            const centralRack = building.centralRack;
                            if (!centralRack) return null;
                            
                            return (
                          <div className="pl-4 space-y-3">
                            {centralRack.routers.map((router, routerIdx) => (
                              <Card key={router.id} className="p-3 bg-muted/30">
                                {/* Router Basic Info */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <Label className="text-xs">Router Name</Label>
                                    <Input
                                      value={router.name || ''}
                                      onChange={(e) => {
                                        const updated = centralRack.routers.map((r, i) =>
                                          i === routerIdx ? { ...r, name: e.target.value } : r
                                        );
                                        updateCentralRack({ routers: updated });
                                      }}
                                      placeholder="e.g., Core Router 1"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Brand</Label>
                                    <Input
                                      value={router.brand || ''}
                                      onChange={(e) => {
                                        const updated = centralRack.routers.map((r, i) =>
                                          i === routerIdx ? { ...r, brand: e.target.value } : r
                                        );
                                        updateCentralRack({ routers: updated });
                                      }}
                                      placeholder="e.g., Cisco, Mikrotik"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Model</Label>
                                    <Input
                                      value={router.model || ''}
                                      onChange={(e) => {
                                        const updated = centralRack.routers.map((r, i) =>
                                          i === routerIdx ? { ...r, model: e.target.value } : r
                                        );
                                        updateCentralRack({ routers: updated });
                                      }}
                                      placeholder="Model number"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">IP Address</Label>
                                    <Input
                                      value={router.ip || ''}
                                      onChange={(e) => {
                                        const updated = centralRack.routers.map((r, i) =>
                                          i === routerIdx ? { ...r, ip: e.target.value } : r
                                        );
                                        updateCentralRack({ routers: updated });
                                      }}
                                      placeholder="192.168.1.1"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Interfaces */}
                                <div className="mb-3 pb-3 border-b">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold">Interfaces</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newInterface = {
                                          id: `interface-${Date.now()}`,
                                          name: '',
                                          type: 'ETH' as const,
                                        };
                                        const updated = centralRack.routers.map((r, i) =>
                                          i === routerIdx ? { ...r, interfaces: [...r.interfaces, newInterface] } : r
                                        );
                                        updateCentralRack({ routers: updated });
                                      }}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Interface
                                    </Button>
                                  </div>
                                  {router.interfaces.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">No interfaces added</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {router.interfaces.map((iface, ifaceIdx) => (
                                        <div key={iface.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded">
                                          <div className="col-span-4">
                                            <Label className="text-xs">Name</Label>
                                            <Input
                                              value={iface.name}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    interfaces: r.interfaces.map((inf, j) =>
                                                      j === ifaceIdx ? { ...inf, name: e.target.value } : inf
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="e.g., Gi0/0"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">Type</Label>
                                            <select
                                              value={iface.type}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    interfaces: r.interfaces.map((inf, j) =>
                                                      j === ifaceIdx ? { ...inf, type: e.target.value as any } : inf
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                            >
                                              <option value="ETH">Ethernet</option>
                                              <option value="SFP">SFP</option>
                                              <option value="SFP+">SFP+</option>
                                              <option value="QSFP">QSFP</option>
                                              <option value="OTHER">Other</option>
                                            </select>
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">Speed</Label>
                                            <Input
                                              value={iface.speed || ''}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    interfaces: r.interfaces.map((inf, j) =>
                                                      j === ifaceIdx ? { ...inf, speed: e.target.value } : inf
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="1Gbps"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">VLAN</Label>
                                            <Input
                                              value={iface.vlanId || ''}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    interfaces: r.interfaces.map((inf, j) =>
                                                      j === ifaceIdx ? { ...inf, vlanId: e.target.value } : inf
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="VLAN ID"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-end">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    interfaces: r.interfaces.filter((_, j) => j !== ifaceIdx)
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              className="h-7 w-7 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* VLANs */}
                                <div className="mb-3 pb-3 border-b">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold">VLANs</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newVlan = {
                                          id: `vlan-${Date.now()}`,
                                          name: '',
                                          subnet: '',
                                          port: '',
                                        };
                                        const updated = centralRack.routers.map((r, i) =>
                                          i === routerIdx ? { ...r, vlans: [...r.vlans, newVlan] } : r
                                        );
                                        updateCentralRack({ routers: updated });
                                      }}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add VLAN
                                    </Button>
                                  </div>
                                  {router.vlans.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">No VLANs configured</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {router.vlans.map((vlan, vlanIdx) => (
                                        <div key={vlan.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded">
                                          <div className="col-span-2">
                                            <Label className="text-xs">VLAN ID</Label>
                                            <Input
                                              value={vlan.port}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    vlans: r.vlans.map((v, j) =>
                                                      j === vlanIdx ? { ...v, port: e.target.value } : v
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="10"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-4">
                                            <Label className="text-xs">Name</Label>
                                            <Input
                                              value={vlan.name}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    vlans: r.vlans.map((v, j) =>
                                                      j === vlanIdx ? { ...v, name: e.target.value } : v
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="e.g., Management"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-5">
                                            <Label className="text-xs">Subnet</Label>
                                            <Input
                                              value={vlan.subnet}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    vlans: r.vlans.map((v, j) =>
                                                      j === vlanIdx ? { ...v, subnet: e.target.value } : v
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="192.168.10.0/24"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-end">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    vlans: r.vlans.filter((_, j) => j !== vlanIdx)
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              className="h-7 w-7 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Connections */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold">Connections</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newConnection = {
                                          id: `conn-${Date.now()}`,
                                          from: '',
                                          to: '',
                                          connectionType: '',
                                        };
                                        const updated = centralRack.routers.map((r, i) =>
                                          i === routerIdx ? { ...r, connections: [...r.connections, newConnection] } : r
                                        );
                                        updateCentralRack({ routers: updated });
                                      }}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Connection
                                    </Button>
                                  </div>
                                  {router.connections.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">No connections configured</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {router.connections.map((conn, connIdx) => (
                                        <div key={conn.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded">
                                          <div className="col-span-3">
                                            <Label className="text-xs">From (Interface)</Label>
                                            <select
                                              value={conn.from}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    connections: r.connections.map((c, j) =>
                                                      j === connIdx ? { ...c, from: e.target.value } : c
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                            >
                                              <option value="">Select interface</option>
                                              {router.interfaces.map(iface => (
                                                <option key={iface.id} value={iface.name}>
                                                  {iface.name} ({iface.type})
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">To (Device)</Label>
                                            <Input
                                              value={conn.to}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    connections: r.connections.map((c, j) =>
                                                      j === connIdx ? { ...c, to: e.target.value } : c
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="Device name"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">To Interface</Label>
                                            <Input
                                              value={conn.toInterface || ''}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    connections: r.connections.map((c, j) =>
                                                      j === connIdx ? { ...c, toInterface: e.target.value } : c
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="Interface"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">Type</Label>
                                            <Input
                                              value={conn.connectionType}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    connections: r.connections.map((c, j) =>
                                                      j === connIdx ? { ...c, connectionType: e.target.value } : c
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="e.g., Fiber"
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-end">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    connections: r.connections.filter((_, j) => j !== connIdx)
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              className="h-7 w-7 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Services */}
                                <div className="mb-3 pb-3 border-b">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold">Services</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newService = {
                                          id: `service-${Date.now()}`,
                                          serviceId: '',
                                          quantity: 1,
                                        };
                                        const updated = centralRack.routers.map((r, i) =>
                                          i === routerIdx ? { ...r, services: [...r.services, newService] } : r
                                        );
                                        updateCentralRack({ routers: updated });
                                      }}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Service
                                    </Button>
                                  </div>
                                  {router.services.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">No services associated</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {router.services.map((service, svcIdx) => (
                                        <div key={service.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded">
                                          <div className="col-span-6">
                                            <Label className="text-xs">Service</Label>
                                            <Input
                                              value={service.serviceId ?? ''}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    services: r.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, serviceId: e.target.value } : srv
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="Select service..."
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">Qty</Label>
                                            <Input
                                              type="number"
                                              value={service.quantity ?? 1}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    services: r.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, quantity: parseInt(e.target.value) || 1 } : srv
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              className="h-7 text-xs"
                                              min="1"
                                            />
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">Notes</Label>
                                            <Input
                                              value={service.notes ?? ''}
                                              onChange={(e) => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    services: r.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, notes: e.target.value } : srv
                                                    )
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              placeholder="Notes..."
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-end">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const updated = centralRack.routers.map((r, i) =>
                                                  i === routerIdx ? {
                                                    ...r,
                                                    services: r.services.filter((_, j) => j !== svcIdx)
                                                  } : r
                                                );
                                                updateCentralRack({ routers: updated });
                                              }}
                                              className="h-7 w-7 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Delete Router Button */}
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const updated = centralRack.routers.filter((_, i) => i !== routerIdx);
                                      updateCentralRack({ routers: updated });
                                    }}
                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete Router
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                          );
                          })()}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {building.centralRack.connections && building.centralRack.connections.length > 0 && (
                    <div className="mt-2">
                      <Collapsible 
                        open={expandedCentralRackSections.has('connections')}
                        onOpenChange={() => toggleCentralRackSection('connections')}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              {expandedCentralRackSections.has('connections') ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <Cable className="h-3 w-3" />
                              <span className="text-xs font-semibold">Connections ({building.centralRack.connections.length})</span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="text-xs text-muted-foreground pl-4">
                            {building.centralRack.connections.map(conn => (
                              <div key={conn.id} className="p-2 bg-muted/30 rounded mb-1">
                                {conn.fromDevice} → {conn.toDevice} ({conn.connectionType})
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {/* Servers */}
                  {building.centralRack.servers && building.centralRack.servers.length > 0 && (
                    <div className="mt-2">
                      <Collapsible 
                        open={expandedCentralRackSections.has('servers')}
                        onOpenChange={() => toggleCentralRackSection('servers')}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              {expandedCentralRackSections.has('servers') ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <Server className="h-3 w-3" />
                              <span className="text-xs font-semibold">Servers ({building.centralRack.servers.length})</span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="pl-4 space-y-3">
                            {building.centralRack.servers.map((server, serverIdx) => (
                              <Card key={server.id} className="p-3">
                                {/* Server Basic Info */}
                                <div className="grid grid-cols-12 gap-3 mb-3">
                                  <div className="col-span-4">
                                    <Label className="text-xs">Server Name</Label>
                                    <Input
                                      value={server.name ?? ''}
                                      onChange={(e) => {
                                        const updated = building.centralRack!.servers.map((s, i) =>
                                          i === serverIdx ? { ...s, name: e.target.value } : s
                                        );
                                        updateCentralRack({ servers: updated });
                                      }}
                                      placeholder="e.g., DC01, App Server"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <Label className="text-xs">Brand</Label>
                                    <Input
                                      value={server.brand ?? ''}
                                      onChange={(e) => {
                                        const updated = building.centralRack!.servers.map((s, i) =>
                                          i === serverIdx ? { ...s, brand: e.target.value } : s
                                        );
                                        updateCentralRack({ servers: updated });
                                      }}
                                      placeholder="e.g., Dell, HP"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <Label className="text-xs">Model</Label>
                                    <Input
                                      value={server.model ?? ''}
                                      onChange={(e) => {
                                        const updated = building.centralRack!.servers.map((s, i) =>
                                          i === serverIdx ? { ...s, model: e.target.value } : s
                                        );
                                        updateCentralRack({ servers: updated });
                                      }}
                                      placeholder="Model number"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <Label className="text-xs">IP Address</Label>
                                    <Input
                                      value={server.ip ?? ''}
                                      onChange={(e) => {
                                        const updated = building.centralRack!.servers.map((s, i) =>
                                          i === serverIdx ? { ...s, ip: e.target.value } : s
                                        );
                                        updateCentralRack({ servers: updated });
                                      }}
                                      placeholder="192.168.1.x"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Services */}
                                <div className="mb-3 pb-3 border-b">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-semibold">Services</Label>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newService = {
                                          id: `service-${Date.now()}`,
                                          serviceId: '',
                                          quantity: 1,
                                        };
                                        const updated = building.centralRack!.servers.map((s, i) =>
                                          i === serverIdx ? { ...s, services: [...s.services, newService] } : s
                                        );
                                        updateCentralRack({ servers: updated });
                                      }}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Service
                                    </Button>
                                  </div>
                                  {server.services.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">No services associated</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {server.services.map((service, svcIdx) => (
                                        <div key={service.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded">
                                          <div className="col-span-6">
                                            <Label className="text-xs">Service</Label>
                                            <Input
                                              value={service.serviceId ?? ''}
                                              onChange={(e) => {
                                                const updated = building.centralRack!.servers.map((s, i) =>
                                                  i === serverIdx ? {
                                                    ...s,
                                                    services: s.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, serviceId: e.target.value } : srv
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ servers: updated });
                                              }}
                                              placeholder="Select service..."
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Label className="text-xs">Qty</Label>
                                            <Input
                                              type="number"
                                              value={service.quantity ?? 1}
                                              onChange={(e) => {
                                                const updated = building.centralRack!.servers.map((s, i) =>
                                                  i === serverIdx ? {
                                                    ...s,
                                                    services: s.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, quantity: parseInt(e.target.value) || 1 } : srv
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ servers: updated });
                                              }}
                                              className="h-7 text-xs"
                                              min="1"
                                            />
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-xs">Notes</Label>
                                            <Input
                                              value={service.notes ?? ''}
                                              onChange={(e) => {
                                                const updated = building.centralRack!.servers.map((s, i) =>
                                                  i === serverIdx ? {
                                                    ...s,
                                                    services: s.services.map((srv, j) =>
                                                      j === svcIdx ? { ...srv, notes: e.target.value } : srv
                                                    )
                                                  } : s
                                                );
                                                updateCentralRack({ servers: updated });
                                              }}
                                              placeholder="Notes..."
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="col-span-1 flex items-end">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const updated = building.centralRack!.servers.map((s, i) =>
                                                  i === serverIdx ? {
                                                    ...s,
                                                    services: s.services.filter((_, j) => j !== svcIdx)
                                                  } : s
                                                );
                                                updateCentralRack({ servers: updated });
                                              }}
                                              className="h-7 w-7 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Virtualization */}
                                <div className="mb-3 pb-3 border-b">
                                  <div className="flex items-center gap-3 mb-2">
                                    <input
                                      type="checkbox"
                                      id={`virtualized-${server.id}`}
                                      checked={server.isVirtualized ?? false}
                                      onChange={(e) => {
                                        const updated = building.centralRack!.servers.map((s, i) =>
                                          i === serverIdx ? { ...s, isVirtualized: e.target.checked } : s
                                        );
                                        updateCentralRack({ servers: updated });
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor={`virtualized-${server.id}`} className="text-xs font-semibold cursor-pointer">
                                      Virtualization Enabled
                                    </Label>
                                  </div>

                                  {server.isVirtualized && (
                                    <>
                                      {/* Hypervisor Selection */}
                                      <div className="mb-3">
                                        <Label className="text-xs">Hypervisor</Label>
                                        <select
                                          value={server.hypervisor ?? ''}
                                          onChange={(e) => {
                                            const updated = building.centralRack!.servers.map((s, i) =>
                                              i === serverIdx ? { ...s, hypervisor: e.target.value as any } : s
                                            );
                                            updateCentralRack({ servers: updated });
                                          }}
                                          className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                                        >
                                          <option value="">Select hypervisor...</option>
                                          <option value="VMware ESXi">VMware ESXi</option>
                                          <option value="Hyper-V">Microsoft Hyper-V</option>
                                          <option value="Proxmox">Proxmox VE</option>
                                          <option value="KVM">KVM</option>
                                          <option value="Xen">Xen</option>
                                          <option value="OTHER">Other</option>
                                        </select>
                                      </div>

                                      {/* Virtual Machines */}
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <Label className="text-xs font-semibold">Virtual Machines ({server.virtualMachines.length})</Label>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              const newVM: VirtualMachineData = {
                                                id: `vm-${Date.now()}`,
                                                name: '',
                                                status: 'RUNNING',
                                              };
                                              const updated = building.centralRack!.servers.map((s, i) =>
                                                i === serverIdx ? { ...s, virtualMachines: [...s.virtualMachines, newVM] } : s
                                              );
                                              updateCentralRack({ servers: updated });
                                            }}
                                            className="h-6 text-xs"
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add VM
                                          </Button>
                                        </div>

                                        {server.virtualMachines.length === 0 ? (
                                          <p className="text-xs text-muted-foreground text-center py-2">No virtual machines configured</p>
                                        ) : (
                                          <div className="space-y-2">
                                            {server.virtualMachines.map((vm, vmIdx) => (
                                              <div key={vm.id} className="p-2 bg-muted/50 rounded border">
                                                <div className="grid grid-cols-12 gap-2 mb-2">
                                                  <div className="col-span-5">
                                                    <Label className="text-xs">VM Name</Label>
                                                    <Input
                                                      value={vm.name ?? ''}
                                                      onChange={(e) => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.map((v, j) =>
                                                              j === vmIdx ? { ...v, name: e.target.value } : v
                                                            )
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      placeholder="e.g., DC01, SQL-SERVER"
                                                      className="h-7 text-xs"
                                                    />
                                                  </div>
                                                  <div className="col-span-4">
                                                    <Label className="text-xs">Operating System</Label>
                                                    <Input
                                                      value={vm.os ?? ''}
                                                      onChange={(e) => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.map((v, j) =>
                                                              j === vmIdx ? { ...v, os: e.target.value } : v
                                                            )
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      placeholder="e.g., Windows Server 2022"
                                                      className="h-7 text-xs"
                                                    />
                                                  </div>
                                                  <div className="col-span-2">
                                                    <Label className="text-xs">Status</Label>
                                                    <select
                                                      value={vm.status ?? 'RUNNING'}
                                                      onChange={(e) => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.map((v, j) =>
                                                              j === vmIdx ? { ...v, status: e.target.value as any } : v
                                                            )
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                                    >
                                                      <option value="RUNNING">Running</option>
                                                      <option value="STOPPED">Stopped</option>
                                                      <option value="SUSPENDED">Suspended</option>
                                                    </select>
                                                  </div>
                                                  <div className="col-span-1 flex items-end">
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.filter((_, j) => j !== vmIdx)
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      className="h-7 w-7 p-0 text-destructive"
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                
                                                {/* VM Resources Row */}
                                                <div className="grid grid-cols-12 gap-2 mb-2">
                                                  <div className="col-span-4">
                                                    <Label className="text-xs">Purpose/Role</Label>
                                                    <Input
                                                      value={vm.purpose ?? ''}
                                                      onChange={(e) => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.map((v, j) =>
                                                              j === vmIdx ? { ...v, purpose: e.target.value } : v
                                                            )
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      placeholder="e.g., Domain Controller"
                                                      className="h-7 text-xs"
                                                    />
                                                  </div>
                                                  <div className="col-span-2">
                                                    <Label className="text-xs">vCPUs</Label>
                                                    <Input
                                                      type="number"
                                                      value={vm.cpu ?? ''}
                                                      onChange={(e) => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.map((v, j) =>
                                                              j === vmIdx ? { ...v, cpu: parseInt(e.target.value) || undefined } : v
                                                            )
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      placeholder="4"
                                                      className="h-7 text-xs"
                                                      min="1"
                                                    />
                                                  </div>
                                                  <div className="col-span-2">
                                                    <Label className="text-xs">RAM</Label>
                                                    <Input
                                                      value={vm.ram ?? ''}
                                                      onChange={(e) => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.map((v, j) =>
                                                              j === vmIdx ? { ...v, ram: e.target.value } : v
                                                            )
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      placeholder="8GB"
                                                      className="h-7 text-xs"
                                                    />
                                                  </div>
                                                  <div className="col-span-2">
                                                    <Label className="text-xs">Storage</Label>
                                                    <Input
                                                      value={vm.storage ?? ''}
                                                      onChange={(e) => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.map((v, j) =>
                                                              j === vmIdx ? { ...v, storage: e.target.value } : v
                                                            )
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      placeholder="100GB"
                                                      className="h-7 text-xs"
                                                    />
                                                  </div>
                                                  <div className="col-span-2">
                                                    <Label className="text-xs">IP Address</Label>
                                                    <Input
                                                      value={vm.ip ?? ''}
                                                      onChange={(e) => {
                                                        const updated = building.centralRack!.servers.map((s, i) =>
                                                          i === serverIdx ? {
                                                            ...s,
                                                            virtualMachines: s.virtualMachines.map((v, j) =>
                                                              j === vmIdx ? { ...v, ip: e.target.value } : v
                                                            )
                                                          } : s
                                                        );
                                                        updateCentralRack({ servers: updated });
                                                      }}
                                                      placeholder="192.168.1.x"
                                                      className="h-7 text-xs"
                                                    />
                                                  </div>
                                                </div>

                                                {/* VM Notes */}
                                                <div>
                                                  <Label className="text-xs">Notes</Label>
                                                  <Textarea
                                                    value={vm.notes ?? ''}
                                                    onChange={(e) => {
                                                      const updated = building.centralRack!.servers.map((s, i) =>
                                                        i === serverIdx ? {
                                                          ...s,
                                                          virtualMachines: s.virtualMachines.map((v, j) =>
                                                            j === vmIdx ? { ...v, notes: e.target.value } : v
                                                          )
                                                        } : s
                                                      );
                                                      updateCentralRack({ servers: updated });
                                                    }}
                                                    placeholder="Additional VM notes..."
                                                    className="h-16 resize-none text-xs"
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Delete Server Button */}
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const updated = building.centralRack!.servers.filter((_, i) => i !== serverIdx);
                                      updateCentralRack({ servers: updated });
                                    }}
                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete Server
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>

          {/* Layer 1: Floors */}
          <Collapsible open={floorsOpen} onOpenChange={setFloorsOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors">
                <div className="flex items-center gap-2">
                  {floorsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Layers className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-sm">Floors</span>
                  <Badge variant="secondary" className="ml-2">
                    {building.floors.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      addFloor();
                      setFloorsOpen(true);
                    }}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Floor
                  </Button>
                  {building.floors.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 hover:text-blue-700">
                          <Plus className="h-3 w-3 mr-1" />
                          Copy Floor
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Copy Floor</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {building.floors.map((floor) => (
                          <DropdownMenuItem
                            key={floor.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyFloor(floor.id);
                              setFloorsOpen(true);
                            }}
                          >
                            <Layers className="h-4 w-4 mr-2" />
                            {floor.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 pl-6 border-l-2 border-green-200 dark:border-green-800">
              {building.floors.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                  No floors defined. Click "Add Floor" to add one.
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  {building.floors.map((floor, index) => (
                    <Card key={floor.id} className="bg-muted/20">
                      <div className="p-3 pb-2">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFloor(floor.id)}
                              className="p-1 h-6 w-6"
                            >
                              {expandedFloors.has(floor.id) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                            <Layers className="h-4 w-4 text-green-600" />
                            <Input
                              value={floor.name}
                              onChange={(e) => updateFloor(floor.id, { name: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 max-w-xs font-semibold"
                            />
                            {floor.isTypical && (
                              <Badge variant="secondary" className="text-xs">
                                Typical × {floor.repeatCount || 1}
                              </Badge>
                            )}
                          </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyFloor(floor.id);
                              setFloorsOpen(true);
                            }}
                            className="h-7 text-xs text-blue-600 hover:text-blue-700"
                            title="Copy this floor with all components"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Copy Floor
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Add to Floor</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { 
                                e.stopPropagation(); 
                                addFloorRack(floor.id);
                              }}>
                                <Server className="h-4 w-4 mr-2" />
                                Floor Rack
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { 
                                e.stopPropagation(); 
                                addRoom(floor.id);
                              }}>
                                <Home className="h-4 w-4 mr-2" />
                                Room
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { 
                                e.stopPropagation(); 
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = async (ev: any) => {
                                  const file = ev.target?.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('entityType', 'floor');
                                    formData.append('entityId', floor.id);
                                    try {
                                      const res = await fetch('/api/upload/cabling-image', { method: 'POST', body: formData });
                                      const data = await res.json();
                                      if (data.url) {
                                        updateFloor(floor.id, { 
                                          images: [...(floor.images || []), { id: `img-${Date.now()}`, url: data.url, name: file.name, type: 'IMAGE', size: file.size, uploadedAt: new Date().toISOString() }] 
                                        });
                                      }
                                    } catch (err) { console.error(err); }
                                  }
                                };
                                input.click();
                              }}>
                                <FileImage className="h-4 w-4 mr-2" />
                                Upload Image
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { 
                                e.stopPropagation(); 
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*,.pdf';
                                input.onchange = async (ev: any) => {
                                  const file = ev.target?.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('entityType', 'floor');
                                    formData.append('entityId', floor.id);
                                    try {
                                      const res = await fetch('/api/upload/cabling-image', { method: 'POST', body: formData });
                                      const data = await res.json();
                                      if (data.url) {
                                        updateFloor(floor.id, { 
                                          blueprints: [...(floor.blueprints || []), { id: `bp-${Date.now()}`, url: data.url, name: file.name, type: 'BLUEPRINT', size: file.size, uploadedAt: new Date().toISOString() }] 
                                        });
                                      }
                                    } catch (err) { console.error(err); }
                                  }
                                };
                                input.click();
                              }}>
                                <MapPin className="h-4 w-4 mr-2" />
                                Upload Blueprint
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { 
                                e.stopPropagation(); 
                                const notes = prompt('Enter floor notes:', floor.notes || '');
                                if (notes !== null) {
                                  updateFloor(floor.id, { notes });
                                }
                              }}>
                                <FileText className="h-4 w-4 mr-2" />
                                {floor.notes ? 'Edit' : 'Add'} Notes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteFloor(floor.id)}
                            className="text-destructive hover:text-destructive h-7"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      </div>

                      {expandedFloors.has(floor.id) && (
                        <div className="px-3 pb-3">
                          <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <Label className="text-xs">Level</Label>
                          <Input
                            type="number"
                            value={floor.level}
                            onChange={(e) => updateFloor(floor.id, { level: parseInt(e.target.value) || 0 })}
                            className="h-8"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            id={`typical-${floor.id}`}
                            checked={floor.isTypical}
                            onChange={(e) => updateFloor(floor.id, { isTypical: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`typical-${floor.id}`} className="text-xs cursor-pointer">
                            Typical Floor
                          </Label>
                        </div>
                        {floor.isTypical && (
                          <div>
                            <Label className="text-xs">Repeat Count</Label>
                            <Input
                              type="number"
                              value={floor.repeatCount || 1}
                              onChange={(e) => updateFloor(floor.id, { repeatCount: parseInt(e.target.value) || 1 })}
                              className="h-8"
                              min="1"
                            />
                          </div>
                        )}
                      </div>

                      {/* Optional Notes Display */}
                      {floor.notes && floor.notes.trim() && (
                        <div className="mt-3">
                          <Label className="text-xs">Notes</Label>
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                            <p className="text-xs">{floor.notes}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {floor.racks.length} {floor.racks.length === 1 ? 'Rack' : 'Racks'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {floor.rooms.length} {floor.rooms.length === 1 ? 'Room' : 'Rooms'}
                        </Badge>
                      </div>

                      {/* Floor Racks Section - Collapsible Tree Structure */}
                      {floor.racks && floor.racks.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="text-xs font-semibold mb-3 flex items-center gap-2">
                            <Server className="h-3 w-3 text-purple-600" />
                            Floor Racks ({floor.racks.length})
                          </h5>
                          <div className="space-y-3">
                            {floor.racks.map((rack) => (
                              <Collapsible 
                                key={rack.id}
                                open={expandedFloorRacks.has(rack.id)} 
                                onOpenChange={() => toggleFloorRack(rack.id)}
                              >
                                <div className="border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors">
                                      <div className="flex items-center gap-2">
                                        {expandedFloorRacks.has(rack.id) ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                        <Server className="h-4 w-4 text-purple-600" />
                                        <span className="font-semibold text-sm">{rack.name || 'Floor Rack'}</span>
                                        {rack.location && (
                                          <Badge variant="outline" className="text-xs">{rack.location}</Badge>
                                        )}
                                        <Badge variant="secondary" className="ml-2">
                                          {rack.cableTerminations?.length || 0} Terminations
                                        </Badge>
                                        <Badge variant="secondary">
                                          {rack.switches?.length || 0} Switches
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs"
                                            >
                                              <Plus className="h-3 w-3 mr-1" />
                                              Add
                                              <ChevronDown className="h-3 w-3 ml-1" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Add to {rack.name || 'Rack'}</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => { addFloorRackTermination(floor.id, rack.id); toggleFloorRack(rack.id); }}>
                                              <Cable className="h-4 w-4 mr-2" />
                                              Cable Termination
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { addFloorRackSwitch(floor.id, rack.id); toggleFloorRack(rack.id); }}>
                                              <Network className="h-4 w-4 mr-2" />
                                              Switch
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { addFloorRackConnection(floor.id, rack.id); toggleFloorRack(rack.id); }}>
                                              <Cable className="h-4 w-4 mr-2" />
                                              Connection
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => { e.stopPropagation(); deleteFloorRack(floor.id, rack.id); }}
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent className="px-3 pb-3">
                                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                      {/* Rack Basic Info */}
                                      <div>
                                        <Label className="text-xs">Rack Name</Label>
                                        <Input
                                          value={rack.name || ''}
                                          onChange={(e) => updateFloorRack(floor.id, rack.id, { name: e.target.value })}
                                          placeholder="Rack name"
                                          className="h-9"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-xs">Location</Label>
                                          <Input
                                            value={rack.location || ''}
                                            onChange={(e) => updateFloorRack(floor.id, rack.id, { location: e.target.value })}
                                            placeholder="e.g., Corner A, Near elevator"
                                            className="h-9"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Units (U)</Label>
                                          <Input
                                            type="number"
                                            value={rack.units || ''}
                                            onChange={(e) => updateFloorRack(floor.id, rack.id, { units: parseInt(e.target.value) || 42 })}
                                            placeholder="42"
                                            className="h-9"
                                          />
                                        </div>
                                      </div>

                                      {/* Cable Terminations */}
                                      {rack.cableTerminations && rack.cableTerminations.length > 0 && (
                                        <div className="mt-4">
                                          <Collapsible 
                                            open={expandedFloorRackSections.get(rack.id)?.has('terminations') || false}
                                            onOpenChange={() => toggleFloorRackSection(rack.id, 'terminations')}
                                          >
                                            <CollapsibleTrigger asChild>
                                              <div className="flex items-center justify-between mb-3 p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                                                <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                                                  {expandedFloorRackSections.get(rack.id)?.has('terminations') ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                  )}
                                                  <Cable className="h-4 w-4" />
                                                  Cable Terminations
                                                  <Badge variant="secondary" className="ml-2">
                                                    {rack.cableTerminations.length}
                                                  </Badge>
                                                </Label>
                                              </div>
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                              <div className="space-y-2 pl-6">
                                                {rack.cableTerminations.map((termination) => (
                                                  <div 
                                                    key={termination.id} 
                                                    className={`p-2 rounded border ${
                                                      termination.isFutureProposal 
                                                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' 
                                                        : 'bg-muted/30 border-border'
                                                    }`}
                                                  >
                                                    <div className="flex items-center justify-between mb-2">
                                                      <Badge 
                                                        variant={termination.isFutureProposal ? "default" : "secondary"}
                                                        className="text-xs"
                                                      >
                                                        {termination.isFutureProposal ? '🔮 Future Proposal' : '📦 Existing'}
                                                      </Badge>
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteFloorRackTermination(floor.id, rack.id, termination.id)}
                                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                      >
                                                        <Trash2 className="h-3 w-3" />
                                                      </Button>
                                                    </div>

                                                    <div className="grid grid-cols-12 gap-2 items-center">
                                                      <div className="col-span-3">
                                                        <Label className="text-xs">Cable Type</Label>
                                                        <select
                                                          value={termination.cableType}
                                                          onChange={(e) => updateFloorRackTermination(floor.id, rack.id, termination.id, {
                                                            cableType: e.target.value as CableTerminationData['cableType']
                                                          })}
                                                          className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm"
                                                        >
                                                          <option value="CAT5e">CAT5e</option>
                                                          <option value="CAT6">CAT6</option>
                                                          <option value="CAT6A">CAT6A</option>
                                                          <option value="CAT7">CAT7</option>
                                                          <option value="FIBER_SM">Fiber (SM)</option>
                                                          <option value="FIBER_MM">Fiber (MM)</option>
                                                          <option value="COAX">Coax</option>
                                                          <option value="RJ11">RJ11 (Phone)</option>
                                                          <option value="OTHER">Other</option>
                                                        </select>
                                                      </div>
                                                      <div className="col-span-2">
                                                        <Label className="text-xs">Qty</Label>
                                                        <Input
                                                          type="number"
                                                          value={termination.quantity}
                                                          onChange={(e) => updateFloorRackTermination(floor.id, rack.id, termination.id, {
                                                            quantity: parseInt(e.target.value) || 0
                                                          })}
                                                          className="h-8"
                                                          min="0"
                                                        />
                                                      </div>
                                                      <div className="col-span-3">
                                                        <Label className="text-xs">From</Label>
                                                        <Input
                                                          value={termination.fromLocation || ''}
                                                          onChange={(e) => updateFloorRackTermination(floor.id, rack.id, termination.id, {
                                                            fromLocation: e.target.value
                                                          })}
                                                          placeholder="Source"
                                                          className="h-8"
                                                        />
                                                      </div>
                                                      <div className="col-span-4">
                                                        <Label className="text-xs">To</Label>
                                                        <Input
                                                          value={termination.toLocation || ''}
                                                          onChange={(e) => updateFloorRackTermination(floor.id, rack.id, termination.id, {
                                                            toLocation: e.target.value
                                                          })}
                                                          placeholder="Destination"
                                                          className="h-8"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                        </div>
                                      )}

                                      {/* Switches */}
                                      {rack.switches && rack.switches.length > 0 && (
                                        <div className="mt-4">
                                          <Collapsible 
                                            open={expandedFloorRackSections.get(rack.id)?.has('switches') || false}
                                            onOpenChange={() => toggleFloorRackSection(rack.id, 'switches')}
                                          >
                                            <CollapsibleTrigger asChild>
                                              <div className="flex items-center justify-between mb-3 p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                                                <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                                                  {expandedFloorRackSections.get(rack.id)?.has('switches') ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                  )}
                                                  <Network className="h-4 w-4" />
                                                  Switches
                                                  <Badge variant="secondary" className="ml-2">
                                                    {rack.switches.length}
                                                  </Badge>
                                                </Label>
                                              </div>
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                              <div className="space-y-2 pl-6">
                                                {rack.switches.map((sw) => (
                                                  <div key={sw.id} className="p-2 rounded border bg-muted/30">
                                                    <div className="grid grid-cols-3 gap-2">
                                                      <div>
                                                        <Label className="text-xs">Brand</Label>
                                                        <Input
                                                          value={sw.brand || ''}
                                                          placeholder="e.g., Cisco"
                                                          className="h-7 text-xs"
                                                          readOnly
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs">Model</Label>
                                                        <Input
                                                          value={sw.model || ''}
                                                          placeholder="Model"
                                                          className="h-7 text-xs"
                                                          readOnly
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs">IP</Label>
                                                        <Input
                                                          value={sw.ip || ''}
                                                          placeholder="192.168.1.x"
                                                          className="h-7 text-xs"
                                                          readOnly
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                        </div>
                                      )}

                                      {/* Connections */}
                                      {rack.connections && rack.connections.length > 0 && (
                                        <div className="mt-4">
                                          <Collapsible 
                                            open={expandedFloorRackSections.get(rack.id)?.has('connections') || false}
                                            onOpenChange={() => toggleFloorRackSection(rack.id, 'connections')}
                                          >
                                            <CollapsibleTrigger asChild>
                                              <div className="flex items-center justify-between mb-3 p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50">
                                                <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                                                  {expandedFloorRackSections.get(rack.id)?.has('connections') ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                  )}
                                                  <Cable className="h-4 w-4" />
                                                  Connections
                                                  <Badge variant="secondary" className="ml-2">
                                                    {rack.connections.length}
                                                  </Badge>
                                                </Label>
                                              </div>
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                              <div className="space-y-2 pl-6">
                                                {rack.connections.map((conn) => (
                                                  <div key={conn.id} className="p-2 rounded border bg-muted/30">
                                                    <div className="grid grid-cols-3 gap-2">
                                                      <div>
                                                        <Label className="text-xs">From</Label>
                                                        <Input
                                                          value={conn.fromDevice || ''}
                                                          placeholder="Source"
                                                          className="h-7 text-xs"
                                                          readOnly
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs">To</Label>
                                                        <Input
                                                          value={conn.toDevice || ''}
                                                          placeholder="Destination"
                                                          className="h-7 text-xs"
                                                          readOnly
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs">Type</Label>
                                                        <Input
                                                          value={conn.connectionType || ''}
                                                          className="h-7 text-xs"
                                                          readOnly
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rooms Section */}
                      {floor.rooms.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="text-xs font-semibold mb-3 flex items-center gap-2">
                            <Home className="h-3 w-3" />
                            Rooms ({floor.rooms.length})
                          </h5>
                          <div className="space-y-3">
                            {floor.rooms.map((room, roomIdx) => (
                              <Collapsible key={room.id}>
                                <Card className="p-3 bg-muted/30">
                                  {/* Room Accordion Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <ChevronDown className="h-4 w-4" />
                                        </Button>
                                      </CollapsibleTrigger>
                                      <Home className="h-4 w-4" />
                                      <span className="font-semibold text-sm">{room.name || 'Unnamed Room'}</span>
                                      {room.number && (
                                        <Badge variant="outline" className="text-xs">#{room.number}</Badge>
                                      )}
                                      {room.type && (
                                        <Badge variant="secondary" className="text-xs">{room.type}</Badge>
                                      )}
                                      <Badge variant="default" className="text-xs bg-blue-500">
                                        {room.devices?.length || 0} Device{room.devices?.length !== 1 ? 's' : ''}
                                      </Badge>
                                      <Badge variant="default" className="text-xs bg-green-500">
                                        {room.outlets?.length || 0} Outlet{room.outlets?.length !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteRoom(floor.id, room.id)}
                                      className="h-6 w-6 p-0 text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Room Expandable Content */}
                                  <CollapsibleContent>
                                    <div className="mt-3 pt-3 border-t">
                                      {/* Room Basic Info */}
                                      <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div>
                                          <Label className="text-xs">Room Name</Label>
                                          <Input
                                            value={room.name ?? ''}
                                            onChange={(e) => updateRoom(floor.id, room.id, { name: e.target.value })}
                                            placeholder="e.g., Conference Room A"
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Number</Label>
                                          <Input
                                            value={room.number ?? ''}
                                            onChange={(e) => updateRoom(floor.id, room.id, { number: e.target.value })}
                                            placeholder="e.g., 101"
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Type</Label>
                                          <Input
                                            value={room.type ?? ''}
                                            onChange={(e) => updateRoom(floor.id, room.id, { type: e.target.value })}
                                            placeholder="e.g., Office, Meeting"
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                      </div>

                                {/* Outlets Section */}
                                <div className="mb-3 pb-3 border-t pt-3">
                                  <Collapsible>
                                    <div className="flex items-center justify-between mb-2">
                                      <CollapsibleTrigger asChild>
                                        <button className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded transition-colors">
                                          <ChevronDown className="h-3 w-3" />
                                          <Label className="text-xs font-semibold cursor-pointer">
                                            Outlets ({room.outlets.length})
                                          </Label>
                                        </button>
                                      </CollapsibleTrigger>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addOutlet(floor.id, room.id)}
                                        className="h-6 text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Outlet
                                      </Button>
                                    </div>
                                    
                                    <CollapsibleContent>
                                      {room.outlets.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-2">No outlets configured</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {room.outlets.map((outlet) => {
                                            // Build list of available racks
                                            const availableRacks: { value: string; label: string }[] = [];
                                            
                                            // Add central rack if exists
                                            if (building.centralRack) {
                                              availableRacks.push({
                                                value: `central-rack-${building.centralRack.id}`,
                                                label: `Central Rack - ${building.centralRack.name || 'Main'}`,
                                              });
                                            }
                                            
                                            // Add floor racks from all floors
                                            building.floors.forEach((f) => {
                                              f.racks?.forEach((rack) => {
                                                availableRacks.push({
                                                  value: `floor-rack-${rack.id}`,
                                                  label: `${f.name} - ${rack.name || 'Floor Rack'}`,
                                                });
                                              });
                                            });
                                            
                                            return (
                                              <div key={outlet.id} className="grid grid-cols-12 gap-2 p-2 bg-muted/30 rounded">
                                                <div className="col-span-2">
                                                  <Label className="text-xs">Label</Label>
                                                  <Input
                                                    value={outlet.label ?? ''}
                                                    onChange={(e) => updateOutlet(floor.id, room.id, outlet.id, { label: e.target.value })}
                                                    placeholder="e.g., Wall-1, Desk-A"
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                                <div className="col-span-1">
                                                  <Label className="text-xs">Qty</Label>
                                                  <Input
                                                    type="number"
                                                    value={(outlet as any).quantity ?? 1}
                                                    onChange={(e) => updateOutlet(floor.id, room.id, outlet.id, { quantity: parseInt(e.target.value) || 1 })}
                                                    className="h-7 text-xs"
                                                    min="1"
                                                  />
                                                </div>
                                                <div className="col-span-2">
                                                  <Label className="text-xs">Type</Label>
                                                  <select
                                                    value={outlet.type ?? ''}
                                                    onChange={(e) => updateOutlet(floor.id, room.id, outlet.id, { type: e.target.value })}
                                                    className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                                  >
                                                    <option value="">Select...</option>
                                                    <option value="DATA">Data (RJ45)</option>
                                                    <option value="PHONE">Phone (RJ11)</option>
                                                    <option value="COMBO">Combo (Data+Phone)</option>
                                                    <option value="FIBER">Fiber Optic</option>
                                                    <option value="COAX">Coaxial</option>
                                                    <option value="POWER">Power Only</option>
                                                  </select>
                                                </div>
                                                <div className="col-span-3">
                                                  <Label className="text-xs">Terminates To Rack</Label>
                                                  <select
                                                    value={outlet.connection?.toDevice ?? ''}
                                                    onChange={(e) => updateOutlet(floor.id, room.id, outlet.id, {
                                                      connection: { ...outlet.connection, toDevice: e.target.value }
                                                    })}
                                                    className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                                  >
                                                    <option value="">Select rack...</option>
                                                    {availableRacks.map((rack) => (
                                                      <option key={rack.value} value={rack.value}>
                                                        {rack.label}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div className="col-span-2">
                                                  <Label className="text-xs">Cable Type</Label>
                                                  <select
                                                    value={outlet.connection?.cableType ?? ''}
                                                    onChange={(e) => updateOutlet(floor.id, room.id, outlet.id, {
                                                      connection: { ...outlet.connection, cableType: e.target.value }
                                                    })}
                                                    className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                                  >
                                                    <option value="">Select...</option>
                                                    <option value="CAT5e">CAT5e</option>
                                                    <option value="CAT6">CAT6</option>
                                                    <option value="CAT6A">CAT6A</option>
                                                    <option value="CAT7">CAT7</option>
                                                    <option value="FIBER">Fiber</option>
                                                    <option value="COAX">Coax</option>
                                                  </select>
                                                </div>
                                                <div className="col-span-1">
                                                  <Label className="text-xs">Port #</Label>
                                                  <Input
                                                    value={outlet.connection?.fromDevice ?? ''}
                                                    onChange={(e) => updateOutlet(floor.id, room.id, outlet.id, {
                                                      connection: { ...outlet.connection, fromDevice: e.target.value }
                                                    })}
                                                    placeholder="#"
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                                <div className="col-span-1 flex items-end gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => duplicateOutlet(floor.id, room.id, outlet.id)}
                                                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                                    title="Duplicate outlet"
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteOutlet(floor.id, room.id, outlet.id)}
                                                    className="h-7 w-7 p-0 text-destructive"
                                                    title="Delete outlet"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </CollapsibleContent>
                                  </Collapsible>
                                </div>

                                {/* Devices Section */}
                                <div className="mb-3 pb-3 border-t pt-3">
                                  <Collapsible>
                                    <div className="flex items-center justify-between mb-2">
                                      <CollapsibleTrigger asChild>
                                        <button className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded transition-colors">
                                          <ChevronDown className="h-3 w-3" />
                                          <Label className="text-xs font-semibold cursor-pointer">
                                            Devices ({room.devices.length})
                                          </Label>
                                        </button>
                                      </CollapsibleTrigger>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addDevice(floor.id, room.id)}
                                        className="h-6 text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Device
                                      </Button>
                                    </div>
                                    
                                    <CollapsibleContent>
                                      {room.devices.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-2">No devices configured</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {room.devices.map((device) => (
                                            <div key={device.id} className="p-2 bg-muted/30 rounded border">
                                              <div className="grid grid-cols-12 gap-2 mb-2">
                                                <div className="col-span-2">
                                                  <Label className="text-xs">Device Type</Label>
                                                  <select
                                                    value={device.type ?? 'OTHER'}
                                                    onChange={(e) => updateDevice(floor.id, room.id, device.id, { type: e.target.value })}
                                                    className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                                  >
                                                    <option value="PHONE">Phone (Analog)</option>
                                                    <option value="VOIP_PHONE">VoIP Phone</option>
                                                    <option value="PC">PC/Computer</option>
                                                    <option value="TV">TV</option>
                                                    <option value="AP">Access Point (WiFi)</option>
                                                    <option value="CAMERA">IP Camera</option>
                                                    <option value="IOT">IoT Device</option>
                                                    <option value="OTHER">Other</option>
                                                  </select>
                                                </div>
                                                <div className="col-span-1">
                                                  <Label className="text-xs">Qty</Label>
                                                  <Input
                                                    type="number"
                                                    value={device.quantity ?? 1}
                                                    onChange={(e) => updateDevice(floor.id, room.id, device.id, { quantity: parseInt(e.target.value) || 1 })}
                                                    className="h-7 text-xs"
                                                    min="1"
                                                  />
                                                </div>
                                                <div className="col-span-3">
                                                  <Label className="text-xs">Model</Label>
                                                  <Input
                                                    value={device.model ?? ''}
                                                    onChange={(e) => updateDevice(floor.id, room.id, device.id, { model: e.target.value })}
                                                    placeholder="Device model/brand"
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                                <div className="col-span-2">
                                                  <Label className="text-xs">Brand</Label>
                                                  <Input
                                                    value={device.brand ?? ''}
                                                    onChange={(e) => updateDevice(floor.id, room.id, device.id, { brand: e.target.value })}
                                                    placeholder="Brand"
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                                <div className="col-span-2">
                                                  <Label className="text-xs">IP Address</Label>
                                                  <Input
                                                    value={device.ip ?? ''}
                                                    onChange={(e) => updateDevice(floor.id, room.id, device.id, { ip: e.target.value })}
                                                    placeholder="192.168.x.x"
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                                <div className="col-span-1 flex items-end gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => duplicateDevice(floor.id, room.id, device.id)}
                                                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                                    title="Duplicate device"
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteDevice(floor.id, room.id, device.id)}
                                                    className="h-7 w-7 p-0 text-destructive"
                                                    title="Delete device"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                              
                                              {/* Second row: Outlet assignment and Notes */}
                                              <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-4">
                                                  <Label className="text-xs">Connected to Outlet</Label>
                                                  <select
                                                    value={device.notes?.startsWith('outlet:') ? device.notes.substring(7) : ''}
                                                    onChange={(e) => {
                                                      const outletId = e.target.value;
                                                      const selectedOutlet = room.outlets.find(o => o.id === outletId);
                                                      const outletLabel = selectedOutlet ? selectedOutlet.label : '';
                                                      // Store outlet ID in notes field with prefix
                                                      const newNotes = outletId ? `outlet:${outletId}|${outletLabel}` : '';
                                                      updateDevice(floor.id, room.id, device.id, { 
                                                        notes: newNotes + (device.notes && !device.notes.startsWith('outlet:') ? ' | ' + device.notes : '')
                                                      });
                                                    }}
                                                    className="w-full h-7 px-2 rounded-md border border-input bg-background text-xs"
                                                  >
                                                    <option value="">No outlet / Wireless</option>
                                                    {room.outlets.map((outlet) => (
                                                      <option key={outlet.id} value={outlet.id}>
                                                        {outlet.label || `Outlet ${outlet.type}`} ({outlet.type})
                                                      </option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div className="col-span-8">
                                                  <Label className="text-xs">Additional Notes</Label>
                                                  <Input
                                                    value={(() => {
                                                      // Extract notes without the outlet prefix
                                                      if (!device.notes) return '';
                                                      if (device.notes.startsWith('outlet:')) {
                                                        const parts = device.notes.split(' | ');
                                                        return parts.length > 1 ? parts.slice(1).join(' | ') : '';
                                                      }
                                                      return device.notes;
                                                    })()}
                                                    onChange={(e) => {
                                                      // Preserve outlet prefix if it exists
                                                      let newNotes = e.target.value;
                                                      if (device.notes && device.notes.startsWith('outlet:')) {
                                                        const outletPrefix = device.notes.split(' | ')[0];
                                                        newNotes = e.target.value ? `${outletPrefix} | ${e.target.value}` : outletPrefix;
                                                      }
                                                      updateDevice(floor.id, room.id, device.id, { notes: newNotes });
                                                    }}
                                                    placeholder="Extension, MAC, serial number, etc..."
                                                    className="h-7 text-xs"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </CollapsibleContent>
                                  </Collapsible>
                                </div>
                                    </div>
                                  </CollapsibleContent>
                                </Card>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  );
}

