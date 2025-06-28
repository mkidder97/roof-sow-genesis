import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateSOWAPI, SOWGenerationRequest, SOWGenerationResponse } from '@/lib/api';
import { SOWIntegrationEngine } from '@/engines/sowIntegrationEngine';
import { FieldInspection } from '@/types/fieldInspection';

export interface UseSOWGenerationReturn {
  generateSOW: (request: SOWGenerationRequest) => Promise<SOWGenerationResponse>;
  generateSOWFromInspection: (inspectionData: FieldInspection) => Promise<SOWGenerationResponse>;
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

  // Enhanced function to generate SOW from inspection data using integration engine
  const generateSOWFromInspection = useCallback(async (inspectionData: FieldInspection): Promise<SOWGenerationResponse> => {
    setIsGenerating(true);
    setError(null);
    setGenerationError(null);
    setGenerationProgress(0);
    setGenerationStatus('Processing field inspection data...');

    try {
      console.log('🔧 Processing field inspection data with SOW Integration Engine:', inspectionData);

      // Generate SOW configuration using the integration engine
      setGenerationProgress(20);
      setGenerationStatus('Analyzing field inspection data...');
      
      const sowConfig = SOWIntegrationEngine.generateSOWConfiguration(inspectionData);
      const sectionInclusions = SOWIntegrationEngine.generateSectionInclusions(inspectionData);
      
      console.log('📋 SOW Configuration generated:', sowConfig);
      console.log('📝 Section inclusions determined:', sectionInclusions);

      setGenerationProgress(40);
      setGenerationStatus('Building SOW request from inspection data...');

      // Create enhanced SOW generation request with integration engine data
      const request: SOWGenerationRequest = {
        // Basic project information
        projectName: inspectionData.project_name || 'Untitled Project',
        projectAddress: inspectionData.project_address || '',
        customerName: inspectionData.customer_name,
        customerPhone: inspectionData.customer_phone,
        city: inspectionData.city,
        state: inspectionData.state,
        zipCode: inspectionData.zip_code,
        
        // Building specifications from SOW config
        buildingHeight: sowConfig.projectInfo.buildingHeight,
        squareFootage: sowConfig.projectInfo.squareFootage,
        
        // Template selection from integration engine
        templateId: sowConfig.templateId,
        projectType: sowConfig.projectInfo.projectType,
        
        // Roof assembly specifications
        deckType: sowConfig.roofAssembly.deckType,
        membraneType: sowConfig.roofAssembly.newSystem.membraneType,
        insulationType: sowConfig.roofAssembly.newSystem.insulationType,
        attachmentMethod: sowConfig.roofAssembly.newSystem.attachmentMethod,
        
        // ASCE requirements
        windSpeed: inspectionData.wind_speed,
        exposureCategory: inspectionData.exposure_category,
        buildingClassification: inspectionData.building_classification,
        
        // Enhanced drainage specifications from integration engine
        drainageConfiguration: {
          primaryType: sowConfig.drainageConfig.primary_type,
          overflowType: sowConfig.drainageConfig.overflow_type,
          specifications: sowConfig.drainageConfig.specifications,
          additionalDrainage: sowConfig.drainageConfig.additional_drainage
        },
        
        // Equipment specifications from integration engine
        equipmentSpecs: {
          skylights: sowConfig.equipmentSpecs.skylights,
          hvacUnits: sowConfig.equipmentSpecs.hvacUnits,
          accessPoints: sowConfig.equipmentSpecs.accessPoints,
          walkwayPads: sowConfig.equipmentSpecs.walkwayPads,
          equipmentPlatforms: sowConfig.equipmentSpecs.equipmentPlatforms
        },
        
        // Penetration specifications from integration engine
        penetrationSpecs: {
          gasLines: sowConfig.penetrationSpecs.gasLines,
          conduit: sowConfig.penetrationSpecs.conduit,
          other: sowConfig.penetrationSpecs.other
        },
        
        // Section inclusions based on inspection data
        sectionInclusions: {
          tearoffAndDisposal: sectionInclusions.tearoffAndDisposal,
          newRoofSystem: sectionInclusions.newRoofSystem,
          flashing: sectionInclusions.flashing,
          drainageModifications: sectionInclusions.drainageModifications,
          scupperWork: sectionInclusions.scupperWork,
          gutterInstallation: sectionInclusions.gutterInstallation,
          equipmentCurbs: sectionInclusions.equipmentCurbs,
          skylightFlashing: sectionInclusions.skylightFlashing,
          walkwayPads: sectionInclusions.walkwayPads,
          equipmentPlatforms: sectionInclusions.equipmentPlatforms,
          gasLinePenetrations: sectionInclusions.gasLinePenetrations,
          conduitProtection: sectionInclusions.conduitProtection,
          interiorProtection: sectionInclusions.interiorProtection,
          safetyRequirements: sectionInclusions.safetyRequirements,
          accessRequirements: sectionInclusions.accessRequirements
        },
        
        // Special requirements and modifications
        specialRequirements: sowConfig.specialRequirements.modifications,
        
        // Legacy fields for backward compatibility
        numberOfDrains: (sowConfig.drainageConfig.specifications.deck_drains?.count || 0) + 
                       (sowConfig.drainageConfig.specifications.scuppers?.count || 0),
        numberOfPenetrations: (sowConfig.penetrationSpecs.gasLines.count || 0) + 
                             (sowConfig.penetrationSpecs.other.requiresCustomFlashing ? 1 : 0),
        
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