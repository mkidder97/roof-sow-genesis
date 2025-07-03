
import { z } from 'zod';
import { RoofLayer } from './roofingTypes';

// Fixed Generation Status Type
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// ✅ PHASE 1: Extended Zod schema to include assembly data
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
  
  // ✅ NEW: Assembly configuration fields
  roofAssemblyLayers: z.array(z.any()).optional(), // RoofLayer array
  projectType: z.enum(['recover', 'tearoff', 'new']).optional(),
  assemblyNotes: z.string().optional(),
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
  
  // ✅ NEW: Assembly-related fields for backward compatibility
  roof_assembly_layers: z.array(z.any()).optional(),
  project_type: z.string().optional(),
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
  file_url: z.string().optional(),
  generationStatus: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  error: z.string().optional(),
  estimatedCompletionTime: z.number().optional(),
  message: z.string().optional(), // Added missing property
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

// ✅ PHASE 1: TypeScript interfaces with assembly support
export interface SOWGenerationRequest {
  projectName: string;
  projectAddress: string;
  city?: string;
  state?: string;
  zipCode?: string;
  buildingHeight?: number;
  deckType?: 'concrete' | 'metal' | 'wood' | 'gypsum';
  membraneType?: 'tpo' | 'epdm' | 'pvc' | 'modified-bitumen';
  insulationType?: 'polyiso' | 'eps' | 'xps' | 'mineral-wool';
  windSpeed?: number;
  exposureCategory?: 'B' | 'C' | 'D';
  buildingClassification?: 'I' | 'II' | 'III' | 'IV';
  takeoffFile?: File;
  notes?: string;
  inspectionId?: string;
  
  // ✅ NEW: Assembly configuration properties
  roofAssemblyLayers?: RoofLayer[];
  projectType?: 'recover' | 'tearoff' | 'new';
  assemblyNotes?: string;
}

export interface FieldInspectionData {
  id?: string;
  projectName?: string; // Made optional to handle both formats
  project_name?: string; // Legacy field
  projectAddress?: string; // Made optional to handle both formats  
  project_address?: string; // Legacy field
  city?: string;
  state?: string;
  zipCode?: string;
  zip_code?: string; // Legacy field
  buildingHeight?: number;
  building_height?: number; // Legacy field
  deckType?: string;
  deck_type?: string; // Legacy field
  membraneType?: string;
  membrane_type?: string; // Legacy field
  insulationType?: string;
  insulation_type?: string; // Legacy field
  windSpeed?: number;
  wind_speed?: number; // Legacy field
  exposureCategory?: string;
  exposure_category?: string; // Legacy field
  buildingClassification?: string;
  building_classification?: string; // Legacy field
  notes?: string;
  inspectorName?: string;
  inspector_name?: string; // Legacy field
  completed?: boolean;
  status?: string;
  
  // ✅ NEW: Assembly-related fields
  roof_assembly_layers?: RoofLayer[];
  project_type?: 'recover' | 'tearoff' | 'new';
  
  // ASCE requirements - make flexible
  asce_requirements?: any; // More flexible type to avoid strict validation issues
}

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

// ✅ PHASE 1: Enhanced data transformation with assembly support
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
    
    // ✅ NEW: Include assembly data from inspection
    roofAssemblyLayers: inspection.roof_assembly_layers,
    projectType: inspection.project_type,
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

  return result as SOWGenerationRequest;
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
