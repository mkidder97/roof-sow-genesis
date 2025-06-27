// src/lib/api.ts - Clean Production API Configuration

const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://your-production-backend.com' 
  : 'http://localhost:3001';

export const API_ENDPOINTS = {
  // PRODUCTION: Clean SOW generation endpoint
  generateSOW: `${API_BASE_URL}/api/sow/generate`,
  downloadSOW: `${API_BASE_URL}/api/sow/download`,
  getSOWStatus: `${API_BASE_URL}/api/sow/status`,
  listSOWs: `${API_BASE_URL}/api/sow/list`,
  deleteSOW: `${API_BASE_URL}/api/sow`,
  
  // System Status
  health: `${API_BASE_URL}/health`,
  status: `${API_BASE_URL}/api/status`,
  sowHealth: `${API_BASE_URL}/api/sow/health`,
  
  // Debug endpoints (for development)
  debugSOW: `${API_BASE_URL}/api/debug/sow`,
  debugEngine: `${API_BASE_URL}/api/debug/engine`,
  
  // Template endpoints
  templateMap: `${API_BASE_URL}/api/templates/map`,
  renderTemplate: `${API_BASE_URL}/api/templates/render`,
  docs: `${API_BASE_URL}/api/docs`,
  
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
  downloadUrl?: string;
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
    fileSize?: number;
  };
  error?: string;
}

// Type aliases for backward compatibility
export type SOWResponse = SOWGenerationResponse;
export type SOWPayload = SOWGenerationRequest;

/**
 * Generic API call utility
 */
export async function apiCall(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Main production SOW generation function
 * Clean, direct generation without self-healing complexity
 */
export async function generateSOWAPI(request: SOWGenerationRequest): Promise<SOWGenerationResponse> {
  try {
    const formData = new FormData();
    
    // Clean project data mapping
    const projectData = {
      projectName: request.projectData.projectName,
      projectAddress: request.projectData.projectAddress,
      customerName: request.projectData.customerName,
      customerPhone: request.projectData.customerPhone,
      buildingHeight: request.projectData.buildingHeight,
      squareFootage: request.projectData.squareFootage,
      numberOfDrains: request.projectData.numberOfDrains,
      numberOfPenetrations: request.projectData.numberOfPenetrations,
      membraneType: request.projectData.membraneType,
      windSpeed: request.projectData.windSpeed,
      exposureCategory: request.projectData.exposureCategory,
      projectType: request.projectData.projectType,
      city: request.projectData.city,
      state: request.projectData.state,
      zipCode: request.projectData.zipCode,
      deckType: request.projectData.deckType,
      insulationType: request.projectData.insulationType,
      buildingClassification: request.projectData.buildingClassification,
      notes: request.projectData.notes
    };
    
    // Add project data
    formData.append('projectData', JSON.stringify(projectData));
    
    // Add inspection ID if provided
    if (request.inspectionId) {
      formData.append('inspectionId', request.inspectionId);
    }
    
    // Add file if provided
    if (request.file) {
      formData.append('file', request.file);
    }

    console.log('🚀 Clean production SOW generation request:', {
      projectName: projectData.projectName,
      projectAddress: projectData.projectAddress,
      hasFile: !!request.file,
      productionMode: true
    });

    const response = await fetch(API_ENDPOINTS.generateSOW, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Production SOW generated successfully');
    
    return result;
  } catch (error) {
    console.error('❌ Production SOW generation failed:', error);
    throw error;
  }
}

/**
 * Download SOW PDF
 */
export async function downloadSOWAPI(sowId: string): Promise<Blob> {
  try {
    const response = await fetch(`${API_ENDPOINTS.downloadSOW}/${sowId}`);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Get SOW status
 */
export async function getSOWStatusAPI(sowId: string): Promise<any> {
  return apiCall(`${API_ENDPOINTS.getSOWStatus}/${sowId}`);
}

/**
 * List SOWs
 */
export async function listSOWsAPI(): Promise<any> {
  return apiCall(API_ENDPOINTS.listSOWs);
}

/**
 * Delete SOW
 */
export async function deleteSOWAPI(sowId: string): Promise<any> {
  return apiCall(`${API_ENDPOINTS.deleteSOW}/${sowId}`, {
    method: 'DELETE'
  });
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
