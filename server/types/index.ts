// Enhanced Type Definitions with Comprehensive Jurisdiction Analysis
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
    data: string;
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
  // NEW: Section Analysis for transparency
  sectionAnalysis?: {
    includedSections: Array<{
      id: string;
      title: string;
      rationale: string;
    }>;
    excludedSections: Array<{
      id: string;
      title: string;
      rationale: string;
    }>;
    reasoningMap: Record<string, string>;
    selfHealingActions?: Array<{
      action: string;
      reason: string;
      confidence: number;
    }>;
    confidenceScore?: number;
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
    engineeringSummary?: EngineeringSummaryData;
  };
  uploadedFiles?: string[];
  error?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  city: string;
  county: string;
  state: string;
  elevation: number;
}

export interface JurisdictionData {
  codeCycle: string;
  asceVersion: '7-10' | '7-16' | '7-22';
  hvhz: boolean;
  windSpeed?: number;
  specialRequirements?: string[];
}

export interface WindAnalysisParams {
  latitude: number;
  longitude: number;
  elevation: number;
  exposureCategory: string;
  buildingHeight: number;
  asceVersion: '7-10' | '7-16' | '7-22';
}

export interface WindAnalysisResult {
  designWindSpeed: number;
  exposureCategory: string;
  elevation: number;
  zonePressures: {
    zone1Field: number;
    zone1Perimeter: number;
    zone2Perimeter: number;
    zone3Corner: number;
  };
}

export interface TemplateSelectionParams {
  projectType: string;
  deckType?: string;
  membraneThickness: string;
  hvhz: boolean;
  windPressures: {
    zone3Corner: number;
  };
}

export interface TemplateSelectionResult {
  template: string;
  rationale: string;
  attachmentMethod: string;
}

// NEW: Section Engine Types
export interface SectionOutput {
  id: string;
  title: string;
  included: boolean;
  rationale: string;
  content?: string;
  priority?: number;
  dependencies?: string[];
  warnings?: string[];
}

export interface SectionAnalysis {
  includedSections: SectionOutput[];
  excludedSections: SectionOutput[];
  reasoningMap: Record<string, string>;
  selfHealingActions: Array<{
    action: string;
    reason: string;
    confidence: number;
  }>;
  confidenceScore: number;
}

// NEW: Self-Healing Types
export interface SelfHealingAction {
  type: 'missing_field' | 'low_confidence' | 'fallback_selection' | 'auto_correction';
  field: string;
  originalValue?: any;
  correctedValue: any;
  reason: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

export interface SelfHealingReport {
  totalActions: number;
  highImpactActions: SelfHealingAction[];
  recommendations: string[];
  overallConfidence: number;
  requiresUserReview: boolean;
}

// NEW: Comprehensive Jurisdiction Analysis Types
export interface ComprehensiveJurisdictionAnalysis {
  // Basic location data
  address: string;
  geocoding: GeocodeResult;
  
  // Jurisdiction determination
  jurisdiction: {
    city: string;
    county: string;
    state: string;
    codeCycle: string;
    asceVersion: string;
    hvhz: boolean;
    windSpeed?: number;
    specialRequirements?: string[];
  };
  
  // Wind analysis
  windAnalysis: {
    designWindSpeed: number;
    exposureCategory: string;
    elevation: number;
    asceVersion: '7-10' | '7-16' | '7-22';
    zonePressures: {
      zone1Field: number;
      zone1Perimeter: number;
      zone2Perimeter: number;
      zone3Corner: number;
    };
    calculationFactors: {
      Kh: number;
      Kzt: number;
      Kd: number;
      qh: number;
    };
  };
  
  // Summary metadata
  summary: {
    appliedMethod: string;
    reasoning: string;
    compliance: {
      hvhzRequired: boolean;
      specialRequirements: string[];
      codeReferences: string[];
    };
  };
}

// NEW: ASCE Mapping Data Structure
export interface ASCEMappingData {
  states: Record<string, {
    defaultCode: string;
    defaultASCE: string;
    counties: Record<string, {
      codeCycle: string;
      asceVersion: string;
      hvhz: boolean;
      windSpeed: number;
      specialRequirements?: string[];
    }>;
  }>;
  windSpeedDefaults: Record<string, number>;
  asceVersions: Record<string, {
    pressureCoefficients: Record<string, number>;
  }>;
  exposureCategories: Record<string, any>;
}

// NEW: SOW Metadata with Jurisdiction Context
export interface SOWMetadata {
  projectLocation: string;
  appliedCodes: string[];
  windCriteria: string;
  complianceNotes: string[];
  engineeringBasis: string;
  generatedAt: string;
  jurisdictionAnalysis: ComprehensiveJurisdictionAnalysis;
}

// NEW: Pressure Table for SOW Documents
export interface PressureTable {
  title: string;
  method: string;
  zones: Array<{
    zone: string;
    description: string;
    pressure: string;
    units: string;
  }>;
}

// NEW: Jurisdiction Compliance Validation
export interface JurisdictionCompliance {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  requiredActions: string[];
}

// NEW: Enhanced Wind Summary
export interface WindAnalysisSummary {
  method: string;
  asceVersion: string;
  windSpeed: number;
  zonePressures: {
    zone1Field: number;
    zone1Perimeter: number;
    zone2Perimeter: number;
    zone3Corner: number;
  };
  reasoning: string;
  calculationFactors: {
    Kh: number;
    Kzt: number;
    Kd: number;
    qh: number;
  };
}

// NEW: API Request/Response Types for Jurisdiction Analysis
export interface JurisdictionAnalysisRequest {
  address: string;
  buildingHeight?: number;
  exposureCategory?: 'B' | 'C' | 'D';
}

export interface JurisdictionAnalysisResponse {
  success: boolean;
  analysis?: ComprehensiveJurisdictionAnalysis;
  metadata?: SOWMetadata;
  pressureTable?: PressureTable;
  compliance?: JurisdictionCompliance;
  error?: string;
}

// NEW: Quick Lookup Types
export interface QuickJurisdictionLookup {
  county: string;
  state: string;
}

export interface QuickJurisdictionResponse {
  codeCycle: string;
  asceVersion: string;
  hvhz: boolean;
  windSpeed?: number;
  specialRequirements?: string[];
}

// Enhanced existing interfaces for better integration
export interface EnhancedGeocodeResult extends GeocodeResult {
  jurisdictionData?: JurisdictionData;
  windAnalysis?: WindAnalysisResult;
}

export interface EnhancedWindAnalysisParams extends WindAnalysisParams {
  jurisdictionContext?: {
    county: string;
    state: string;
    codeCycle: string;
  };
}

// Export utility types
export type ASCEVersion = '7-10' | '7-16' | '7-22';
export type ExposureCategory = 'B' | 'C' | 'D';
export type ProjectType = 'recover' | 'tearoff' | 'new';
export type DeckType = 'steel' | 'concrete' | 'wood' | 'gypsum' | 'lightweight-concrete';
export type MembraneType = 'TPO' | 'EPDM' | 'PVC' | 'Modified Bitumen' | 'Built-Up';
