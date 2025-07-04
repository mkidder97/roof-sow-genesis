// Main export file for shared package

// Export all types
export * from './types/api';
export * from './types/fieldInspection';
export * from './types/sow';
export * from './types/engineering';
export * from './types/roofing';

// Export utilities
export * from './utils';
export * from './utils/fieldInspection';
export * from './utils/sow';
export * from './utils/validation';
export * from './utils/windAnalysis';
export * from './utils/jurisdiction';

// Export constants
export * from './constants';

// Re-export commonly used types for convenience
export type {
  JurisdictionAnalysisRequest,
  JurisdictionAnalysisResponse,
  WindAnalysisParams,
  WindAnalysisResult,
  HealthCheckResponse,
  ApiResponse,
} from './types/api';

export type {
  FieldInspection,
  FieldInspectionData,
  HVACUnit,
  RoofDrain,
  Penetration,
  DrainageSOWConfig,
} from './types/fieldInspection';

export type {
  SOWGenerationRequest,
  SOWGenerationResult,
  SOWGenerationData,
  ProjectMetadata,
  Environmental,
  Membrane,
  Takeoff,
  Notes,
} from './types/sow';

export type {
  ASCERequirements,
  PartialASCERequirements,
  EngineeringAnalysis,
  WindLoadCalculation,
} from './types/engineering';

export type {
  MembraneType,
  InsulationType,
  DeckType,
  ProjectType,
  AttachmentMethod,
  RoofingMaterial,
  RoofSystem,
  ManufacturerSystem,
  RoofingSpecification,
} from './types/roofing';

// Re-export utility interfaces for convenience
export type {
  WindZonePressures,
  WindFactors,
} from './utils/windAnalysis';

export type {
  JurisdictionInfo,
  ComplianceIssue,
  ComplianceResult,
} from './utils/jurisdiction';
