/**
 * Equipment Selection Types
 * Defines the structure for selected infrastructure elements and equipment items
 */

export type InfrastructureElementType = 
  | 'building' 
  | 'centralRack' 
  | 'floor' 
  | 'floorRack' 
  | 'room' 
  | 'buildingConnection';

export interface SelectedElement {
  type: InfrastructureElementType;
  buildingIndex?: number;
  floorIndex?: number;
  rackIndex?: number;
  roomIndex?: number;
  connectionIndex?: number;
  // Actual names for display
  buildingName?: string;
  floorName?: string;
  rackName?: string;
  roomName?: string;
  connectionName?: string;
}

export interface EquipmentItem {
  id: string;
  itemId: string; // The original product or service ID
  name: string;
  type: 'product' | 'service';
  brand?: string;
  model?: string;
  category: string;
  unit: string;
  quantity: number;
  price: number;
  margin?: number; // Profit margin percentage
  totalPrice: number;
  notes?: string;
  // Infrastructure context
  infrastructureElement?: SelectedElement;
}

export interface Product {
  id: string;
  mtrl: string | null;
  code: string | null;
  name: string;
  description: string | null;
  brand: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  manufacturer: {
    id: string;
    name: string;
  } | null;
  unit: {
    id: string;
    name: string;
    shortcut: string | null;
  } | null;
  price: number;
  isActive: boolean;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    isDefault: boolean;
  }>;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  } | null;
}

export interface EquipmentSelectionContext {
  selectedElement: SelectedElement | null;
  onElementSelect: (element: SelectedElement) => void;
  onEquipmentAdd: (equipment: EquipmentItem[], element: SelectedElement) => void;
}

// Helper functions for element type checking
export const isBuildingElement = (element: SelectedElement): boolean => 
  element.type === 'building';

export const isRackElement = (element: SelectedElement): boolean => 
  element.type === 'centralRack' || element.type === 'floorRack';

export const isRoomElement = (element: SelectedElement): boolean => 
  element.type === 'room';

export const isFloorElement = (element: SelectedElement): boolean => 
  element.type === 'floor';

export const isConnectionElement = (element: SelectedElement): boolean => 
  element.type === 'buildingConnection';

// Helper function to get element display name
export const getElementDisplayName = (element: SelectedElement): string => {
  switch (element.type) {
    case 'building':
      return element.buildingName || 'Building';
    case 'centralRack':
      return element.rackName || 'Central Rack';
    case 'floor':
      return element.floorName || 'Floor';
    case 'floorRack':
      return element.rackName || 'Floor Rack';
    case 'room':
      return element.roomName || 'Room';
    case 'buildingConnection':
      return element.connectionName || 'Building Connection';
    default:
      return 'Unknown Element';
  }
};

// Helper function to get element context path
export const getElementContextPath = (element: SelectedElement): string => {
  const parts: string[] = [];
  
  if (element.buildingName) {
    parts.push(element.buildingName);
  } else if (element.buildingIndex !== undefined) {
    parts.push(`Building ${element.buildingIndex + 1}`);
  }
  
  if (element.floorName) {
    parts.push(element.floorName);
  } else if (element.floorIndex !== undefined) {
    parts.push(`Floor ${element.floorIndex + 1}`);
  }
  
  if (element.rackName) {
    parts.push(element.rackName);
  } else if (element.rackIndex !== undefined) {
    parts.push(`Rack ${element.rackIndex + 1}`);
  }
  
  if (element.roomName) {
    parts.push(element.roomName);
  } else if (element.roomIndex !== undefined) {
    parts.push(`Room ${element.roomIndex + 1}`);
  }
  
  if (element.connectionName) {
    parts.push(element.connectionName);
  } else if (element.connectionIndex !== undefined) {
    parts.push(`Connection ${element.connectionIndex + 1}`);
  }
  
  return parts.join(' → ');
};
