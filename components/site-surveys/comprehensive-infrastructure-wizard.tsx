// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Server, 
  Wifi, 
  Phone,
  Camera,
  Router,
  Cable,
  ArrowLeft, 
  ArrowRight,
  Save,
  CheckCircle,
  Package,
  Calculator,
  FileText,
  FileDown,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { BuildingsStep } from "./wizard-steps/buildings-step";
import { EquipmentAssignmentStep } from "./wizard-steps/equipment-assignment-step";
import { CentralRackStep } from "./wizard-steps/central-rack-step";
import ProposalDocumentStep from "./wizard-steps/proposal-document-step";
import { BuildingData, SiteConnectionData } from "@/types/building-data";
import { ProposalGenerationModal } from "../proposals/proposal-generation-modal";

export interface InfrastructureData {
  buildings: BuildingData[];
  siteConnections: SiteConnectionData[];
}

export interface BuildingData {
  id: string;
  name: string;
  code?: string;
  address?: string;
  notes?: string;
  images?: FileReference[];
  blueprints?: FileReference[];
  centralRack?: CentralRackData;
  floors: FloorData[];
  isFutureProposal?: boolean; // Flag to indicate if this is a future proposal
}

export interface CentralRackData {
  id: string;
  name: string;
  code?: string;
  units?: number;
  location?: string;
  notes?: string;
  images?: FileReference[];
  ispConnection?: ISPConnectionData;
  cableTerminations: CableTerminationData[];
  switches: SwitchData[];
  routers: RouterData[];
  pbx?: PBXData;
  ata?: ATAData;
  nvr?: NVRData;
  servers: ServerData[];
  phoneLines: PhoneLineData[];
  connections: ConnectionData[];
}

export interface CableTerminationData {
  id: string;
  cableType: 'CAT5e' | 'CAT6' | 'CAT6A' | 'CAT7' | 'FIBER_SM' | 'FIBER_MM' | 'COAX' | 'RJ11' | 'OTHER';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
  // Fiber optic specific fields
  totalFibers?: number;       // Total number of fibers in the cable (e.g., 12, 24, 48)
  terminatedFibers?: number;  // How many fibers are actually terminated
  // Services can be added to both existing and future items
  services: ServiceAssociationData[];
  // For future proposals (product association)
  isFutureProposal?: boolean;
  productId?: string;        // Link to cable product from catalog (future only)
  proposalNotes?: string;
}

export interface ServiceAssociationData {
  id: string;
  serviceId: string;         // Link to Service from catalog
  serviceName?: string;      // Display name (cached from service)
  quantity?: number;         // Quantity of service (e.g., 10 cable terminations)
  notes?: string;            // Specific notes for this service
}

export interface ISPConnectionData {
  ispName: string;
  connectionType: string;
  router?: RouterData;
}

export interface SwitchData {
  id: string;
  name?: string;
  // For existing equipment (descriptive)
  brand?: string;
  model?: string;
  ip?: string;
  vlans: VLANData[];
  ports: SwitchPortData[];
  poeEnabled: boolean;
  poePortsCount?: number;
  connections: SwitchConnectionData[];
  // Services can be added to both existing and future items
  services: ServiceAssociationData[];
  // For future proposals (product association)
  isFutureProposal?: boolean;
  productId?: string;        // Link to Product from catalog (future only)
  quantity?: number;         // Quantity for proposal
  proposalNotes?: string;    // Notes specific to the proposal
}

export interface SwitchPortData {
  id: string;
  number: string; // Port number/name (e.g., "1", "Gi0/1")
  type: 'ETHERNET' | 'FIBER' | 'SFP' | 'SFP+';
  speed: string; // e.g., 100Mbps, 1Gbps, 10Gbps
  isPoe?: boolean;
  status?: 'USED' | 'AVAILABLE';
  vlanId?: string;
  connectedTo?: string;
}

export interface SwitchConnectionData {
  id: string;
  fromPort: string; // Port on this switch
  toDevice: string; // Destination device
  toPort?: string; // Destination port
  connectionType?: string;
  notes?: string;
}

export interface RouterData {
  id: string;
  name?: string;
  // For existing equipment (descriptive)
  brand?: string;
  model?: string;
  ip?: string;
  interfaces: RouterInterfaceData[];
  vlans: VLANData[];
  connections: RouterConnectionData[];
  // Services can be added to both existing and future items
  services: ServiceAssociationData[];
  // For future proposals (product association)
  isFutureProposal?: boolean;
  productId?: string;
  quantity?: number;
  proposalNotes?: string;
}

export interface RouterInterfaceData {
  id: string;
  name: string; // e.g., GigabitEthernet0/0, FastEthernet0/1
  type: 'SFP' | 'ETH' | 'SFP+' | 'QSFP' | 'OTHER';
  status?: 'UP' | 'DOWN' | 'DISABLED';
  speed?: string; // e.g., 1Gbps, 10Gbps
  vlanId?: string; // Which VLAN this interface belongs to
}

export interface RouterConnectionData {
  id: string;
  from: string; // Router interface (from this router)
  to: string; // Destination device
  toInterface?: string; // Destination interface
  connectionType: string; // e.g., Direct, Cross-over, Fiber
  notes?: string;
}

export interface PBXData {
  id: string;
  brand?: string;
  model?: string;
  type: 'SIP' | 'ANALOG' | 'DIGITAL';
  ip?: string;
  connection?: string; // Connected to which rack
  pmsIntegration?: boolean;
  pmsName?: string;
  trunkLines: TrunkLineData[];
  extensions: ExtensionData[];
}

