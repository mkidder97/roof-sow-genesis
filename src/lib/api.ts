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

export default API_ENDPOINTS;
