// Core interfaces for SOW generation and management
export interface SOWGenerationData {
  id: string;
  project_name: string;
  project_address: string;
  customer_name?: string;
  customer_phone?: string;
  status: 'processing' | 'complete' | 'failed';
  error_message?: string;
  request_data: any;
  inspection_id?: string;
  file_uploaded: boolean;
  file_name?: string;
  extraction_confidence?: number;
  pdf_url?: string;
  pdf_data?: string;
  engineering_summary?: any;
  template_used?: string;
  created_at: string;
  completed_at?: string;
  generation_time_ms?: number;
  created_by?: string;
  updated_at: string;
}

export interface SOWGenerationResult {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  message?: string;
  error?: string;
}

export type GenerationStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface SOWGenerationRecord {
  id: string;
  inspection_id?: string;
  template_type: string;
  generation_status: GenerationStatus;
  input_data: any;
  output_data?: any;
  pdf_url?: string;
  error_message?: string;
  generation_started_at?: string;
  generation_finished_at?: string;
  generation_duration_seconds?: number;
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
  id: string;
  project_name: string;
  project_address: string;
  customer_name?: string;
  customer_phone?: string;
  building_height?: number;
  building_length?: number;
  building_width?: number;
  square_footage?: number;
  number_of_stories?: number;
  roof_slope?: string;
  deck_type?: string;
  existing_membrane_type?: string;
  existing_membrane_condition?: number;
  roof_age_years?: number;
  insulation_type?: string;
  insulation_condition?: string;
  cover_board_type?: string;
  overall_condition?: number;
  priority_level?: string;
  photos?: string[];
  notes?: string;
  status?: string;
  sow_generated?: boolean;
  sow_id?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  asce_requirements?: ASCERequirements;
  asce_version?: string;
  wind_speed?: number;
  exposure_category?: string;
  building_classification?: string;
}

export interface SOWGenerationRequest {
  // Basic project information
  projectName: string;
  projectAddress: string;
  companyName?: string;
  customerName?: string;
  customerPhone?: string;

  // Building specifications
  squareFootage?: number;
  buildingHeight?: number;
  buildingDimensions?: {
    length?: number;
    width?: number;
  };
  deckType?: string;
  projectType?: 'recover' | 'tearoff' | 'new';
  roofSlope?: number;
  elevation?: number;

  // Location data for jurisdiction analysis
  city?: string;
  state?: string;
  county?: string;
  zipCode?: string;

  // ASCE 7 requirements (enhanced)
  asceRequirements?: ASCERequirements;
  asceVersion?: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  engineeringNotes?: string;

  // Membrane specifications
  membraneType?: string;
  membraneThickness?: string;
  membraneMaterial?: string;
  selectedMembraneBrand?: string;

  // Takeoff data
  takeoffData?: any;
  takeoffFile?: File;

  // Optional overrides
  basicWindSpeed?: number;
  preferredManufacturer?: string;
  includesTaperedInsulation?: boolean;
  userSelectedSystem?: string;
  customNotes?: string[];

  // Inspector information
  inspectorName?: string;
  inspectionDate?: string;
}

interface ASCERequirements {
  version: string;
  wind_speed?: number;
  exposure_category: string;
  building_classification: string;
  risk_category: string;
  importance_factor: number;
  hvhz_applicable?: boolean;
  engineer_approved?: boolean;
  approval_date?: string;
  approval_engineer?: string;
  notes?: string;
}

export function transformInspectionToSOWRequest(inspection: FieldInspectionData): SOWGenerationRequest {
  return {
    projectName: inspection.project_name,
    projectAddress: inspection.project_address,
    customerName: inspection.customer_name,
    customerPhone: inspection.customer_phone,
    squareFootage: inspection.square_footage,
    buildingHeight: inspection.building_height,
    buildingDimensions: {
      length: inspection.building_length,
      width: inspection.building_width
    },
    deckType: inspection.deck_type,
    roofSlope: typeof inspection.roof_slope === 'string' ? parseFloat(inspection.roof_slope) : inspection.roof_slope,
    
    // Location data
    city: inspection.city,
    state: inspection.state,
    county: inspection.county,
    zipCode: inspection.zip_code,
    
    // ASCE requirements (enhanced)
    asceRequirements: inspection.asce_requirements,
    asceVersion: inspection.asce_version,
    windSpeed: inspection.wind_speed,
    exposureCategory: inspection.exposure_category,
    buildingClassification: inspection.building_classification,
    
    // Membrane specifications
    membraneType: inspection.existing_membrane_type,
    
    // Inspector information
    inspectorName: inspection.inspector_name,
    inspectionDate: inspection.inspection_date,
    
    // Additional notes
    customNotes: [
      inspection.notes,
      inspection.recommendations,
      inspection.concerns
    ].filter(Boolean) as string[]
  };
}
