// src/hooks/useSOWGeneration.ts - React hook for SOW generation API calls

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
  API_ENDPOINTS,
  SOWGenerationRequest,
  SOWGenerationResponse 
} from '@/lib/api';

export interface UseSOWGenerationProps {
  onSuccess?: (data: SOWGenerationResponse) => void;
  onError?: (error: Error) => void;
}

export function useSOWGeneration({ onSuccess, onError }: UseSOWGenerationProps = {}) {
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  const generateSOWMutation = useMutation({
    mutationFn: async (data: SOWGenerationRequest) => {
      setGenerationProgress(10);
      setGenerationStatus('Initializing SOW generation...');

      setGenerationProgress(30);
      setGenerationStatus('Processing project data...');

      if (data.file) {
        setGenerationStatus('Processing takeoff file...');
        setGenerationProgress(50);
      }

      setGenerationProgress(70);
      setGenerationStatus('Generating SOW document...');

      const result = await generateSOWAPI(data);
      
      setGenerationProgress(100);
      setGenerationStatus('SOW generation complete!');
      return result;
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
    refetchInterval: (data) => {
      // Poll every 2 seconds if still processing
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
      // Refetch the list after successful deletion
      refetchList();
    },
  });

  // Hook for checking backend health
  const { data: healthStatus, isLoading: isHealthLoading } = useQuery({
    queryKey: ['backend-health'],
    queryFn: () => checkHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });

  // Hook for getting backend status
  const { data: backendStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['backend-status'],
    queryFn: () => apiCall(API_ENDPOINTS.status),
    refetchInterval: 60000, // Check every minute
  });

  return {
    // Main SOW generation
    generateSOW: generateSOWMutation.mutate,
    isGenerating: generateSOWMutation.isPending,
    generationError: generateSOWMutation.error,
    generationData: generateSOWMutation.data,
    generationProgress,
    generationStatus,
    
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
      downloadSOWMutation.reset();
      deleteSOWMutation.reset();
      setGenerationProgress(0);
      setGenerationStatus('');
    },
  };
}

// Hook for debug mode (existing functionality)
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

// Hook for engine-specific debugging (existing functionality)
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

// Hook for template operations (existing functionality)
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

// NEW: Hook for SOW workflow integration with field inspections
export function useSOWWorkflow() {
  const generateFromInspectionMutation = useMutation({
    mutationFn: async (data: { inspectionData: any; inspectionId: string }) => {
      // Transform inspection data to SOW format
      const sowRequest: SOWGenerationRequest = {
        projectData: {
          projectName: data.inspectionData.projectName || '',
          address: data.inspectionData.address || '',
          customerName: data.inspectionData.customerName,
          customerPhone: data.inspectionData.customerPhone,
          buildingHeight: data.inspectionData.buildingHeight,
          squareFootage: data.inspectionData.squareFootage,
          numberOfDrains: data.inspectionData.numberOfDrains,
          numberOfPenetrations: data.inspectionData.numberOfPenetrations,
          membraneType: data.inspectionData.membraneType,
          windSpeed: data.inspectionData.windSpeed,
          exposureCategory: data.inspectionData.exposureCategory,
          projectType: data.inspectionData.projectType,
          city: data.inspectionData.city,
          state: data.inspectionData.state,
          zipCode: data.inspectionData.zipCode,
          deckType: data.inspectionData.deckType,
          insulationType: data.inspectionData.insulationType,
          buildingClassification: data.inspectionData.buildingClassification,
          notes: data.inspectionData.notes,
        },
        inspectionId: data.inspectionId,
      };

      return await generateSOWAPI(sowRequest);
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

// NEW: Hook for real-time SOW status monitoring
export function useSOWStatusMonitor(sowId: string | null) {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const statusQuery = useQuery({
    queryKey: ['sow-status-monitor', sowId],
    queryFn: () => getSOWStatusAPI(sowId!),
    enabled: !!sowId && isMonitoring,
    refetchInterval: (data) => {
      // Poll every 2 seconds if still processing
      if (data?.generationStatus === 'processing') {
        return 2000;
      }
      // Stop monitoring when complete or failed
      if (data?.generationStatus === 'complete' || data?.generationStatus === 'failed') {
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
