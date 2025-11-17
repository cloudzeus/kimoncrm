"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Package, 
  ArrowLeft, 
  ArrowRight,
  Save,
  CheckCircle,
  Loader2,
  Camera,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { BuildingsStep } from "@/components/site-surveys/wizard-steps/buildings-step";
import { EquipmentAssignmentStep } from "@/components/site-surveys/wizard-steps/equipment-assignment-step";
import { BuildingData as ComprehensiveBuildingData } from "@/components/site-surveys/comprehensive-infrastructure-wizard";
import { BuildingData as TypesBuildingData } from "@/types/building-data";

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
];

export default function CollaboratorSurveyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const siteSurveyId = params.id as string;
  const token = searchParams.get("token");

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wizardData, setWizardData] = useState<{ buildings: ComprehensiveBuildingData[] }>({
    buildings: [],
  });
  const [siteSurveyData, setSiteSurveyData] = useState<any>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (siteSurveyId && token) {
      loadSurveyData();
    }
  }, [siteSurveyId, token]);

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      
      // Load site survey data
      const surveyResponse = await fetch(`/api/site-surveys/${siteSurveyId}`);
      if (!surveyResponse.ok) {
        throw new Error("Failed to load survey data");
      }
      const surveyData = await surveyResponse.json();
      setSiteSurveyData(surveyData);

      // Load infrastructure data
      const infraResponse = await fetch(`/api/site-surveys/${siteSurveyId}/comprehensive-infrastructure`);
      if (infraResponse.ok) {
        const infraData = await infraResponse.json();
        const loadedBuildings = (infraData.infrastructureData?.buildings || []) as ComprehensiveBuildingData[];
        setWizardData({ buildings: loadedBuildings });
      }
    } catch (error) {
      console.error("Error loading survey data:", error);
      toast.error("Failed to load survey data");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const saveProgress = async (markStepComplete?: number) => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/comprehensive-infrastructure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          infrastructureData: {
            buildings: wizardData.buildings,
          },
          completedStep: markStepComplete,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save progress");
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
    if (currentStep < 2) {
      await saveProgress(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = async () => {
    if (currentStep > 1) {
      await saveProgress();
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await saveProgress(2);
      
      toast.success('Survey completed successfully! Thank you for your contribution.');
      
      // Optionally redirect or show completion message
      setTimeout(() => {
        window.location.href = "/survey/completed";
      }, 2000);
    } catch (error) {
      console.error("Error completing survey:", error);
      toast.error("Failed to complete survey");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingsUpdate = (updatedBuildings: ComprehensiveBuildingData[] | TypesBuildingData[]) => {
    // Convert to ComprehensiveBuildingData format if needed
    setWizardData({ buildings: updatedBuildings as ComprehensiveBuildingData[] });
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (initialLoad || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-sm text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Mobile-friendly Header - Sticky */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                {siteSurveyData?.title || 'Site Survey'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  Step {currentStep}/{STEPS.length}
                </Badge>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {STEPS[currentStep - 1]?.title}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveProgress()}
              disabled={saving}
              className="min-h-[44px] sm:min-h-[36px] text-sm font-medium"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Progress"}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress value={progress} className="h-2.5" />
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap min-w-[60px] text-right">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator - Mobile */}
      <div className="bg-white border-b md:hidden">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white"
                          : isCompleted
                          ? "bg-green-600 border-green-600 text-white"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          isCompleted ? "bg-green-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <Card className="shadow-sm border-0 md:border">
          <CardContent className="p-3 sm:p-4 md:p-6">
            {currentStep === 1 && (
              <BuildingsStep
                buildings={wizardData.buildings}
                onUpdate={handleBuildingsUpdate}
                siteSurveyId={siteSurveyId}
              />
            )}

            {currentStep === 2 && (
              <EquipmentAssignmentStep
                buildings={wizardData.buildings as unknown as TypesBuildingData[]}
                onUpdate={(buildings) => {
                  // Convert back to ComprehensiveBuildingData format
                  setWizardData({ buildings: buildings as unknown as ComprehensiveBuildingData[] });
                }}
                siteSurveyId={siteSurveyId}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation - Mobile Friendly with Large Touch Targets */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch gap-3 mt-6 sm:mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || saving || loading}
            className="w-full sm:w-auto min-h-[48px] sm:min-h-[40px] text-base sm:text-sm font-medium order-2 sm:order-1"
          >
            <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Previous
          </Button>

          {currentStep < 2 ? (
            <Button
              onClick={handleNext}
              disabled={loading || saving}
              className="w-full sm:w-auto min-h-[48px] sm:min-h-[40px] text-base sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2"
            >
              Next Step
              <ArrowRight className="h-5 w-5 sm:h-4 sm:w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full sm:w-auto min-h-[48px] sm:min-h-[40px] text-base sm:text-sm font-medium bg-green-600 hover:bg-green-700 text-white order-1 sm:order-2"
            >
              <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
              {loading ? "Completing..." : "Complete Survey"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

