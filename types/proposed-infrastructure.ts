/**
 * Proposed Infrastructure Types
 * These represent NEW infrastructure elements proposed in the Equipment Tab
 * They are separate from the current infrastructure documented in the Infrastructure Tab
 */

import { SelectedElement, EquipmentItem } from './equipment-selection';

// Cable/Connection types
export type CableType = 'FIBER' | 'COAXIAL' | 'RJ11' | 'RJ45' | 'OTHER';

export interface ProposedOutlet {
  id: string;
  name: string;
  type: CableType;
  quantity: number;
  terminationPoint: string; // Where it terminates (e.g., "Floor Rack 1")
  notes?: string;
  // Associated products/services for this outlet
  associatedProducts: EquipmentItem[]; // Cables, jacks, faceplates, etc.
  associatedServices: EquipmentItem[]; // Installation service, testing, etc.
}

export interface ProposedDevice {
  id: string;
  type: string;
  name: string;
  brand?: string;
  model?: string;
  quantity: number;
  notes?: string;
  // Associated product/service from catalog
  associatedProduct?: EquipmentItem;
  associatedService?: EquipmentItem;
}

export interface ProposedRoom {
  id: string;
  name: string;
  type: 'OFFICE' | 'MEETING_ROOM' | 'CLOSET' | 'CORRIDOR' | 'OTHER';
  isNew: true; // Always true for proposed rooms
  notes?: string;
  // Proposed outlets for this room
  proposedOutlets: ProposedOutlet[];
  // Proposed devices for this room
  proposedDevices: ProposedDevice[];
  // Location context
  buildingIndex: number;
  floorIndex: number;
}

export interface ProposedConnection {
  id: string;
  fromRackId: string; // Can be existing or proposed rack
  toRackId: string;
  connectionType: CableType;
  distance?: number;
  description: string;
  notes?: string;
  // Associated products/services
  associatedProducts: EquipmentItem[]; // Cables, connectors, etc.
  associatedServices: EquipmentItem[]; // Installation, termination, testing
}

export interface ProposedFloorRack {
  id: string;
  name: string;
  code?: string;
  units?: number;
  location?: string;
  isNew: true; // Always true for proposed racks
  notes?: string;
  // Proposed devices in this rack
  proposedDevices: ProposedDevice[];
  // Connections from/to this rack
  connections: ProposedConnection[];
  // Location context
  buildingIndex: number;
  floorIndex: number;
  // Associated products for the rack itself
  associatedProducts: EquipmentItem[]; // The rack itself, PDU, cable management
  associatedServices: EquipmentItem[]; // Installation, configuration
}

export interface ProposedCentralRack {
  id: string;
  name: string;
  code?: string;
  units?: number;
  location?: string;
  isNew: true;
  notes?: string;
  proposedDevices: ProposedDevice[];
  connections: ProposedConnection[];
  buildingIndex: number;
  associatedProducts: EquipmentItem[];
  associatedServices: EquipmentItem[];
}

// Container for all proposed infrastructure
export interface ProposedInfrastructure {
  proposedCentralRacks: ProposedCentralRack[];
  proposedFloorRacks: ProposedFloorRack[];
  proposedRooms: ProposedRoom[];
  proposedConnections: ProposedConnection[]; // General connections not tied to specific racks
}

// Helper to get all equipment from proposed infrastructure
export function getAllProposedEquipment(proposed: ProposedInfrastructure): EquipmentItem[] {
  const equipment: EquipmentItem[] = [];

  // From central racks
  proposed.proposedCentralRacks.forEach(rack => {
    equipment.push(...rack.associatedProducts);
    equipment.push(...rack.associatedServices);
    rack.proposedDevices.forEach(device => {
      if (device.associatedProduct) equipment.push(device.associatedProduct);
      if (device.associatedService) equipment.push(device.associatedService);
    });
    rack.connections.forEach(conn => {
      equipment.push(...conn.associatedProducts);
      equipment.push(...conn.associatedServices);
    });
  });

  // From floor racks
  proposed.proposedFloorRacks.forEach(rack => {
    equipment.push(...rack.associatedProducts);
    equipment.push(...rack.associatedServices);
    rack.proposedDevices.forEach(device => {
      if (device.associatedProduct) equipment.push(device.associatedProduct);
      if (device.associatedService) equipment.push(device.associatedService);
    });
    rack.connections.forEach(conn => {
      equipment.push(...conn.associatedProducts);
      equipment.push(...conn.associatedServices);
    });
  });

  // From rooms
  proposed.proposedRooms.forEach(room => {
    room.proposedOutlets.forEach(outlet => {
      equipment.push(...outlet.associatedProducts);
      equipment.push(...outlet.associatedServices);
    });
    room.proposedDevices.forEach(device => {
      if (device.associatedProduct) equipment.push(device.associatedProduct);
      if (device.associatedService) equipment.push(device.associatedService);
    });
  });

  // General connections
  proposed.proposedConnections.forEach(conn => {
    equipment.push(...conn.associatedProducts);
    equipment.push(...conn.associatedServices);
  });

  return equipment;
}

// Helper to generate location string for proposed element
export function getProposedElementLocation(
  element: ProposedFloorRack | ProposedCentralRack | ProposedRoom,
  buildings: any[]
): string {
  const parts: string[] = [];
  
  if (element.buildingIndex !== undefined && buildings[element.buildingIndex]) {
    const building = buildings[element.buildingIndex];
    parts.push(building.name);
    
    if ('floorIndex' in element && element.floorIndex !== undefined) {
      const floor = building.floors?.[element.floorIndex];
      if (floor) {
        parts.push(floor.name);
      }
    }
    
    parts.push(`[NEW] ${element.name}`);
  }
  
  return parts.join(' → ');
}

