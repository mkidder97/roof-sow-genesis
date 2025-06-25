// src/lib/api.ts - API configuration for connecting to your backend

const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://your-production-backend.com' 
  : 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Main SOW Generation - Your primary endpoint
  generateSOW: `${API_BASE_URL}/api/sow/debug-sow`,
  
  // Debug and Development
  debugSOW: `${API_BASE_URL}/api/debug-sow-enhanced`,
  debugEngine: `${API_BASE_URL}/api/debug-engine-trace`,
  
  // Template System
  renderTemplate: `${API_BASE_URL}/api/render-template`,
  templateMap: `${API_BASE_URL}/api/template-map`,
  
  // System Status
  health: `${API_BASE_URL}/health`,
  status: `${API_BASE_URL}/api/status`,
  docs: `${API_BASE_URL}/api/docs`,
  
  // Draft Management
  saveDraft: `${API_BASE_URL}/api/drafts/save`,
  loadDraft: `${API_BASE_URL}/api/drafts`,
  listDrafts: `${API_BASE_URL}/api/drafts/list`,
  deleteDraft: `${API_BASE_URL}/api/drafts`,
  calculateSquareFootage: `${API_BASE_URL}/api/drafts/calculate-sqft`,
  
  // Legacy endpoints (still supported)
  generateSOWLegacy: `${API_BASE_URL}/api/generate-sow`,
  debugSOWLegacy: `${API_BASE_URL}/api/debug-sow`,
} as const;

export interface SOWGenerationRequest {
  // Project Information
  projectName?: string;
  projectAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Building Specifications
  buildingHeight?: number;
  deckType?: string;
  membraneType?: string;
  insulationType?: string;
  
  // Wind Analysis
  windSpeed?: number;
  exposureCategory?: 'B' | 'C' | 'D';
  buildingClassification?: 'I' | 'II' | 'III' | 'IV';
  
  // File Upload
  takeoffFile?: File;
  
  // Additional metadata
  [key: string]: any;
}

export interface SOWGenerationResponse {
  success: boolean;
  data?: {
    sow?: string;
    pdf?: string;
    engineeringSummary?: any;
    template?: string;
    templateUsed?: string;
  };
  error?: string;
  debug?: any;
}

// Legacy types for compatibility with existing SOWInputForm
export interface SOWPayload {
  projectName?: string;
  address?: string;
  companyName?: string;
  squareFootage?: number;
  buildingHeight?: number;
  buildingDimensions?: {
    length: number;
    width: number;
  };
  projectType?: string;
  membraneThickness?: string;
  membraneColor?: string;
  deckType?: string;
  elevation?: number;
  exposureCategory?: string;
  roofSlope?: number;
  documentAttachment?: {
    filename: string;
    type: string;
    data: string;
  };
}

export interface SOWResponse {
  success: boolean;
  outputPath?: string;
  filename?: string;
  generationTime?: number;
  metadata?: {
    engineeringSummary?: any;
  };
  error?: string;
}

// Draft Management Types
export interface DraftData {
  id?: string;
  projectName?: string;
  projectAddress?: string;
  buildingHeight?: number;
  buildingLength?: number;
  buildingWidth?: number;
  squareFootage?: number;
  numberOfStories?: number;
  roofSlope?: string;
  deckType?: string;
  insulationLayers?: Array<{
    type: string;
    thickness: number;
  }>;
  coverBoard?: string;
  timestamp?: string;
  lastModified?: string;
  [key: string]: any;
}

export interface DraftResponse {
  success: boolean;
  draftId?: string;
  draft?: DraftData;
  message?: string;
  error?: string;
  squareFootage?: number;
}

export interface DraftListResponse {
  success: boolean;
  drafts?: DraftData[];
  count?: number;
  error?: string;
}

// Draft Management API Functions
export async function saveDraft(draftData: DraftData): Promise<DraftResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.saveDraft, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': 'current-user', // Replace with actual user ID from auth context
      },
      body: JSON.stringify(draftData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Save draft failed:', error);
    throw error;
  }
}

export async function loadDraft(draftId: string): Promise<DraftResponse> {
  try {
    const response = await fetch(`${API_ENDPOINTS.loadDraft}/${draftId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user-id': 'current-user', // Replace with actual user ID from auth context
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Load draft failed:', error);
    throw error;
  }
}

export async function listDrafts(): Promise<DraftListResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.listDrafts, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user-id': 'current-user', // Replace with actual user ID from auth context
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('List drafts failed:', error);
    throw error;
  }
}

export async function deleteDraft(draftId: string): Promise<DraftResponse> {
  try {
    const response = await fetch(`${API_ENDPOINTS.deleteDraft}/${draftId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'user-id': 'current-user', // Replace with actual user ID from auth context
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Delete draft failed:', error);
    throw error;
  }
}

// Utility function for making API calls with proper error handling
export async function apiCall<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Specialized function for file uploads
export async function uploadFileToAPI(
  endpoint: string,
  file: File,
  additionalData: Record<string, any> = {}
): Promise<SOWGenerationResponse> {
  try {
    const formData = new FormData();
    formData.append('takeoffFile', file);
    
    // Add additional form data
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
}

// Legacy API functions for compatibility with existing SOWInputForm
export async function generateSOW(payload: SOWPayload): Promise<SOWResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.generateSOW, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform response to match expected format
    return {
      success: data.success,
      outputPath: data.data?.pdf ? `data:application/pdf;base64,${data.data.pdf}` : undefined,
      filename: `SOW_${payload.projectName || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`,
      generationTime: data.generationTime || 0,
      metadata: {
        engineeringSummary: data.data?.engineeringSummary
      },
      error: data.error
    };
  } catch (error) {
    console.error('SOW generation failed:', error);
    throw error;
  }
}

export async function generateSOWWithDebug(payload: SOWPayload): Promise<SOWResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.debugSOW, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform response to match expected format
    return {
      success: data.success,
      outputPath: data.data?.pdf ? `data:application/pdf;base64,${data.data.pdf}` : undefined,
      filename: `SOW_DEBUG_${payload.projectName || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`,
      generationTime: data.generationTime || 0,
      metadata: {
        engineeringSummary: data.data?.engineeringSummary
      },
      error: data.error
    };
  } catch (error) {
    console.error('SOW debug generation failed:', error);
    throw error;
  }
}

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

export default API_ENDPOINTS;
