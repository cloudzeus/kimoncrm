"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Package, 
  DollarSign, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Save,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { InfrastructureStep } from "./wizard-steps/infrastructure-step";
import { EquipmentStep } from "./wizard-steps/equipment-step";
import { PricingStep } from "./wizard-steps/pricing-step";
import { EquipmentItem } from "@/types/equipment-selection";

export interface WizardData {
  // Infrastructure data
  buildings: any[];
  buildingConnections: any[];
  
  // Equipment data
  equipment: EquipmentItem[];
  
  // Metadata
  siteSurveyId: string;
  lastSaved?: Date;
}

interface SiteSurveyWizardProps {
  siteSurveyId: string;
  siteSurveyData?: any;
  onComplete?: () => void;
}

const STEPS = [
  {
    id: 1,
    title: "Infrastructure",
    description: "Define buildings, floors, racks, and rooms",
    icon: Building2,
  },
  {
    id: 2,
    title: "Equipment",
    description: "Select products and services",
    icon: Package,
  },
  {
    id: 3,
    title: "Pricing & Review",
    description: "Set prices, quantities, and margins",
    icon: DollarSign,
  },
];

export function SiteSurveyWizard({
  siteSurveyId,
  siteSurveyData,
  onComplete,
}: SiteSurveyWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    buildings: [],
    buildingConnections: [],
    equipment: [],
    siteSurveyId,
  });
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
      
      // Load infrastructure data
      const infraResponse = await fetch(`/api/site-surveys/${siteSurveyId}/infrastructure`);
      if (infraResponse.ok) {
        const infraData = await infraResponse.json();
        setWizardData(prev => ({
          ...prev,
          buildings: infraData.buildings || [],
          buildingConnections: infraData.buildingConnections || [],
        }));
      }

      // Load equipment data
      const equipmentResponse = await fetch(`/api/site-surveys/${siteSurveyId}/equipment`);
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setWizardData(prev => ({
          ...prev,
          equipment: equipmentData.equipment || [],
        }));
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
      
      // Save infrastructure data
      await fetch(`/api/site-surveys/${siteSurveyId}/infrastructure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildings: wizardData.buildings,
          buildingConnections: wizardData.buildingConnections,
        }),
      });

      // Save equipment data
      await fetch(`/api/site-surveys/${siteSurveyId}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment: wizardData.equipment,
        }),
      });

      setWizardData(prev => ({ ...prev, lastSaved: new Date() }));
      toast.success("Progress saved successfully");
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    // Auto-save before moving to next step
    await saveProgress();
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const handleInfrastructureUpdate = (data: { buildings: any[]; buildingConnections: any[] }) => {
    setWizardData(prev => ({
      ...prev,
      buildings: data.buildings,
      buildingConnections: data.buildingConnections,
    }));
  };

  const handleEquipmentUpdate = (equipment: EquipmentItem[]) => {
    setWizardData(prev => ({
      ...prev,
      equipment,
    }));
  };

  const handleFinalSubmit = async (finalEquipment: EquipmentItem[]) => {
    try {
      setLoading(true);

      // Update equipment with final pricing
      setWizardData(prev => ({ ...prev, equipment: finalEquipment }));

      // Save final data
      await fetch(`/api/site-surveys/${siteSurveyId}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment: finalEquipment }),
      });

      // Generate and upload BOM Excel to BunnyCDN
      const bomResponse = await fetch(`/api/site-surveys/${siteSurveyId}/generate-and-upload-bom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment: finalEquipment,
          buildings: wizardData.buildings,
        }),
      });

      if (bomResponse.ok) {
        const bomResult = await bomResponse.json();
        toast.success(`BOM Excel uploaded: ${bomResult.fileName}`);
      } else {
        throw new Error('Failed to generate BOM Excel');
      }

      // Generate and upload Word Document to BunnyCDN
      const wordResponse = await fetch(`/api/site-surveys/${siteSurveyId}/generate-and-upload-word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment: finalEquipment }),
      });

      if (wordResponse.ok) {
        const wordResult = await wordResponse.json();
        toast.success(`Word document uploaded: ${wordResult.fileName}`);
      } else {
        throw new Error('Failed to generate Word document');
      }

      toast.success('Site survey completed successfully! All documents uploaded to CDN.');
      onComplete?.();

    } catch (error) {
      console.error("Error completing survey:", error);
      toast.error("Failed to complete survey: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wizard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Site Survey Wizard</h2>
          <div className="flex items-center gap-2">
            {wizardData.lastSaved && (
              <span className="text-sm text-muted-foreground">
                Last saved: {wizardData.lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={saveProgress}
              disabled={saving}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Progress"}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center gap-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div key={step.id} className="flex-1">
              <button
                onClick={() => handleStepClick(step.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : isCompleted
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-primary text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{step.title}</span>
                      {isActive && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>
              {index < STEPS.length - 1 && (
                <div className="h-0.5 bg-gray-200 my-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <InfrastructureStep
              buildings={wizardData.buildings}
              buildingConnections={wizardData.buildingConnections}
              onUpdate={handleInfrastructureUpdate}
              siteSurveyId={siteSurveyId}
            />
          )}

          {currentStep === 2 && (
            <EquipmentStep
              equipment={wizardData.equipment}
              buildings={wizardData.buildings}
              onUpdate={handleEquipmentUpdate}
              siteSurveyId={siteSurveyId}
            />
          )}

          {currentStep === 3 && (
            <PricingStep
              equipment={wizardData.equipment}
              buildings={wizardData.buildings}
              siteSurveyData={siteSurveyData}
              siteSurveyId={siteSurveyId}
              onSubmit={handleFinalSubmit}
              onBack={handlePrevious}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {currentStep < 3 && (
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button onClick={handleNext} disabled={loading || saving}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

