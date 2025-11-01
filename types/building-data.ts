export interface BuildingData {
  id: string;
  name: string;
  address?: string;
  floors: FloorData[];
  centralRack?: CentralRackData;
  isFutureProposal?: boolean;
}

export interface FloorData {
  id: string;
  name: string;
  level: number;
  rooms: RoomData[];
  racks?: FloorRackData[];
  isFutureProposal?: boolean;
  isTypical?: boolean; // Flag to indicate if this is a typical floor
  repeatCount?: number; // For typical floors - number of times this floor repeats
  image?: FileReference;
  blueprint?: FileReference;
  notes?: string;
}

export interface CentralRackData {
  id: string;
  name: string;
  location: string;
  units: number;
  cableTerminations?: CableTerminationData[];
  switches?: SwitchData[];
  routers?: RouterData[];
  servers?: ServerData[];
  voipPbx?: VoipPbxData[];
  headend?: HeadendData[];
  nvr?: NvrData[];
  ata?: AtaData[];
  connections?: ConnectionData[];
  isFutureProposal?: boolean;
}

export interface FloorRackData {
  id: string;
  name: string;
  location: string;
  units: number;
  cableTerminations?: CableTerminationData[];
  switches?: SwitchData[];
  routers?: RouterData[];
  servers?: ServerData[];
  voipPbx?: VoipPbxData[];
  headend?: HeadendData[];
  nvr?: NvrData[];
  ata?: AtaData[];
  loraWanGateway?: LoRaWANGatewayData;
  connections?: ConnectionData[];
  isFutureProposal?: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  number: string;
  type: 'NORMAL' | 'STANDARD' | 'TYPICAL';
  devices?: DeviceData[];
  outlets?: OutletData[];
  connections?: ConnectionData[];
  isFutureProposal?: boolean;
  repeatCount?: number; // For typical rooms
  notes?: string;
}

export interface ProductAssignment {
  productId: string;
  quantity: number;
}

export interface CableTerminationData {
  id: string;
  cableType: 'CAT6' | 'CAT6A' | 'CAT5e' | 'FIBER_SM' | 'FIBER_MM';
  quantity: number;
  totalFibers?: number;
  terminatedFibers?: number;
  fromLocation?: string;
  toLocation?: string;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface SwitchData {
  id: string;
  brand: string;
  model: string;
  ports: number;
  poeEnabled: boolean;
  poePortsCount?: number;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface RouterData {
  id: string;
  brand: string;
  model: string;
  interfaces: RouterInterfaceData[];
  connections?: RouterConnectionData[];
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface ServerData {
  id: string;
  brand: string;
  model: string;
  virtualMachines: VirtualMachineData[];
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface HeadendData {
  id: string;
  brand: string;
  model: string;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface VoipPbxData {
  id: string;
  brand: string;
  model: string;
  extensions?: number;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface NvrData {
  id: string;
  brand: string;
  model: string;
  channels?: number;
  storageCapacity?: string;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface AtaData {
  id: string;
  brand: string;
  model: string;
  ports?: number;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface LoRaWANGatewayData {
  id: string;
  brand: string;
  model: string;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface DeviceData {
  id: string;
  type: 'PHONE' | 'VOIP_PHONE' | 'PC' | 'TV' | 'AP' | 'CAMERA' | 'IOT' | 'OTHER';
  brand?: string;
  model?: string;
  quantity: number;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface OutletData {
  id: string;
  type: 'DATA' | 'POWER' | 'COMBINED';
  quantity: number;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface ConnectionData {
  id: string;
  fromDevice: string;
  toDevice: string;
  cableType?: string;
  productId?: string; // Deprecated - kept for backwards compatibility
  products?: ProductAssignment[]; // New field for multiple products
  quantity?: number;
  services?: ServiceAssociationData[];
  isFutureProposal?: boolean;
}

export interface ServiceAssociationData {
  id: string;
  serviceId: string;
  quantity: number;
}

export interface FileReference {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface RouterInterfaceData {
  id: string;
  name: string;
  type: 'WAN' | 'LAN' | 'WIFI';
  speed: string;
}

export interface RouterConnectionData {
  id: string;
  interfaceId: string;
  connectedTo: string;
}

export interface VirtualMachineData {
  id: string;
  name: string;
  os: string;
  cpu: number;
  memory: number;
  storage: number;
}

export interface SiteConnectionData {
  id: string;
  fromBuilding: string;
  toBuilding: string;
  connectionType: 'FIBER' | 'WIRELESS' | 'COPPER';
  speed: string;
  distance?: number;
  isFutureProposal?: boolean;
}
