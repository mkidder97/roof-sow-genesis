// src/lib/api.ts - Clean Production API Configuration

const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://your-production-backend.com' 
  : 'http://localhost:8001';

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
  
  // Jurisdiction Analysis (Keep - These are good)
  jurisdictionAnalyze: `${API_BASE_URL}/api/jurisdiction/analyze`,
  jurisdictionLookup: `${API_BASE_URL}/api/jurisdiction/lookup`,
  jurisdictionGeocode: `${API_BASE_URL}/api/jurisdiction/geocode`,
  jurisdictionCodes: `${API_BASE_URL}/api/jurisdiction/codes`,
  jurisdictionValidate: `${API_BASE_URL}/api/jurisdiction/validate`,
  jurisdictionPressureTable: `${API_BASE_URL}/api/jurisdiction/pressure-table`,
  jurisdictionDebug: `${API_BASE_URL}/api/jurisdiction/debug`,
  jurisdictionHealth: `${API_BASE_URL}/api/jurisdiction/health`,
  
  // Developer Tools Info (not integrated in production workflow)
  devTools: `${API_BASE_URL}/api/dev-tools`,
  
  // Additional endpoints for testing
  docs: `${API_BASE_URL}/api/docs`,
  templateMap: `${API_BASE_URL}/api/template-map`,
  
  // Legacy compatibility
  SOW_GENERATION: `${API_BASE_URL}/api/sow/generate`,
  HEALTH_CHECK: `${API_BASE_URL}/api/health`,
  PROJECTS: `${API_BASE_URL}/api/projects`,
} as const;

export interface SOWGenerationRequest {
  // Clean production request structure
  projectData: {
    projectName: string;
    projectAddress: string;
    customerName?: string;
    customerPhone?: string;
    buildingHeight?: number;
    squareFootage?: number;
    numberOfDrains?: number;
    numberOfPenetrations?: number;
    membraneType?: string;
    windSpeed?: number;
    exposureCategory?: string;
    projectType?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    deckType?: string;
    insulationType?: string;
    buildingClassification?: string;
    notes?: string;
  };
  inspectionId?: string;
  file?: File;
}

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
      fileSize?: number;
      fileUrl?: string;
      filename?: string;
      generationTime?: number;
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
  // Additional properties that components expect
  filename?: string;
  outputPath?: string;
}

// Legacy alias for compatibility
export type SOWResponse = SOWGenerationResponse;

// Draft Management Interface
export interface DraftData {
  id: string;
  name: string;
  data: any;
  created_at: string;
  updated_at: string;
  // Properties that components expect to be at the top level
  projectName?: string;
  projectAddress?: string;
  buildingHeight?: number;
  buildingLength?: number;
  buildingWidth?: number;
  squareFootage?: number;
  numberOfStories?: number;
  lastModified?: string;
  insulationLayers?: any[];
}

/**
 * Main production SOW generation function
 * Clean, direct generation without self-healing complexity
 */
export async function generateSOWAPI(request: SOWGenerationRequest): Promise<SOWGenerationResponse> {
  try {
    console.log('🚀 Calling Supabase SOW generation function:', request);
    
    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Flatten the request structure for the edge function
    const flatRequest = {
      ...request.projectData,
      inspectionId: request.inspectionId
    };

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-sow', {
      body: flatRequest
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      throw new Error(error.message || 'SOW generation failed');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'SOW generation failed');
    }

    console.log('✅ SOW generation successful:', data);
    
    // Transform response to match expected interface
    return {
      success: true,
      data: data.data,
      metadata: data.metadata,
      filename: data.data?.engineeringSummary?.filename,
      outputPath: data.downloadUrl
    };
  } catch (error) {
    console.error('❌ SOW generation failed:', error);
    throw error;
  }
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

/**
 * Check SOW system health
 */
export async function checkSOWHealth(): Promise<any> {
  try {
    const response = await fetch(API_ENDPOINTS.sowHealth);
    
    if (!response.ok) {
      throw new Error(`SOW health check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('SOW health check failed:', error);
    throw error;
  }
}

/**
 * Get system status
 */
export async function getSystemStatus(): Promise<any> {
  try {
    const response = await fetch(API_ENDPOINTS.status);
    
    if (!response.ok) {
      throw new Error(`System status check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('System status check failed:', error);
    throw error;
  }
}

/**
 * Get developer tools info (separate from production)
 */
export async function getDevToolsInfo(): Promise<any> {
  try {
    const response = await fetch(API_ENDPOINTS.devTools);
    
    if (!response.ok) {
      throw new Error(`Dev tools info failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Dev tools info failed:', error);
    throw error;
  }
}

// Legacy compatibility functions (simplified for production)
export async function generateSOW(payload: any): Promise<any> {
  // Convert legacy payload to new format
  const request: SOWGenerationRequest = {
    projectData: {
      projectName: payload.projectName || 'Untitled Project',
      projectAddress: payload.address || payload.projectAddress || '',
      buildingHeight: payload.buildingHeight,
      squareFootage: payload.squareFootage,
      membraneType: payload.membraneThickness?.includes('TPO') ? 'TPO' : 'EPDM',
      projectType: payload.projectType || 'recover',
      deckType: payload.deckType,
      exposureCategory: payload.exposureCategory
    }
  };

  return generateSOWAPI(request);
}

export async function generateSOWWithDebug(payload: any): Promise<any> {
  // In production, just use the clean generation (no debug complexity)
  return generateSOW(payload);
}

export default API_ENDPOINTS;
