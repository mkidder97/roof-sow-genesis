
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateSOWAPI, SOWGenerationRequest, SOWGenerationResponse } from '@/lib/api';

export interface UseSOWGenerationReturn {
  generateSOW: (request: SOWGenerationRequest) => Promise<SOWGenerationResponse>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
  
  // Additional properties that components expect
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

      const response = await generateSOWAPI(request);

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

  // Helper function to generate SOW from inspection data
  const generateSOWFromInspection = useCallback(async (inspectionData: any): Promise<SOWGenerationResponse> => {
    const request: SOWGenerationRequest = {
      projectName: inspectionData.project_name || inspectionData.projectName || 'Untitled Project',
      projectAddress: inspectionData.project_address || inspectionData.projectAddress || '',
      customerName: inspectionData.customer_name || inspectionData.customerName,
      customerPhone: inspectionData.customer_phone || inspectionData.customerPhone,
      buildingHeight: inspectionData.building_height || inspectionData.buildingHeight,
      squareFootage: inspectionData.square_footage || inspectionData.squareFootage,
      numberOfDrains: inspectionData.number_of_drains || inspectionData.numberOfDrains,
      numberOfPenetrations: inspectionData.number_of_penetrations || inspectionData.numberOfPenetrations,
      membraneType: inspectionData.existing_membrane_type || inspectionData.membraneType,
      windSpeed: inspectionData.wind_speed || inspectionData.windSpeed,
      exposureCategory: inspectionData.exposure_category || inspectionData.exposureCategory,
      projectType: inspectionData.project_type || inspectionData.projectType || 'recover',
      city: inspectionData.city,
      state: inspectionData.state,
      zipCode: inspectionData.zip_code || inspectionData.zipCode,
      deckType: inspectionData.deck_type || inspectionData.deckType,
      insulationType: inspectionData.insulation_type || inspectionData.insulationType,
      buildingClassification: inspectionData.building_classification || inspectionData.buildingClassification,
      notes: inspectionData.notes,
      inspectionId: inspectionData.id
    };

    return generateSOW(request);
  }, [generateSOW]);

  return {
    generateSOW,
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
    reset,
    generateSOWFromInspection
  } as UseSOWGenerationReturn & { generateSOWFromInspection: typeof generateSOWFromInspection };
}
