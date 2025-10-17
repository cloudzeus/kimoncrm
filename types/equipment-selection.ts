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
  totalPrice: number;
  notes?: string;
  // Infrastructure context
  infrastructureElement?: SelectedElement;
}

export interface Product {
  id: string;
  mtrl: string | null;
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
      return 'Building';
    case 'centralRack':
      return 'Central Rack';
    case 'floor':
      return 'Floor';
    case 'floorRack':
      return 'Floor Rack';
    case 'room':
      return 'Room';
    case 'buildingConnection':
      return 'Building Connection';
    default:
      return 'Unknown Element';
  }
};

// Helper function to get element context path
export const getElementContextPath = (element: SelectedElement): string => {
  const parts: string[] = [];
  
  if (element.buildingIndex !== undefined) {
    parts.push(`Building ${element.buildingIndex + 1}`);
  }
  
  if (element.floorIndex !== undefined) {
    parts.push(`Floor ${element.floorIndex + 1}`);
  }
  
  if (element.rackIndex !== undefined) {
    parts.push(`Rack ${element.rackIndex + 1}`);
  }
  
  if (element.roomIndex !== undefined) {
    parts.push(`Room ${element.roomIndex + 1}`);
  }
  
  if (element.connectionIndex !== undefined) {
    parts.push(`Connection ${element.connectionIndex + 1}`);
  }
  
  return parts.join(' → ');
};
