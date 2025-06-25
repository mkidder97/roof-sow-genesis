
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { useDashboardMetrics, useSOWHistory } from '@/hooks/useSOWDatabase';
import { useFieldInspections } from '@/hooks/useFieldInspections';

// Cache configuration
const GC_TIME = 5 * 60 * 1000; // 5 minutes (garbage collection time)
const STALE_TIME = 30 * 1000; // 30 seconds

export function useOptimizedDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics-optimized'],
    queryFn: async () => {
      // Simulate optimized metrics calculation
      const { data } = await useDashboardMetrics();
      return data;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useOptimizedSOWHistory(limit: number = 10) {
  return useQuery({
    queryKey: ['sow-history-optimized', limit],
    queryFn: async () => {
      const { data } = await useSOWHistory(limit);
      return data;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useOptimizedInspections() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['inspections-optimized'],
    queryFn: async () => {
      const { inspections } = useFieldInspections();
      return inspections;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });

  const prefetchInspection = useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['inspection', id],
      queryFn: () => {
        // Prefetch individual inspection data
        return fetch(`/api/inspections/${id}`).then(res => res.json());
      },
      staleTime: STALE_TIME,
    });
  }, [queryClient]);

  const optimisticUpdate = useCallback((id: string, updates: any) => {
    queryClient.setQueryData(['inspections-optimized'], (old: any) => {
      if (!old) return old;
      return old.map((inspection: any) => 
        inspection.id === id 
          ? { ...inspection, ...updates }
          : inspection
      );
    });
  }, [queryClient]);

  return {
    ...query,
    prefetchInspection,
    optimisticUpdate,
  };
}

export function usePrefetchOnHover() {
  const queryClient = useQueryClient();

  const prefetchSOWGeneration = useCallback((sowId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['sow-generation', sowId],
      queryFn: () => fetch(`/api/sow/${sowId}`).then(res => res.json()),
      staleTime: STALE_TIME,
    });
  }, [queryClient]);

  const prefetchInspectionDetails = useCallback((inspectionId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['inspection-details', inspectionId],
      queryFn: () => fetch(`/api/inspections/${inspectionId}/details`).then(res => res.json()),
      staleTime: STALE_TIME,
    });
  }, [queryClient]);

  return {
    prefetchSOWGeneration,
    prefetchInspectionDetails,
  };
}

// Memoized data processing hooks
export function useProcessedDashboardData() {
  const { data: metrics, isLoading } = useOptimizedDashboardMetrics();
  const { data: sowHistory } = useOptimizedSOWHistory();

  const processedData = useMemo(() => {
    if (!metrics || !sowHistory) return null;

    const recentCompletions = sowHistory?.filter(sow => 
      sow.generation_status === 'completed' &&
      new Date(sow.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) || [];

    const averageGenerationTime = sowHistory?.reduce((acc, sow) => {
      if (sow.generation_duration_seconds) {
        return acc + sow.generation_duration_seconds;
      }
      return acc;
    }, 0) / (sowHistory?.length || 1) || 0;

    return {
      ...metrics,
      recentCompletions: recentCompletions.length,
      averageGenerationTime: Math.round(averageGenerationTime),
      successRate: sowHistory?.length ? 
        (sowHistory.filter(s => s.generation_status === 'completed').length / sowHistory.length * 100) : 0
    };
  }, [metrics, sowHistory]);

  return {
    data: processedData,
    isLoading,
  };
}

export function useInspectionMetrics() {
  const { data: inspections, isLoading } = useOptimizedInspections();

  const metrics = useMemo(() => {
    if (!inspections) return null;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: inspections.length,
      draft: inspections.filter(i => i.status === 'Draft').length,
      completed: inspections.filter(i => i.status === 'Completed').length,
      thisWeek: inspections.filter(i => new Date(i.created_at || '') > weekAgo).length,
      thisMonth: inspections.filter(i => new Date(i.created_at || '') > monthAgo).length,
      completionRate: inspections.length ? 
        (inspections.filter(i => i.status === 'Completed').length / inspections.length * 100) : 0,
    };
  }, [inspections]);

  return {
    metrics,
    isLoading,
  };
}
