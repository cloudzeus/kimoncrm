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
  Package
} from "lucide-react";
import { toast } from "sonner";
import { BuildingsStep } from "./wizard-steps/buildings-step";
import { EquipmentAssignmentStep } from "./wizard-steps/equipment-assignment-step";
import { CentralRackStep } from "./wizard-steps/central-rack-step";
import { FloorsStep } from "./wizard-steps/floors-step";
import { RoomsStep } from "./wizard-steps/rooms-step";
import { SiteConnectionsStep } from "./wizard-steps/site-connections-step";
import { FutureProposalsStep } from "./wizard-steps/future-proposals-step";

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
}

const STEPS = [
  {
    id: 1,
    title: "Buildings",
    description: "Define buildings with images and blueprints",
    icon: Building2,
  },
  {
    id: 2,
    title: "Equipment & Products",
    description: "Assign products and services to infrastructure elements",
    icon: Package,
  },
  {
    id: 3,
    title: "Central Rack",
    description: "Configure central rack equipment and connections",
    icon: Server,
  },
  {
    id: 4,
    title: "Floors",
    description: "Set up floors with typical floor support",
    icon: Wifi,
  },
  {
    id: 5,
    title: "Rooms",
    description: "Configure rooms, outlets, and devices",
    icon: Phone,
  },
  {
    id: 6,
    title: "Site Connections",
    description: "Define inter-building connections",
    icon: Cable,
  },
  {
    id: 7,
    title: "Future Proposals",
    description: "Plan future infrastructure improvements",
    icon: CheckCircle,
  },
];

export function ComprehensiveInfrastructureWizard({
  siteSurveyId,
  siteSurveyData,
  onComplete,
}: ComprehensiveInfrastructureWizardProps) {
  
  const [wizardData, setWizardData] = useState<InfrastructureData>({
    buildings: [],
    siteConnections: [],
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

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

  const saveProgress = async () => {
    try {
      setSaving(true);
      
      // Save comprehensive infrastructure data
      await fetch(`/api/site-surveys/${siteSurveyId}/comprehensive-infrastructure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          infrastructureData: {
            buildings: wizardData.buildings,
          },
          siteConnections: wizardData.siteConnections,
        }),
      });

      toast.success("Progress saved successfully");
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      // Auto-save before moving to next step (especially important before Equipment step)
      if (currentStep === 1) {
        toast.info("Saving infrastructure data...");
        await saveProgress();
      }
      setCurrentStep(currentStep + 1);
      if (currentStep !== 1) {
        saveProgress(); // Background save for other steps
      }
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
    setWizardData(prev => ({
      ...prev,
      buildings,
    }));
  };

  const handleSiteConnectionsUpdate = (siteConnections: SiteConnectionData[]) => {
    setWizardData(prev => ({
      ...prev,
      siteConnections,
    }));
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
            </div>
          </div>
        </div>
      </div>

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
              <FloorsStep
                buildings={wizardData.buildings}
                onUpdate={handleBuildingsUpdate}
                siteSurveyId={siteSurveyId}
              />
            )}
            {currentStep === 5 && (
              <RoomsStep
                buildings={wizardData.buildings}
                onUpdate={handleBuildingsUpdate}
                siteSurveyId={siteSurveyId}
              />
            )}
            {currentStep === 6 && (
              <SiteConnectionsStep
                siteConnections={wizardData.siteConnections}
                buildings={wizardData.buildings}
                onUpdate={handleSiteConnectionsUpdate}
                siteSurveyId={siteSurveyId}
              />
            )}
            {currentStep === 7 && (
              <FutureProposalsStep
                futureBuildings={[]}
                futureEquipment={[]}
                onUpdate={() => {}}
                siteSurveyId={siteSurveyId}
                siteSurveyData={siteSurveyData}
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
