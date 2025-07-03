import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Simplified compatible types for SOW generation with proper type constraints
interface SOWGenerationRequest {
  projectName: string;
  projectAddress: string;
  customerName?: string;
  customerPhone?: string;
  buildingHeight?: number;
  squareFootage?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  deckType?: 'concrete' | 'metal' | 'wood' | 'gypsum' | string; // Made more flexible
  membraneType?: string;
  insulationType?: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  projectType?: 'recover' | 'tearoff' | 'new';
  
  // Enhanced drainage fields
  drainage_primary_type?: string;
  drainage_overflow_type?: string;
  drainage_deck_drains_count?: number;
  drainage_deck_drains_diameter?: number;
  drainage_scuppers_count?: number;
  drainage_scuppers_length?: number;
  drainage_scuppers_width?: number;
  drainage_scuppers_height?: number;
  drainage_gutters_linear_feet?: number;
  drainage_gutters_height?: number;
  drainage_gutters_width?: number;
  drainage_gutters_depth?: number;
  drainage_additional_count?: number;
  drainage_additional_size?: string;
  drainage_additional_notes?: string;
  
  numberOfDrains?: number;
  numberOfPenetrations?: number;
  notes?: string;
  inspectionId?: string;
}

interface SOWGenerationResponse {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  message?: string;
  error?: string;
  data?: {
    pdf?: string;
    sow?: string;
  };
}

export interface UseSOWGenerationReturn {
  generateSOW: (request: SOWGenerationRequest) => Promise<SOWGenerationResponse>;
  generateSOWFromInspection: (inspectionData: any) => Promise<SOWGenerationResponse>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
  generationError: Error | null;
  generationData: SOWGenerationResponse | undefined;
  generationProgress: number;
  generationStatus: string;
  healthStatus: any;
  isHealthLoading: boolean;
  backendStatus: any;
  isStatusLoading: boolean;
  isBackendOnline: boolean;
  reset: () => void;
}

// Simple template selection logic (inline to avoid import issues)
function selectSOWTemplate(inspectionData: any): string {
  const projectType = inspectionData.project_type || 'tearoff';
  const deckType = inspectionData.deck_type || 'steel';
  
  if (projectType === 'tearoff') {
    if (deckType === 'gypsum') {
      return 'T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum';
    } else if (deckType === 'lightweight_concrete') {
      return 'T7-Tearoff-TPO(MA)-insul-lwc-steel';
    } else {
      return 'T6-Tearoff-TPO(MA)-insul-steel';
    }
  } else if (projectType === 'recover') {
    return 'T5-Recover-TPO(Rhino)-iso-EPS flute fill-SSR';
  }
  
  return 'T6-Tearoff-TPO(MA)-insul-steel'; // Default
}

// Clean SOW API integration using Supabase Edge Functions
async function callSupabaseSOWAPI(request: SOWGenerationRequest): Promise<SOWGenerationResponse> {
  try {
    console.log('🚀 Calling Supabase SOW generation API:', request);
    
    const { generateSOWAPI } = await import('@/lib/api');
    
    // Transform request to match API structure
    const apiRequest = {
      projectData: {
        projectName: request.projectName,
        projectAddress: request.projectAddress,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        buildingHeight: request.buildingHeight,
        squareFootage: request.squareFootage,
        city: request.city,
        state: request.state,
        zipCode: request.zipCode,
        deckType: request.deckType,
        membraneType: request.membraneType,
        insulationType: request.insulationType,
        windSpeed: request.windSpeed,
        exposureCategory: request.exposureCategory,
        buildingClassification: request.buildingClassification,
        projectType: request.projectType,
        notes: request.notes,
        numberOfDrains: request.numberOfDrains,
        numberOfPenetrations: request.numberOfPenetrations
      },
      inspectionId: request.inspectionId
    };

    const result = await generateSOWAPI(apiRequest);
    
    console.log('✅ SOW generation response:', result);
    
    return {
      success: result.success,
      sowId: result.outputPath, // Use outputPath as sowId
      downloadUrl: result.outputPath,
      message: 'SOW generated successfully',
      error: result.error,
      data: result.data
    };
  } catch (error) {
    console.error('❌ SOW API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SOW generation failed'
    };
  }
}

