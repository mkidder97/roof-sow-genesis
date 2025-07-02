// TypeScript interfaces for engineering configuration

export interface ImportanceFactors {
  standard: number;
  essential: number;
  emergency: number;
}

export interface InternalPressureCoeffs {
  enclosed: number;
  partially_enclosed: number;
  open: number;
}

export interface DirectivityFactor {
  standard: number;
}

export interface WindExposureCoeffs {
  B: number;
  C: number;
  D: number;
}

export interface TopographicFactor {
  default: number;
  hilltop: number;
  ridge: number;
  escarpment: number;
}

export interface AttachmentZone {
  description: string;
  factor: number;
}

export interface AttachmentZones {
  field: AttachmentZone;
  perimeter: AttachmentZone;
  corner: AttachmentZone;
}

export interface MembraneSpec {
  standard_thickness: string;
  alternate_thickness: string;
  lap_width: string;
  weld_width: string;
  seam_requirements: string;
  cover_strip_thickness: string;
}

export interface MembraneSpecifications {
  TPO: MembraneSpec;
}

export interface TemplateCondition {
  roofType?: string;
  deckType?: string;
  membraneType?: string;
  attachmentType?: string;
  hasInsulation?: boolean;
  insulationAttachment?: string;
  hasLightweightConcrete?: boolean;
  hasCoverBoard?: boolean;
  existingSystem?: string;
  membraneStyle?: string;
  insulationType?: string;
}

export interface TemplateRule {
  condition: TemplateCondition;
  template: string;
  description: string;
}

export type TemplateRules = TemplateRule[];

// Configuration key type union
export type ConfigKey = 
  | 'importance_factors'
  | 'internal_pressure_coeffs'
  | 'directivity_factor'
  | 'wind_exposure_coeffs'
  | 'topographic_factor'
  | 'attachment_zones'
  | 'membrane_specifications'
  | 'template_rules';

// Configuration value type mapping
export interface ConfigValueMap {
  importance_factors: ImportanceFactors;
  internal_pressure_coeffs: InternalPressureCoeffs;
  directivity_factor: DirectivityFactor;
  wind_exposure_coeffs: WindExposureCoeffs;
  topographic_factor: TopographicFactor;
  attachment_zones: AttachmentZones;
  membrane_specifications: MembraneSpecifications;
  template_rules: TemplateRules;
}

// Database record interface
export interface EngineeringConfigRecord {
  key: string;
  value: any; // JSONB from database
  description?: string;
  created_at: string;
  updated_at: string;
}

// Service response interface
export interface ConfigServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}
