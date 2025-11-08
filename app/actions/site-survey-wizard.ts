'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Save wizard data (buildings, pricing) to database
 */
export async function saveWizardData(siteSurveyId: string, wizardData: {
  buildings: any[];
  productPricing: Record<string, { unitPrice: number; margin: number; totalPrice: number }>;
  servicePricing: Record<string, { unitPrice: number; margin: number; totalPrice: number }>;
}) {
  console.log('🔥 [SERVER ACTION] ========== ENTRY POINT HIT ==========');
  console.log('🔥 [SERVER ACTION] Received siteSurveyId:', siteSurveyId);
  console.log('🔥 [SERVER ACTION] Received wizardData type:', typeof wizardData);
  console.log('🔥 [SERVER ACTION] wizardData keys:', Object.keys(wizardData || {}));
  
  try {
    console.log('🔥 [SERVER ACTION] Starting auth check...');
    const session = await auth();
    console.log('🔥 [SERVER ACTION] Session:', { hasUser: !!session?.user, userId: session?.user?.id });
    
    if (!session?.user?.id) {
      console.error('❌ [SERVER ACTION] Unauthorized - no session');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('💾 [SERVER ACTION] Saving wizardData with pricing:', {
      buildingsCount: wizardData.buildings?.length || 0,
      productPricingCount: Object.keys(wizardData.productPricing || {}).length,
      servicePricingCount: Object.keys(wizardData.servicePricing || {}).length,
    });
    console.log('📊 [SERVER ACTION] FULL PRODUCT PRICING:', JSON.stringify(wizardData.productPricing, null, 2));
    console.log('📊 [SERVER ACTION] FULL SERVICE PRICING:', JSON.stringify(wizardData.servicePricing, null, 2));
    console.log('📊 [SERVER ACTION] FULL BUILDINGS DATA:', JSON.stringify(wizardData.buildings, null, 2));

    console.log('🔥 [SERVER ACTION] Fetching existing survey from DB...');
    // Get existing site survey
    const existingSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      select: { infrastructureData: true },
    });

    console.log('🔥 [SERVER ACTION] Existing survey found:', !!existingSurvey);
    
    if (!existingSurvey) {
      console.error('❌ [SERVER ACTION] Site survey not found');
      return { success: false, error: 'Site survey not found' };
    }

    const currentInfraData = (existingSurvey.infrastructureData as any) || {};
    console.log('🔥 [SERVER ACTION] Current infraData keys:', Object.keys(currentInfraData));
    
    // Merge wizard data while preserving aiContent
    const updatedInfraData = {
      ...currentInfraData,
      wizardData: wizardData,
      aiContent: currentInfraData.aiContent, // Preserve AI content
    };

    console.log('📊 [SERVER ACTION] Final infrastructureData structure:', JSON.stringify({
      hasWizardData: !!updatedInfraData.wizardData,
      hasAiContent: !!updatedInfraData.aiContent,
      wizardDataKeys: Object.keys(updatedInfraData.wizardData || {}),
      productPricingInWizard: Object.keys(updatedInfraData.wizardData?.productPricing || {}).length,
      servicePricingInWizard: Object.keys(updatedInfraData.wizardData?.servicePricing || {}).length,
    }, null, 2));

    console.log('🔥 [SERVER ACTION] Updating database...');
    // Update database
    await prisma.siteSurvey.update({
      where: { id: siteSurveyId },
      data: {
        infrastructureData: updatedInfraData,
      },
    });

    console.log('✅ [SERVER ACTION] Wizard data saved to database successfully');

    console.log('🔥 [SERVER ACTION] Revalidating path...');
    // Revalidate the site survey page
    revalidatePath(`/site-surveys/${siteSurveyId}`);

    console.log('🔥 [SERVER ACTION] ========== SAVE COMPLETE ==========');
    return { success: true };
  } catch (error) {
    console.error('❌ [SERVER ACTION] ========== ERROR OCCURRED ==========');
    console.error('❌ [SERVER ACTION] Error type:', error?.constructor?.name);
    console.error('❌ [SERVER ACTION] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [SERVER ACTION] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ [SERVER ACTION] Full error object:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save wizard data' 
    };
  }
}

/**
 * Server Action: Load wizard data from database
 */
export async function loadWizardData(siteSurveyId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', data: null };
    }

    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id: siteSurveyId },
      select: { infrastructureData: true },
    });

    if (!siteSurvey) {
      return { success: false, error: 'Site survey not found', data: null };
    }

    const infrastructureData = (siteSurvey.infrastructureData as any) || {};
    const wizardData = infrastructureData.wizardData || {};

    console.log('📥 [SERVER ACTION] Loading wizardData:', {
      buildingsCount: wizardData.buildings?.length || 0,
      productPricingCount: Object.keys(wizardData.productPricing || {}).length,
      servicePricingCount: Object.keys(wizardData.servicePricing || {}).length,
    });

    return { 
      success: true, 
      data: {
        buildings: wizardData.buildings || [],
        productPricing: wizardData.productPricing || {},
        servicePricing: wizardData.servicePricing || {},
      }
    };
  } catch (error) {
    console.error('❌ [SERVER ACTION] Error loading wizard data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load wizard data',
      data: null 
    };
  }
}