export interface TrunkLineData {
  id: string;
  type: 'PSTN' | 'ISDN' | 'PRI' | 'SIP';
  provider?: string;
  phoneNumbers: string[]; // Array of phone numbers on this line
  channels?: number; // For ISDN/PRI
  notes?: string;
}

export interface ATAData {
  id: string;
  ports: number;
  connection: ConnectionData;
}

export interface NVRData {
  id: string;
  channels: number;
  vms: string;
}

export interface ServerData {
  id: string;
  name: string;
  type: string;
  // For existing equipment (descriptive)
  brand?: string;
  model?: string;
  ip?: string;
  notes?: string;
  // Virtualization
  isVirtualized?: boolean;
  hypervisor?: 'VMware ESXi' | 'Hyper-V' | 'Proxmox' | 'KVM' | 'Xen' | 'OTHER';
  virtualMachines: VirtualMachineData[];
  // Services can be added to both existing and future items
  services: ServiceAssociationData[];
  // For future proposals (product association)
  isFutureProposal?: boolean;
  productId?: string;
  quantity?: number;
  proposalNotes?: string;
}

export interface VirtualMachineData {
  id: string;
  name: string;
  os?: string; // Operating System (e.g., Windows Server 2022, Ubuntu 22.04)
  purpose?: string; // Purpose/Role (e.g., Domain Controller, Database Server)
  cpu?: number; // vCPUs
  ram?: string; // RAM (e.g., 8GB, 16GB)
  storage?: string; // Storage (e.g., 100GB, 500GB)
  ip?: string;
  status?: 'RUNNING' | 'STOPPED' | 'SUSPENDED';
  notes?: string;
}

export interface PhoneLineData {
  id: string;
  type: 'PSTN' | 'ISDN' | 'SIP';
  channels: number;
  phoneNumbers: string[];
}

export interface HeadendData {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  channels?: number;
  type?: 'CATV' | 'IPTV' | 'SATELLITE' | 'OTHER';
  notes?: string;
}

export interface LoRaWANGatewayData {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  eui?: string; // Gateway EUI (unique identifier)
  frequency?: string; // e.g., EU868, US915
  ip?: string;
  notes?: string;
}

export interface FloorData {
  id: string;
  name: string;
  level: number;
  notes?: string;
  isTypical: boolean;
  repeatCount?: number;
  images?: FileReference[];
  blueprints?: FileReference[];
  racks: FloorRackData[];
  rooms: RoomData[];
  isFutureProposal?: boolean;
}

export interface FloorRackData {
  id: string;
  name: string;
  code?: string;
  units?: number;
  location?: string;
  notes?: string;
  isFutureProposal?: boolean; // Mark as future proposal/upgrade
  cableTerminations?: CableTerminationData[];
  connections: ConnectionData[];
  switches: SwitchData[];
  routers?: RouterData[];
  ata?: ATAData;
  nvr?: NVRData;
  servers?: ServerData[];
  headend?: HeadendData;
  loraWanGateway?: LoRaWANGatewayData;
}

export interface RoomData {
  id: string;
  name: string;
  number?: string;
  type: string;
  notes?: string;
  isTypical?: boolean; // Mark as typical room
  repeatCount?: number; // Number of same rooms on this floor
  outlets: OutletData[];
  devices: DeviceData[];
  connections: ConnectionData[];
}

export interface OutletData {
  id: string;
  label: string;
  type: string;
  quantity?: number;
  connection: ConnectionData;
}

export interface DeviceData {
  id: string;
  type: 'PHONE' | 'VOIP_PHONE' | 'PC' | 'TV' | 'AP' | 'CAMERA' | 'IOT' | 'OTHER';
  // For existing equipment (descriptive)
  brand?: string;
  model?: string;
  ip?: string;
  notes?: string;
  images?: FileReference[];
  // Services can be added to both existing and future items
  services: ServiceAssociationData[];
  // For future proposals (product association)
  isFutureProposal?: boolean;
  productId?: string;
  quantity?: number;
  proposalNotes?: string;
}

export interface SiteConnectionData {
  id: string;
  fromBuilding: string;
  toBuilding: string;
  connectionType: 'WIRELESS' | 'FIBER' | 'ETHERNET';
  details?: string;
  notes?: string;
}

export interface VLANData {
  id: string;
  name: string;
  subnet: string;
  port: string;
}

export interface PortData {
  id: string;
  number: string;
  type: 'ETHERNET' | 'SFP' | 'OTHER';
  status: 'USED' | 'AVAILABLE';
  connection?: ConnectionData;
}

export interface ConnectionData {
  id: string;
  fromDevice: string;
  toDevice: string;
  connectionType: string;
  cableType?: string;
  notes?: string;
  // Future proposal fields
  isFutureProposal?: boolean;
  productId?: string;
  quantity?: number;
  services?: ServiceAssociationData[];
}

export interface ExtensionData {
  id: string;
  number: string;
  type: string;
  device?: string;
}

export interface FileReference {
  id: string;
  name: string;
  url: string;
  type: 'IMAGE' | 'BLUEPRINT' | 'DOCUMENT';
  size?: number;
  uploadedAt: string;
}

interface ComprehensiveInfrastructureWizardProps {
  siteSurveyId: string;
  siteSurveyData?: any;
  onComplete?: () => void;
  onRFPGenerated?: (rfpData: any) => void;
}