export function useSOWGeneration(options?: { onSuccess?: (data: SOWGenerationResponse) => void; onError?: (error: Error) => void }): UseSOWGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const [generationData, setGenerationData] = useState<SOWGenerationResponse | undefined>(undefined);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [healthStatus, setHealthStatus] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
    setGenerationError(null);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setGenerationError(null);
    setGenerationData(undefined);
    setGenerationProgress(0);
    setGenerationStatus('');
  }, []);

  const generateSOW = useCallback(async (request: SOWGenerationRequest): Promise<SOWGenerationResponse> => {
    setIsGenerating(true);
    setError(null);
    setGenerationError(null);
    setGenerationProgress(0);
    setGenerationStatus('Starting SOW generation...');

    try {
      console.log('🚀 Starting SOW generation with request:', request);

      // Validate required fields
      if (!request.projectName?.trim()) {
        throw new Error('Project name is required');
      }
      if (!request.projectAddress?.trim()) {
        throw new Error('Project address is required');
      }

      setGenerationProgress(25);
      setGenerationStatus('Processing project data...');

      const response = await callSupabaseSOWAPI(request);

      if (!response.success) {
        throw new Error(response.error || 'SOW generation failed');
      }

      setGenerationProgress(100);
      setGenerationStatus('SOW generation completed');
      setGenerationData(response);

      console.log('✅ SOW generation completed successfully');
      
      toast({
        title: "SOW Generated Successfully",
        description: "Your Statement of Work has been generated and is ready for download.",
      });

      options?.onSuccess?.(response);
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred during SOW generation';
      const errorObj = err instanceof Error ? err : new Error(errorMessage);
      
      console.error('❌ SOW generation failed:', errorMessage);
      
      setError(errorMessage);
      setGenerationError(errorObj);
      
      toast({
        title: "SOW Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      options?.onError?.(errorObj);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [toast, options]);

  // Enhanced function to generate SOW from inspection data
  const generateSOWFromInspection = useCallback(async (inspectionData: any): Promise<SOWGenerationResponse> => {
    setIsGenerating(true);
    setError(null);
    setGenerationError(null);
    setGenerationProgress(0);
    setGenerationStatus('Processing field inspection data...');

    try {
      console.log('🔧 Processing field inspection data:', inspectionData);

      setGenerationProgress(20);
      setGenerationStatus('Analyzing drainage configuration...');
      
      // Simple template selection
      const templateId = selectSOWTemplate(inspectionData);
      console.log('📋 Selected template:', templateId);

      setGenerationProgress(40);
      setGenerationStatus('Building SOW request from inspection data...');

      // Create enhanced SOW generation request with drainage specifications
      const request: SOWGenerationRequest = {
        // Basic project information
        projectName: inspectionData.project_name || 'Untitled Project',
        projectAddress: inspectionData.project_address || '',
        customerName: inspectionData.customer_name,
        customerPhone: inspectionData.customer_phone,
        city: inspectionData.city,
        state: inspectionData.state,
        zipCode: inspectionData.zip_code,
        
        // Building specifications
        buildingHeight: inspectionData.building_height,
        squareFootage: inspectionData.square_footage,
        
        // Template and roof specifications
        projectType: inspectionData.project_type || 'tearoff',
        deckType: inspectionData.deck_type || 'steel', // Provide default
        membraneType: inspectionData.existing_membrane_type,
        insulationType: inspectionData.insulation_type,
        
        // ASCE requirements
        windSpeed: inspectionData.wind_speed,
        exposureCategory: inspectionData.exposure_category,
        buildingClassification: inspectionData.building_classification,
        
        // Enhanced drainage specifications
        drainage_primary_type: inspectionData.drainage_primary_type,
        drainage_overflow_type: inspectionData.drainage_overflow_type,
        
        // Deck drains
        drainage_deck_drains_count: inspectionData.drainage_deck_drains_count,
        drainage_deck_drains_diameter: inspectionData.drainage_deck_drains_diameter,
        
        // Scuppers
        drainage_scuppers_count: inspectionData.drainage_scuppers_count,
        drainage_scuppers_length: inspectionData.drainage_scuppers_length,
        drainage_scuppers_width: inspectionData.drainage_scuppers_width,
        drainage_scuppers_height: inspectionData.drainage_scuppers_height,
        
        // Gutters
        drainage_gutters_linear_feet: inspectionData.drainage_gutters_linear_feet,
        drainage_gutters_height: inspectionData.drainage_gutters_height,
        drainage_gutters_width: inspectionData.drainage_gutters_width,
        drainage_gutters_depth: inspectionData.drainage_gutters_depth,
        
        // Additional drainage
        drainage_additional_count: inspectionData.drainage_additional_count,
        drainage_additional_size: inspectionData.drainage_additional_size,
        drainage_additional_notes: inspectionData.drainage_additional_notes,
        
        // Legacy fields for backward compatibility
        numberOfDrains: (inspectionData.drainage_deck_drains_count || 0) + 
                       (inspectionData.drainage_scuppers_count || 0),
        numberOfPenetrations: inspectionData.penetrations_gas_line_count || 0,
        
        // Additional metadata
        notes: inspectionData.notes,
        inspectionId: inspectionData.id
      };

      setGenerationProgress(60);
      setGenerationStatus('Generating SOW document...');
      
      console.log('📤 Enhanced SOW request prepared:', request);

      // Generate the SOW using the enhanced request
      const response = await generateSOW(request);
      
      console.log('✅ SOW generated successfully from field inspection data');
      
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate SOW from inspection data';
      const errorObj = err instanceof Error ? err : new Error(errorMessage);
      
      console.error('❌ SOW generation from inspection failed:', errorMessage);
      
      setError(errorMessage);
      setGenerationError(errorObj);
      
      toast({
        title: "SOW Generation Failed",
        description: `Failed to generate SOW from inspection data: ${errorMessage}`,
        variant: "destructive",
      });

      options?.onError?.(errorObj);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [generateSOW, toast, options]);

  return {
    generateSOW,
    generateSOWFromInspection,
    isGenerating,
    error,
    clearError,
    generationError,
    generationData,
    generationProgress,
    generationStatus,
    healthStatus,
    isHealthLoading,
    backendStatus,
    isStatusLoading,
    isBackendOnline,
    reset
  };
}
