// Engineering and ASCE Requirements Types - Shared between frontend and backend

export interface ASCERequirements {
  version: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  importance_factor?: number;
  engineer_approved?: boolean;
  // Additional ASCE-specific fields
  riskCategory?: 'I' | 'II' | 'III' | 'IV';
  topographicFactor?: number;
  directionalityFactor?: number;
  enclosureClassification?: 'open' | 'partially_enclosed' | 'enclosed';
  internalPressureCoefficient?: number;
  velocityPressureExposureCoefficient?: number;
  buildingResponseFactor?: number;
  designLifeCategory?: string;
  ultimateWindSpeed?: number;
  meanRecurrenceInterval?: number;
  elevationAdjustmentFactor?: number;
  componentAndCladdingFactor?: number;
}

export interface PartialASCERequirements {
  version?: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  importance_factor?: number;
  engineer_approved?: boolean;
  riskCategory?: 'I' | 'II' | 'III' | 'IV';
  topographicFactor?: number;
  directionalityFactor?: number;
  enclosureClassification?: 'open' | 'partially_enclosed' | 'enclosed';
  internalPressureCoefficient?: number;
  velocityPressureExposureCoefficient?: number;
  buildingResponseFactor?: number;
  designLifeCategory?: string;
  ultimateWindSpeed?: number;
  meanRecurrenceInterval?: number;
  elevationAdjustmentFactor?: number;
  componentAndCladdingFactor?: number;
}

export interface EngineeringAnalysis {
  asceCompliance: boolean;
  windLoadCalculations: WindLoadCalculation[];
  structuralRecommendations: string[];
  attachmentRequirements: AttachmentRequirement[];
  safetyFactors: SafetyFactor[];
}

export interface WindLoadCalculation {
  zone: string;
  pressure: number;
  upliftForce: number;
  designMethod: string;
  applicableStandard: string;
}

export interface AttachmentRequirement {
  component: string;
  attachmentType: string;
  spacing: number;
  pulloutStrength: number;
  safetyFactor: number;
}

export interface SafetyFactor {
  component: string;
  requiredFactor: number;
  actualFactor: number;
  compliant: boolean;
}

// Engineering validation and utility functions would go here
export function validateASCERequirements(requirements: PartialASCERequirements): ASCERequirements | null {
  // Basic validation - ensure required fields are present
  if (!requirements.version) {
    return null;
  }
  
  return {
    version: requirements.version,
    windSpeed: requirements.windSpeed || 0,
    exposureCategory: requirements.exposureCategory || 'C',
    buildingClassification: requirements.buildingClassification || 'II',
    importance_factor: requirements.importance_factor || 1.0,
    engineer_approved: requirements.engineer_approved || false,
    riskCategory: requirements.riskCategory || 'II',
    topographicFactor: requirements.topographicFactor || 1.0,
    directionalityFactor: requirements.directionalityFactor || 0.85,
    enclosureClassification: requirements.enclosureClassification || 'enclosed',
    internalPressureCoefficient: requirements.internalPressureCoefficient || 0.18,
    velocityPressureExposureCoefficient: requirements.velocityPressureExposureCoefficient || 1.0,
    buildingResponseFactor: requirements.buildingResponseFactor || 1.0,
    designLifeCategory: requirements.designLifeCategory || 'Standard',
    ultimateWindSpeed: requirements.ultimateWindSpeed || requirements.windSpeed || 0,
    meanRecurrenceInterval: requirements.meanRecurrenceInterval || 700,
    elevationAdjustmentFactor: requirements.elevationAdjustmentFactor || 1.0,
    componentAndCladdingFactor: requirements.componentAndCladdingFactor || 1.0,
  };
}

export function isASCECompliant(requirements: ASCERequirements): boolean {
  return requirements.engineer_approved && 
         requirements.windSpeed > 0 && 
         requirements.version.length > 0;
}