// Type Definitions
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
