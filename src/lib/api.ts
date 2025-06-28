
import { supabase } from '@/integrations/supabase/client';
import { SOWGenerationRequest, SOWGenerationResult } from '@/types/sow';

const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://your-production-backend.com' 
  : 'http://localhost:8001';

// Export missing API utilities
export const API_ENDPOINTS = {
  // PRODUCTION: Clean SOW generation endpoint
  generateSOW: `${API_BASE_URL}/api/sow/generate`,
  downloadSOW: `${API_BASE_URL}/api/sow/download`,
  getSOWStatus: `${API_BASE_URL}/api/sow/status`,
  listSOWs: `${API_BASE_URL}/api/sow/list`,
  deleteSOW: `${API_BASE_URL}/api/sow`,
  
  // System Status
  health: `${API_BASE_URL}/api/health`,
  status: `${API_BASE_URL}/api/status`,
  sowHealth: `${API_BASE_URL}/api/sow/health`,
  
  // Legacy endpoints for compatibility
  GENERATE_SOW: '/generate-sow',
  HEALTH_CHECK: '/health',
  docs: '/docs',
  templateMap: '/template-map',
  
  // Jurisdiction Analysis
  jurisdictionAnalyze: `${API_BASE_URL}/api/jurisdiction/analyze`,
  jurisdictionLookup: `${API_BASE_URL}/api/jurisdiction/lookup`,
  jurisdictionGeocode: `${API_BASE_URL}/api/jurisdiction/geocode`,
  jurisdictionCodes: `${API_BASE_URL}/api/jurisdiction/codes`,
  jurisdictionValidate: `${API_BASE_URL}/api/jurisdiction/validate`,
  jurisdictionPressureTable: `${API_BASE_URL}/api/jurisdiction/pressure-table`,
  jurisdictionDebug: `${API_BASE_URL}/api/jurisdiction/debug`,
  jurisdictionHealth: `${API_BASE_URL}/api/jurisdiction/health`,
  
  // Developer Tools Info
  devTools: `${API_BASE_URL}/api/dev-tools`,
} as const;

export interface SOWGenerationResponse {
  success: boolean;
  data?: {
    pdf?: string;
    sow?: string;
    engineeringSummary?: {
      jurisdiction?: {
        location: string;
        asceVersion: string;
        hvhz: boolean;
        windSpeed: number;
      };
      windAnalysis?: {
        pressures: any;
        zones: any;
        calculations: any;
      };
      manufacturerAnalysis?: {
        selectedPattern: string;
        manufacturer: string;
        system: string;
        approvals: string[];
        liveDataSources: string[];
        dataSource: string;
      };
    };
    template?: string;
    templateUsed?: string;
  };
  generationTime?: number;
  metadata?: {
    fileProcessed?: boolean;
    extractionConfidence?: number;
    liveManufacturerData?: boolean;
    productionGeneration?: boolean;
  };
  error?: string;
}

// Draft Management Interface
export interface DraftData {
  id: string;
  name: string;
  data: any;
  created_at: string;
  updated_at: string;
}

/**
 * Generic API call helper
 */
export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

/**
 * Main production SOW generation function
 * Clean, direct generation with Supabase integration
 */
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

/**
 * Draft Management Functions
 */
export async function saveDraft(name: string, data: any): Promise<DraftData> {
  // For Phase 1, use local storage as a simple draft system
  const draft: DraftData = {
    id: Date.now().toString(),
    name,
    data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const drafts = await listDrafts();
  const updatedDrafts = [...drafts, draft];
  localStorage.setItem('sow_drafts', JSON.stringify(updatedDrafts));
  
  return draft;
}

export async function loadDraft(id: string): Promise<DraftData | null> {
  const drafts = await listDrafts();
  return drafts.find(draft => draft.id === id) || null;
}

export async function listDrafts(): Promise<DraftData[]> {
  try {
    const draftsJson = localStorage.getItem('sow_drafts');
    return draftsJson ? JSON.parse(draftsJson) : [];
  } catch {
    return [];
  }
}

export async function deleteDraft(id: string): Promise<boolean> {
  const drafts = await listDrafts();
  const filteredDrafts = drafts.filter(draft => draft.id !== id);
  localStorage.setItem('sow_drafts', JSON.stringify(filteredDrafts));
  return true;
}

/**
 * SOW Management Functions
 */
export async function downloadSOWAPI(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/download/pdf/${id}`);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  return await response.blob();
}

export async function getSOWStatusAPI(id: string): Promise<any> {
  return apiCall(`${API_BASE_URL}/api/workflow/${id}`);
}

export async function listSOWsAPI(): Promise<any> {
  return apiCall(`${API_BASE_URL}/api/recent-workflows`);
}

export async function deleteSOWAPI(id: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/sow/${id}`, {
    method: 'DELETE',
  });
  return response.ok;
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<any> {
  try {
    const response = await fetch(API_ENDPOINTS.health);
    
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// Export for compatibility - use proper type export syntax
export type { SOWGenerationResult as SOWGenerationResponse };
export type { SOWGenerationResult as SOWResponse };
export type { SOWGenerationRequest };