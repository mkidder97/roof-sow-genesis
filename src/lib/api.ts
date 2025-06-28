
import { supabase } from '@/integrations/supabase/client';
import { SOWGenerationRequest, SOWGenerationResult } from '@/types/sow';

// Export missing API utilities
export const API_ENDPOINTS = {
  GENERATE_SOW: '/generate-sow',
  HEALTH_CHECK: '/health',
  health: '/health',
  status: '/status',
  docs: '/docs',
  templateMap: '/template-map'
};

export async function apiCall(endpoint: string, data?: any) {
  // Basic API call utility
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// Main SOW generation function
export async function generateSOWAPI(request: SOWGenerationRequest): Promise<SOWGenerationResult> {
  try {
    console.log('🔄 Starting SOW generation API call');
    console.log('Request data:', request);

    // Validate required fields
    if (!request.projectName?.trim()) {
      throw new Error('Project name is required');
    }
    
    if (!request.projectAddress?.trim()) {
      throw new Error('Project address is required');
    }

    // Transform request data to match backend expectations
    const payload = {
      project_name: request.projectName,
      project_address: request.projectAddress,
      customer_name: request.customerName || 'TBD',
      customer_phone: request.customerPhone || 'TBD',
      
      // Building specifications
      building_height: request.buildingHeight || 20,
      square_footage: request.squareFootage || 10000,
      building_length: request.buildingDimensions?.length || 100,
      building_width: request.buildingDimensions?.width || 100,
      
      // Location data
      city: request.city || 'Unknown',
      state: request.state || 'FL',
      zip_code: request.zipCode || '00000',
      county: request.county,
      
      // Roof specifications
      deck_type: request.deckType || 'steel',
      membrane_type: request.membraneType || 'tpo',
      project_type: request.projectType || 'recover',
      roof_slope: request.roofSlope || 0,
      
      // ASCE requirements - properly serialize
      wind_speed: request.windSpeed || request.asceRequirements?.wind_speed || 140,
      exposure_category: request.exposureCategory || request.asceRequirements?.exposure_category || 'C',
      building_classification: request.buildingClassification || request.asceRequirements?.building_classification || 'II',
      asce_version: request.asceVersion || request.asceRequirements?.version || 'ASCE 7-22',
      asce_requirements: request.asceRequirements ? JSON.stringify(request.asceRequirements) : undefined,
      
      // Additional data
      custom_notes: request.customNotes || [],
      engineering_notes: request.engineeringNotes,
      inspector_name: request.inspectorName,
      inspection_date: request.inspectionDate
    };

    console.log('Transformed payload:', payload);

    // Call Supabase edge function
    const response = await supabase.functions.invoke('generate-sow', {
      body: payload
    });

    if (response.error) {
      console.error('SOW generation error:', response.error);
      throw new Error(response.error.message || 'SOW generation failed');
    }

    console.log('✅ SOW generation completed successfully');
    
    return {
      success: true,
      sowId: response.data?.sow_id || 'temp-id',
      downloadUrl: response.data?.download_url || '/temp-sow.pdf',
      message: 'SOW generated successfully'
    };

  } catch (error) {
    console.error('❌ SOW generation API error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Export for compatibility
export type SOWGenerationResponse = SOWGenerationResult;
export type SOWResponse = SOWGenerationResult;
export { SOWGenerationRequest };
