
import { z } from 'zod';

// Fixed Generation Status Type
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Zod schemas for runtime validation - Fixed to match actual usage
export const SOWGenerationRequestSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  projectAddress: z.string().min(1, 'Project address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  buildingHeight: z.number().positive().optional(),
  deckType: z.enum(['concrete', 'metal', 'wood', 'gypsum']).optional(),
  membraneType: z.enum(['tpo', 'epdm', 'pvc', 'modified-bitumen']).optional(),
  insulationType: z.enum(['polyiso', 'eps', 'xps', 'mineral-wool']).optional(),
  windSpeed: z.number().positive().optional(),
  exposureCategory: z.enum(['B', 'C', 'D']).optional(),
  buildingClassification: z.enum(['I', 'II', 'III', 'IV']).optional(),
  takeoffFile: z.instanceof(File).optional(),
  notes: z.string().optional(),
  inspectionId: z.string().optional(),
});

export const FieldInspectionDataSchema = z.object({
  id: z.string().uuid().optional(),
  projectName: z.string(),
  project_name: z.string().optional(), // Legacy field
  projectAddress: z.string(),
  project_address: z.string().optional(), // Legacy field
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  zip_code: z.string().optional(), // Legacy field
  buildingHeight: z.number().optional(),
  building_height: z.number().optional(), // Legacy field
  deckType: z.string().optional(),
  deck_type: z.string().optional(), // Legacy field
  membraneType: z.string().optional(),
  membrane_type: z.string().optional(), // Legacy field
  insulationType: z.string().optional(),
  insulation_type: z.string().optional(), // Legacy field
  windSpeed: z.number().optional(),
  wind_speed: z.number().optional(), // Legacy field
  exposureCategory: z.string().optional(),
  exposure_category: z.string().optional(), // Legacy field
  buildingClassification: z.string().optional(),
  building_classification: z.string().optional(), // Legacy field
  notes: z.string().optional(),
  inspectorName: z.string().optional(),
  inspector_name: z.string().optional(), // Legacy field
  completed: z.boolean().optional(),
  status: z.string().optional(),
});

export const SOWGenerationErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  type: z.enum(['network', 'validation', 'server', 'unknown']).default('unknown'),
});

// Fixed SOWGenerationResponse interface with all required properties
export const SOWResponseSchema = z.object({
  success: z.boolean(),
  sowId: z.string().optional(),
  downloadUrl: z.string().optional(),
  generationStatus: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  error: z.string().optional(),
  estimatedCompletionTime: z.number().optional(),
  file_url: z.string().optional(),
  data: z.object({
    sow: z.string().optional(),
    pdf: z.string().optional(),
    engineeringSummary: z.record(z.any()).optional(),
    template: z.string().optional(),
    templateUsed: z.string().optional(),
  }).optional(),
  metadata: z.object({
    generationTime: z.number().optional(),
    fileProcessed: z.boolean().optional(),
    extractionConfidence: z.number().optional(),
    fileSize: z.number().optional(),
  }).optional(),
});

// TypeScript interfaces derived from Zod schemas - Fixed to match actual usage
export type SOWGenerationRequest = z.infer<typeof SOWGenerationRequestSchema>;
export type FieldInspectionData = z.infer<typeof FieldInspectionDataSchema>;
export type SOWGenerationError = z.infer<typeof SOWGenerationErrorSchema>;
export type SOWGenerationResponse = z.infer<typeof SOWResponseSchema>;

// Alias for backward compatibility
export type SOWResponse = SOWGenerationResponse;

// Form data interface for the SOW input form
export interface SOWFormData {
  projectName: string;
  projectAddress: string;
  city: string;
  state: string;
  zipCode: string;
  buildingHeight: string;
  deckType: string;
  membraneType: string;
  insulationType: string;
  windSpeed: string;
  exposureCategory: string;
  buildingClassification: string;
  takeoffFile: File | null;
  notes: string;
}

// Generation status types
export type SOWGenerationStatus = 'idle' | 'processing' | 'success' | 'error';

// Progress tracking interface
export interface SOWGenerationProgress {
  percentage: number;
  stage: string;
  message: string;
  estimatedTimeRemaining?: number;
}

// Data transformation utilities - Fixed to work with flat structure
export function transformInspectionToSOWRequest(inspection: FieldInspectionData): Partial<SOWGenerationRequest> {
  return {
    projectName: inspection.projectName || inspection.project_name,
    projectAddress: inspection.projectAddress || inspection.project_address,
    city: inspection.city,
    state: inspection.state,
    zipCode: inspection.zipCode || inspection.zip_code,
    buildingHeight: inspection.buildingHeight || inspection.building_height,
    deckType: (inspection.deckType || inspection.deck_type) as any,
    membraneType: (inspection.membraneType || inspection.membrane_type) as any,
    insulationType: (inspection.insulationType || inspection.insulation_type) as any,
    windSpeed: inspection.windSpeed || inspection.wind_speed,
    exposureCategory: (inspection.exposureCategory || inspection.exposure_category) as any,
    buildingClassification: (inspection.buildingClassification || inspection.building_classification) as any,
    notes: inspection.notes,
  };
}

export function transformFormDataToSOWRequest(formData: SOWFormData): SOWGenerationRequest {
  const result: any = {
    projectName: formData.projectName,
    projectAddress: formData.projectAddress,
    city: formData.city || undefined,
    state: formData.state || undefined,
    zipCode: formData.zipCode || undefined,
    notes: formData.notes || undefined,
    takeoffFile: formData.takeoffFile || undefined,
  };

  // Convert string numbers to actual numbers
  if (formData.buildingHeight) {
    result.buildingHeight = parseFloat(formData.buildingHeight);
  }
  if (formData.windSpeed) {
    result.windSpeed = parseFloat(formData.windSpeed);
  }

  // Add enum values if they exist
  if (formData.deckType) result.deckType = formData.deckType;
  if (formData.membraneType) result.membraneType = formData.membraneType;
  if (formData.insulationType) result.insulationType = formData.insulationType;
  if (formData.exposureCategory) result.exposureCategory = formData.exposureCategory;
  if (formData.buildingClassification) result.buildingClassification = formData.buildingClassification;

  return SOWGenerationRequestSchema.parse(result);
}

// Error handling utilities
export function createSOWError(message: string, type: SOWGenerationError['type'] = 'unknown', details?: any): SOWGenerationError {
  return {
    message,
    type,
    details,
    code: `SOW_${type.toUpperCase()}_ERROR`,
  };
}

export function isNetworkError(error: any): boolean {
  return error?.type === 'network' || 
         error?.message?.includes('fetch') || 
         error?.message?.includes('Load failed') ||
         error?.name === 'TypeError';
}

export function isValidationError(error: any): boolean {
  return error?.type === 'validation' || 
         error?.name === 'ZodError';
}
