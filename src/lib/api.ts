// API configuration
const API_BASE_URL = 'http://localhost:3001';

export interface SOWPayload {
  projectName: string;
  address: string;
  companyName: string;
  squareFootage: number;
  buildingHeight: number;
  buildingDimensions: {
    length: number;
    width: number;
  };
  projectType: string;
  membraneThickness: string;
  membraneColor: string;
  deckType?: string;
  elevation?: number;
  exposureCategory?: string;
  roofSlope?: number;
  documentAttachment?: {
    filename: string;
    type: string;
    data: string; // base64
  };
}

// Import from local types instead of server types
import { EngineeringSummaryData } from '../types/engineering';

export interface SOWResponse {
  success: boolean;
  filename?: string;
  outputPath?: string;
  fileUrl?: string;
  fileSize?: number;
  generationTime?: number;
  metadata?: {
    projectName: string;
    template: string;
    windPressure: string;
    attachmentMethod?: string;
    jurisdiction?: {
      county: string;
      state: string;
      codeCycle: string;
      asceVersion: string;
      hvhz: boolean;
    };
    // Engineering Summary Data
    engineeringSummary?: EngineeringSummaryData;
  };
  uploadedFiles?: string[]; // For future OCR use
  error?: string;
  
  // **NEW: File processing support**
  fileProcessed?: boolean;
  fileProcessingSummary?: {
    filename: string;
    extractedData?: any;
    processingSuccess: boolean;
    error?: string;
  };
}

// **FIXED: Enhanced SOW generation with file upload support**
export async function generateSOWWithDebug(payload: SOWPayload): Promise<SOWResponse> {
  try {
    console.log('🚀 Sending debug SOW request to:', `${API_BASE_URL}/api/sow/debug-sow`);
    console.log('📦 Payload:', payload);
    
    // **NEW: Check if we have a file to upload**
    if (payload.documentAttachment) {
      console.log('📁 File detected, using FormData upload...');
      return await sendWithFormData(payload, '/api/sow/debug-sow');
    }
    
    // **EXISTING: JSON for non-file requests**
    const response = await fetch(`${API_BASE_URL}/api/sow/debug-sow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result: SOWResponse = await response.json();
    
    console.log('📡 Debug response status:', response.status);
    console.log('📄 Debug response data:', result);

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Debug SOW generation failed');
    }

    return result;
  } catch (error) {
    console.error('❌ Debug API Error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Make sure your test server is running.`);
    }
    
    throw error;
  }
}

export async function generateSOW(payload: SOWPayload): Promise<SOWResponse> {
  try {
    console.log('🚀 Sending SOW request to:', `${API_BASE_URL}/api/generate-sow`);
    console.log('📦 Payload:', payload);
    
    // **NEW: Check if we have a file to upload**
    if (payload.documentAttachment) {
      console.log('📁 File detected, using FormData upload...');
      return await sendWithFormData(payload, '/api/generate-sow');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/generate-sow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result: SOWResponse = await response.json();
    
    console.log('📡 Response status:', response.status);
    console.log('📄 Response data:', result);

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'SOW generation failed');
    }

    return result;
  } catch (error) {
    console.error('❌ API Error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Make sure your test server is running.`);
    }
    
    throw error;
  }
}

// **NEW: Helper function to send requests with file uploads**
async function sendWithFormData(payload: SOWPayload, endpoint: string): Promise<SOWResponse> {
  const formData = new FormData();
  
  // Convert base64 to blob and add file
  if (payload.documentAttachment) {
    const { filename, type, data } = payload.documentAttachment;
    
    // Convert base64 to blob
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type });
    
    // Add file to FormData
    formData.append('file', blob, filename);
    console.log(`📁 File added to FormData: ${filename} (${type})`);
  }
  
  // Add project data as JSON string (excluding file attachment)
  const projectData = { ...payload };
  delete projectData.documentAttachment;
  formData.append('data', JSON.stringify(projectData));
  
  console.log('📤 Sending FormData request...');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData, // No Content-Type header - let browser set it with boundary
  });

  const result: SOWResponse = await response.json();
  
  console.log('📡 FormData response status:', response.status);
  console.log('📄 FormData response data:', result);

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (!result.success) {
    throw new Error(result.error || 'SOW generation with file failed');
  }

  return result;
}

// Health check function for debugging
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Backend health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
