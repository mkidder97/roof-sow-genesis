// Common types for roof SOW generation system
// These types are shared between web-client and api-server

export interface ProjectData {
  projectName: string;
  projectAddress: string;
  customerName?: string;
  customerPhone?: string;
  squareFootage?: number;
  buildingHeight?: number;
}

export interface SOWGenerationRequest {
  projectData: ProjectData;
  templateId?: string;
  customOptions?: Record<string, any>;
}

export interface SOWGenerationResult {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  message?: string;
  error?: string;
}

export interface ASCERequirements {
  version: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  importance_factor?: number;
  engineer_approved?: boolean;
}

export interface FieldInspectionData {
  id: string;
  project_name: string;
  project_address: string;
  inspector_name: string;
  inspection_date?: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Under Review';
  priority_level: 'Low' | 'Standard' | 'High' | 'Urgent';
  // Add more fields as needed when moving from current src/types
}

// Export more types as we move them from the current structure
export * from './fieldInspection';
export * from './sow';
export * from './engineering';
