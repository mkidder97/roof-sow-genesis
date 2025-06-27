// Frontend API client for SOW generation
// Location: src/lib/api/sow-api.ts

export interface TakeoffFormData {
  // Required fields
  project_name: string;
  address: string;
  roof_area: number;
  membrane_type: 'TPO' | 'EPDM' | 'PVC' | 'Modified Bitumen' | 'Built-Up';
  fastening_pattern: 'Mechanically Attached' | 'Fully Adhered' | 'Ballasted';
  
  // Optional fields
  insulation_type?: 'Polyiso' | 'XPS' | 'EPS' | 'Mineral Wool' | 'None';
  insulation_thickness?: number;
  deck_type?: 'Steel' | 'Concrete' | 'Wood' | 'Lightweight Concrete';
  building_height?: number;
  wind_zone?: 'I' | 'II' | 'III' | 'IV';
  hvhz_zone?: boolean;
  county?: string;
  state?: string;
  building_code?: 'IBC2021' | 'IBC2018' | 'FBC2020' | 'FBC2023';
  asce_version?: '7-16' | '7-22' | '7-10';
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  error_count: number;
  warning_count: number;
}

export interface WorkflowResponse {
  workflow_id: string;
  status: string;
  timestamp: string;
  validation_passed: boolean;
  download_url?: string;
  error_message?: string;
  validation_errors: string[];
  validation_warnings: string[];
}

export interface RecentWorkflow {
  workflow_id: string;
  project_name: string;
  created: number;
  roof_area: number;
  membrane_type: string;
}

class SOWApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Health check for the API server
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error('API server is not responding');
    }
    return response.json();
  }

  /**
   * Validate takeoff data without generating SOW (for real-time validation)
   */
  async validateTakeoffData(data: TakeoffFormData): Promise<ValidationResult> {
    const response = await fetch(`${this.baseUrl}/api/validate-only`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Validation failed');
    }

    return response.json();
  }

  /**
   * Submit takeoff form and generate SOW
   */
  async submitTakeoffForm(data: TakeoffFormData): Promise<WorkflowResponse> {
    const response = await fetch(`${this.baseUrl}/api/submit-takeoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Submission failed');
    }

    return response.json();
  }

  /**
   * Get workflow status by ID
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/workflow/${workflowId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Workflow not found');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get workflow status');
    }

    return response.json();
  }

  /**
   * Get recent workflows
   */
  async getRecentWorkflows(limit: number = 10): Promise<{ workflows: RecentWorkflow[] }> {
    const response = await fetch(`${this.baseUrl}/api/recent-workflows?limit=${limit}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get recent workflows');
    }

    return response.json();
  }

  /**
   * Download PDF file
   */
  async downloadPDF(filename: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/download/pdf/${filename}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('PDF file not found');
      }
      throw new Error('Failed to download PDF');
    }

    return response.blob();
  }

  /**
   * Get download URL for PDF
   */
  getPDFDownloadUrl(filename: string): string {
    return `${this.baseUrl}/api/download/pdf/${filename}`;
  }

  /**
   * Trigger PDF download in browser
   */
  async triggerPDFDownload(filename: string): Promise<void> {
    try {
      const blob = await this.downloadPDF(filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
}

// Default instance
export const sowApi = new SOWApiClient();

// Export class for custom instances
export { SOWApiClient };

// Utility functions for form validation
export const validateFormData = (data: Partial<TakeoffFormData>): string[] => {
  const errors: string[] = [];

  // Required field validation
  if (!data.project_name || data.project_name.trim().length === 0) {
    errors.push('Project name is required');
  }

  if (!data.address || data.address.trim().length < 10) {
    errors.push('Address must be at least 10 characters');
  }

  if (!data.roof_area || data.roof_area <= 0) {
    errors.push('Roof area must be greater than 0');
  }

  if (!data.membrane_type) {
    errors.push('Membrane type is required');
  }

  if (!data.fastening_pattern) {
    errors.push('Fastening pattern is required');
  }

  // Optional field validation
  if (data.insulation_thickness !== undefined && data.insulation_thickness < 0) {
    errors.push('Insulation thickness cannot be negative');
  }

  if (data.building_height !== undefined && data.building_height < 8) {
    errors.push('Building height must be at least 8 feet');
  }

  return errors;
};

// Form field options
export const FORM_OPTIONS = {
  membrane_types: ['TPO', 'EPDM', 'PVC', 'Modified Bitumen', 'Built-Up'],
  fastening_patterns: ['Mechanically Attached', 'Fully Adhered', 'Ballasted'],
  insulation_types: ['Polyiso', 'XPS', 'EPS', 'Mineral Wool', 'None'],
  deck_types: ['Steel', 'Concrete', 'Wood', 'Lightweight Concrete'],
  wind_zones: ['I', 'II', 'III', 'IV'],
  building_codes: ['IBC2021', 'IBC2018', 'FBC2020', 'FBC2023'],
  asce_versions: ['7-16', '7-22', '7-10'],
} as const;