// src/hooks/useSOWGeneration.ts - React hook for SOW generation API calls

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, uploadFileToAPI, apiCall, SOWGenerationRequest, SOWGenerationResponse } from '@/lib/api';

export interface UseSOWGenerationProps {
  onSuccess?: (data: SOWGenerationResponse) => void;
  onError?: (error: Error) => void;
}

export function useSOWGeneration({ onSuccess, onError }: UseSOWGenerationProps = {}) {
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  const generateSOWMutation = useMutation({
    mutationFn: async (data: SOWGenerationRequest & { takeoffFile?: File }) => {
      setGenerationProgress(10);
      setGenerationStatus('Initializing SOW generation...');

      // Use the main debug endpoint with file upload capability
      const endpoint = API_ENDPOINTS.generateSOW;
      
      setGenerationProgress(30);
      setGenerationStatus('Processing takeoff file...');

      if (data.takeoffFile) {
        // Upload with file
        const result = await uploadFileToAPI(endpoint, data.takeoffFile, {
          projectName: data.projectName,
          projectAddress: data.projectAddress,
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
        });
        
        setGenerationProgress(100);
        setGenerationStatus('SOW generation complete!');
        return result;
      } else {
        // JSON-only request
        setGenerationProgress(50);
        setGenerationStatus('Generating SOW...');
        
        const result = await apiCall<SOWGenerationResponse>(endpoint, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        
        setGenerationProgress(100);
        setGenerationStatus('SOW generation complete!');
        return result;
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

  // Hook for checking backend health
  const { data: healthStatus, isLoading: isHealthLoading } = useQuery({
    queryKey: ['backend-health'],
    queryFn: () => apiCall(API_ENDPOINTS.health),
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
    generateSOW: generateSOWMutation.mutate,
    isGenerating: generateSOWMutation.isPending,
    generationError: generateSOWMutation.error,
    generationData: generateSOWMutation.data,
    generationProgress,
    generationStatus,
    
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
    },
  };
}

// Hook for debug mode
export function useSOWDebug() {
  const debugMutation = useMutation({
    mutationFn: async (data: SOWGenerationRequest) => {
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

// Hook for engine-specific debugging
export function useEngineDebug() {
  const engineDebugMutation = useMutation({
    mutationFn: async (data: { engine: string } & SOWGenerationRequest) => {
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

// Hook for template operations
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
