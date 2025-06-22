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

export interface EngineeringSummaryData {
  jurisdiction: {
    city: string;
    county: string;
    state: string;
    codeCycle: string;
    asceVersion: string;
    hvhz: boolean;
  };
  windAnalysis: {
    windSpeed: string;
    exposure: string;
    elevation: string;
    zonePressures: {
      zone1Field: string;
      zone1Perimeter: string;
      zone2Perimeter: string;
      zone3Corner: string;
    };
  };
  systemSelection: {
    selectedTemplate: string;
    rationale: string;
    rejectedManufacturers: string[];
    approvalSource: string[];
  };
  attachmentSpec: {
    fieldSpacing: string;
    perimeterSpacing: string;
    cornerSpacing: string;
    penetrationDepth: string;
    notes: string;
  };
}

export interface SOWResponse {
  success: boolean;
  filename?: string;
  outputPath?: string;
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
    // NEW: Engineering Summary Data
    engineeringSummary?: EngineeringSummaryData;
  };
  uploadedFiles?: string[]; // For future OCR use
  error?: string;
}

// NEW: Enhanced SOW generation with debug support
export async function generateSOWWithDebug(payload: SOWPayload): Promise<SOWResponse> {
  try {
    console.log('🚀 Sending debug SOW request to:', `${API_BASE_URL}/api/sow/debug-sow`);
    console.log('📦 Payload:', payload);
    
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
