
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createSOWGeneration, 
  updateSOWGeneration, 
  getSOWGeneration, 
  getSOWHistory, 
  getDashboardMetrics,
  updateInspectionSOWStatus,
  getSOWTemplates
} from '@/lib/sowDatabase';
import { SOWGenerationRequest, SOWGenerationRecord, DashboardMetrics } from '@/types/sow';

// Hook for creating SOW generations
export function useCreateSOWGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { inspectionId?: string; templateType: string; inputData: SOWGenerationRequest }) => {
      const result = await createSOWGeneration(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sow-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    }
  });
}

// Hook for updating SOW generation status
export function useUpdateSOWGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SOWGenerationRecord> }) => {
      const result = await updateSOWGeneration(id, updates);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['sow-generation', data.id], data);
        queryClient.invalidateQueries({ queryKey: ['sow-history'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      }
    }
  });
}

// Hook for getting SOW generation details
export function useSOWGeneration(id: string | null) {
  return useQuery({
    queryKey: ['sow-generation', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await getSOWGeneration(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.generation_status === 'processing' || data?.generation_status === 'pending' ? 2000 : false;
    }
  });
}

// Hook for SOW generation history
export function useSOWHistory(limit: number = 10) {
  return useQuery({
    queryKey: ['sow-history', limit],
    queryFn: async () => {
      const result = await getSOWHistory(limit);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchOnWindowFocus: false
  });
}

// Hook for dashboard metrics
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const result = await getDashboardMetrics();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  });
}

// Hook for available templates
export function useSOWTemplates() {
  return useQuery({
    queryKey: ['sow-templates'],
    queryFn: async () => {
      const result = await getSOWTemplates();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchOnWindowFocus: false
  });
}

// Hook for updating inspection status
export function useUpdateInspectionSOWStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ inspectionId, sowGenerated }: { inspectionId: string; sowGenerated: boolean }) => {
      const result = await updateInspectionSOWStatus(inspectionId, sowGenerated);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    }
  });
}
