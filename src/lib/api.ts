// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://your-deployed-backend.fly.dev');

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
  };
  error?: string;
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
