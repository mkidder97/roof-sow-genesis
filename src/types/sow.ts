
// Complete SOW Type Definitions - Single Source of Truth
// Based on actual code usage analysis

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Main SOW Generation Request - matches actual usage in components
export interface SOWGenerationRequest {
  projectName: string;
  projectAddress: string;
  city?: string;
  state?: string;
  zipCode?: string;
  buildingHeight?: number;
  deckType?: 'concrete' | 'metal' | 'wood' | 'gypsum';
  membraneType?: 'tpo' | 'epdm' | 'pvc' | 'modified-bitumen';
  insulationType?: 'polyiso' | 'eps' | 'xps' | 'mineral-wool';
  windSpeed?: number;
  exposureCategory?: 'B' | 'C' | 'D';
  buildingClassification?: 'I' | 'II' | 'III' | 'IV';
  takeoffFile?: File;
  notes?: string;
  inspectionId?: string;
}

// SOW Generation Response - matches actual backend response
export interface SOWGenerationResponse {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  file_url?: string;
  generationStatus?: GenerationStatus;
  error?: string;
  estimatedCompletionTime?: number;
  data?: {
    sow?: string;
    pdf?: string;
    engineeringSummary?: any;
    template?: string;
    templateUsed?: string;
  };
  metadata?: {
    generationTime?: number;
    fileProcessed?: boolean;
    extractionConfidence?: number;
    fileSize?: number;
  };
}

// Database record interface
export interface SOWGenerationRecord {
  id: string;
  inspection_id?: string;
  user_id: string;
  template_type: string;
  generation_status: GenerationStatus;
  input_data: any;
  output_file_path?: string;
  file_size_bytes?: number;
  generation_started_at: string;
  generation_completed_at?: string;
  generation_duration_seconds?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Error interface
export interface SOWGenerationError {
  message: string;
  code?: string;
  details?: Record<string, any>;
  type?: 'network' | 'validation' | 'server' | 'unknown';
}

// Field inspection data interface (for workflow integration)
export interface FieldInspectionData {
  id?: string;
  projectName?: string;
  project_name?: string; // Legacy field
  projectAddress?: string;
  project_address?: string; // Legacy field
  city?: string;
  state?: string;
  zipCode?: string;
  zip_code?: string; // Legacy field
  buildingHeight?: number;
  building_height?: number; // Legacy field
  deckType?: string;
  deck_type?: string; // Legacy field
  membraneType?: string;
  membrane_type?: string; // Legacy field
  insulationType?: string;
  insulation_type?: string; // Legacy field
  windSpeed?: number;
  wind_speed?: number; // Legacy field
  exposureCategory?: string;
  exposure_category?: string; // Legacy field
  buildingClassification?: string;
  building_classification?: string; // Legacy field
  notes?: string;
  inspectorName?: string;
  inspector_name?: string; // Legacy field
  completed?: boolean;
  status?: string;
}

// Dashboard metrics interface
export interface DashboardMetrics {
  totalInspections: number;
  totalSOWsGenerated: number;
  pendingSOWs: number;
  avgGenerationTime: number;
  recentGenerations: SOWGenerationRecord[];
}

// Hook props interfaces
export interface UseSOWGenerationProps {
  onSuccess?: (data: SOWGenerationResponse) => void;
  onError?: (error: Error) => void;
}

// Utility functions
export function createSOWError(
  message: string, 
  type: SOWGenerationError['type'] = 'unknown', 
  details?: any
): SOWGenerationError {
  return {
    message,
    type,
    details,
    code: `SOW_${type.toUpperCase()}_ERROR`,
  };
}

export function isNetworkError(error: any): boolean {
  return error?.type === 'network' || 
         error?.message?.includes('fetch') || 
         error?.message?.includes('Load failed') ||
         error?.name === 'TypeError';
}

export function transformInspectionToSOWRequest(inspection: FieldInspectionData): Partial<SOWGenerationRequest> {
  return {
    projectName: inspection.projectName || inspection.project_name || '',
    projectAddress: inspection.projectAddress || inspection.project_address || '',
    city: inspection.city,
    state: inspection.state,
    zipCode: inspection.zipCode || inspection.zip_code,
    buildingHeight: inspection.buildingHeight || inspection.building_height,
    deckType: (inspection.deckType || inspection.deck_type) as any,
    membraneType: (inspection.membraneType || inspection.membrane_type) as any,
    insulationType: (inspection.insulationType || inspection.insulation_type) as any,
    windSpeed: inspection.windSpeed || inspection.wind_speed,
    exposureCategory: (inspection.exposureCategory || inspection.exposure_category) as any,
    buildingClassification: (inspection.buildingClassification || inspection.building_classification) as any,
    notes: inspection.notes,
    inspectionId: inspection.id,
  };
}
