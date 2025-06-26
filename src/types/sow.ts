export interface UseSOWGenerationProps {
  onSuccess?: (data: SOWGenerationResponse) => void;
  onError?: (error: Error) => void;
}

export interface SOWGenerationResponse {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  generationStatus?: GenerationStatus;
  metadata?: {
    generationTime?: number;
    fileProcessed?: boolean;
    extractionConfidence?: number;
    fileSize?: number;
  };
}

export interface SOWGenerationRequest {
  projectName?: string;
  projectAddress?: string;
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