const STEPS = [
  {
    id: 1,
    title: "Υφιστάμενη Κατάσταση",
    description: "Καταγραφή υφιστάμενης υποδομής",
    icon: Building2,
  },
  {
    id: 2,
    title: "Προϊόντα & Υπηρεσίες",
    description: "Προσθήκη προϊόντων και υπηρεσιών αναβάθμισης",
    icon: Package,
  },
  {
    id: 3,
    title: "Τιμολόγηση",
    description: "Τιμολόγηση προϊόντων και υπηρεσιών",
    icon: Calculator,
  },
  {
    id: 4,
    title: "Προσφορά",
    description: "Δημιουργία προσφοράς προς τον πελάτη",
    icon: FileText,
  },
];

export function ComprehensiveInfrastructureWizard({
  siteSurveyId,
  siteSurveyData,
  onComplete,
  onRFPGenerated,
}: ComprehensiveInfrastructureWizardProps) {
  
  const [wizardData, setWizardData] = useState<InfrastructureData>({
    buildings: [],
    siteConnections: [],
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [generatingFile, setGeneratingFile] = useState(false);
  const [generatingBOM, setGeneratingBOM] = useState(false);
  const [generatingRFP, setGeneratingRFP] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [showProposalDialog, setShowProposalDialog] = useState(false);

  // Load existing data on mount
  useEffect(() => {
    loadExistingData();
  }, [siteSurveyId]);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      
      // Load comprehensive infrastructure data
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/comprehensive-infrastructure`);
      if (response.ok) {
        const data = await response.json();
        setWizardData({
          buildings: data.infrastructureData?.buildings || [],
          siteConnections: data.siteConnections || [],
        });
      }

    } catch (error) {
      console.error("Error loading wizard data:", error);
      toast.error("Failed to load existing data");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const saveProgress = async (markStepComplete?: number) => {
    try {
      setSaving(true);
      
      // Helper function to remove circular references and clean data
      const cleanData = (obj: any, seen = new WeakSet()): any => {
        if (obj === null || typeof obj !== 'object') {
          return obj;
        }
        
        // Check for circular reference
        if (seen.has(obj)) {
          return undefined; // Return undefined for circular refs
        }
        
        seen.add(obj);
        
        if (Array.isArray(obj)) {
          return obj.map(item => cleanData(item, seen));
        }
        
        const cleaned: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = cleanData(obj[key], seen);
            if (value !== undefined) {
              cleaned[key] = value;
            }
          }
        }
        
        return cleaned;
      };
      
      // Clean the data before serialization
      const cleanedBuildings = cleanData(wizardData.buildings);
      const cleanedConnections = cleanData(wizardData.siteConnections);
      
      // Save comprehensive infrastructure data
      await fetch(`/api/site-surveys/${siteSurveyId}/comprehensive-infrastructure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          infrastructureData: {
            buildings: cleanedBuildings,
          },
          siteConnections: cleanedConnections,
          completedStep: markStepComplete,
        }),
      });

      // Auto-generate Excel and update lead status when step 1 is completed
      if (markStepComplete === 1 && wizardData.buildings.length > 0) {
        try {
          const excelResponse = await fetch(`/api/site-surveys/${siteSurveyId}/generate-and-save-excel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              buildings: cleanedBuildings,
              stepCompleted: markStepComplete,
            }),
          });

          if (excelResponse.ok) {
            const result = await excelResponse.json();
            toast.success(`Infrastructure Excel generated! ${result.filesGenerated} files saved to lead.`);
          } else {
            console.error('Failed to generate Excel files');
          }
        } catch (error) {
          console.error('Error generating Excel files:', error);
        }
      }

      if (markStepComplete) {
        toast.success(`Step ${markStepComplete} completed and saved`);
      } else {
        toast.success("Progress saved successfully");
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      // Auto-save before moving to next step and mark current step as complete
      await saveProgress(currentStep);
      
      // Update stage based on completed step
      if (currentStep === 1) {
        // Update stage to REQUIREMENTS_AND_PRODUCTS when completing infrastructure step
        try {
          await fetch(`/api/site-surveys/${siteSurveyId}/stage`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stage: "REQUIREMENTS_AND_PRODUCTS" }),
          });
        } catch (error) {
          console.error("Failed to update stage:", error);
        }
      } else if (currentStep === 2) {
        // Update stage to PRICING_COMPLETED when completing products step
        try {
          await fetch(`/api/site-surveys/${siteSurveyId}/stage`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stage: "PRICING_COMPLETED" }),
          });
        } catch (error) {
          console.error("Failed to update stage:", error);
        }
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await saveProgress();
      
      // Update stage to DOCUMENTS_READY when all steps are completed
      try {
        await fetch(`/api/site-surveys/${siteSurveyId}/stage`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: "DOCUMENTS_READY" }),
        });
      } catch (error) {
        console.error("Failed to update stage:", error);
      }
      
      toast.success('Infrastructure survey completed successfully!');
      onComplete?.();
    } catch (error) {
      console.error("Error completing survey:", error);
      toast.error("Failed to complete survey");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingsUpdate = (buildings: BuildingData[]) => {
    // Helper function to remove circular references
    const cleanData = (obj: any, seen = new WeakSet()): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      // Check for circular reference
      if (seen.has(obj)) {
        return undefined; // Return undefined for circular refs
      }
      
      seen.add(obj);
      
      if (Array.isArray(obj)) {
        return obj.map(item => cleanData(item, seen));
      }
      
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = cleanData(obj[key], seen);
          if (value !== undefined) {
            cleaned[key] = value;
          }
        }
      }
      
      return cleaned;
    };
    
    // Clean buildings before setting state to avoid circular references
    const cleanedBuildings = cleanData(buildings);
    
    setWizardData(prev => ({
      ...prev,
      buildings: cleanedBuildings,
    }));
  };

  const handleSiteConnectionsUpdate = (siteConnections: SiteConnectionData[]) => {
    // Helper function to remove circular references
    const cleanData = (obj: any, seen = new WeakSet()): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      // Check for circular reference
      if (seen.has(obj)) {
        return undefined; // Return undefined for circular refs
      }
      
      seen.add(obj);
      
      if (Array.isArray(obj)) {
        return obj.map(item => cleanData(item, seen));
      }
      
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = cleanData(obj[key], seen);
          if (value !== undefined) {
            cleaned[key] = value;
          }
        }
      }
      
      return cleaned;
    };
    
    // Clean site connections before setting state to avoid circular references
    const cleanedConnections = cleanData(siteConnections);
    
    setWizardData(prev => ({
      ...prev,
      siteConnections: cleanedConnections,
    }));
  };

  // Helper function to clean circular references
  const cleanData = (obj: any, seen = new WeakSet()): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (seen.has(obj)) {
      return undefined;
    }
    seen.add(obj);
    if (Array.isArray(obj)) {
      return obj.map(item => cleanData(item, seen));
    }
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = cleanData(obj[key], seen);
        if (value !== undefined) {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  };

  // Helper function to trigger file download
  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file:', { url, filename });
      
      // Use proxy endpoint to avoid CORS issues
      const proxyUrl = `/api/files/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      // Fetch the file through our proxy
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('File blob size:', blob.size);
      
      // Create download link
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      console.log('Download triggered successfully');
      
      toast.success('File downloaded successfully!', {
        description: filename,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Generate Infrastructure File
  const handleGenerateInfrastructureFile = async () => {
    if (wizardData.buildings.length === 0) {
      toast.error("Please add at least one building before generating the infrastructure file");
      return;
    }

    setGeneratingFile(true);
    try {
      const cleanedBuildings = cleanData(wizardData.buildings);

      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-infrastructure-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildings: cleanedBuildings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate file');
      }

      if (data.success) {
        toast.success(
          data.message || `Successfully generated ${data.files.length} infrastructure file(s)`,
          {
            description: data.files.map((f: any) => `${f.filename} (v${f.version})`).join(', '),
            duration: 5000,
          }
        );
        
        // Auto-download the generated files
        if (data.files && data.files.length > 0) {
          for (const file of data.files) {
            if (file.url) {
              downloadFile(file.url, file.filename);
            }
          }
        }
        
        if (data.errors && data.errors.length > 0) {
          toast.warning(
            `Some files had errors`,
            {
              description: data.errors.map((e: any) => `${e.buildingName}: ${e.error}`).join(', '),
              duration: 5000,
            }
          );
        }
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Error generating infrastructure file:', error);
      toast.error(
        'Failed to generate infrastructure file',
        {
          description: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } finally {
      setGeneratingFile(false);
    }
  };

  // Generate BOM File
  const handleGenerateBOM = async () => {
    // Collect all equipment from all buildings
    const allEquipment: any[] = [];
    wizardData.buildings.forEach(building => {
      // From central rack
      if (building.centralRack) {
        if (building.centralRack.equipment) {
          allEquipment.push(...building.centralRack.equipment);
        }
        if (building.centralRack.switches) {
          allEquipment.push(...building.centralRack.switches);
        }
        if (building.centralRack.routers) {
          allEquipment.push(...building.centralRack.routers);
        }
        if (building.centralRack.servers) {
          allEquipment.push(...building.centralRack.servers);
        }
      }
      
      // From floors
      building.floors?.forEach(floor => {
        floor.racks?.forEach(rack => {
          if (rack.equipment) {
            allEquipment.push(...rack.equipment);
          }
          if (rack.switches) {
            allEquipment.push(...rack.switches);
          }
          if (rack.routers) {
            allEquipment.push(...rack.routers);
          }
          if (rack.servers) {
            allEquipment.push(...rack.servers);
          }
        });
        floor.rooms?.forEach(room => {
          if (room.equipment) {
            allEquipment.push(...room.equipment);
          }
          if (room.devices) {
            allEquipment.push(...room.devices);
          }
        });
      });
    });

    if (allEquipment.length === 0) {
      toast.error("Please add equipment before generating the BOM file");
      return;
    }

    setGeneratingBOM(true);
    try {
      // Clean equipment data to remove circular references
      const cleanedEquipment = allEquipment.map(item => cleanData(item));
      
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-bom-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment: cleanedEquipment,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate BOM file');
      }

      const data = await response.json();

      if (data.success) {
        console.log('BOM generated successfully:', data);
        
        toast.success(
          'Successfully generated BOM file',
          {
            description: `${data.file.filename} (v${data.file.version})`,
            duration: 5000,
          }
        );
        
        // Auto-download the file
        if (data.file?.url) {
          console.log('Downloading BOM from:', data.file.url);
          downloadFile(data.file.url, data.file.filename);
        } else {
          console.error('No URL in response:', data);
          toast.warning('BOM generated but download URL missing');
        }
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Error generating BOM file:', error);
      toast.error(
        'Failed to generate BOM file',
        {
          description: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } finally {
      setGeneratingBOM(false);
    }
  };

  // Generate RFP
  const handleGenerateRFP = async () => {
    setGeneratingRFP(true);
    try {
      // Step 1: Fetch all products and services
      const [productsRes, servicesRes] = await Promise.all([
        fetch('/api/products?limit=10000'), // Get all products
        fetch('/api/services?limit=10000'), // Get all services
      ]);

      if (!productsRes.ok || !servicesRes.ok) {
        throw new Error('Failed to fetch products or services');
      }

      const productsData = await productsRes.json();
      const servicesData = await servicesRes.json();
      
      // Extract the data arrays from the API response
      const allProducts = Array.isArray(productsData) ? productsData : (productsData.data || []);
      const allServices = Array.isArray(servicesData) ? servicesData : (servicesData.data || []);

      // Step 1.5: Load custom pricing from localStorage
      let productPricingMap = new Map();
      let servicePricingMap = new Map();
      
      try {
        const savedProductPricing = localStorage.getItem(`pricing-products-${siteSurveyId}`);
        const savedServicePricing = localStorage.getItem(`pricing-services-${siteSurveyId}`);
        
        if (savedProductPricing) {
          const pricingData = JSON.parse(savedProductPricing);
          productPricingMap = new Map(pricingData);
          console.log('Loaded product pricing from localStorage:', productPricingMap.size, 'items');
        }
        
        if (savedServicePricing) {
          const pricingData = JSON.parse(savedServicePricing);
          servicePricingMap = new Map(pricingData);
          console.log('Loaded service pricing from localStorage:', servicePricingMap.size, 'items');
        }
      } catch (error) {
        console.error('Failed to load pricing from localStorage:', error);
      }

      // Step 2: Collect all equipment with full details from all buildings
      const productsMap = new Map();
      const servicesMap = new Map();

      wizardData.buildings.forEach(building => {
        // From central rack
        if (building.centralRack) {
          // Cable terminations
          building.centralRack.cableTerminations?.forEach(term => {
            if (term.productId && term.isFutureProposal) {
              const product = allProducts.find(p => p.id === term.productId);
              if (product) {
                const key = term.productId;
                if (!productsMap.has(key)) {
                  // Get custom pricing from localStorage if available
                  const customPricing = productPricingMap.get(key);
                  const price = customPricing?.unitPrice || product.price || 0;
                  const margin = customPricing?.margin || 0;
                  
                  productsMap.set(key, {
                    id: product.id,
                    productId: product.id,
                    name: product.name || term.cableType,
                    brand: product.brand || 'N/A',
                    category: product.category || 'Cable Termination',
                    quantity: 0,
                    price: price,
                    margin: margin,
                    type: 'product',
                  });
                }
                productsMap.get(key).quantity += term.quantity || 1;
              }
            }

            // Services for terminations
            term.services?.forEach(svc => {
              const service = allServices.find(s => s.id === svc.serviceId);
              if (service) {
                const key = svc.serviceId;
                if (!servicesMap.has(key)) {
                  // Get custom pricing from localStorage if available
                  const customPricing = servicePricingMap.get(key);
                  const price = customPricing?.unitPrice || service.price || 0;
                  const margin = customPricing?.margin || 0;
                  
                  servicesMap.set(key, {
                    id: service.id,
                    serviceId: service.id,
                    name: service.name,
                    category: service.category || 'Installation',
                    quantity: 0,
                    price: price,
                    margin: margin,
                    type: 'service',
                  });
                }
                servicesMap.get(key).quantity += svc.quantity || 1;
              }
            });
          });

          // Switches
          building.centralRack.switches?.forEach(sw => {
            if (sw.productId && sw.isFutureProposal) {
              const product = allProducts.find(p => p.id === sw.productId);
              if (product) {
                const key = sw.productId;
                if (!productsMap.has(key)) {
                  // Get custom pricing from localStorage if available
                  const customPricing = productPricingMap.get(key);
                  const price = customPricing?.unitPrice || product.price || 0;
                  const margin = customPricing?.margin || 0;
                  
                  productsMap.set(key, {
                    id: product.id,
                    productId: product.id,
                    name: product.name,
                    brand: product.brand || 'N/A',
                    category: product.category || 'Network Switch',
                    quantity: 0,
                    price: price,
                    margin: margin,
                    type: 'product',
                  });
                }
                productsMap.get(key).quantity += sw.quantity || 1;
              }
            }

            // Services for switches
            sw.services?.forEach(svc => {
              const service = allServices.find(s => s.id === svc.serviceId);
              if (service) {
                const key = svc.serviceId;
                if (!servicesMap.has(key)) {
                  // Get custom pricing from localStorage if available
                  const customPricing = servicePricingMap.get(key);
                  const price = customPricing?.unitPrice || service.price || 0;
                  const margin = customPricing?.margin || 0;
                  
                  servicesMap.set(key, {
                    id: service.id,
                    serviceId: service.id,
                    name: service.name,
                    category: service.category || 'Installation',
                    quantity: 0,
                    price: price,
                    margin: margin,
                    type: 'service',
                  });
                }
                servicesMap.get(key).quantity += svc.quantity || 1;
              }
            });
          });

          // Routers
          building.centralRack.routers?.forEach(router => {
            if (router.productId && router.isFutureProposal) {
              const product = allProducts.find(p => p.id === router.productId);
              if (product) {
                const key = router.productId;
                if (!productsMap.has(key)) {
                  // Get custom pricing from localStorage if available
                  const customPricing = productPricingMap.get(key);
                  const price = customPricing?.unitPrice || product.price || 0;
                  const margin = customPricing?.margin || 0;
                  
                  productsMap.set(key, {
                    id: product.id,
                    productId: product.id,
                    name: product.name,
                    brand: product.brand || 'N/A',
                    category: product.category || 'Router',
                    quantity: 0,
                    price: price,
                    margin: margin,
                    type: 'product',
                  });
                }
                productsMap.get(key).quantity += router.quantity || 1;
              }
            }

            // Services for routers
            router.services?.forEach(svc => {
              const service = allServices.find(s => s.id === svc.serviceId);
              if (service) {
                const key = svc.serviceId;
                if (!servicesMap.has(key)) {
                  // Get custom pricing from localStorage if available
                  const customPricing = servicePricingMap.get(key);
                  const price = customPricing?.unitPrice || service.price || 0;
                  const margin = customPricing?.margin || 0;
                  
                  servicesMap.set(key, {
                    id: service.id,
                    serviceId: service.id,
                    name: service.name,
                    category: service.category || 'Installation',
                    quantity: 0,
                    price: price,
                    margin: margin,
                    type: 'service',
                  });
                }
                servicesMap.get(key).quantity += svc.quantity || 1;
              }
            });
          });

          // Servers
          building.centralRack.servers?.forEach(server => {
            if (server.productId && server.isFutureProposal) {
              const product = allProducts.find(p => p.id === server.productId);
              if (product) {
                const key = server.productId;
                if (!productsMap.has(key)) {
                  // Get custom pricing from localStorage if available
                  const customPricing = productPricingMap.get(key);
                  const price = customPricing?.unitPrice || product.price || 0;
                  const margin = customPricing?.margin || 0;
                  
                  productsMap.set(key, {
                    id: product.id,
                    productId: product.id,
                    name: product.name,
                    brand: product.brand || 'N/A',
                    category: product.category || 'Server',
                    quantity: 0,
                    price: price,
                    margin: margin,
                    type: 'product',
                  });
                }
                productsMap.get(key).quantity += server.quantity || 1;
              }
            }

            // Services for servers
            server.services?.forEach(svc => {
              const service = allServices.find(s => s.id === svc.serviceId);
              if (service) {
                const key = svc.serviceId;
                if (!servicesMap.has(key)) {
                  // Get custom pricing from localStorage if available
                  const customPricing = servicePricingMap.get(key);
                  const price = customPricing?.unitPrice || service.price || 0;
                  const margin = customPricing?.margin || 0;
                  
                  servicesMap.set(key, {
                    id: service.id,
                    serviceId: service.id,
                    name: service.name,
                    category: service.category || 'Installation',
                    quantity: 0,
                    price: price,
                    margin: margin,
                    type: 'service',
                  });
                }
                servicesMap.get(key).quantity += svc.quantity || 1;
              }
            });
          });
        }
        
        // From floors
        building.floors?.forEach(floor => {
          floor.racks?.forEach(rack => {
            // Rack switches
            rack.switches?.forEach(sw => {
              if (sw.productId && sw.isFutureProposal) {
                const product = allProducts.find(p => p.id === sw.productId);
                if (product) {
                  const key = sw.productId;
                  if (!productsMap.has(key)) {
                    // Get custom pricing from localStorage if available
                    const customPricing = productPricingMap.get(key);
                    const price = customPricing?.unitPrice || product.price || 0;
                    const margin = customPricing?.margin || 0;
                    
                    productsMap.set(key, {
                      id: product.id,
                      productId: product.id,
                      name: product.name,
                      brand: product.brand || 'N/A',
                      category: product.category || 'Network Switch',
                      quantity: 0,
                      price: price,
                      margin: margin,
                      type: 'product',
                    });
                  }
                  productsMap.get(key).quantity += sw.quantity || 1;
                }
              }

              sw.services?.forEach(svc => {
                const service = allServices.find(s => s.id === svc.serviceId);
                if (service) {
                  const key = svc.serviceId;
                  if (!servicesMap.has(key)) {
                    servicesMap.set(key, {
                      id: service.id,
                      serviceId: service.id,
                      name: service.name,
                      category: service.category || 'Installation',
                      quantity: 0,
                      price: service.price || 0,
                      margin: 0,
                      type: 'service',
                    });
                  }
                  servicesMap.get(key).quantity += svc.quantity || 1;
                }
              });
            });

            // Rack routers
            rack.routers?.forEach(router => {
              if (router.productId && router.isFutureProposal) {
                const product = allProducts.find(p => p.id === router.productId);
                if (product) {
                  const key = router.productId;
                  if (!productsMap.has(key)) {
                    // Get custom pricing from localStorage if available
                    const customPricing = productPricingMap.get(key);
                    const price = customPricing?.unitPrice || product.price || 0;
                    const margin = customPricing?.margin || 0;
                    
                    productsMap.set(key, {
                      id: product.id,
                      productId: product.id,
                      name: product.name,
                      brand: product.brand || 'N/A',
                      category: product.category || 'Router',
                      quantity: 0,
                      price: price,
                      margin: margin,
                      type: 'product',
                    });
                  }
                  productsMap.get(key).quantity += router.quantity || 1;
                }
              }

              router.services?.forEach(svc => {
                const service = allServices.find(s => s.id === svc.serviceId);
                if (service) {
                  const key = svc.serviceId;
                  if (!servicesMap.has(key)) {
                    servicesMap.set(key, {
                      id: service.id,
                      serviceId: service.id,
                      name: service.name,
                      category: service.category || 'Installation',
                      quantity: 0,
                      price: service.price || 0,
                      margin: 0,
                      type: 'service',
                    });
                  }
                  servicesMap.get(key).quantity += svc.quantity || 1;
                }
              });
            });

            // Rack servers
            rack.servers?.forEach(server => {
              if (server.productId && server.isFutureProposal) {
                const product = allProducts.find(p => p.id === server.productId);
                if (product) {
                  const key = server.productId;
                  if (!productsMap.has(key)) {
                    productsMap.set(key, {
                      id: product.id,
                      productId: product.id,
                      name: product.name,
                      brand: product.brand || 'N/A',
                      category: product.category || 'Server',
                      quantity: 0,
                      price: product.price || 0,
                      margin: 0,
                      type: 'product',
                    });
                  }
                  productsMap.get(key).quantity += server.quantity || 1;
                }
              }

              server.services?.forEach(svc => {
                const service = allServices.find(s => s.id === svc.serviceId);
                if (service) {
                  const key = svc.serviceId;
                  if (!servicesMap.has(key)) {
                    servicesMap.set(key, {
                      id: service.id,
                      serviceId: service.id,
                      name: service.name,
                      category: service.category || 'Installation',
                      quantity: 0,
                      price: service.price || 0,
                      margin: 0,
                      type: 'service',
                    });
                  }
                  servicesMap.get(key).quantity += svc.quantity || 1;
                }
              });
            });
          });

          // Room devices
          floor.rooms?.forEach(room => {
            room.devices?.forEach(device => {
              if (device.productId && device.isFutureProposal) {
                const product = allProducts.find(p => p.id === device.productId);
                if (product) {
                  const key = device.productId;
                  if (!productsMap.has(key)) {
                    // Get custom pricing from localStorage if available
                    const customPricing = productPricingMap.get(key);
                    const price = customPricing?.unitPrice || product.price || 0;
                    const margin = customPricing?.margin || 0;
                    
                    productsMap.set(key, {
                      id: product.id,
                      productId: product.id,
                      name: product.name,
                      brand: product.brand || 'N/A',
                      category: product.category || 'Device',
                      quantity: 0,
                      price: price,
                      margin: margin,
                      type: 'product',
                    });
                  }
                  productsMap.get(key).quantity += device.quantity || 1;
                }
              }

              device.services?.forEach(svc => {
                const service = allServices.find(s => s.id === svc.serviceId);
                if (service) {
                  const key = svc.serviceId;
                  if (!servicesMap.has(key)) {
                    servicesMap.set(key, {
                      id: service.id,
                      serviceId: service.id,
                      name: service.name,
                      category: service.category || 'Installation',
                      quantity: 0,
                      price: service.price || 0,
                      margin: 0,
                      type: 'service',
                    });
                  }
                  servicesMap.get(key).quantity += svc.quantity || 1;
                }
              });
            });
          });
        });
      });

      // Convert maps to arrays
      const allEquipment = [
        ...Array.from(productsMap.values()),
        ...Array.from(servicesMap.values()),
      ];

      if (allEquipment.length === 0) {
        toast.error("No new products or services found", {
          description: "Please mark items as 'new' or 'future proposal' in step 2"
        });
        return;
      }

      // Clean equipment data to remove circular references
      const cleanedEquipment = allEquipment.map(item => cleanData(item));
      
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-rfp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment: cleanedEquipment,
          buildings: cleanData(wizardData.buildings),
          generalNotes: siteSurveyData?.notes || '',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RFP generation failed:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to generate RFP');
        } catch {
          throw new Error(`Failed to generate RFP: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('RFP response data:', data);

      if (data.success) {
        console.log('RFP generated successfully!');
        console.log('- RFP Number:', data.rfp?.rfpNo);
        console.log('- File info:', data.file);
        
        toast.success(
          'Successfully generated RFP',
          {
            description: `${data.rfp.rfpNo} - ${data.file.filename} (v${data.file.version})`,
            duration: 5000,
          }
        );
        
        // Update parent component with new RFP data (no page refresh needed)
        if (onRFPGenerated && data.rfp) {
          onRFPGenerated(data.rfp);
        }
        
        // Auto-download the file
        if (data.file?.url && data.file?.filename) {
          console.log('Starting RFP file download...');
          console.log('- URL:', data.file.url);
          console.log('- Filename:', data.file.filename);
          
          toast.info('Downloading RFP file...', {
            duration: 2000,
          });
          
          // Trigger download
          await downloadFile(data.file.url, data.file.filename);
        } else {
          console.error('Missing file URL or filename in response:', {
            hasFile: !!data.file,
            hasUrl: !!data.file?.url,
            hasFilename: !!data.file?.filename,
            fullData: data,
          });
          toast.warning('RFP generated but download URL missing');
        }
      } else {
        console.error('Success flag is false:', data);
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Error generating RFP:', error);
      toast.error(
        'Failed to generate RFP',
        {
          description: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } finally {
      setGeneratingRFP(false);
    }
  };

  // Generate Product Analysis (Word Document)
  const handleGenerateProductAnalysis = async () => {
    // Collect all equipment from all buildings
    const allEquipment: any[] = [];
    wizardData.buildings.forEach(building => {
      // From central rack
      if (building.centralRack) {
        // Central rack equipment
        if (building.centralRack.equipment) {
          allEquipment.push(...building.centralRack.equipment);
        }
        // Switches in central rack
        if (building.centralRack.switches) {
          allEquipment.push(...building.centralRack.switches);
        }
        // Routers in central rack
        if (building.centralRack.routers) {
          allEquipment.push(...building.centralRack.routers);
        }
        // Servers in central rack
        if (building.centralRack.servers) {
          allEquipment.push(...building.centralRack.servers);
        }
      }
      
      // From floors
      building.floors?.forEach(floor => {
        // From racks
        floor.racks?.forEach(rack => {
          if (rack.equipment) {
            allEquipment.push(...rack.equipment);
          }
          if (rack.switches) {
            allEquipment.push(...rack.switches);
          }
          if (rack.routers) {
            allEquipment.push(...rack.routers);
          }
          if (rack.servers) {
            allEquipment.push(...rack.servers);
          }
        });
        
        // From rooms
        floor.rooms?.forEach(room => {
          if (room.equipment) {
            allEquipment.push(...room.equipment);
          }
          if (room.devices) {
            allEquipment.push(...room.devices);
          }
        });
      });
    });

    // Filter for products marked as "new" (isFutureProposal = true) only (excluding services)
    const newProducts = allEquipment.filter((item: any) => 
      (item.isFutureProposal === true || item.isNew === true || item.status === 'new' || item.condition === 'new') &&
      item.type !== 'SERVICE' && 
      item.itemType !== 'SERVICE' &&
      item.category !== 'SERVICE'
    );

    if (newProducts.length === 0) {
      toast.error("No new products found. Please add products marked as 'new' in step 2 before generating the analysis document");
      return;
    }

    setGeneratingAnalysis(true);
    try {
      // Generate analysis for each unique new product
      // Try multiple ID fields to find the product ID
      const uniqueProductIds = [...new Set(
        newProducts.map((p: any) => p.productId || p.id || p.equipmentId || p.itemId).filter(Boolean)
      )];
      
      if (uniqueProductIds.length === 0) {
        toast.error("No valid product IDs found for new products");
        return;
      }

      toast.info(`Generating single analysis document for ${uniqueProductIds.length} new product(s)...`);

      // Call the multi-product analysis endpoint
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-multi-product-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: uniqueProductIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate analysis document');
      }

      // Download the single document
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Product_Analysis_${uniqueProductIds.length}_Products.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Successfully generated product analysis document`,
        {
          description: `Analysis completed for ${uniqueProductIds.length} new product(s)`,
          duration: 5000,
        }
      );
    } catch (error) {
      console.error('Error generating product analysis:', error);
      toast.error(
        'Failed to generate product analysis',
        {
          description: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading infrastructure data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {siteSurveyData?.title || 'Infrastructure Survey'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.title}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={saveProgress}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Progress"}
              </Button>
              
              {/* Document Generation Button Group */}
              <div className="flex items-center rounded-lg overflow-hidden shadow-sm">
                <Button
                  className="rounded-none bg-blue-600 hover:bg-blue-700 text-white border-r border-blue-500"
                  size="sm"
                  onClick={handleGenerateInfrastructureFile}
                  disabled={wizardData.buildings.length === 0 || generatingFile}
                >
                  {generatingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-1" />
                      Infrastructure
                    </>
                  )}
                </Button>
                <Button
                  className="rounded-none bg-green-600 hover:bg-green-700 text-white border-r border-green-500"
                  size="sm"
                  onClick={handleGenerateBOM}
                  disabled={generatingBOM}
                >
                  {generatingBOM ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-1" />
                      BOM
                    </>
                  )}
                </Button>
                <Button
                  className="rounded-none bg-purple-600 hover:bg-purple-700 text-white border-r border-purple-500"
                  size="sm"
                  onClick={handleGenerateRFP}
                  disabled={generatingRFP}
                >
                  {generatingRFP ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-1" />
                      RFP
                    </>
                  )}
                </Button>
                <Button
                  className="rounded-none bg-orange-600 hover:bg-orange-700 text-white border-r border-orange-500"
                  size="sm"
                  onClick={handleGenerateProductAnalysis}
                  disabled={generatingAnalysis}
                >
                  {generatingAnalysis ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-1" />
                      Analysis
                    </>
                  )}
                </Button>
                <Button
                  className="rounded-none bg-pink-600 hover:bg-pink-700 text-white"
                  size="sm"
                  onClick={async () => {
                    // Check if RFP exists
                    if (!siteSurveyData?.lead?.rfps || siteSurveyData?.lead?.rfps?.length === 0) {
                      toast.error("RFP Required", {
                        description: "Please generate an RFP first by clicking the 'RFP' button above. The RFP is required to create a comprehensive proposal.",
                      });
                      return;
                    }
                    setShowProposalDialog(true);
                  }}
                  disabled={generatingRFP}
                >
                  {generatingRFP ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-1" />
                      Proposal
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Generation Modal */}
      <ProposalGenerationModal
        open={showProposalDialog}
        onOpenChange={setShowProposalDialog}
        rfpId={siteSurveyData?.lead?.rfps?.[0]?.id}
        leadId={siteSurveyData?.leadId}
        siteSurveyId={siteSurveyId}
        customerName={siteSurveyData?.customer?.name || 'Unknown Customer'}
        leadNumber={siteSurveyData?.lead?.leadNumber}
      />

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
            </div>
            <div className="text-sm text-gray-600">
              {Math.round(progress)}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <BuildingsStep
                buildings={wizardData.buildings}
                onUpdate={handleBuildingsUpdate}
                siteSurveyId={siteSurveyId}
              />
            )}
            {currentStep === 2 && (
              <EquipmentAssignmentStep
                buildings={wizardData.buildings}
                onUpdate={handleBuildingsUpdate}
                siteSurveyId={siteSurveyId}
              />
            )}
            {currentStep === 3 && (
              <CentralRackStep
                buildings={wizardData.buildings}
                onUpdate={handleBuildingsUpdate}
                siteSurveyId={siteSurveyId}
              />
            )}
        {currentStep === 4 && (
          <ProposalDocumentStep
            buildings={wizardData.buildings}
            onComplete={onComplete}
            siteSurveyId={siteSurveyId}
          />
        )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading ? "Completing..." : "Complete Survey"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
