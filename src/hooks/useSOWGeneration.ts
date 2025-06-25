
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  generateSOWAPI, 
  downloadSOWAPI, 
  getSOWStatusAPI, 
  listSOWsAPI, 
  deleteSOWAPI,
  checkHealth,
  apiCall,
  API_ENDPOINTS
} from '@/lib/api';
import { 
  useCreateSOWGeneration, 
  useUpdateSOWGeneration, 
  useSOWGeneration as useSOWGenerationDB,
  useUpdateInspectionSOWStatus 
} from '@/hooks/useSOWDatabase';
import {
  SOWGenerationRequest,
  SOWGenerationResponse,
  UseSOWGenerationProps,
  SOWGenerationRecord,
  FieldInspectionData
} from '@/types/sow';

export function useSOWGeneration({ onSuccess, onError }: UseSOWGenerationProps = {}) {
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [currentSOWId, setCurrentSOWId] = useState<string | null>(null);

  // Database mutations
  const createSOWMutation = useCreateSOWGeneration();
  const updateSOWMutation = useUpdateSOWGeneration();
  const updateInspectionMutation = useUpdateInspectionSOWStatus();

  // Monitor current SOW generation
  const { data: currentSOW } = useSOWGenerationDB(currentSOWId);

  const generateSOWMutation = useMutation({
    mutationFn: async (data: SOWGenerationRequest) => {
      setGenerationProgress(10);
      setGenerationStatus('Initializing SOW generation...');

      // Create database record first
      const templateType = 'commercial';
      
      // Separate file handling from JSON data
      const { takeoffFile, ...jsonData } = data;
      
      const dbRecord = await createSOWMutation.mutateAsync({
        inspectionId: data.inspectionId,
        templateType,
        inputData: jsonData
      });

      if (!dbRecord) {
        throw new Error('Failed to create SOW generation record');
      }

      setCurrentSOWId(dbRecord.id);
      setGenerationProgress(30);
      setGenerationStatus('Processing project data...');

      try {
        // Update status to processing
        await updateSOWMutation.mutateAsync({
          id: dbRecord.id,
          updates: { generation_status: 'processing' }
        });

        if (takeoffFile) {
          setGenerationStatus('Processing takeoff file...');
          setGenerationProgress(50);
        }

        setGenerationProgress(70);
        setGenerationStatus('Generating SOW document...');

        // Transform data for API compatibility
        const apiData = {
          projectData: {
            projectName: data.projectName || '',
            projectAddress: data.projectAddress || '',
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            buildingHeight: data.buildingHeight,
            deckType: data.deckType,
            membraneType: data.membraneType,
            insulationType: data.insulationType,
            windSpeed: data.windSpeed,
            exposureCategory: data.exposureCategory,
            buildingClassification: data.buildingClassification,
            notes: data.notes
          },
          takeoffFile: takeoffFile,
          inspectionId: data.inspectionId
        };

        // Call the API to generate SOW
        const result = await generateSOWAPI(apiData as any);
        
        setGenerationProgress(100);
        setGenerationStatus('SOW generation completed!');

        // Update database with completion
        const completedAt = new Date().toISOString();
        const generationTime = Math.floor((new Date(completedAt).getTime() - new Date(dbRecord.generation_started_at).getTime()) / 1000);

        await updateSOWMutation.mutateAsync({
          id: dbRecord.id,
          updates: {
            generation_status: 'completed',
            generation_completed_at: completedAt,
            generation_duration_seconds: generationTime,
            output_file_path: result.downloadUrl,
            file_size_bytes: result.metadata?.fileSize
          }
        });

        // Update inspection status if linked
        if (data.inspectionId) {
          await updateInspectionMutation.mutateAsync({
            inspectionId: data.inspectionId,
            sowGenerated: true
          });
        }

        const response: SOWGenerationResponse = { 
          ...result, 
          sowId: dbRecord.id,
          generationStatus: 'completed'
        };
        
        return response;
      } catch (error) {
        // Update database with error
        await updateSOWMutation.mutateAsync({
          id: dbRecord.id,
          updates: {
            generation_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            generation_completed_at: new Date().toISOString()
          }
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      setGenerationStatus('Success!');
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      setGenerationStatus(`Error: ${error.message}`);
      setGenerationProgress(0);
      onError?.(error);
    },
  });

  // Hook for downloading SOW PDF
  const downloadSOWMutation = useMutation({
    mutationFn: async (sowId: string) => {
      const blob = await downloadSOWAPI(sowId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SOW_${sowId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
  });

  // Hook for checking SOW status
  const statusQuery = (sowId: string) => useQuery({
    queryKey: ['sow-status', sowId],
    queryFn: () => getSOWStatusAPI(sowId),
    enabled: !!sowId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.generationStatus === 'processing' ? 2000 : false;
    },
  });

  // Hook for listing user SOWs
  const { data: sowList, isLoading: isListLoading, refetch: refetchList } = useQuery({
    queryKey: ['sow-list'],
    queryFn: () => listSOWsAPI(),
    refetchOnWindowFocus: false,
  });

  // Hook for deleting SOW
  const deleteSOWMutation = useMutation({
    mutationFn: deleteSOWAPI,
    onSuccess: () => {
      refetchList();
    },
  });

  // Hook for checking backend health
  const { data: healthStatus, isLoading: isHealthLoading } = useQuery({
    queryKey: ['backend-health'],
    queryFn: () => checkHealth(),
    refetchInterval: 30000,
    retry: 3,
  });

  // Hook for getting backend status
  const { data: backendStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['backend-status'],
    queryFn: () => apiCall(API_ENDPOINTS.status),
    refetchInterval: 60000,
  });

  return {
    // Main SOW generation
    generateSOW: generateSOWMutation.mutate,
    isGenerating: generateSOWMutation.isPending,
    generationError: generateSOWMutation.error,
    generationData: generateSOWMutation.data,
    generationProgress,
    generationStatus,
    currentSOW,
    
    // SOW download
    downloadSOW: downloadSOWMutation.mutate,
    isDownloading: downloadSOWMutation.isPending,
    downloadError: downloadSOWMutation.error,
    
    // SOW status checking
    getSOWStatus: statusQuery,
    
    // SOW list management
    sowList: sowList?.sows || [],
    sowListPagination: sowList?.pagination,
    isListLoading,
    refetchList,
    
    // SOW deletion
    deleteSOW: deleteSOWMutation.mutate,
    isDeleting: deleteSOWMutation.isPending,
    deleteError: deleteSOWMutation.error,
    
    // Backend health monitoring
    healthStatus,
    isHealthLoading,
    backendStatus,
    isStatusLoading,
    isBackendOnline: healthStatus && !isHealthLoading,
    
    // Reset function
    reset: () => {
      generateSOWMutation.reset();
      setGenerationProgress(0);
      setGenerationStatus('');
      setCurrentSOWId(null);
    },
  };
}

export function useSOWDebug() {
  const debugMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiCall(API_ENDPOINTS.debugSOW, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  });

  return {
    debugSOW: debugMutation.mutate,
    isDebugging: debugMutation.isPending,
    debugError: debugMutation.error,
    debugData: debugMutation.data,
    resetDebug: debugMutation.reset,
  };
}

export function useEngineDebug() {
  const engineDebugMutation = useMutation({
    mutationFn: async (data: { engine: string } & any) => {
      return await apiCall(API_ENDPOINTS.debugEngine, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  });

  return {
    debugEngine: engineDebugMutation.mutate,
    isEngineDebugging: engineDebugMutation.isPending,
    engineDebugError: engineDebugMutation.error,
    engineDebugData: engineDebugMutation.data,
    resetEngineDebug: engineDebugMutation.reset,
  };
}

export function useTemplateOperations() {
  const { data: templateMap, isLoading: isTemplateMapLoading } = useQuery({
    queryKey: ['template-map'],
    queryFn: () => apiCall(API_ENDPOINTS.templateMap),
  });

  const renderTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: string; data: any }) => {
      return await apiCall(API_ENDPOINTS.renderTemplate, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  });

  return {
    templateMap,
    isTemplateMapLoading,
    renderTemplate: renderTemplateMutation.mutate,
    isRendering: renderTemplateMutation.isPending,
    renderError: renderTemplateMutation.error,
    renderData: renderTemplateMutation.data,
    resetRender: renderTemplateMutation.reset,
  };
}

// Hook for SOW workflow integration with field inspections
export function useSOWWorkflow() {
  const generateFromInspectionMutation = useMutation({
    mutationFn: async (data: { inspectionData: FieldInspectionData; inspectionId: string }) => {
      // Transform inspection data to SOW format
      const sowRequest: SOWGenerationRequest = {
        projectName: data.inspectionData.projectName || data.inspectionData.project_name || '',
        projectAddress: data.inspectionData.projectAddress || data.inspectionData.project_address || '',
        city: data.inspectionData.city,
        state: data.inspectionData.state,
        zipCode: data.inspectionData.zipCode || data.inspectionData.zip_code,
        buildingHeight: data.inspectionData.buildingHeight || data.inspectionData.building_height,
        deckType: (data.inspectionData.deckType || data.inspectionData.deck_type) as any,
        membraneType: (data.inspectionData.membraneType || data.inspectionData.membrane_type) as any,
        insulationType: (data.inspectionData.insulationType || data.inspectionData.insulation_type) as any,
        windSpeed: data.inspectionData.windSpeed || data.inspectionData.wind_speed,
        exposureCategory: (data.inspectionData.exposureCategory || data.inspectionData.exposure_category) as any,
        buildingClassification: (data.inspectionData.buildingClassification || data.inspectionData.building_classification) as any,
        notes: data.inspectionData.notes,
        inspectionId: data.inspectionId,
      };

      // Transform for API compatibility
      const apiData = {
        projectData: {
          projectName: sowRequest.projectName || '',
          projectAddress: sowRequest.projectAddress || '',
          city: sowRequest.city,
          state: sowRequest.state,
          zipCode: sowRequest.zipCode,
          buildingHeight: sowRequest.buildingHeight,
          deckType: sowRequest.deckType,
          membraneType: sowRequest.membraneType,
          insulationType: sowRequest.insulationType,
          windSpeed: sowRequest.windSpeed,
          exposureCategory: sowRequest.exposureCategory,
          buildingClassification: sowRequest.buildingClassification,
          notes: sowRequest.notes
        }
      };

      return await generateSOWAPI(apiData as any);
    },
  });

  return {
    generateFromInspection: generateFromInspectionMutation.mutate,
    isGeneratingFromInspection: generateFromInspectionMutation.isPending,
    inspectionGenerationError: generateFromInspectionMutation.error,
    inspectionGenerationData: generateFromInspectionMutation.data,
    resetInspectionGeneration: generateFromInspectionMutation.reset,
  };
}

export function useSOWStatusMonitor(sowId: string | null) {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const statusQuery = useQuery({
    queryKey: ['sow-status-monitor', sowId],
    queryFn: () => getSOWStatusAPI(sowId!),
    enabled: !!sowId && isMonitoring,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.generationStatus === 'processing') {
        return 2000;
      }
      if (data?.generationStatus === 'completed' || data?.generationStatus === 'failed') {
        setIsMonitoring(false);
        return false;
      }
      return false;
    },
  });

  const startMonitoring = () => setIsMonitoring(true);
  const stopMonitoring = () => setIsMonitoring(false);

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
}
