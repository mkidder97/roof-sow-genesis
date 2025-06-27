export interface UseSOWGenerationProps {
  onSuccess?: (data: SOWGenerationResponse) => void;
  onError?: (error: Error) => void;
}

export interface SOWGenerationResponse {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  filename?: string;
  outputPath?: string;
  fileSize?: number;
  generationStatus?: GenerationStatus;
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

export interface SOWGenerationRequest {
  // Make core fields required to match api.ts usage
  projectName: string;
  projectAddress: string;
  
  // Optional fields
  customerName?: string;
  customerPhone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  buildingHeight?: number;
  deckType?: string;
  membraneType?: string;
  insulationType?: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  notes?: string;
  inspectionId?: string;
  takeoffFile?: File;
  projectType?: string;
  squareFootage?: number;
  numberOfDrains?: number;
  numberOfPenetrations?: number;
  
  // Keep projectData for backward compatibility
  projectData?: {
    projectName?: string;
    projectAddress?: string;
    customerName?: string;
    customerPhone?: string;
    squareFootage?: number;
    numberOfDrains?: number;
    numberOfPenetrations?: number;
    projectType?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    buildingHeight?: number;
    deckType?: string;
    membraneType?: string;
    insulationType?: string;
    windSpeed?: number;
    exposureCategory?: string;
    buildingClassification?: string;
    notes?: string;
  };
}

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface SOWGenerationRecord {
  id: string;
  inspection_id?: string;
  user_id?: string;
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

export interface DashboardMetrics {
  totalInspections: number;
  totalSOWsGenerated: number;
  pendingSOWs: number;
  avgGenerationTime: number;
  recentGenerations: SOWGenerationRecord[];
}

export interface FieldInspectionData {
  projectName?: string;
  project_name?: string;
  projectAddress?: string;
  project_address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zip_code?: string;
  buildingHeight?: number;
  building_height?: number;
  deckType?: string;
  deck_type?: string;
  membraneType?: string;
  membrane_type?: string;
  insulationType?: string;
  insulation_type?: string;
  windSpeed?: number;
  wind_speed?: number;
  exposureCategory?: string;
  exposure_category?: string;
  buildingClassification?: string;
  building_classification?: string;
  notes?: string;
}

// SOW Form Section Types
export interface ProjectMetadata {
  projectName: string;
  companyName: string;
  address: string;
  squareFootage?: number;
  projectType: 'Recover' | 'Tear-Off' | 'Replacement';
  deckType: 'Steel' | 'Wood' | 'Concrete';
  buildingHeight?: number;
  length?: number;
  width?: number;
}

export interface Environmental {
  city: string;
  state: string;
  zip: string;
  elevation?: number;
  jurisdiction: string;
  exposureCategory: 'B' | 'C' | 'D';
  asceVersion: '7-10' | '7-16' | '7-22';
  hvhzZone: boolean;
}

export interface Membrane {
  manufacturer: string;
  productName: string;
  membraneType: 'TPO' | 'PVC';
  thickness: 45 | 60 | 80 | 115;
  warrantyTerm: 20 | 25 | 30;
  attachmentMethod: 'Induction Welded' | 'Fully Adhered' | 'Mechanically Attached';
}

export interface Takeoff {
  drains?: number;
  pipePenetrations?: number;
  curbs?: number;
  hvacUnits?: number;
  skylights?: number;
  scuppers?: number;
  expansionJoints: boolean;
}

export interface Notes {
  contractorName: string;
  addendaNotes: string;
  warrantyNotes: string;
}

// Error handling types
export interface SOWGenerationError extends Error {
  type: 'network' | 'server' | 'validation' | 'unknown';
  code?: string;
  details?: any;
}

export function createSOWError(message: string, type: SOWGenerationError['type'], code?: string, details?: any): SOWGenerationError {
  const error = new Error(message) as SOWGenerationError;
  error.type = type;
  error.code = code;
  error.details = details;
  return error;
}

export function isNetworkError(error: Error): boolean {
  return error.message.includes('fetch') || 
         error.message.includes('network') || 
         error.message.includes('connection') ||
         error.name === 'NetworkError' ||
         error.name === 'TypeError';
}

export function transformInspectionToSOWRequest(inspectionData: FieldInspectionData): SOWGenerationRequest {
  return {
    projectName: inspectionData.projectName || inspectionData.project_name || '',
    projectAddress: inspectionData.projectAddress || inspectionData.project_address || '',
    city: inspectionData.city,
    state: inspectionData.state,
    zipCode: inspectionData.zipCode || inspectionData.zip_code,
    buildingHeight: inspectionData.buildingHeight || inspectionData.building_height,
    deckType: inspectionData.deckType || inspectionData.deck_type,
    membraneType: inspectionData.membraneType || inspectionData.membrane_type,
    insulationType: inspectionData.insulationType || inspectionData.insulation_type,
    windSpeed: inspectionData.windSpeed || inspectionData.wind_speed,
    exposureCategory: inspectionData.exposureCategory || inspectionData.exposure_category,
    buildingClassification: inspectionData.buildingClassification || inspectionData.building_classification,
    notes: inspectionData.notes,
  };
}
