'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { saveWizardData } from '@/app/actions/site-survey-wizard';
import { BuildingData } from '@/components/site-surveys/comprehensive-infrastructure-wizard';
import { toast } from 'sonner';

interface PricingData {
  unitPrice: number;
  margin: number;
  totalPrice: number;
}

interface WizardContextType {
  buildings: BuildingData[];
  productPricing: Map<string, PricingData>;
  servicePricing: Map<string, PricingData>;
  setBuildings: (buildings: BuildingData[]) => void;
  updateProductPricing: (productId: string, pricing: PricingData) => void;
  updateServicePricing: (serviceId: string, pricing: PricingData) => void;
  deleteProductPricing: (productId: string) => void;
  deleteServicePricing: (serviceId: string) => void;
  saveToDatabase: () => Promise<boolean>;
  loadFromDatabase: (siteSurveyId: string) => Promise<void>;
  isAutoSaving: boolean;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ 
  children, 
  siteSurveyId,
  initialBuildings = [],
  initialProductPricing = {},
  initialServicePricing = {},
}: { 
  children: ReactNode;
  siteSurveyId: string;
  initialBuildings?: BuildingData[];
  initialProductPricing?: Record<string, PricingData>;
  initialServicePricing?: Record<string, PricingData>;
}) {
  const [buildings, setBuildings] = useState<BuildingData[]>(initialBuildings);
  const [productPricing, setProductPricing] = useState<Map<string, PricingData>>(
    new Map(Object.entries(initialProductPricing))
  );
  const [servicePricing, setServicePricing] = useState<Map<string, PricingData>>(
    new Map(Object.entries(initialServicePricing))
  );
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Auto-save to database whenever pricing changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (productPricing.size > 0 || servicePricing.size > 0) {
        console.log('🔄 [CONTEXT] Auto-saving pricing to database...');
        saveToDatabase();
      }
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timeoutId);
  }, [productPricing, servicePricing]);

  const saveToDatabase = useCallback(async (): Promise<boolean> => {
    setIsAutoSaving(true);
    try {
      console.log('💾 [CONTEXT] Saving wizard data to database via Server Action...');
      console.log('💾 [CONTEXT] Buildings:', buildings.length);
      console.log('💾 [CONTEXT] Product pricing entries:', productPricing.size);
      console.log('💾 [CONTEXT] Service pricing entries:', servicePricing.size);

      const result = await saveWizardData(siteSurveyId, {
        buildings,
        productPricing: Object.fromEntries(productPricing),
        servicePricing: Object.fromEntries(servicePricing),
      });

      if (!result.success) {
        console.error('❌ [CONTEXT] Save failed:', result.error);
        return false;
      }

      console.log('✅ [CONTEXT] Auto-save complete');
      return true;
    } catch (error) {
      console.error('❌ [CONTEXT] Error during auto-save:', error);
      return false;
    } finally {
      setIsAutoSaving(false);
    }
  }, [siteSurveyId, buildings, productPricing, servicePricing]);

  const loadFromDatabase = useCallback(async (surveyId: string) => {
    try {
      console.log('📥 [CONTEXT] Loading wizard data from database...');
      const response = await fetch(`/api/site-surveys/${surveyId}`);
      if (!response.ok) throw new Error('Failed to fetch site survey');
      
      const data = await response.json();
      const wizardData = data.wizardData || data.infrastructureData?.wizardData || {};
      
      if (wizardData.buildings) {
        setBuildings(wizardData.buildings);
        console.log('✅ [CONTEXT] Loaded buildings:', wizardData.buildings.length);
      }
      
      if (wizardData.productPricing) {
        setProductPricing(new Map(Object.entries(wizardData.productPricing)));
        console.log('✅ [CONTEXT] Loaded product pricing:', Object.keys(wizardData.productPricing).length);
      }
      
      if (wizardData.servicePricing) {
        setServicePricing(new Map(Object.entries(wizardData.servicePricing)));
        console.log('✅ [CONTEXT] Loaded service pricing:', Object.keys(wizardData.servicePricing).length);
      }
    } catch (error) {
      console.error('❌ [CONTEXT] Failed to load from database:', error);
      toast.error('Failed to load wizard data');
    }
  }, [setBuildings, setProductPricing, setServicePricing]);

  const updateProductPricing = useCallback((productId: string, pricing: PricingData) => {
    console.log('💰 [CONTEXT] Updating product pricing:', productId, pricing);
    setProductPricing(prev => {
      const newMap = new Map(prev);
      newMap.set(productId, pricing);
      return newMap;
    });
  }, []);

  const updateServicePricing = useCallback((serviceId: string, pricing: PricingData) => {
    console.log('💰 [CONTEXT] Updating service pricing:', serviceId, pricing);
    setServicePricing(prev => {
      const newMap = new Map(prev);
      newMap.set(serviceId, pricing);
      return newMap;
    });
  }, []);

  const deleteProductPricing = useCallback((productId: string) => {
    console.log('🗑️ [CONTEXT] Deleting product pricing:', productId);
    setProductPricing(prev => {
      const newMap = new Map(prev);
      newMap.delete(productId);
      return newMap;
    });
  }, []);

  const deleteServicePricing = useCallback((serviceId: string) => {
    console.log('🗑️ [CONTEXT] Deleting service pricing:', serviceId);
    setServicePricing(prev => {
      const newMap = new Map(prev);
      newMap.delete(serviceId);
      return newMap;
    });
  }, []);

  const value: WizardContextType = {
    buildings,
    productPricing,
    servicePricing,
    setBuildings,
    updateProductPricing,
    updateServicePricing,
    deleteProductPricing,
    deleteServicePricing,
    saveToDatabase,
    loadFromDatabase,
    isAutoSaving,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizardContext() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizardContext must be used within WizardProvider');
  }
  return context;
}

