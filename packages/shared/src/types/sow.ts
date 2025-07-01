// SOW (Scope of Work) Generation Types - Shared between frontend and backend

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
  filename?: string;
  outputPath?: string;
  generationTime?: number;
  data?: {
    sow?: string;
    pdf?: string;
    engineeringSummary?: any;
    template?: string;
  };
}

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SOWGenerationRecord {
  id: string;
  inspection_id?: string;
  template_type: string;
  generation_status: GenerationStatus;
  input_data: any;
  output_data?: any;
  pdf_url?: string;
  output_file_path?: string;
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
  deckType?: 'concrete' | 'metal' | 'wood' | 'gypsum';
  projectType?: 'recover' | 'tearoff' | 'new';
  roofSlope?: number;
  elevation?: number;

  // Location data for jurisdiction analysis
  city?: string;
  state?: string;
  county?: string;
  zipCode?: string;

  // ASCE 7 requirements
  asceRequirements?: any; // Will be properly typed when we move ASCE types
  asceVersion?: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  engineeringNotes?: string;

  // Membrane specifications
  membraneType?: 'tpo' | 'epdm' | 'pvc' | 'modified-bitumen';
  membraneThickness?: string;
  membraneMaterial?: string;
  selectedMembraneBrand?: string;
  insulationType?: 'polyiso' | 'eps' | 'xps' | 'mineral-wool';
  attachmentMethod?: string;

  // Template Selection
  templateId?: string;
  
  // Enhanced Drainage Configuration
  drainageConfiguration?: {
    primaryType: 'Deck Drains' | 'Scuppers' | 'Gutters';
    overflowType?: string;
    specifications: {
      deck_drains?: {
        count: number;
        diameter: number;
        type: 'primary' | 'secondary' | 'overflow';
      };
      scuppers?: {
        count: number;
        length: number;
        width: number;
        height_above_roof: number;
        type: 'primary' | 'overflow';
      };
      gutters?: {
        linear_feet: number;
        height: number;
        width: number;
        depth: number;
      };
    };
    additionalDrainage?: {
      count: number;
      type: string;
      specifications: string;
    };
  };
  
  // Equipment Specifications
  equipmentSpecs?: {
    skylights: {
      count: number;
      requiresFlashing: boolean;
      details: any[];
    };
    hvacUnits: {
      count: number;
      requiresCurbs: boolean;
      details: any[];
    };
    accessPoints: {
      count: number;
      roofHatches: number;
      details: any[];
    };
    walkwayPads: number;
    equipmentPlatforms: number;
  };
  
  // Penetration Specifications
  penetrationSpecs?: {
    gasLines: {
      present: boolean;
      count: number;
      requiresSpecialFlashing: boolean;
    };
    conduit: {
      attachedToUnderside: boolean;
      description: string;
      requiresProtection: boolean;
    };
    other: {
      description: string;
      requiresCustomFlashing: boolean;
    };
  };
  
  // Section Inclusions
  sectionInclusions?: {
    // Core sections
    tearoffAndDisposal: boolean;
    newRoofSystem: boolean;
    flashing: boolean;
    
    // Conditional sections
    drainageModifications: boolean;
    scupperWork: boolean;
    gutterInstallation: boolean;
    equipmentCurbs: boolean;
    skylightFlashing: boolean;
    walkwayPads: boolean;
    equipmentPlatforms: boolean;
    gasLinePenetrations: boolean;
    conduitProtection: boolean;
    interiorProtection: boolean;
    
    // Safety and access
    safetyRequirements: string[];
    accessRequirements: boolean;
  };

  // Takeoff data
  takeoffData?: any;
  takeoffFile?: File;

  // Optional overrides
  basicWindSpeed?: number;
  preferredManufacturer?: string;
  includesTaperedInsulation?: boolean;
  userSelectedSystem?: string;
  customNotes?: string[];
  specialRequirements?: string[];

  // Inspector information
  inspectorName?: string;
  inspectionDate?: string;
  
  // Legacy equipment counts (for backward compatibility)
  numberOfDrains?: number;
  numberOfPenetrations?: number;
  
  // Notes
  notes?: string;
  
  // Inspection ID
  inspectionId?: string;
}

// Error handling types
export interface SOWGenerationError {
  message: string;
  code?: string;
  details?: any;
  type: 'network' | 'validation' | 'server' | 'unknown';
}

// Section types for SOW components
export interface ProjectMetadata {
  projectName: string;
  address: string;
  customerName?: string;
  companyName?: string;
  squareFootage?: number;
  projectType?: string;
  deckType?: string;
  buildingHeight?: number;
  length?: number;
  width?: number;
}

export interface Environmental {
  windSpeed: number;
  exposureCategory: string;
  asceVersion: string;
  city?: string;
  state?: string;
  zip?: string;
  elevation?: number;
  jurisdiction?: string;
  hvhzZone?: boolean;
}

export interface Membrane {
  type: string;
  thickness: string;
  color?: string;
  manufacturer?: string;
  productName?: string;
  membraneType?: string;
  warrantyTerm?: string;
  attachmentMethod?: string;
}

export interface Takeoff {
  squareFootage: number;
  materials: any[];
  drains?: number;
  pipePenetrations?: number;
  curbs?: number;
  hvacUnits?: number;
  skylights?: number;
  scuppers?: number;
  expansionJoints?: number;
}

export interface Notes {
  general?: string;
  special?: string;
  engineering?: string;
  contractorName?: string;
  addendaNotes?: string;
  warrantyNotes?: string;
}

// Export response type alias
export type SOWResponse = SOWGenerationResult;