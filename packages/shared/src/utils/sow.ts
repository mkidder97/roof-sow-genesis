// SOW Generation Utility Functions - Shared between frontend and backend
import { SOWGenerationRequest, SOWGenerationError, FieldInspection } from '../types/sow';
import { ASCERequirements } from '../types/engineering';
import { validateASCERequirements } from '../utils/validation';

/**
 * Transforms field inspection data to SOW generation request
 */
export function transformInspectionToSOWRequest(inspection: FieldInspection): SOWGenerationRequest {
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
    deckType: inspection.deck_type as any,
    roofSlope: typeof inspection.roof_slope === 'string' ? parseFloat(inspection.roof_slope) : inspection.roof_slope,
    
    // Location data
    city: inspection.city,
    state: inspection.state,
    county: inspection.county,
    zipCode: inspection.zip_code,
    
    // ASCE requirements (enhanced) - validate before use
    asceRequirements: inspection.asce_requirements ? validateASCERequirements(inspection.asce_requirements) || undefined : undefined,
    asceVersion: inspection.asce_version,
    windSpeed: inspection.wind_speed_design,
    exposureCategory: inspection.exposure_category,
    buildingClassification: inspection.building_classification,
    
    // Membrane specifications
    membraneType: inspection.existing_membrane_type as any,
    insulationType: inspection.insulation_type as any,
    
    // Inspector information
    inspectorName: inspection.inspector_name,
    inspectionDate: inspection.inspection_date,
    
    // Additional notes
    customNotes: [
      inspection.notes,
      inspection.recommendations,
      inspection.concerns
    ].filter(Boolean) as string[],
    
    // Inspection ID
    inspectionId: inspection.id
  };
}

/**
 * Creates standardized SOW error objects
 */
export function createSOWError(message: string, type: SOWGenerationError['type'] = 'unknown', details?: any): SOWGenerationError {
  return {
    message,
    type,
    details,
    code: `SOW_${type.toUpperCase()}_ERROR`,
  };
}

/**
 * Validates SOW generation request data
 */
export function validateSOWRequest(request: SOWGenerationRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!request.projectName?.trim()) {
    errors.push('Project name is required');
  }
  
  if (!request.projectAddress?.trim()) {
    errors.push('Project address is required');
  }
  
  // Validate numeric fields
  if (request.buildingHeight && (request.buildingHeight < 1 || request.buildingHeight > 2000)) {
    errors.push('Building height must be between 1 and 2000 feet');
  }
  
  if (request.squareFootage && (request.squareFootage < 100 || request.squareFootage > 10000000)) {
    errors.push('Square footage must be between 100 and 10,000,000 sq ft');
  }
  
  // Validate wind speed if provided
  if (request.windSpeed && (request.windSpeed < 50 || request.windSpeed > 250)) {
    errors.push('Wind speed must be between 50 and 250 mph');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generates a unique SOW ID
 */
export function generateSOWId(projectName: string, timestamp?: Date): string {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
  const projectSlug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
  
  return `SOW-${projectSlug}-${dateStr}-${timeStr}`;
}

/**
 * Calculates estimated SOW generation time based on complexity
 */
export function estimateGenerationTime(request: SOWGenerationRequest): number {
  let baseTime = 30; // seconds
  
  // Add time for complex features
  if (request.takeoffFile) baseTime += 15;
  if (request.drainageConfiguration?.specifications) baseTime += 10;
  if (request.equipmentSpecs?.hvacUnits.count && request.equipmentSpecs.hvacUnits.count > 5) baseTime += 5;
  if (request.sectionInclusions && Object.keys(request.sectionInclusions).length > 10) baseTime += 10;
  
  // Square footage complexity
  if (request.squareFootage && request.squareFootage > 50000) baseTime += 10;
  if (request.squareFootage && request.squareFootage > 100000) baseTime += 15;
  
  return baseTime;
}

/**
 * Formats SOW generation progress for display
 */
export interface SOWGenerationProgress {
  stage: string;
  percentage: number;
  message: string;
  estimatedTimeRemaining: number;
}

export function createProgressUpdate(
  stage: 'initializing' | 'analyzing' | 'generating' | 'finalizing' | 'complete',
  startTime: Date,
  estimatedTotal: number
): SOWGenerationProgress {
  const elapsed = (Date.now() - startTime.getTime()) / 1000;
  
  const stages = {
    initializing: { percentage: 10, message: 'Initializing SOW generation...' },
    analyzing: { percentage: 30, message: 'Analyzing jurisdiction and wind loads...' },
    generating: { percentage: 70, message: 'Generating SOW document...' },
    finalizing: { percentage: 90, message: 'Finalizing PDF document...' },
    complete: { percentage: 100, message: 'SOW generation complete!' }
  };
  
  const stageInfo = stages[stage];
  const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
  
  return {
    stage,
    percentage: stageInfo.percentage,
    message: stageInfo.message,
    estimatedTimeRemaining
  };
}

/**
 * Sanitizes and validates SOW template selection
 */
export function validateTemplateId(templateId: string, availableTemplates: string[]): boolean {
  return availableTemplates.includes(templateId);
}

/**
 * Extracts key metrics from SOW generation request for analytics
 */
export function extractSOWMetrics(request: SOWGenerationRequest) {
  return {
    projectType: request.projectType || 'unknown',
    deckType: request.deckType || 'unknown',
    membraneType: request.membraneType || 'unknown',
    squareFootage: request.squareFootage || 0,
    buildingHeight: request.buildingHeight || 0,
    windSpeed: request.windSpeed || 0,
    hasFile: !!request.takeoffFile,
    hasCustomNotes: (request.customNotes?.length || 0) > 0,
    hasEquipmentSpecs: !!request.equipmentSpecs,
    hasDrainageConfig: !!request.drainageConfiguration,
    state: request.state || 'unknown',
    asceVersion: request.asceVersion || 'unknown'
  };
}
